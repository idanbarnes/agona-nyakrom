import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  deleteNews,
  getAllNews,
} from '../../services/api/adminNewsApi.js'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Pagination,
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

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10

function AdminNewsListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [page, setPage] = useState(DEFAULT_PAGE)
  const [limit] = useState(DEFAULT_LIMIT)
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || ''
  )
  const [confirmState, setConfirmState] = useState({ open: false, id: null })
  const isLastPage =
    total !== null
      ? page >= Math.ceil(total / limit)
      : items.length < limit

  const fetchNews = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const payload = await getAllNews({ page, limit })
      // Accept either { data: { items, total } } or a direct array for flexibility.
      const data = payload?.data ?? payload
      const list = Array.isArray(data)
        ? data
        : data?.items || data?.news || []

      setItems(list)
      setTotal(data?.total ?? payload?.total ?? null)
    } catch (error) {
      if (error.status === 401) {
        // Session expired or invalid; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      setErrorMessage(error.message || 'Unable to load news.')
    } finally {
      setIsLoading(false)
    }
  }, [limit, navigate, page])

  useEffect(() => {
    if (!getAuthToken()) {
      // Prevent unauthenticated access to admin resources.
      navigate('/login', { replace: true })
      return
    }

    fetchNews()
  }, [fetchNews, navigate, page])

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
      if (error.status === 401) {
        // Token is no longer valid; send the user back to login.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to delete news.'
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

  return (
    <section className="space-y-4 md:space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold md:text-2xl">News</h2>
        {total !== null ? (
          <p className="text-sm text-muted-foreground">Total: {total}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div />
        <Button
          type="button"
          variant="primary"
          onClick={() => navigate('/admin/news/create')}
        >
          Create news
        </Button>
      </div>
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
        skeleton={<TableSkeleton rows={6} columns={5} />}
        errorFallback={
          <ErrorState
            message={errorMessage}
            onRetry={fetchNews}
            retryLabel="Reload news"
          />
        }
        empty={
          <EmptyState
            title="No news items found"
            description="Create a news item to publish updates for readers."
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/admin/news/create')}
              >
                Create news
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
            {items.map((item) => {
              const id = item.id || item._id
              const slug = item.slug
              const published =
                typeof item.published === 'boolean'
                  ? item.published
                  : item.status === 'published'

              return (
                <TableRow key={id}>
                  <TableCell className="max-w-xs break-words">
                    {item.title || 'Untitled'}
                  </TableCell>
                  <TableCell className="max-w-xs break-words">
                    {slug || '-'}
                  </TableCell>
                  <TableCell>
                    <PublishStatus published={published} />
                  </TableCell>
                  <TableCell>{item.updatedAt || item.updated_at || '-'}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {slug ? (
                        <Link to={`/news/${slug}`} className={actionLinkClassName}>
                          View
                        </Link>
                      ) : null}
                      <Link
                        to={`/admin/news/edit/${id}`}
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
