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
