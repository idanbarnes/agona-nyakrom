import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  deleteEvent,
  listEvents,
} from '../../services/api/adminEventsApi.js'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'
import { Badge } from '../../components/ui/badge.jsx'
import { eventTags } from '../../constants/eventTags.js'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Input,
  Pagination,
  PublishStatus,
  Select,
  StateGate,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSkeleton,
  TableToolbar,
  ToastMessage,
} from '../../components/ui/index.jsx'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10

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
    state: 'all',
    date_from: '',
    date_to: '',
    tag: '',
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
      if (filters.state !== 'all') {
        params.state = filters.state
      }
      if (filters.date_from) {
        params.date_from = filters.date_from
      }
      if (filters.date_to) {
        params.date_to = filters.date_to
      }
      if (filters.tag) {
        params.tag = filters.tag
      }

      const data = await listEvents(params)
      const list = Array.isArray(data) ? data : data?.items || []

      setItems(list)
      setTotal(data?.total ?? null)
    } catch (error) {
      if (error.status === 401) {
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      setErrorMessage(error.message || 'Unable to load events.')
    } finally {
      setIsLoading(false)
    }
  }, [filters, limit, navigate, page])

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
      if (error.status === 401) {
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to delete event.'
      setErrorMessage(message)
      window.alert(message)
    }
  }

  const handleDeleteClick = (id) => {
    setConfirmState({ open: true, id })
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

  const handlePageChange = (nextPage) => {
    if (nextPage < DEFAULT_PAGE || nextPage > totalPages) {
      return
    }
    setPage(nextPage)
  }

  const actionLinkClassName =
    'inline-flex h-8 items-center justify-center rounded-md border border-transparent px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

  const handleOpenInlinePreview = (eventId) => {
    if (!eventId) {
      return
    }

    navigate(`/admin/events/${eventId}/edit?preview=1`)
  }

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
    setPage(DEFAULT_PAGE)
  }

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      state: 'all',
      date_from: '',
      date_to: '',
      tag: '',
    })
    setPage(DEFAULT_PAGE)
  }

  const derivedRows = useMemo(() => {
    return items.map((item) => ({
      ...item,
      derivedState: deriveEventState(item),
    }))
  }, [items])

  return (
    <section className="space-y-4 md:space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold break-words md:text-2xl">Events</h2>
        {total !== null ? (
          <p className="text-sm text-muted-foreground">Total: {total}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div />
        <Button
          type="button"
          variant="primary"
          onClick={() => navigate('/admin/events/new')}
        >
          New event
        </Button>
      </div>

      <TableToolbar
        left={
          <>
            <Input
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search events"
              className="w-48"
            />
            <Select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-40"
            >
              <option value="all">All status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </Select>
            <Select
              name="state"
              value={filters.state}
              onChange={handleFilterChange}
              className="w-40"
            >
              <option value="all">All states</option>
              <option value="coming_soon">Coming soon</option>
              <option value="upcoming">Upcoming</option>
              <option value="past">Past</option>
            </Select>
            <Input
              name="date_from"
              type="date"
              value={filters.date_from}
              onChange={handleFilterChange}
              className="w-40"
            />
            <Input
              name="date_to"
              type="date"
              value={filters.date_to}
              onChange={handleFilterChange}
              className="w-40"
            />
            <Input
              name="tag"
              value={filters.tag}
              onChange={handleFilterChange}
              placeholder="Tag"
              className="w-40"
            />
          </>
        }
        right={
          <Button type="button" variant="secondary" onClick={handleClearFilters}>
            Clear
          </Button>
        }
      />

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
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        className={actionLinkClassName}
                        onClick={() => handleOpenInlinePreview(id)}
                      >
                        Preview
                      </button>
                      <Link
                        to={`/admin/events/${id}/edit`}
                        className={actionLinkClassName}
                      >
                        Edit
                      </Link>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </StateGate>

      <div className="flex justify-end">
        <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
      </div>

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
