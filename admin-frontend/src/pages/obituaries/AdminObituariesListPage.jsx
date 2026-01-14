import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  deleteObituary,
  getAllObituaries,
} from '../../services/api/adminObituariesApi.js'
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

function AdminObituariesListPage() {
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

  const fetchObituaries = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const payload = await getAllObituaries({ page, limit })
      // Accept either { data: { items, total } } or a direct array for flexibility.
      const data = payload?.data ?? payload
      const list = Array.isArray(data)
        ? data
        : data?.items || data?.obituaries || []

      setItems(list)
      setTotal(data?.total ?? payload?.total ?? null)
    } catch (error) {
      if (error.status === 401) {
        // Session expired or invalid; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      setErrorMessage(error.message || 'Unable to load obituaries.')
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

    fetchObituaries()
  }, [fetchObituaries, navigate, page])

  const handleDelete = async (id) => {
    setErrorMessage('')
    setSuccessMessage('')

    if (!window.confirm('Delete this obituary?')) {
      return
    }

    try {
      const response = await deleteObituary(id)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to delete obituary.')
      }
      window.alert('Obituary deleted successfully')
      setSuccessMessage('Obituary deleted.')
      fetchObituaries()
    } catch (error) {
      if (error.status === 401) {
        // Token is no longer valid; send the user back to login.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to delete obituary.'
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
          <h2 className="text-lg font-semibold text-foreground">Obituaries</h2>
          {total !== null ? (
            <p className="text-sm text-muted-foreground">Total: {total}</p>
          ) : null}
        </div>
        <Button
          type="button"
          onClick={() => navigate('/admin/obituaries/create')}
        >
          Create obituary
        </Button>
      </div>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      {successMessage ? <p role="status">{successMessage}</p> : null}

      <StateGate
        loading={isLoading}
        error={errorMessage}
        isEmpty={!isLoading && !errorMessage && items.length === 0}
        skeleton={<TableSkeleton rows={6} columns={6} />}
        errorFallback={
          <ErrorState
            message={errorMessage}
            onRetry={fetchObituaries}
            retryLabel="Reload obituaries"
          />
        }
        empty={
          <EmptyState
            title="No obituaries found"
            description="Create an obituary to share memorial details."
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/admin/obituaries/create')}
              >
                Create obituary
              </Button>
            }
          />
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <tr>
                <th className="px-4 py-3 text-left">Full Name</th>
                <th className="px-4 py-3 text-left">Age</th>
                <th className="px-4 py-3 text-left">Date of Death</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Updated At</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </TableHead>
            <TableBody>
              {items.map((item) => {
                const id = item.id || item._id
                const published = Boolean(
                  item.published || item.is_published || item.isPublished,
                )
                const fullName =
                  item.full_name || item.fullName || item.name || 'Unknown'

                return (
                  <TableRow key={id}>
                    <TableCell className="max-w-xs break-words">
                      {fullName}
                    </TableCell>
                    <TableCell>{item.age ?? '-'}</TableCell>
                    <TableCell>
                      {formatDate(item.dateOfDeath || item.date_of_death)}
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
                          to={`/admin/obituaries/edit/${id}`}
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

export default AdminObituariesListPage
