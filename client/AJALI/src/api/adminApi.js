import { apiFetch } from '../lib/api'

export function getAdminDashboard() {
  return apiFetch('/admin/dashboard')
}

export function getAdminIncidents(params = {}) {
  const query = new URLSearchParams()

  if (params.page) query.set('page', params.page)
  if (params.per_page) query.set('per_page', params.per_page)
  if (params.status) query.set('status', params.status)
  if (params.incident_type) {
    query.set('incident_type', params.incident_type)
  }
  if (params.q) query.set('q', params.q)

  const queryString = query.toString()

  return apiFetch(
    `/admin/incidents${queryString ? `?${queryString}` : ''}`
  )
}

export function getAdminIncident(id) {
  return apiFetch(`/admin/incidents/${id}`)
}

export function updateAdminIncidentStatus(id, status) {
  return apiFetch(`/admin/incidents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}