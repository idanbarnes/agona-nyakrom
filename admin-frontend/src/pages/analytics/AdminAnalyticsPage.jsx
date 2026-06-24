import { useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '../../components/ui/index.jsx'
import { getAnalyticsReport } from '../../services/api/adminAnalyticsApi.js'

function formatNumber(value) {
  return Number(value || 0).toLocaleString()
}

function toDateInput(value) {
  return new Date(value).toISOString().slice(0, 10)
}

function defaultRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 29)
  return { startDate: toDateInput(start), endDate: toDateInput(end) }
}

function AdminAnalyticsPage() {
  const [range, setRange] = useState(defaultRange)
  const [report, setReport] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const refreshSeconds = report?.refresh_interval_seconds || 60

  useEffect(() => {
    let isMounted = true
    let timer = 0

    const loadReport = async ({ quiet = false } = {}) => {
      if (!quiet) setIsLoading(true)
      setErrorMessage('')
      try {
        const data = await getAnalyticsReport(range)
        if (isMounted) setReport(data)
      } catch (error) {
        if (isMounted) setErrorMessage(error.message || 'Unable to load analytics report.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadReport()
    timer = window.setInterval(() => loadReport({ quiet: true }), refreshSeconds * 1000)

    return () => {
      isMounted = false
      window.clearInterval(timer)
    }
  }, [range, refreshSeconds])

  const totals = report?.totals || {}
  const timeline = useMemo(() => report?.views_over_time || [], [report?.views_over_time])
  const maxDailyViews = useMemo(
    () => Math.max(1, ...timeline.map((item) => Number(item.page_views || 0))),
    [timeline],
  )

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Visitor Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">
            Anonymous public-site activity. Sessions are approximate and do not identify people.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[11rem_11rem_auto]">
          <label className="space-y-1 text-sm text-slate-600">
            <span>Start date</span>
            <Input
              type="date"
              value={range.startDate}
              onChange={(event) => setRange((current) => ({ ...current, startDate: event.target.value }))}
            />
          </label>
          <label className="space-y-1 text-sm text-slate-600">
            <span>End date</span>
            <Input
              type="date"
              value={range.endDate}
              onChange={(event) => setRange((current) => ({ ...current, endDate: event.target.value }))}
            />
          </label>
          <Button type="button" variant="secondary" onClick={() => setRange(defaultRange())}>
            Last 30 Days
          </Button>
        </div>
      </header>

      {errorMessage ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Page Views" value={totals.page_views} loading={isLoading} />
        <MetricCard label="Content Views" value={totals.content_views} loading={isLoading} />
        <MetricCard label="Approx. Sessions" value={totals.unique_sessions} loading={isLoading} />
        <MetricCard label="Total Events" value={totals.total_events} loading={isLoading} />
      </div>

      <Card>
        <CardHeader className="border-b border-slate-200">
          <CardTitle>Views Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {timeline.length ? (
            <div className="space-y-3">
              {timeline.map((item) => (
                <div key={item.date} className="grid grid-cols-[7rem_1fr_4rem] items-center gap-3 text-sm">
                  <span className="text-slate-500">{String(item.date).slice(0, 10)}</span>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-blue-600"
                      style={{ width: `${Math.max(3, (Number(item.page_views || 0) / maxDailyViews) * 100)}%` }}
                    />
                  </div>
                  <span className="text-right font-medium text-slate-900">{formatNumber(item.page_views)}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyText loading={isLoading} />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <DataTable title="Top Public Pages" rows={report?.top_pages || []} columns={[
          ['page_title', 'Page'],
          ['views', 'Views'],
          ['unique_sessions', 'Sessions'],
        ]} loading={isLoading} />
        <DataTable title="Top Content" rows={report?.top_content || []} columns={[
          ['title', 'Content'],
          ['content_type', 'Type'],
          ['views', 'Views'],
        ]} loading={isLoading} />
        <DataTable title="Search Activity" rows={report?.search_activity || []} columns={[
          ['search_query', 'Query'],
          ['searches', 'Searches'],
          ['average_result_count', 'Avg. Results'],
        ]} loading={isLoading} />
        <DataTable title="Zero-Result Searches" rows={report?.zero_result_searches || []} columns={[
          ['search_query', 'Query'],
          ['searches', 'Searches'],
        ]} loading={isLoading} />
        <DataTable title="Referrer Categories" rows={report?.referrer_categories || []} columns={[
          ['referrer_category', 'Category'],
          ['events', 'Events'],
        ]} loading={isLoading} />
        <DataTable title="Device Categories" rows={report?.device_categories || []} columns={[
          ['device_category', 'Device'],
          ['events', 'Events'],
        ]} loading={isLoading} />
        <DataTable title="Read Depth" rows={report?.read_depth || []} columns={[
          ['read_depth_percent', 'Milestone'],
          ['events', 'Events'],
        ]} loading={isLoading} formatValue={(key, value) => key === 'read_depth_percent' ? `${value}%` : value} />
        <RecentActivity rows={report?.recent_activity || []} loading={isLoading} />
      </div>
    </section>
  )
}

function MetricCard({ label, value, loading }) {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-semibold text-slate-900">
          {loading ? '...' : formatNumber(value)}
        </p>
      </CardContent>
    </Card>
  )
}

function EmptyText({ loading }) {
  return <p className="text-sm text-slate-500">{loading ? 'Loading...' : 'No analytics data for this range.'}</p>
}

function DataTable({ title, rows, columns, loading, formatValue }) {
  return (
    <Card>
      <CardHeader className="border-b border-slate-200">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <Table>
            <TableHead>
              <TableRow>
                {columns.map(([, label]) => (
                  <th key={label} className="px-4 py-3 text-left font-medium whitespace-nowrap">
                    {label}
                  </th>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={`${title}-${index}`}>
                  {columns.map(([key]) => (
                    <TableCell key={key}>
                      {formatValue ? formatValue(key, row[key]) : row[key] ?? 'N/A'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyText loading={loading} />
        )}
      </CardContent>
    </Card>
  )
}

function RecentActivity({ rows, loading }) {
  return (
    <Card>
      <CardHeader className="border-b border-slate-200">
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <ul className="space-y-3">
            {rows.map((row, index) => (
              <li key={`${row.occurred_at}-${index}`} className="rounded-lg border border-slate-200 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="muted">{row.event_type}</Badge>
                  <span className="text-xs text-slate-500">{new Date(row.occurred_at).toLocaleString()}</span>
                </div>
                <p className="mt-2 text-sm font-medium text-slate-900">{row.page_title || row.route_path}</p>
                <p className="text-xs text-slate-500">
                  {row.content_type || 'page'} · {row.referrer_category} · {row.device_category}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyText loading={loading} />
        )}
      </CardContent>
    </Card>
  )
}

export default AdminAnalyticsPage
