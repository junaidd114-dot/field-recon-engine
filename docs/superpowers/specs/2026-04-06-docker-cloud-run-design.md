---
title: Docker + Cloud Run Deployment
date: 2026-04-06
status: approved
---

## Overview

Dockerize the field-recon-engine Next.js app and deploy it to Google Cloud Run as a public service. Infrastructure is managed with Terraform. Deployments are manual via the gcloud CLI.

## Repository Structure

```
field-recon-engine/
├── infra/
│   ├── main.tf             # provider, APIs, Artifact Registry repo, Cloud Run service
│   ├── variables.tf        # project_id, region, image_tag
│   ├── outputs.tf          # service URL
│   └── terraform.tfvars    # (gitignored) actual values
├── Dockerfile
├── .dockerignore
└── deploy.sh               # documented 3-step build/push/apply reference
```

`terraform.tfvars` is gitignored — populated locally with `project_id` and `region`.

## Docker

Multi-stage build using Next.js standalone output (`output: 'standalone'` in `next.config.ts`).

**Stages:**
1. `deps` — install `node_modules`
2. `builder` — run `next build`, produces `.next/standalone/`
3. `runner` — copy standalone bundle + `public/` + `input/` into a slim Node image, run `node server.js`

**Details:**
- `.dockerignore` excludes `node_modules`, `.next`, `infra`, `.git`
- Final image runs as a non-root user on port 3000
- Cloud Run injects `PORT` env var; Next.js standalone respects it automatically

## Terraform

Single `main.tf` managing:

| Resource | Purpose |
|---|---|
| `google_project_service` | Enables `run.googleapis.com` and `artifactregistry.googleapis.com` |
| `google_artifact_registry_repository` | Docker repo in configured region |
| `google_cloud_run_v2_service` | Deploys image; `min=0`, `max=2`; all-traffic ingress |
| `google_cloud_run_v2_service_iam_member` | Grants `roles/run.invoker` to `allUsers` (public) |

**Variables:** `project_id`, `region`, `image_tag`
**Outputs:** Cloud Run service URL

## Deploy Workflow

Prerequisites (one-time):
- `gcloud auth login`
- `gcloud auth configure-docker <region>-docker.pkg.dev`
- `terraform` installed

```bash
# 1. Build and push image
IMAGE_TAG=<region>-docker.pkg.dev/<project_id>/field-recon-engine/app:<tag>
docker build -t $IMAGE_TAG .
docker push $IMAGE_TAG

# 2. Provision / update infra
cd infra
terraform init        # first time only
terraform apply -var="image_tag=$IMAGE_TAG"
```

Subsequent deploys: bump the tag, build, push, `terraform apply`.
