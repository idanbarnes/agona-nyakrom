import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  deleteEvent,
  listEvents,
  updateEvent,
} from '../../services/api/adminEventsApi.js'
import { getAuthToken } from '../../lib/auth.js'
import { Badge } from '../../components/ui/badge.jsx'
import { eventTags } from '../../constants/eventTags.js'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Input,
  PublishStatus,
  StateGate,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSkeleton,
  ToastMessage,
} from '../../components/ui/index.jsx'
import {
  TableEntriesSummary,
  TablePaginationFooter,
} from '../../components/ui/pagination.jsx'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10
const statusFilterOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
]

const stateStyles = {
  COMING_SOON: { label: 'Coming Soon', variant: 'warning' },
  UPCOMING: { label: 'Upcoming', variant: 'success' },
  PAST: { label: 'Past', variant: 'muted' },
}

function formatDate(value) {
  if (!value) {
    return 'TBA'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return date.toLocaleDateString()
}

function deriveEventState(item) {
  if (item?.state) {
    return String(item.state).toUpperCase()
  }

  if (!item?.event_date) {
    return 'COMING_SOON'
  }

  const today = new Date()
  const eventDate = new Date(item.event_date)
  if (Number.isNaN(eventDate.getTime())) {
    return 'COMING_SOON'
  }

  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const eventStart = new Date(
    eventDate.getFullYear(),
    eventDate.getMonth(),
    eventDate.getDate(),
  )

  return eventStart.getTime() >= todayStart.getTime() ? 'UPCOMING' : 'PAST'
}

function isRecommendedTag(value) {
  if (!value) return false
  const normalized = String(value).trim().toLowerCase()
  return eventTags.some((tag) => tag.toLowerCase() === normalized)
}

function PlusIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function SearchIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function EyeIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EditIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  )
}

function TrashIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function EyeOffIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M17.94 17.94A10.87 10.87 0 0 1 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.06-6.94" />
      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.8 21.8 0 0 1-3.17 4.51" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function AdminEventsListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [page, setPage] = useState(DEFAULT_PAGE)
  const [limit] = useState(DEFAULT_LIMIT)
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || '',
  )
  const [confirmState, setConfirmState] = useState({ open: false, id: null })
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
  })

  const isLastPage =
    total !== null
      ? page >= Math.ceil(total / limit)
      : items.length < limit

  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const params = {
        page,
        limit,
      }

      if (filters.search) {
        params.search = filters.search
      }
      if (filters.status === 'published') {
        params.is_published = 'true'
      }
      if (filters.status === 'draft') {
        params.is_published = 'false'
      }

      const data = await listEvents(params)
      const list = Array.isArray(data) ? data : data?.items || []

      setItems(list)
      setTotal(data?.total ?? null)
    } catch (error) {
      setErrorMessage(error.message || 'Unable to load events.')
    } finally {
      setIsLoading(false)
    }
  }, [filters, limit, page])

  useEffect(() => {
    if (!getAuthToken()) {
      navigate('/login', { replace: true })
      return
    }

    fetchEvents()
  }, [fetchEvents, navigate, page])

  const handleDelete = async (id) => {
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await deleteEvent(id)
      window.alert('Event deleted successfully')
      setSuccessMessage('Event deleted.')
      fetchEvents()
    } catch (error) {
      const message = error.message || 'Unable to delete event.'
      setErrorMessage(message)
      window.alert(message)
    }
  }

  const handleDeleteClick = (id) => {
    setConfirmState({ open: true, id })
  }

  const handleUnpublish = async (item) => {
    const id = item?.id || item?._id
    const isPublished = Boolean(
      item?.is_published ?? item?.isPublished ?? item?.published,
    )
    if (!id || !isPublished) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')

    const formData = new FormData()
    formData.append('is_published', 'false')

    try {
      await updateEvent(id, formData)
      setSuccessMessage('Event unpublished.')
      fetchEvents()
    } catch (error) {
      const message = error.message || 'Unable to unpublish event.'
      setErrorMessage(message)
      window.alert(message)
    }
  }

  const handleConfirmDelete = async () => {
    if (!confirmState.id) {
      return
    }

    try {
      await handleDelete(confirmState.id)
    } finally {
      setConfirmState({ open: false, id: null })
    }
  }

  const totalPages =
    total !== null ? Math.max(1, Math.ceil(total / limit)) : isLastPage ? page : page + 1
  const totalEntries = total ?? items.length

  const handlePageChange = (nextPage) => {
    if (nextPage < DEFAULT_PAGE || nextPage > totalPages) {
      return
    }
    setPage(nextPage)
  }

  const iconButtonClassName =
    'inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
  const neutralIconButtonClassName = `${iconButtonClassName} text-slate-600 hover:bg-accent hover:text-slate-900`

  const handleOpenInlinePreview = (eventId) => {
    if (!eventId) {
      return
    }

    navigate(`/admin/events/${eventId}/edit?preview=1`)
  }

  const handleSearchChange = (event) => {
    setFilters((current) => ({ ...current, search: event.target.value }))
    setPage(DEFAULT_PAGE)
  }

  const handleStatusFilterChange = (status) => {
    setFilters((current) => ({ ...current, status }))
    setPage(DEFAULT_PAGE)
  }

  const derivedRows = useMemo(() => {
    return items.map((item) => ({
      ...item,
      derivedState: deriveEventState(item),
    }))
  }, [items])

  return (
    <section className="mx-auto max-w-6xl space-y-6 pb-8 md:space-y-8">
      <header className="rounded-2xl border border-border/80 bg-gradient-to-r from-white via-slate-50 to-blue-50/40 p-5 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              Events Management
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Manage events, drafts, and publication updates from one place.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            className="border-slate-900 bg-slate-900 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800"
            onClick={() => navigate('/admin/events/new')}
          >
            <PlusIcon />
            Create Event
          </Button>
        </div>
      </header>

      <div className="rounded-xl border border-border/80 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
              <SearchIcon className="h-4 w-4" />
            </span>
            <Input
              type="search"
              value={filters.search}
              onChange={handleSearchChange}
              placeholder="Search by event title"
              className="h-11 w-full pl-10 transition-colors duration-200"
              aria-label="Search events by title"
            />
          </div>
          <div
            className="flex flex-wrap items-center gap-2 md:flex-nowrap md:justify-end"
            role="group"
            aria-label="Filter by publication status"
          >
            {statusFilterOptions.map((option) => {
              const isActive = filters.status === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleStatusFilterChange(option.value)}
                  aria-pressed={isActive}
                  className={[
                    'inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-border bg-white text-foreground hover:bg-accent',
                  ].join(' ')}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <TableEntriesSummary totalEntries={totalEntries} />

      {errorMessage ? (
        <ToastMessage type="error" message={errorMessage} />
      ) : null}
      {successMessage ? (
        <ToastMessage type="success" message={successMessage} />
      ) : null}

      <StateGate
        loading={isLoading}
        error={errorMessage}
        isEmpty={!isLoading && !errorMessage && items.length === 0}
        skeleton={<TableSkeleton rows={6} columns={6} />}
        errorFallback={
          <ErrorState
            message={errorMessage}
            onRetry={fetchEvents}
            retryLabel="Reload events"
          />
        }
        empty={
          <EmptyState
            title="No events found"
            description="Create an event to keep the community updated."
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/admin/events/new')}
              >
                Create event
              </Button>
            }
          />
        }
      >
        <Table>
          <TableHead>
            <tr>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                Title
              </th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                Date
              </th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                State
              </th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                Published
              </th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                Updated
              </th>
              <th className="px-4 py-3 text-right font-medium whitespace-nowrap">
                Actions
              </th>
            </tr>
          </TableHead>
          <TableBody>
            {derivedRows.map((item) => {
              const id = item.id || item._id
              const published = Boolean(
                item.is_published ?? item.isPublished ?? item.published,
              )
              const stateInfo = stateStyles[item.derivedState] || stateStyles.COMING_SOON

              return (
                <TableRow key={id}>
                  <TableCell className="max-w-xs break-words">
                    <div className="space-y-1">
                      <div>{item.title || 'Untitled'}</div>
                      {item.event_tag ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="muted">{item.event_tag}</Badge>
                          {isRecommendedTag(item.event_tag) ? (
                            <Badge variant="success">Recommended</Badge>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(item.event_date)}</TableCell>
                  <TableCell>
                    <Badge variant={stateInfo.variant}>{stateInfo.label}</Badge>
                  </TableCell>
                  <TableCell>
                    <PublishStatus published={published} />
                  </TableCell>
                  <TableCell>{item.updated_at || item.updatedAt || '-'}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        className={neutralIconButtonClassName}
                        aria-label={`View ${item.title || 'event'}`}
                        title="View in split preview"
                        onClick={() => handleOpenInlinePreview(id)}
                      >
                        <EyeIcon />
                      </button>
                      <Link
                        to={`/admin/events/${id}/edit`}
                        className={neutralIconButtonClassName}
                        aria-label={`Edit ${item.title || 'event'}`}
                        title="Edit"
                      >
                        <EditIcon />
                      </Link>
                      <button
                        type="button"
                        className={`${iconButtonClassName} !text-red-600 hover:!bg-red-50 hover:!text-red-700`}
                        aria-label={`Delete ${item.title || 'event'}`}
                        title="Delete"
                        onClick={() => handleDeleteClick(id)}
                      >
                        <TrashIcon />
                      </button>
                      <button
                        type="button"
                        className={[
                          iconButtonClassName,
                          !id || !published
                            ? 'cursor-not-allowed !text-slate-300 opacity-60 hover:translate-y-0 hover:!bg-transparent hover:!text-slate-300'
                            : '!text-red-600 hover:!bg-red-50 hover:!text-red-700',
                        ].join(' ')}
                        aria-label={`Unpublish ${item.title || 'event'}`}
                        title="Unpublish"
                        disabled={!id || !published}
                        onClick={() => handleUnpublish(item)}
                      >
                        <EyeOffIcon />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </StateGate>

      {!isLoading && !errorMessage && totalEntries > 0 ? (
        <TablePaginationFooter
          page={page}
          totalPages={totalPages}
          onChange={handlePageChange}
        />
      ) : null}

      <ConfirmDialog
        open={confirmState.open}
        title="Delete event"
        description="Delete this event?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmState({ open: false, id: null })}
      />
    </section>
  )
}

export default AdminEventsListPage
