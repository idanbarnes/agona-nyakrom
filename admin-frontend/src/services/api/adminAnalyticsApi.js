import { apiRequest } from '../../lib/apiClient.js'

export function getAnalyticsReport(params = {}) {
  const query = new URLSearchParams()
  if (params.startDate) query.set('start_date', params.startDate)
  if (params.endDate) query.set('end_date', params.endDate)
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return apiRequest(`/api/admin/analytics/report${suffix}`)
}

export function cleanupAnalytics(params = {}) {
  const query = new URLSearchParams()
  query.set('dry_run', params.execute ? 'false' : 'true')
  if (params.retentionDays) query.set('retention_days', params.retentionDays)
  const suffix = query.toString() ? `?${query.toString()}` : ''
  return apiRequest(`/api/admin/analytics/cleanup${suffix}`, { method: 'POST' })
}
