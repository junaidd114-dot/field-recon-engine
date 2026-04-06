# Docker + Cloud Run Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dockerize the field-recon-engine Next.js app and deploy it to a public Google Cloud Run service managed by Terraform.

**Architecture:** Multi-stage Dockerfile builds a minimal Next.js standalone image. Terraform provisions Artifact Registry, enables required GCP APIs, and manages the Cloud Run service and its public IAM binding. Deployments are manual via a documented `deploy.sh` script.

**Tech Stack:** Docker, Next.js standalone output, Google Artifact Registry, Google Cloud Run v2, Terraform (hashicorp/google ~> 6.0)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `next.config.ts` | Add `output: 'standalone'` |
| Create | `Dockerfile` | Multi-stage build: deps → builder → runner |
| Create | `.dockerignore` | Exclude node_modules, .next, infra, .git |
| Create | `infra/main.tf` | Provider, GCP APIs, Artifact Registry, Cloud Run service, public IAM |
| Create | `infra/variables.tf` | `project_id`, `region`, `image_tag` |
| Create | `infra/outputs.tf` | `service_url` output |
| Create | `infra/.gitignore` | Ignore `terraform.tfvars`, `.terraform/`, `*.tfstate*` |
| Create | `infra/terraform.tfvars.example` | Template showing required variable values |
| Create | `deploy.sh` | Documented build/push/apply reference script |

---

## Task 1: Configure Next.js for standalone output

**Files:**
- Modify: `next.config.ts`

- [ ] **Step 1: Add standalone output to next.config.ts**

Replace the contents of `next.config.ts` with:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

- [ ] **Step 2: Verify the build still works**

```bash
npm run build
```

Expected: build completes successfully and `.next/standalone/` directory is created.

```bash
ls .next/standalone/
```

Expected: you see `server.js` and a `node_modules/` directory.

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "feat: enable Next.js standalone output for Docker"
```

---

## Task 2: Write Dockerfile and .dockerignore

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`

- [ ] **Step 1: Create .dockerignore**

Create `.dockerignore` at the repo root:

```
node_modules
.next
infra
.git
.gitignore
*.md
docs
npm-debug.log*
.env*
```

- [ ] **Step 2: Create Dockerfile**

Create `Dockerfile` at the repo root:

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/input ./input
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

Note: `input/` is copied because the app reads those JSON files at runtime via the filesystem. They must live at the same relative path as in development.

- [ ] **Step 3: Verify docker build succeeds**

```bash
docker build -t field-recon-engine:local .
```

Expected: build completes with all three stages. Final image size should be under 300MB.

- [ ] **Step 4: Verify container runs locally**

```bash
docker run --rm -p 3000:3000 field-recon-engine:local
```

Open http://localhost:3000 in a browser. Expected: app loads correctly. Stop with `Ctrl+C`.

- [ ] **Step 5: Commit**

```bash
git add Dockerfile .dockerignore
git commit -m "feat: add multi-stage Dockerfile with Next.js standalone output"
```

---

## Task 3: Write Terraform configuration

**Files:**
- Create: `infra/main.tf`
- Create: `infra/variables.tf`
- Create: `infra/outputs.tf`
- Create: `infra/.gitignore`
- Create: `infra/terraform.tfvars.example`

- [ ] **Step 1: Create infra/.gitignore**

```
terraform.tfvars
.terraform/
.terraform.lock.hcl
*.tfstate
*.tfstate.backup
```

- [ ] **Step 2: Create infra/terraform.tfvars.example**

```hcl
project_id = "your-gcp-project-id"
region     = "europe-west1"
# image_tag is passed at apply time via -var flag
```

- [ ] **Step 3: Create infra/variables.tf**

```hcl
variable "project_id" {
  type        = string
  description = "GCP project ID"
}

variable "region" {
  type        = string
  description = "GCP region (e.g. europe-west1)"
  default     = "europe-west1"
}

variable "image_tag" {
  type        = string
  description = "Full Artifact Registry image tag to deploy (e.g. europe-west1-docker.pkg.dev/my-project/field-recon-engine/app:v1)"
}
```

- [ ] **Step 4: Create infra/main.tf**

```hcl
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
  required_version = ">= 1.5"
}

provider "google" {
  project = var.project_id
  region  = var.region
}

resource "google_project_service" "run" {
  project            = var.project_id
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "artifactregistry" {
  project            = var.project_id
  service            = "artifactregistry.googleapis.com"
  disable_on_destroy = false
}

resource "google_artifact_registry_repository" "docker" {
  project       = var.project_id
  location      = var.region
  repository_id = "field-recon-engine"
  format        = "DOCKER"

  depends_on = [google_project_service.artifactregistry]
}

resource "google_cloud_run_v2_service" "app" {
  name     = "field-recon-engine"
  location = var.region

  template {
    containers {
      image = var.image_tag
      ports {
        container_port = 3000
      }
    }
    scaling {
      min_instance_count = 0
      max_instance_count = 2
    }
  }

  ingress = "INGRESS_TRAFFIC_ALL"

  depends_on = [google_project_service.run]
}

resource "google_cloud_run_v2_service_iam_member" "public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.app.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
```

- [ ] **Step 5: Create infra/outputs.tf**

```hcl
output "service_url" {
  value       = google_cloud_run_v2_service.app.uri
  description = "The public URL of the Cloud Run service"
}
```

- [ ] **Step 6: Validate Terraform configuration**

```bash
cd infra
terraform init
terraform validate
```

Expected: `Success! The configuration is valid.`

- [ ] **Step 7: Commit**

```bash
cd ..  # back to repo root
git add infra/
git commit -m "feat: add Terraform infra for Artifact Registry and Cloud Run"
```

---

## Task 4: Write deploy script

**Files:**
- Create: `deploy.sh`

- [ ] **Step 1: Create deploy.sh**

```bash
#!/usr/bin/env bash
# field-recon-engine deploy script
#
# Prerequisites (one-time setup):
#   1. gcloud auth login
#   2. gcloud auth configure-docker ${REGION}-docker.pkg.dev
#   3. terraform >= 1.5 installed (https://developer.hashicorp.com/terraform/install)
#   4. Copy infra/terraform.tfvars.example to infra/terraform.tfvars and fill in project_id
#
# Usage:
#   export PROJECT_ID=your-gcp-project-id
#   export REGION=europe-west1   # optional, defaults to europe-west1
#   export TAG=v1.0.0            # optional, defaults to 'latest'
#   bash deploy.sh

set -euo pipefail

PROJECT_ID=${PROJECT_ID:?Error: PROJECT_ID environment variable must be set}
REGION=${REGION:-europe-west1}
TAG=${TAG:-latest}

IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/field-recon-engine/app:${TAG}"

echo "==> Building image: ${IMAGE}"
docker build -t "${IMAGE}" .

echo "==> Pushing image to Artifact Registry..."
docker push "${IMAGE}"

echo "==> Applying Terraform..."
cd "$(dirname "$0")/infra"
terraform init -input=false
terraform apply \
  -var="image_tag=${IMAGE}" \
  -var="project_id=${PROJECT_ID}" \
  -var="region=${REGION}"

echo ""
echo "==> Deployed. Service URL:"
terraform output -raw service_url
echo ""
```

- [ ] **Step 2: Make deploy.sh executable**

```bash
chmod +x deploy.sh
```

- [ ] **Step 3: Verify the script is syntactically valid**

```bash
bash -n deploy.sh
```

Expected: no output (no syntax errors).

- [ ] **Step 4: Commit**

```bash
git add deploy.sh
git commit -m "feat: add deploy.sh with documented gcloud/terraform deploy flow"
```

---

## Task 5: First deploy

This task is manual — not automated. Run it once your GCP project is ready.

- [ ] **Step 1: One-time local setup**

```bash
gcloud auth login
gcloud auth configure-docker europe-west1-docker.pkg.dev
cp infra/terraform.tfvars.example infra/terraform.tfvars
# Edit infra/terraform.tfvars and set your project_id
```

- [ ] **Step 2: Run a Terraform plan first (dry run)**

```bash
export PROJECT_ID=your-gcp-project-id
export REGION=europe-west1
export TAG=v1

IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/field-recon-engine/app:${TAG}"
cd infra
terraform init -input=false
terraform plan \
  -var="image_tag=${IMAGE}" \
  -var="project_id=${PROJECT_ID}" \
  -var="region=${REGION}"
```

Expected: plan shows resources to be created, no errors.

- [ ] **Step 3: Deploy**

```bash
cd ..  # back to repo root
export PROJECT_ID=your-gcp-project-id
export REGION=europe-west1
export TAG=v1
bash deploy.sh
```

Expected: image pushed, Terraform applies, service URL printed at the end.

- [ ] **Step 4: Verify the live service**

Open the printed URL in a browser. Expected: app loads correctly on Cloud Run.
