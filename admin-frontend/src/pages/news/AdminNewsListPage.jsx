import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  deleteNews,
  getAllNews,
} from '../../services/api/adminNewsApi.js'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'
import {
  Button,
  EmptyState,
  ErrorState,
  PublishStatus,
  StateGate,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSkeleton,
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

    if (!window.confirm('Delete this news item?')) {
      return
    }

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

  const handlePrevPage = () => {
    setPage((current) => Math.max(DEFAULT_PAGE, current - 1))
  }

  const handleNextPage = () => {
    setPage((current) => current + 1)
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">News</h2>
          {total !== null ? (
            <p className="text-sm text-muted-foreground">Total: {total}</p>
          ) : null}
        </div>
        <Button type="button" onClick={() => navigate('/admin/news/create')}>
          Create news
        </Button>
      </div>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      {successMessage ? <p role="status">{successMessage}</p> : null}

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
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Slug</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Updated At</th>
                <th className="px-4 py-3 text-left">Actions</th>
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
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        {slug ? (
                          <Link to={`/news/${slug}`} className="text-primary">
                            View
                          </Link>
                        ) : null}
                        <Link
                          to={`/admin/news/edit/${id}`}
                          className="text-primary"
                        >
                          Edit
                        </Link>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(id)}
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
        </div>
      </StateGate>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={handlePrevPage}
          disabled={page <= 1}
        >
          Prev
        </Button>
        <span className="text-sm text-muted-foreground">Page {page}</span>
        <Button
          type="button"
          variant="secondary"
          onClick={handleNextPage}
          disabled={isLastPage}
        >
          Next
        </Button>
      </div>
    </section>
  )
}

export default AdminNewsListPage
