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

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Load .env.deploy if it exists (copy from .env.deploy.example and fill in values)
if [[ -f "${SCRIPT_DIR}/.env.deploy" ]]; then
  # shellcheck source=/dev/null
  source "${SCRIPT_DIR}/.env.deploy"
fi

PROJECT_ID=${PROJECT_ID:?Error: PROJECT_ID environment variable must be set}
REGION=${REGION:-europe-west1}
TAG=${TAG:-latest}

IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/field-recon-engine/app:${TAG}"

INFRA_DIR="${SCRIPT_DIR}/infra"
TF_VARS="-var=project_id=${PROJECT_ID} -var=region=${REGION}"

echo "==> Provisioning Artifact Registry..."
cd "${INFRA_DIR}"
terraform init -input=false
# shellcheck disable=SC2086
terraform apply -input=false -auto-approve \
  -target=google_project_service.artifactregistry \
  -target=google_artifact_registry_repository.docker \
  -var="image_tag=${IMAGE}" \
  ${TF_VARS}

echo "==> Building image: ${IMAGE}"
cd "${SCRIPT_DIR}"
docker build -t "${IMAGE}" .

echo "==> Pushing image to Artifact Registry..."
docker push "${IMAGE}"

echo "==> Deploying to Cloud Run..."
cd "${INFRA_DIR}"
terraform apply \
  -input=false \
  -var="image_tag=${IMAGE}" \
  ${TF_VARS}

echo ""
echo "==> Deployed. Service URL:"
terraform output -raw service_url
echo ""
