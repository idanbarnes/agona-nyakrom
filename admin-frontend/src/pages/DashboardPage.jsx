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
import { cn } from '../lib/cn.js'
import { getAllNews } from '../services/api/adminNewsApi.js'
import { listAnnouncements } from '../services/api/adminAnnouncementsApi.js'
import { listEvents } from '../services/api/adminEventsApi.js'
import { getAllSections } from '../services/api/adminHomepageSectionsApi.js'
import { getAllHallOfFame } from '../services/api/adminHallOfFameApi.js'
import {
  AwardIcon,
  CalendarIcon,
  EyeIcon,
  HeartIcon,
  MegaphoneIcon,
  NewsIcon,
  PhoneIcon,
  SettingsIcon,
  TrendingUpIcon,
  UsersIcon,
} from '../components/admin/icons.jsx'

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

function getRatio(part, total) {
  if (!total) return 0
  return Math.max(0, Math.min(100, Math.round((part / total) * 100)))
}

const toneStyles = {
  blue: {
    iconBadge: 'bg-blue-100 text-blue-600',
    trend: 'text-blue-600',
    progress: 'bg-blue-600',
    quickHover: 'hover:border-blue-300',
  },
  emerald: {
    iconBadge: 'bg-emerald-100 text-emerald-600',
    trend: 'text-emerald-600',
    progress: 'bg-emerald-600',
    quickHover: 'hover:border-emerald-300',
  },
  amber: {
    iconBadge: 'bg-amber-100 text-amber-700',
    trend: 'text-amber-700',
    progress: 'bg-amber-500',
    quickHover: 'hover:border-amber-300',
  },
  violet: {
    iconBadge: 'bg-violet-100 text-violet-600',
    trend: 'text-violet-600',
    progress: 'bg-violet-600',
    quickHover: 'hover:border-violet-300',
  },
}

function DashboardPage() {
  const navigate = useNavigate()
  const [dashboardData, setDashboardData] = useState({
    news: [],
    announcements: [],
    events: [],
    hallOfFame: [],
    homepageSections: [],
    totals: {
      news: 0,
      announcements: 0,
      events: 0,
      hallOfFame: 0,
      homepageSections: 0,
    },
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
        getAllHallOfFame({ page: 1, limit: 10 }),
        getAllSections({ page: 1, limit: 10 }),
      ])

      if (!isMounted) return

      const [newsResult, announcementsResult, eventsResult, hallOfFameResult, sectionsResult] =
        results

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
      const hallOfFameData =
        hallOfFameResult.status === 'fulfilled'
          ? getItemsAndTotal(hallOfFameResult.value, [
              'hall_of_fame',
              'hallOfFame',
              'entries',
            ])
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
        hallOfFame: hallOfFameData.items,
        homepageSections: sectionsData.items,
        totals: {
          news: newsData.total,
          announcements: announcementData.total,
          events: eventsData.total,
          hallOfFame: hallOfFameData.total,
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
      dashboardData.events.filter((item) => !isPublished(item)).length +
      dashboardData.hallOfFame.filter((item) => !isPublished(item)).length,
    [
      dashboardData.announcements,
      dashboardData.events,
      dashboardData.hallOfFame,
      dashboardData.news,
    ],
  )

  const upcomingEvents = useMemo(
    () => getUpcomingCount(dashboardData.events),
    [dashboardData.events],
  )

  const publishedNewsCount = useMemo(
    () => dashboardData.news.filter((item) => isPublished(item)).length,
    [dashboardData.news],
  )

  const activeAnnouncementsCount = useMemo(
    () => dashboardData.announcements.filter((item) => isPublished(item)).length,
    [dashboardData.announcements],
  )

  const publishedHallOfFameCount = useMemo(
    () => dashboardData.hallOfFame.filter((item) => isPublished(item)).length,
    [dashboardData.hallOfFame],
  )

  const totalContentCount = useMemo(
    () =>
      dashboardData.totals.news +
      dashboardData.totals.announcements +
      dashboardData.totals.events +
      dashboardData.totals.hallOfFame,
    [dashboardData.totals],
  )

  const publishedContentRatio = useMemo(
    () => getRatio(Math.max(0, totalContentCount - draftCount), totalContentCount),
    [draftCount, totalContentCount],
  )

  const eventReadinessRatio = useMemo(
    () => getRatio(upcomingEvents, dashboardData.totals.events),
    [dashboardData.totals.events, upcomingEvents],
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
      ...dashboardData.hallOfFame.map((item) => ({
        id: `hall-of-fame-${item.id}`,
        title: item.title || 'Untitled hall of fame entry',
        type: 'Hall of Fame',
        badge: isPublished(item) ? 'published' : 'draft',
        updatedAt: item.updated_at || item.updatedAt || item.created_at,
      })),
    ]
      .sort((a, b) => getTimestamp(b.updatedAt) - getTimestamp(a.updatedAt))
      .slice(0, 5)
  }, [
    dashboardData.announcements,
    dashboardData.events,
    dashboardData.hallOfFame,
    dashboardData.news,
  ])

  const showPriorityBanner = draftCount > 0 || upcomingEvents === 0

  const stats = [
    {
      label: 'Total News Articles',
      value: dashboardData.totals.news,
      icon: NewsIcon,
      trend: `${publishedNewsCount} published`,
      tone: 'blue',
    },
    {
      label: 'Upcoming Events',
      value: upcomingEvents,
      icon: CalendarIcon,
      trend: `${dashboardData.totals.events} total events`,
      tone: 'emerald',
    },
    {
      label: 'Active Announcements',
      value: activeAnnouncementsCount,
      icon: MegaphoneIcon,
      trend: `${dashboardData.totals.announcements} total announcements`,
      tone: 'amber',
    },
    {
      label: 'Hall of Fame Entries',
      value: dashboardData.totals.hallOfFame,
      icon: AwardIcon,
      trend: `${publishedHallOfFameCount} published`,
      tone: 'violet',
    },
  ]

  const quickActions = [
    { label: 'Add News Article', to: '/admin/news', icon: NewsIcon, tone: 'blue' },
    { label: 'Create Event', to: '/admin/events/new', icon: CalendarIcon, tone: 'emerald' },
    {
      label: 'Post Announcement',
      to: '/admin/announcements/new',
      icon: MegaphoneIcon,
      tone: 'amber',
    },
    { label: 'Manage Clans', to: '/admin/clans', icon: UsersIcon, tone: 'violet' },
    { label: 'Manage Obituaries', to: '/admin/obituaries', icon: HeartIcon, tone: 'blue' },
    {
      label: 'Homepage Settings',
      to: '/admin/homepage-sections',
      icon: SettingsIcon,
      tone: 'emerald',
    },
    {
      label: 'Contact Information',
      to: '/admin/contact',
      icon: PhoneIcon,
      tone: 'amber',
    },
  ]

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-blue-100">
            {currentDate}
          </p>
          <h1 className="mt-1 text-2xl font-semibold md:text-3xl">
            Welcome to Agona Nyakrom CMS
          </h1>
          <p className="mt-2 text-sm text-blue-100">
            Manage township content, publication health, and operational priorities in one
            place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => navigate('/admin/news/create')}
            className="border-white/40 bg-white/10 text-white hover:bg-white/20"
          >
            Create Content
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate('/')}
            className="border-white/20 bg-white text-blue-700 hover:bg-blue-50"
          >
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <StatCard key={item.label} {...item} isLoading={isLoading} />
        ))}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <QuickActionCard
              key={action.label}
              title={action.label}
              icon={action.icon}
              tone={action.tone}
              onClick={() => navigate(action.to)}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="border-b border-slate-200">
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
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="muted">{entry.type}</Badge>
                      <Badge variant={entry.badge}>{entry.badge}</Badge>
                      <span className="text-xs text-slate-500">{formatDate(entry.updatedAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-slate-200">
            <CardTitle>Analytics Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnalyticsRow
              label="Published Content"
              value={publishedContentRatio}
              description={`${Math.max(0, totalContentCount - draftCount)} of ${totalContentCount} items live`}
              icon={EyeIcon}
              tone="blue"
            />
            <AnalyticsRow
              label="Event Readiness"
              value={eventReadinessRatio}
              description={`${upcomingEvents} upcoming of ${dashboardData.totals.events} events`}
              icon={CalendarIcon}
              tone="emerald"
            />
            <AnalyticsRow
              label="Homepage Sections"
              value={getRatio(dashboardData.totals.homepageSections, 12)}
              description={`${dashboardData.totals.homepageSections} sections configured`}
              icon={SettingsIcon}
              tone="amber"
            />
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

function StatCard({ label, value, icon: Icon, trend, tone, isLoading }) {
  const styles = toneStyles[tone] || toneStyles.blue

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg', styles.iconBadge)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className={cn('flex items-center gap-1 text-xs font-medium', styles.trend)}>
            <TrendingUpIcon className="h-4 w-4" />
            <span>{trend}</span>
          </div>
        </div>
        <div>
          <p className="text-2xl font-semibold text-slate-900">{isLoading ? '...' : value}</p>
          <p className="mt-1 text-sm text-slate-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}

function AnalyticsRow({ label, value, description, icon: Icon, tone }) {
  const styles = toneStyles[tone] || toneStyles.blue

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-slate-700">{label}</span>
        </div>
        <span className="text-sm font-semibold text-slate-900">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100">
        <div
          className={cn('h-2 rounded-full transition-all', styles.progress)}
          style={{ width: `${value}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
  )
}

function QuickActionCard({ title, icon: Icon, tone, onClick }) {
  const styles = toneStyles[tone] || toneStyles.blue

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
        styles.quickHover,
      )}
    >
      <div
        className={cn(
          'mb-4 flex h-12 w-12 items-center justify-center rounded-lg transition-transform group-hover:scale-105',
          styles.iconBadge,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
    </button>
  )
}

export default DashboardPage
