output "service_url" {
  value       = google_cloud_run_v2_service.app.uri
  description = "The public URL of the Cloud Run service"
}
