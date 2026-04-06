# field-recon-engine

A frontend demo for an automated deal-checking system used by a UK motor finance company. When a dealer submits a vehicle finance deal, a pack of documents arrives (broker application, HP agreement, purchase invoice, supplier declaration, payment mandate, giro slip, funds form). This app visualises the verification process — surfacing which fields match, which conflict, and which checks fail across the document pack for a given deal.

The demo deal is **AF-2026-00417** (customer Adam Piers, Ford Focus ST-Line, Midland Motor Group).

## Stack

- **Next.js 16** (App Router) with TypeScript
- **Tailwind CSS** + **shadcn/ui**
- **Zod** for schema validation
- Data source: static JSON files in `input/`

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run lint    # ESLint
npx tsc --noEmit  # type-check only
```

## Deployment

The app runs on **Google Cloud Run**, managed with Terraform.

### First-time setup

```bash
# Authenticate with GCP
gcloud auth login
gcloud auth configure-docker europe-west1-docker.pkg.dev

# Install Terraform >= 1.5
# https://developer.hashicorp.com/terraform/install

# Configure deploy environment
cp .env.deploy.example .env.deploy
# Edit .env.deploy and set PROJECT_ID
```

### Deploy

```bash
bash deploy.sh
```

This will:
1. Provision Artifact Registry (if not already created)
2. Build and push the Docker image
3. Apply Terraform to deploy/update the Cloud Run service

The service URL is stable across deploys and printed at the end of each run.

### Subsequent deploys

Bump `TAG` in `.env.deploy` (e.g. `v2`, `v3`) and re-run `deploy.sh`.
