import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { deleteClan, getAllClans, updateClan } from '../../services/api/adminClansApi.js'
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

function getClanImageUrl(item) {
  const rawPath =
    item?.image_url ||
    item?.imageUrl ||
    item?.image ||
    item?.images?.medium ||
    item?.images?.large ||
    item?.images?.original ||
    item?.images?.thumbnail ||
    item?.thumbnail ||
    ''

  return resolveAssetUrl(rawPath)
}

function AdminClansListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [page, setPage] = useState(DEFAULT_PAGE)
  const [limit] = useState(DEFAULT_LIMIT)
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(null)
  const [hasServerPagination, setHasServerPagination] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || ''
  )
  const [confirmState, setConfirmState] = useState({ open: false, id: null })

  const errorMessage =
    typeof error === 'string' ? error : error?.message || 'Failed to load data.'

  const fetchClans = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setSuccessMessage('')

    try {
      const payload = await getAllClans({ page, limit })
      const data = payload?.data ?? payload
      const list = Array.isArray(data) ? data : data?.items || data?.clans || []
      const pagination = data?.pagination || payload?.pagination || {}
      const hasPaginationMeta = Number.isFinite(Number(pagination?.total))
      const resolvedTotal = hasPaginationMeta
        ? Number(pagination.total)
        : data?.total ?? payload?.total ?? null

      setItems(list)
      setTotal(resolvedTotal)
      setHasServerPagination(hasPaginationMeta)
    } catch (error) {
      setError(error)
    } finally {
      setIsLoading(false)
    }
  }, [limit, page])

  useEffect(() => {
    if (!getAuthToken()) {
      navigate('/login', { replace: true })
      return
    }

    fetchClans()
  }, [fetchClans, navigate, page])

  const normalizedItems = useMemo(() => {
    return items.map((item) => {
      const id = item.id || item._id
      const published =
        typeof item.published === 'boolean'
          ? item.published
          : item.status === 'published'

      return {
        id,
        name: item.name || 'Untitled',
        slug: item.slug || '-',
        published,
        updatedAt: item.updatedAt || item.updated_at,
        imageUrl: getClanImageUrl(item),
      }
    })
  }, [items])

  const filteredItems = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return normalizedItems.filter((item) => {
      if (statusFilter === 'published' && !item.published) {
        return false
      }

      if (statusFilter === 'draft' && item.published) {
        return false
      }

      if (!normalizedQuery) {
        return true
      }

      return (
        item.name.toLowerCase().includes(normalizedQuery) ||
        item.slug.toLowerCase().includes(normalizedQuery)
      )
    })
  }, [normalizedItems, searchQuery, statusFilter])

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== DEFAULT_STATUS
  const totalPages = hasServerPagination
    ? total !== null
      ? Math.max(1, Math.ceil(total / limit))
      : DEFAULT_PAGE
    : Math.max(1, Math.ceil(filteredItems.length / limit))
  const currentPage = Math.min(page, totalPages)
  const paginatedItems = useMemo(() => {
    if (hasServerPagination) {
      return filteredItems
    }

    const start = (currentPage - 1) * limit
    return filteredItems.slice(start, start + limit)
  }, [currentPage, filteredItems, hasServerPagination, limit])
  const isEmpty = !isLoading && !error && paginatedItems.length === 0
  const tableEntryCount = hasActiveFilters
    ? paginatedItems.length
    : hasServerPagination
      ? total ?? normalizedItems.length
      : normalizedItems.length

  const handleDelete = async (id) => {
    setError(null)
    setSuccessMessage('')

    try {
      await deleteClan(id)
      window.alert('Clan deleted successfully')
      setSuccessMessage('Clan deleted.')
      fetchClans()
    } catch (error) {
      const message = error.message || 'Unable to delete clan.'
      setError(message)
      window.alert(message)
    }
  }

  const handleDeleteClick = (id) => {
    setConfirmState({ open: true, id })
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
      const response = await updateClan(item.id, formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to unpublish clan.')
      }

      setSuccessMessage('Clan unpublished.')
      fetchClans()
    } catch (error) {
      const message = error.message || 'Unable to unpublish clan.'
      setError(message)
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

  const handlePageChange = (nextPage) => {
    if (nextPage < DEFAULT_PAGE || nextPage > totalPages) {
      return
    }
    setPage(nextPage)
  }

  const handleOpenInlinePreview = (clanId) => {
    if (!clanId) {
      return
    }

    navigate(`/admin/clans/edit/${clanId}?preview=1`)
  }

  const iconButtonClassName =
    'inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
  const neutralIconButtonClassName = `${iconButtonClassName} text-slate-600 hover:bg-accent hover:text-slate-900`

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  return (
    <section className="mx-auto max-w-6xl space-y-6 pb-8 md:space-y-8">
      <header className="rounded-2xl border border-border/80 bg-gradient-to-r from-white via-slate-50 to-blue-50/40 p-5 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              Clans Management
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Manage clans, drafts, and publication updates from one place.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            className="border-slate-900 bg-slate-900 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800"
            onClick={() => navigate('/admin/clans/create')}
          >
            <PlusIcon />
            Create Clan
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
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by clan name or slug"
              className="h-11 w-full pl-10 transition-colors duration-200"
              aria-label="Search clans by name or slug"
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
                  onClick={() => setStatusFilter(option.value)}
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

      {error ? <ToastMessage type="error" message={errorMessage} /> : null}
      {successMessage ? (
        <ToastMessage type="success" message={successMessage} />
      ) : null}

      <TableEntriesSummary totalEntries={tableEntryCount} />

      <StateGate
        loading={isLoading}
        error={error}
        isEmpty={isEmpty}
        skeleton={<TableSkeleton rows={6} columns={6} />}
        errorFallback={
          <ErrorState
            message={errorMessage}
            onRetry={fetchClans}
            retryLabel="Reload clans"
          />
        }
        empty={
          <EmptyState
            title={hasActiveFilters ? 'No matching clans' : 'No clans found'}
            description={
              hasActiveFilters
                ? 'Try a different name, slug, or status filter.'
                : 'Create a clan entry to organize family branches.'
            }
            action={
              hasActiveFilters ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter(DEFAULT_STATUS)
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/admin/clans/create')}
                >
                  Create clan
                </Button>
              )
            }
          />
        }
      >
        <Table>
          <TableHead>
            <tr>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                Photo
              </th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                Name
              </th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                Slug
              </th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                Status
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
            {paginatedItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <ImageWithFallback
                    src={item.imageUrl}
                    alt={`${item.name} photo`}
                    className="h-10 w-10 rounded-md object-cover"
                    fallbackText="No image"
                  />
                </TableCell>
                <TableCell className="max-w-xs break-words">
                  {item.name}
                </TableCell>
                <TableCell className="max-w-xs break-words">
                  {item.slug}
                </TableCell>
                <TableCell>
                  <PublishStatus published={item.published} />
                </TableCell>
                <TableCell>
                  {formatDate(item.updatedAt)}
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1">
                    {item.id ? (
                      <button
                        type="button"
                        className={neutralIconButtonClassName}
                        aria-label={`View ${item.name}`}
                        title="View in split preview"
                        onClick={() => handleOpenInlinePreview(item.id)}
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
                      to={`/admin/clans/edit/${item.id}`}
                      className={neutralIconButtonClassName}
                      aria-label={`Edit ${item.name}`}
                      title="Edit"
                    >
                      <EditIcon />
                    </Link>
                    <button
                      type="button"
                      className={`${iconButtonClassName} !text-red-600 hover:!bg-red-50 hover:!text-red-700`}
                      aria-label={`Delete ${item.name}`}
                      title="Delete"
                      onClick={() => handleDeleteClick(item.id)}
                    >
                      <TrashIcon />
                    </button>
                    <button
                      type="button"
                      className={[
                        iconButtonClassName,
                        !item.id || !item.published
                          ? 'cursor-not-allowed !text-slate-300 opacity-60 hover:translate-y-0 hover:!bg-transparent hover:!text-slate-300'
                          : '!text-red-600 hover:!bg-red-50 hover:!text-red-700',
                      ].join(' ')}
                      aria-label={`Unpublish ${item.name}`}
                      title="Unpublish"
                      disabled={!item.id || !item.published}
                      onClick={() => handleUnpublish(item)}
                    >
                      <EyeOffIcon />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </StateGate>

      {!isEmpty && !error ? (
        <TablePaginationFooter
          page={currentPage}
          totalPages={totalPages}
          onChange={handlePageChange}
        />
      ) : null}

      <ConfirmDialog
        open={confirmState.open}
        title="Delete clan"
        description="Are you sure you want to delete this clan?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmState({ open: false, id: null })}
      />
    </section>
  )
}

export default AdminClansListPage
