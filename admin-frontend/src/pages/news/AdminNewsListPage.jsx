import { useCallback, useMemo, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  deleteNews,
  getAllNews,
  updateNews,
} from '../../services/api/adminNewsApi.js'
import { getAuthToken } from '../../lib/auth.js'
import {
  Button,
  Card,
  CardContent,
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
const DEFAULT_LIMIT = 15
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

function formatUpdatedAt(value) {
  if (!value) {
    return 'Not updated'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function AdminNewsListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [page, setPage] = useState(DEFAULT_PAGE)
  const [limit] = useState(DEFAULT_LIMIT)
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || ''
  )
  const [confirmState, setConfirmState] = useState({ open: false, id: null })

  const fetchNews = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const payload = await getAllNews({
        page,
        limit,
        search: searchQuery.trim(),
        status: statusFilter,
      })
      // Accept either { data: { items, total } } or a direct array for flexibility.
      const data = payload?.data ?? payload
      const list = Array.isArray(data)
        ? data
        : data?.items || data?.news || []

      setItems(list)
      setTotal(Array.isArray(data) ? list.length : Number(data?.total ?? payload?.total ?? list.length))
    } catch (error) {

      setErrorMessage(error.message || 'Unable to load news.')
      setTotal(0)
    } finally {
      setIsLoading(false)
    }
  }, [limit, page, searchQuery, statusFilter])

  useEffect(() => {
    if (!getAuthToken()) {
      // Prevent unauthenticated access to admin resources.
      navigate('/login', { replace: true })
      return
    }

    fetchNews()
  }, [fetchNews, navigate])

  const handleDelete = async (id) => {
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const response = await deleteNews(id)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to delete news.')
      }
      window.alert('News deleted successfully')
      setSuccessMessage('News item deleted.')
      fetchNews()
    } catch (error) {

      const message = error.message || 'Unable to delete news.'
      setErrorMessage(message)
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

    setErrorMessage('')
    setSuccessMessage('')

    const formData = new FormData()
    formData.append('published', 'false')
    formData.append('status', 'draft')

    try {
      const response = await updateNews(item.id, formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to unpublish news.')
      }
      setSuccessMessage('News item unpublished.')
      fetchNews()
    } catch (error) {
      const message = error.message || 'Unable to unpublish news.'
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

  const normalizedItems = useMemo(() => {
    return items.map((item) => {
      const id = item.id || item._id
      const slug = item.slug || ''
      const published =
        typeof item.published === 'boolean'
          ? item.published
          : item.status === 'published'

      return {
        id,
        title: item.title || 'Untitled',
        slug,
        author: item.reporter || item.author || 'Unknown author',
        published,
        updatedAt: item.updatedAt || item.updated_at || '',
      }
    })
  }, [items])

  const iconButtonClassName =
    'inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
  const neutralIconButtonClassName = `${iconButtonClassName} text-slate-600 hover:bg-accent hover:text-slate-900`

  const totalPages = Math.max(1, Math.ceil(total / limit))

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const paginatedItems = normalizedItems

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value)
    setPage(DEFAULT_PAGE)
  }

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value)
    setPage(DEFAULT_PAGE)
  }

  const handlePageChange = (nextPage) => {
    if (nextPage < DEFAULT_PAGE || nextPage > totalPages) {
      return
    }

    setPage(nextPage)
  }

  const handleViewInEditorPreview = (newsId) => {
    if (!newsId) {
      return
    }

    navigate(`/admin/news/edit/${newsId}?preview=1`)
  }

  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all'
  const totalEntries = total

  return (
    <section className="mx-auto max-w-6xl space-y-6 pb-8 md:space-y-8">
      <header className="rounded-2xl border border-border/80 bg-gradient-to-r from-white via-slate-50 to-blue-50/40 p-5 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              News Management
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Manage articles, drafts, and publication updates from one place.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            className="border-slate-900 bg-slate-900 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800"
            onClick={() => navigate('/admin/news/create')}
          >
            <PlusIcon />
            Create News Article
          </Button>
        </div>
      </header>

      {errorMessage ? <ToastMessage type="error" message={errorMessage} /> : null}
      {successMessage ? <ToastMessage type="success" message={successMessage} /> : null}

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
              placeholder="Search by article title or author"
              className="h-11 w-full pl-10 transition-colors duration-200"
              aria-label="Search articles by title or author"
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

      <StateGate
        loading={isLoading}
        error={errorMessage}
        isEmpty={!isLoading && !errorMessage && normalizedItems.length === 0}
        skeleton={
          <Card className="border-border/80 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <TableSkeleton rows={6} columns={5} />
            </CardContent>
          </Card>
        }
        errorFallback={
          <Card className="border-border/80 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <ErrorState
                message={errorMessage}
                onRetry={fetchNews}
                retryLabel="Reload news"
              />
            </CardContent>
          </Card>
        }
        empty={
          <Card className="border-border/80 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <EmptyState
                title={hasActiveFilters ? 'No matching articles' : 'No news items found'}
                description={
                  hasActiveFilters
                    ? 'Try a different title, author, or status filter.'
                    : 'Create a news item to publish updates for readers.'
                }
                action={
                  hasActiveFilters ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setSearchQuery('')
                        setStatusFilter('all')
                        setPage(DEFAULT_PAGE)
                      }}
                    >
                      Clear filters
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => navigate('/admin/news/create')}
                    >
                      Create news
                    </Button>
                  )
                }
              />
            </CardContent>
          </Card>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 lg:hidden">
            {paginatedItems.map((item) => (
              <Card
                key={item.id}
                className="border-border/80 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                      <p className="text-xs text-muted-foreground">Author: {item.author}</p>
                    </div>
                    <PublishStatus published={item.published} />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Updated</span>
                    <span>{formatUpdatedAt(item.updatedAt)}</span>
                  </div>

                  <div className="flex items-center justify-end gap-1">
                    {item.id ? (
                      <button
                        type="button"
                        onClick={() => handleViewInEditorPreview(item.id)}
                        className={neutralIconButtonClassName}
                        aria-label={`View ${item.title}`}
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
                      to={`/admin/news/edit/${item.id}`}
                      className={neutralIconButtonClassName}
                      aria-label={`Edit ${item.title}`}
                      title="Edit"
                    >
                      <EditIcon />
                    </Link>
                    <button
                      type="button"
                      className={`${iconButtonClassName} !text-red-600 hover:!bg-red-50 hover:!text-red-700`}
                      aria-label={`Delete ${item.title}`}
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
                      aria-label={`Unpublish ${item.title}`}
                      title="Unpublish"
                      disabled={!item.id || !item.published}
                      onClick={() => handleUnpublish(item)}
                    >
                      <EyeOffIcon />
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="hidden lg:block">
            <Table>
              <TableHead>
                <tr>
                  <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                    Article
                  </th>
                  <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                    Author
                  </th>
                  <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                    Status
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
                {paginatedItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="max-w-xs break-words font-semibold text-slate-900">
                      {item.title}
                    </TableCell>
                    <TableCell className="max-w-xs break-words">
                      {item.author}
                    </TableCell>
                    <TableCell>
                      <PublishStatus published={item.published} />
                    </TableCell>
                    <TableCell>{formatUpdatedAt(item.updatedAt)}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {item.id ? (
                          <button
                            type="button"
                            onClick={() => handleViewInEditorPreview(item.id)}
                            className={neutralIconButtonClassName}
                            aria-label={`View ${item.title}`}
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
                          to={`/admin/news/edit/${item.id}`}
                          className={neutralIconButtonClassName}
                          aria-label={`Edit ${item.title}`}
                          title="Edit"
                        >
                          <EditIcon />
                        </Link>
                        <button
                          type="button"
                          className={`${iconButtonClassName} !text-red-600 hover:!bg-red-50 hover:!text-red-700`}
                          aria-label={`Delete ${item.title}`}
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
                          aria-label={`Unpublish ${item.title}`}
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
          </div>
        </div>
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
        title="Delete news item"
        description="Delete this news item?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmState({ open: false, id: null })}
      />
    </section>
  )
}

export default AdminNewsListPage
