import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../components/ui/index.jsx'
import { getAllNews } from '../services/api/adminNewsApi.js'
import { listAnnouncements } from '../services/api/adminAnnouncementsApi.js'
import { listEvents } from '../services/api/adminEventsApi.js'
import { getAllSections } from '../services/api/adminHomepageSectionsApi.js'

function getItemsAndTotal(payload, fallbackKeys = []) {
  const data = payload?.data ?? payload
  const items = Array.isArray(data)
    ? data
    : data?.items || fallbackKeys.map((key) => data?.[key]).find(Array.isArray) || []
  const total = data?.total ?? payload?.total ?? items.length
  return { items, total }
}

function getTimestamp(value) {
  if (!value) return 0
  const parsed = new Date(value).getTime()
  return Number.isNaN(parsed) ? 0 : parsed
}

function formatDate(value) {
  if (!value) return 'N/A'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return 'N/A'
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function isPublished(item) {
  return Boolean(item?.is_published ?? item?.isPublished ?? item?.published)
}

function getUpcomingCount(events) {
  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  return events.filter((event) => {
    const date = new Date(event?.event_date)
    if (Number.isNaN(date.getTime())) return false
    return date >= startOfToday
  }).length
}

function DashboardPage() {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState({
    news: [],
    announcements: [],
    events: [],
    homepageSections: [],
    totals: { news: 0, announcements: 0, events: 0, homepageSections: 0 },
  })
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true

    async function fetchDashboardData() {
      setIsLoading(true)
      setErrorMessage('')

      const results = await Promise.allSettled([
        getAllNews({ page: 1, limit: 10 }),
        listAnnouncements({ page: 1, limit: 10 }),
        listEvents({ page: 1, limit: 10 }),
        getAllSections({ page: 1, limit: 10 }),
      ])

      if (!isMounted) return

      const [newsResult, announcementsResult, eventsResult, sectionsResult] = results

      const newsData =
        newsResult.status === 'fulfilled'
          ? getItemsAndTotal(newsResult.value, ['news'])
          : { items: [], total: 0 }
      const announcementData =
        announcementsResult.status === 'fulfilled'
          ? getItemsAndTotal(announcementsResult.value, ['announcements'])
          : { items: [], total: 0 }
      const eventsData =
        eventsResult.status === 'fulfilled'
          ? getItemsAndTotal(eventsResult.value, ['events'])
          : { items: [], total: 0 }
      const sectionsData =
        sectionsResult.status === 'fulfilled'
          ? getItemsAndTotal(sectionsResult.value, ['sections'])
          : { items: [], total: 0 }

      if (results.every((result) => result.status === 'rejected')) {
        setErrorMessage('Unable to load dashboard insights right now.')
      }

      setDashboardData({
        news: newsData.items,
        announcements: announcementData.items,
        events: eventsData.items,
        homepageSections: sectionsData.items,
        totals: {
          news: newsData.total,
          announcements: announcementData.total,
          events: eventsData.total,
          homepageSections: sectionsData.total,
        },
      })
      setIsLoading(false)
    }

    fetchDashboardData()

    return () => {
      isMounted = false
    }
  }, [])

  const currentDate = useMemo(
    () =>
      new Date().toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    [],
  )

  const draftCount = useMemo(
    () =>
      dashboardData.news.filter((item) => !isPublished(item)).length +
      dashboardData.announcements.filter((item) => !isPublished(item)).length +
      dashboardData.events.filter((item) => !isPublished(item)).length,
    [dashboardData.announcements, dashboardData.events, dashboardData.news],
  )

  const upcomingEvents = useMemo(
    () => getUpcomingCount(dashboardData.events),
    [dashboardData.events],
  )

  const recentActivity = useMemo(() => {
    return [
      ...dashboardData.news.map((item) => ({
        id: `news-${item.id}`,
        title: item.title || 'Untitled news',
        type: 'News',
        badge: isPublished(item) ? 'published' : 'draft',
        updatedAt: item.updated_at || item.updatedAt || item.created_at,
      })),
      ...dashboardData.announcements.map((item) => ({
        id: `announcement-${item.id}`,
        title: item.title || 'Untitled announcement',
        type: 'Announcement',
        badge: isPublished(item) ? 'published' : 'draft',
        updatedAt: item.updated_at || item.updatedAt || item.created_at,
      })),
      ...dashboardData.events.map((item) => ({
        id: `event-${item.id}`,
        title: item.title || 'Untitled event',
        type: 'Event',
        badge: isPublished(item) ? 'published' : 'warning',
        updatedAt: item.updated_at || item.updatedAt || item.created_at,
      })),
    ]
      .sort((a, b) => getTimestamp(b.updatedAt) - getTimestamp(a.updatedAt))
      .slice(0, 5)
  }, [dashboardData.announcements, dashboardData.events, dashboardData.news])

  const distribution = useMemo(() => {
    const rows = [
      { label: 'News', count: dashboardData.totals.news },
      { label: 'Announcements', count: dashboardData.totals.announcements },
      { label: 'Events', count: dashboardData.totals.events },
      { label: 'Homepage Sections', count: dashboardData.totals.homepageSections },
    ]
    const maxCount = Math.max(1, ...rows.map((row) => row.count))
    return rows.map((row) => ({
      ...row,
      width: `${Math.max(8, Math.round((row.count / maxCount) * 100))}%`,
    }))
  }, [dashboardData.totals])

  const showPriorityBanner = draftCount > 0 || upcomingEvents === 0

  return (
    <section className="space-y-6 md:space-y-8">
      <header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {currentDate}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900 md:text-3xl">
            Dashboard Overview
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Manage content health, publication status, and quick actions from one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => navigate('/admin/news/create')}>Create Content</Button>
          <Button variant="secondary" onClick={() => navigate('/')}>
            View site
          </Button>
        </div>
      </header>

      {showPriorityBanner ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {draftCount > 0
            ? `You have ${draftCount} draft item${draftCount > 1 ? 's' : ''} pending publication.`
            : 'There are currently no upcoming events scheduled.'}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Announcements"
          value={dashboardData.totals.announcements}
          hint="Published and draft"
          isLoading={isLoading}
        />
        <MetricCard
          label="Draft Content"
          value={draftCount}
          hint="Across news, events, and announcements"
          isLoading={isLoading}
        />
        <MetricCard
          label="Upcoming Events"
          value={upcomingEvents}
          hint="Future-dated entries"
          isLoading={isLoading}
        />
        <MetricCard
          label="Total News"
          value={dashboardData.totals.news}
          hint="All news records"
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-slate-500">Loading recent updates...</p>
            ) : recentActivity.length === 0 ? (
              <p className="text-sm text-slate-500">No recent updates to show.</p>
            ) : (
              <ul className="space-y-3" aria-label="Recent activity">
                {recentActivity.map((entry) => (
                  <li
                    key={entry.id}
                    className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{entry.title}</p>
                      <p className="text-xs text-slate-500">{entry.type}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={entry.badge}>{entry.badge}</Badge>
                      <span className="text-xs text-slate-500">
                        {formatDate(entry.updatedAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {distribution.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{item.label}</span>
                  <span className="font-medium text-slate-900">{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-2 rounded-full bg-primary" style={{ width: item.width }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <QuickCard
          title="News"
          description="Publish stories and updates for residents."
          onManage={() => navigate('/admin/news')}
        />
        <QuickCard
          title="Events"
          description="Create and organize upcoming community events."
          onManage={() => navigate('/admin/events')}
        />
        <QuickCard
          title="Announcements"
          description="Share official notices and urgent communications."
          onManage={() => navigate('/admin/announcements')}
        />
        <QuickCard
          title="Obituaries"
          description="Manage memorial listings and tribute details."
          onManage={() => navigate('/admin/obituaries')}
        />
        <QuickCard
          title="About Nyakrom"
          description="Update history, governance, and town information."
          onManage={() => navigate('/admin/about-nyakrom/history')}
        />
        <QuickCard
          title="Homepage Settings"
          description="Curate homepage sections and featured content."
          onManage={() => navigate('/admin/homepage-sections')}
        />
      </div>
    </section>
  )
}

function MetricCard({ label, value, hint, isLoading }) {
  return (
    <Card>
      <CardContent className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-3xl font-semibold text-slate-900">{isLoading ? '...' : value}</p>
        <p className="text-xs text-slate-500">{hint}</p>
      </CardContent>
    </Card>
  )
}

function QuickCard({ title, description, onManage }) {
  return (
    <Card className="transition hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="space-y-3">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-500">{description}</p>
        <Button variant="secondary" size="sm" onClick={onManage}>
          Manage
        </Button>
      </CardContent>
    </Card>
  )
}

export default DashboardPage
