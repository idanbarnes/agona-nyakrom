import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  deleteHallOfFame,
  getAllHallOfFame,
} from '../../services/api/adminHallOfFameApi.js'
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

function AdminHallOfFameListPage() {
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
  const isLastPage =
    total !== null
      ? page >= Math.ceil(total / limit)
      : items.length < limit
  const errorMessage =
    typeof error === 'string' ? error : error?.message || 'Failed to load data.'
  const isEmpty = !isLoading && !error && (!items || items.length === 0)

  const fetchHallOfFame = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setSuccessMessage('')

    try {
      const payload = await getAllHallOfFame({ page, limit })
      // Accept either { data: { items, total } } or a direct array for flexibility.
      const data = payload?.data ?? payload
      const list = Array.isArray(data)
        ? data
        : data?.items || data?.hallOfFame || data?.entries || []

      setItems(list)
      setTotal(data?.total ?? payload?.total ?? null)
    } catch (error) {
      if (error.status === 401) {
        // Session expired or invalid; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      setError(error)
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

    fetchHallOfFame()
  }, [fetchHallOfFame, navigate, page])

  const handleDelete = async (id) => {
    setError(null)
    setSuccessMessage('')

    if (!window.confirm('Delete this entry?')) {
      return
    }

    try {
      const response = await deleteHallOfFame(id)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to delete entry.')
      }
      window.alert('Hall of Fame entry deleted successfully')
      setSuccessMessage('Entry deleted.')
      fetchHallOfFame()
    } catch (error) {
      if (error.status === 401) {
        // Token is no longer valid; send the user back to login.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to delete entry.'
      setError(message)
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
          <h2 className="text-lg font-semibold text-foreground">Hall of Fame</h2>
          {total !== null ? (
            <p className="text-sm text-muted-foreground">Total: {total}</p>
          ) : null}
        </div>
        <Button
          type="button"
          onClick={() => navigate('/admin/hall-of-fame/create')}
        >
          Create entry
        </Button>
      </div>
      {error ? <p role="alert">{errorMessage}</p> : null}
      {successMessage ? <p role="status">{successMessage}</p> : null}

      <StateGate
        loading={isLoading}
        error={error}
        isEmpty={isEmpty}
        skeleton={<TableSkeleton rows={6} columns={7} />}
        errorFallback={
          <ErrorState
            message={errorMessage}
            onRetry={fetchHallOfFame}
            retryLabel="Reload entries"
          />
        }
        empty={
          <EmptyState
            title="No entries found"
            description="Add a Hall of Fame entry to highlight achievements."
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/admin/hall-of-fame/create')}
              >
                Create entry
              </Button>
            }
          />
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <tr>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Featured</th>
                <th className="px-4 py-3 text-left">Display Order</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Updated At</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </TableHead>
            <TableBody>
              {items.map((item) => {
                const id = item.id || item._id
                const published =
                  typeof item.published === 'boolean'
                    ? item.published
                    : item.status === 'published'

                return (
                  <TableRow key={id}>
                    <TableCell className="max-w-xs break-words">
                      {item.name || 'Untitled'}
                    </TableCell>
                    <TableCell className="max-w-xs break-words">
                      {item.title || '-'}
                    </TableCell>
                    <TableCell>{item.is_featured ? 'Yes' : 'No'}</TableCell>
                    <TableCell>
                      {item.display_order ?? item.displayOrder ?? '-'}
                    </TableCell>
                    <TableCell>
                      <PublishStatus published={published} />
                    </TableCell>
                    <TableCell>
                      {formatDate(item.updatedAt || item.updated_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/admin/hall-of-fame/edit/${id}`}
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

export default AdminHallOfFameListPage
