import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  deleteSlide,
  getAllSlides,
  updateSlide,
} from '../../services/api/adminCarouselApi.js'
import { getAuthToken } from '../../lib/auth.js'
import { buildApiUrl } from '../../lib/apiClient.js'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  ImageWithFallback,
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
const DEFAULT_STATUS = 'all'
const statusFilterOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
]

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

function formatDate(value) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return date.toLocaleDateString()
}

function resolveAssetUrl(path) {
  if (!path) {
    return ''
  }

  if (/^https?:\/\//i.test(path)) {
    return path
  }

  return buildApiUrl(path.startsWith('/') ? path : `/${path}`)
}

function AdminCarouselListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [page, setPage] = useState(DEFAULT_PAGE)
  const [limit] = useState(DEFAULT_LIMIT)
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || ''
  )
  const [confirmState, setConfirmState] = useState({ open: false, id: null })
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS)
  const isLastPage =
    total !== null
      ? page >= Math.ceil(total / limit)
      : items.length < limit
  const errorMessage =
    typeof error === 'string' ? error : error?.message || 'Failed to load data.'

  const sortedItems = useMemo(() => {
    return [...items].sort((left, right) => {
      const leftOrder = Number(left.display_order ?? left.displayOrder ?? 0)
      const rightOrder = Number(right.display_order ?? right.displayOrder ?? 0)
      return leftOrder - rightOrder
    })
  }, [items])

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return sortedItems.filter((item) => {
      const published =
        typeof item.published === 'boolean'
          ? item.published
          : item.status === 'published'

      if (statusFilter === 'published' && !published) {
        return false
      }

      if (statusFilter === 'draft' && published) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      const title = String(item.title || '').toLowerCase()
      const subtitle = String(item.subtitle || '').toLowerCase()
      const caption = String(item.caption || '').toLowerCase()
      return (
        title.includes(normalizedQuery) ||
        subtitle.includes(normalizedQuery) ||
        caption.includes(normalizedQuery)
      )
    })
  }, [searchQuery, sortedItems, statusFilter])

  const isEmpty = !isLoading && !error && filteredItems.length === 0
  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== DEFAULT_STATUS
  const totalEntries = hasActiveFilters ? filteredItems.length : total ?? sortedItems.length

  const fetchSlides = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setSuccessMessage('')

    try {
      const payload = await getAllSlides({ page, limit })
      // Accept either { data: { items, total } } or a direct array for flexibility.
      const data = payload?.data ?? payload
      const list = Array.isArray(data) ? data : data?.items || data?.slides || []

      setItems(list)
      setTotal(data?.total ?? payload?.total ?? null)
    } catch (error) {

      setError(error)
    } finally {
      setIsLoading(false)
    }
  }, [limit, page])

  useEffect(() => {
    if (!getAuthToken()) {
      // Prevent unauthenticated access to admin resources.
      navigate('/login', { replace: true })
      return
    }

    fetchSlides()
  }, [fetchSlides, navigate, page])

  const handleDelete = async (id) => {
    setError(null)
    setSuccessMessage('')

    try {
      const response = await deleteSlide(id)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to delete slide.')
      }
      window.alert('Carousel slide deleted successfully')
      setSuccessMessage('Slide deleted.')
      fetchSlides()
    } catch (error) {

      const message = error.message || 'Unable to delete slide.'
      setError(message)
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

  const handleUnpublish = async (item) => {
    if (!item?.id || !item.published) {
      return
    }

    setError(null)
    setSuccessMessage('')

    const formData = new FormData()
    formData.append('published', 'false')

    try {
      const response = await updateSlide(item.id, formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to unpublish slide.')
      }
      setSuccessMessage('Slide unpublished.')
      fetchSlides()
    } catch (error) {
      const message = error.message || 'Unable to unpublish slide.'
      setError(message)
      window.alert(message)
    }
  }

  const imageFromSlide = (slide) => {
    const rawPath =
      slide?.images?.thumbnail ||
      slide?.images?.mobile ||
      slide?.images?.medium ||
      slide?.images?.tablet ||
      slide?.images?.large ||
      slide?.images?.desktop ||
      slide?.images?.original ||
      slide?.thumbnail_image_path ||
      slide?.medium_image_path ||
      slide?.large_image_path ||
      slide?.original_image_path ||
      slide?.image_url ||
      slide?.imageUrl ||
      slide?.image ||
      ''

    return resolveAssetUrl(rawPath)
  }

  const totalPages =
    total !== null ? Math.max(1, Math.ceil(total / limit)) : isLastPage ? page : page + 1

  const handlePageChange = (nextPage) => {
    if (nextPage < DEFAULT_PAGE || nextPage > totalPages) {
      return
    }
    setPage(nextPage)
  }

  const iconButtonClassName =
    'inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
  const neutralIconButtonClassName = `${iconButtonClassName} text-slate-600 hover:bg-accent hover:text-slate-900`

  return (
    <section className="mx-auto max-w-6xl space-y-6 pb-8 md:space-y-8">
      <header className="rounded-2xl border border-border/80 bg-gradient-to-r from-white via-slate-50 to-blue-50/40 p-5 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              Carousel Management
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Manage carousel slides, drafts, and publication updates from one place.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            className="border-slate-900 bg-slate-900 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800"
            onClick={() => navigate('/admin/carousel/create')}
          >
            <PlusIcon />
            Create Slide
          </Button>
        </div>
      </header>
      {error ? <ToastMessage type="error" message={errorMessage} /> : null}
      {successMessage ? (
        <ToastMessage type="success" message={successMessage} />
      ) : null}

      <div className="rounded-xl border border-border/80 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
              <SearchIcon className="h-4 w-4" />
            </span>
            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value)
                setPage(DEFAULT_PAGE)
              }}
              placeholder="Search by slide title or subtitle"
              className="h-11 w-full pl-10 transition-colors duration-200"
              aria-label="Search carousel slides"
            />
          </div>
          <div
            className="flex flex-wrap items-center gap-2 md:flex-nowrap md:justify-end"
            role="group"
            aria-label="Filter by publication status"
          >
            {statusFilterOptions.map((option) => {
              const isActive = statusFilter === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setStatusFilter(option.value)
                    setPage(DEFAULT_PAGE)
                  }}
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

      <StateGate
        loading={isLoading}
        error={error}
        isEmpty={isEmpty}
        skeleton={<TableSkeleton rows={6} columns={6} />}
        errorFallback={
          <ErrorState
            message={errorMessage}
            onRetry={fetchSlides}
            retryLabel="Reload slides"
          />
        }
        empty={
          <EmptyState
            title={hasActiveFilters ? 'No matching slides' : 'No slides found'}
            description={
              hasActiveFilters
                ? 'Try a different title, subtitle, or status filter.'
                : 'Create a carousel slide to highlight key stories.'
            }
            action={
              hasActiveFilters ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter(DEFAULT_STATUS)
                    setPage(DEFAULT_PAGE)
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/admin/carousel/create')}
                >
                  Create slide
                </Button>
              )
            }
          />
        }
      >
        <div className="mb-3 flex justify-start">
          <TableEntriesSummary totalEntries={totalEntries} />
        </div>
        <Table>
          <TableHead>
            <tr>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                Image
              </th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                Title
              </th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                Status
              </th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                Display Order
              </th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                Updated At
              </th>
              <th className="px-4 py-3 text-right font-medium whitespace-nowrap">
                Actions
              </th>
            </tr>
          </TableHead>
          <TableBody>
            {filteredItems.map((item) => {
              const id = item.id || item._id
              const published =
                typeof item.published === 'boolean'
                  ? item.published
                  : item.status === 'published'

              return (
                <TableRow key={id}>
                  <TableCell>
                    <ImageWithFallback
                      src={imageFromSlide(item)}
                      alt={item.title || 'Slide'}
                      className="h-12 w-20 rounded-md object-cover"
                      fallbackText="No image"
                    />
                  </TableCell>
                  <TableCell className="max-w-xs break-words">
                    {item.title || '-'}
                  </TableCell>
                  <TableCell>
                    <PublishStatus published={published} />
                  </TableCell>
                  <TableCell>
                    {item.display_order ?? item.displayOrder ?? '-'}
                  </TableCell>
                  <TableCell>
                    {formatDate(item.updatedAt || item.updated_at)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      {id ? (
                        <button
                          type="button"
                          onClick={() => navigate(`/admin/carousel/edit/${id}?preview=1`)}
                          className={neutralIconButtonClassName}
                          aria-label={`View ${item.title || 'slide'}`}
                          title="View in split preview"
                        >
                          <EyeIcon />
                        </button>
                      ) : (
                        <span
                          className={`${neutralIconButtonClassName} cursor-not-allowed opacity-40`}
                          aria-hidden="true"
                        >
                          <EyeIcon />
                        </span>
                      )}
                      <Link
                        to={`/admin/carousel/edit/${id}`}
                        className={neutralIconButtonClassName}
                        aria-label={`Edit ${item.title || 'slide'}`}
                        title="Edit"
                      >
                        <EditIcon />
                      </Link>
                      <button
                        type="button"
                        className={`${iconButtonClassName} !text-red-600 hover:!bg-red-50 hover:!text-red-700`}
                        aria-label={`Delete ${item.title || 'slide'}`}
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
                        aria-label={`Unpublish ${item.title || 'slide'}`}
                        title="Unpublish"
                        disabled={!id || !published}
                        onClick={() => handleUnpublish({ id, published })}
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

      {!isEmpty && !error ? (
        <TablePaginationFooter
          page={page}
          totalPages={totalPages}
          onChange={handlePageChange}
        />
      ) : null}

      <ConfirmDialog
        open={confirmState.open}
        title="Delete carousel slide"
        description="Delete this slide?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmState({ open: false, id: null })}
      />
    </section>
  )
}

export default AdminCarouselListPage
