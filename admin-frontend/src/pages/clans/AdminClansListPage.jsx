import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { deleteClan, getAllClans } from '../../services/api/adminClansApi.js'
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

function AdminClansListPage() {
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

  const fetchClans = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const payload = await getAllClans({ page, limit })
      // Accept either { data: { items, total } } or a direct array for flexibility.
      const data = payload?.data ?? payload
      const list = Array.isArray(data) ? data : data?.items || data?.clans || []

      setItems(list)
      setTotal(data?.total ?? payload?.total ?? null)
    } catch (error) {
      if (error.status === 401) {
        // Session expired or invalid; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      setErrorMessage(error.message || 'Unable to load clans.')
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

    fetchClans()
  }, [fetchClans, navigate, page])

  const handleDelete = async (id) => {
    setErrorMessage('')
    setSuccessMessage('')

    if (!window.confirm('Are you sure you want to delete this clan?')) {
      return
    }

    try {
      await deleteClan(id)
      // Confirm deletion before refreshing the list.
      window.alert('Clan deleted successfully')
      setSuccessMessage('Clan deleted.')
      fetchClans()
    } catch (error) {
      if (error.status === 401) {
        // Token is no longer valid; send the user back to login.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to delete clan.'
      setErrorMessage(message)
      // Keep the user on the list to retry the action.
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
          <h2 className="text-lg font-semibold text-foreground">Family Clans</h2>
          {total !== null ? (
            <p className="text-sm text-muted-foreground">Total: {total}</p>
          ) : null}
        </div>
        <Button type="button" onClick={() => navigate('/admin/clans/create')}>
          Create clan
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
            onRetry={fetchClans}
            retryLabel="Reload clans"
          />
        }
        empty={
          <EmptyState
            title="No clans found"
            description="Create a clan entry to organize family branches."
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/admin/clans/create')}
              >
                Create clan
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
                <th className="px-4 py-3 text-left">Slug</th>
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
                      {item.slug || '-'}
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
                          to={`/admin/clans/edit/${id}`}
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

export default AdminClansListPage
