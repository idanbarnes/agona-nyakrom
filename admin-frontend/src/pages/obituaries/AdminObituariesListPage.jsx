import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  deleteObituary,
  getAllObituaries,
  updateObituary,
} from '../../services/api/adminObituariesApi.js'
import { getAuthToken } from '../../lib/auth.js'
import { buildApiUrl } from '../../lib/apiClient.js'
import {
  Button,
  Card,
  CardContent,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  ImageWithFallback,
  Input,
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
const ITEMS_PER_PAGE = 10
const DEFAULT_STATUS = 'all'

const statusFilters = [
  { key: 'all', label: 'All Statuses' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Draft' },
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
    return '-'
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
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

function getPublishedValue(item) {
  return Boolean(item?.published ?? item?.is_published ?? item?.isPublished)
}

function getPhotoPath(item) {
  const deceasedCandidate =
    item?.deceased_photo_url ||
    item?.deceasedPhotoUrl ||
    item?.photo_url ||
    item?.photoUrl ||
    null

  if (
    typeof deceasedCandidate === 'string' &&
    /^[^/\\]+\.[a-z0-9]{2,6}$/i.test(deceasedCandidate.trim())
  ) {
    return ''
  }

  return (
    deceasedCandidate ||
    item?.images?.thumbnail ||
    item?.images?.medium ||
    item?.images?.large ||
    item?.images?.original ||
    item?.thumbnail ||
    item?.image ||
    ''
  )
}

function AdminObituariesListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [items, setItems] = useState([])
  const [currentPage, setCurrentPage] = useState(DEFAULT_PAGE)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || '',
  )
  const [confirmState, setConfirmState] = useState({ open: false, id: null })

  const fetchObituaries = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const payload = await getAllObituaries()
      const data = payload?.data ?? payload
      const list = Array.isArray(data)
        ? data
        : data?.items || data?.obituaries || []

      setItems(list)
    } catch (error) {

      setErrorMessage(error.message || 'Unable to load obituaries.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!getAuthToken()) {
      navigate('/login', { replace: true })
      return
    }

    fetchObituaries()
  }, [fetchObituaries, navigate])

  const normalizedItems = useMemo(() => {
    return items.map((item) => {
      const id = item?.id || item?._id
      const fullName = item?.full_name || item?.fullName || item?.name || 'Unknown'

      return {
        id,
        slug: item?.slug || '',
        fullName,
        age: item?.age,
        birthDate: item?.date_of_birth || item?.dateOfBirth || '',
        deathDate: item?.date_of_death || item?.dateOfDeath || '',
        createdDate: item?.created_at || item?.createdAt || '',
        published: getPublishedValue(item),
        photoUrl: resolveAssetUrl(getPhotoPath(item)),
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

      return item.fullName.toLowerCase().includes(normalizedQuery)
    })
  }, [normalizedItems, searchQuery, statusFilter])

  const totalLoaded = normalizedItems.length
  const totalFiltered = filteredItems.length
  const totalPages = Math.ceil(totalFiltered / ITEMS_PER_PAGE)
  const totalEntries = totalFiltered

  useEffect(() => {
    if (!totalPages && currentPage !== DEFAULT_PAGE) {
      setCurrentPage(DEFAULT_PAGE)
      return
    }

    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const paginatedItems = useMemo(() => {
    if (!totalFiltered) {
      return []
    }

    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredItems.slice(start, start + ITEMS_PER_PAGE)
  }, [currentPage, filteredItems, totalFiltered])

  const handleDelete = async (id) => {
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await deleteObituary(id)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to delete obituary.')
      }

      window.alert('Obituary deleted successfully')
      setSuccessMessage('Obituary deleted.')
      fetchObituaries()
    } catch (error) {

      const message = error.message || 'Unable to delete obituary.'
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

  const handleUnpublish = async (item) => {
    if (!item?.id || !item.published) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')

    const formData = new FormData()
    formData.append('published', 'false')

    try {
      const response = await updateObituary(item.id, formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to unpublish obituary.')
      }

      setSuccessMessage('Obituary unpublished.')
      fetchObituaries()
    } catch (error) {
      const message = error.message || 'Unable to unpublish obituary.'
      setErrorMessage(message)
      window.alert(message)
    }
  }

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value)
    setCurrentPage(DEFAULT_PAGE)
  }

  const handleStatusChange = (nextStatus) => {
    setStatusFilter(nextStatus)
    setCurrentPage(DEFAULT_PAGE)
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setStatusFilter(DEFAULT_STATUS)
    setCurrentPage(DEFAULT_PAGE)
  }

  const iconButtonClassName =
    'inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
  const neutralIconButtonClassName = `${iconButtonClassName} text-slate-600 hover:bg-accent hover:text-slate-900`

  const handleOpenInlinePreview = (obituaryId) => {
    if (!obituaryId) {
      return
    }

    navigate(`/admin/obituaries/edit/${obituaryId}?preview=1`)
  }

  return (
    <section className="mx-auto max-w-6xl space-y-6 pb-8 md:space-y-8">
      <header className="rounded-2xl border border-border/80 bg-gradient-to-r from-white via-slate-50 to-blue-50/40 p-5 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              Obituaries Management
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Manage obituaries, drafts, and publication updates from one place.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            className="border-slate-900 bg-slate-900 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800"
            onClick={() => navigate('/admin/obituaries/create')}
          >
            <PlusIcon />
            Create Obituary
          </Button>
        </div>
      </header>

      {errorMessage ? <ToastMessage type="error" message={errorMessage} /> : null}
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
              onChange={handleSearchChange}
              placeholder="Search by name..."
              className="h-11 w-full pl-10 transition-colors duration-200"
              aria-label="Search obituaries by name"
            />
          </div>

          <div
            className="flex flex-wrap items-center gap-2 md:flex-nowrap md:justify-end"
            role="group"
            aria-label="Filter by publication status"
          >
            {statusFilters.map((filter) => {
              const active = statusFilter === filter.key
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => handleStatusChange(filter.key)}
                  className={[
                    'inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium transition-all duration-200',
                    active
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-border bg-white text-foreground hover:bg-accent',
                  ].join(' ')}
                  aria-pressed={active}
                >
                  {filter.label}
                </button>
              )
            })}
          </div>
        </div>
        <TableEntriesSummary totalEntries={totalEntries} className="mt-4" />
      </div>

      {isLoading ? (
        <Card>
          <CardContent>
            <TableSkeleton rows={6} columns={8} />
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && errorMessage ? (
        <Card>
          <CardContent>
            <ErrorState
              message={errorMessage}
              onRetry={fetchObituaries}
              retryLabel="Reload obituaries"
            />
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !errorMessage && totalLoaded === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title="No obituaries yet"
              description="Create your first obituary to see it listed here."
              action={
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => navigate('/admin/obituaries/create')}
                >
                  <PlusIcon />
                  Create New Obituary
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !errorMessage && totalLoaded > 0 && totalFiltered === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              title="No matching obituaries"
              description="Try a different name or change the status filter."
              action={
                <Button type="button" variant="secondary" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !errorMessage && totalFiltered > 0 ? (
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
                Age
              </th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                Birth Date
              </th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                Death Date
              </th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                Status
              </th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                Created
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
                    src={item.photoUrl}
                    alt={`${item.fullName} photo`}
                    className="h-10 w-10 rounded-md object-cover text-[10px]"
                    fallbackText="No photo"
                  />
                </TableCell>
                <TableCell className="font-semibold text-slate-900">
                  {item.fullName}
                </TableCell>
                <TableCell>{item.age ?? '-'}</TableCell>
                <TableCell>{formatDate(item.birthDate)}</TableCell>
                <TableCell>{formatDate(item.deathDate)}</TableCell>
                <TableCell>
                  <span
                    className={[
                      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
                      item.published
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-700',
                    ].join(' ')}
                  >
                    {item.published ? 'Published' : 'Draft'}
                  </span>
                </TableCell>
                <TableCell>{formatDate(item.createdDate)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {item.id ? (
                      <button
                        type="button"
                        onClick={() => handleOpenInlinePreview(item.id)}
                        className={neutralIconButtonClassName}
                        aria-label={`View ${item.fullName}`}
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
                      to={`/admin/obituaries/edit/${item.id}`}
                      className={neutralIconButtonClassName}
                      aria-label={`Edit ${item.fullName}`}
                      title="Edit"
                    >
                      <EditIcon />
                    </Link>
                    <button
                      type="button"
                      className={`${iconButtonClassName} !text-red-600 hover:!bg-red-50 hover:!text-red-700`}
                      aria-label={`Delete ${item.fullName}`}
                      title="Delete"
                      onClick={() => setConfirmState({ open: true, id: item.id })}
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
                      aria-label={`Unpublish ${item.fullName}`}
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
      ) : null}

      {totalPages > 0 && totalEntries > 0 ? (
        <TablePaginationFooter
          page={currentPage}
          totalPages={totalPages}
          onChange={setCurrentPage}
        />
      ) : null}

      <ConfirmDialog
        open={confirmState.open}
        title="Delete obituary"
        description="Delete this obituary?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmState({ open: false, id: null })}
      />
    </section>
  )
}

export default AdminObituariesListPage
