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
#
# Note: terraform apply will display a plan and prompt for approval.
#       Review the plan and type 'yes' to proceed with deployment.

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
