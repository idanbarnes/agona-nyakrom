import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  deleteHallOfFame,
  getAllHallOfFame,
} from '../../services/api/adminHallOfFameApi.js'
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
  const [confirmState, setConfirmState] = useState({ open: false, id: null })
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
        <h2 className="text-xl font-semibold break-words md:text-2xl">Hall of Fame</h2>
        {total !== null ? (
          <p className="text-sm text-muted-foreground">Total: {total}</p>
        ) : null}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div />
        <Button
          type="button"
          variant="primary"
          onClick={() => navigate('/admin/hall-of-fame/create')}
        >
          Create entry
        </Button>
      </div>
      {error ? <ToastMessage type="error" message={errorMessage} /> : null}
      {successMessage ? (
        <ToastMessage type="success" message={successMessage} />
      ) : null}

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
        <Table>
          <TableHead>
            <tr>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                Name
              </th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                Title
              </th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                Featured
              </th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                Display Order
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
              const published =
                typeof item.published === 'boolean'
                  ? item.published
                  : typeof item.isPublished === 'boolean'
                  ? item.isPublished
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
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Link
                        to={`/admin/hall-of-fame/edit/${id}`}
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
        title="Delete hall of fame entry"
        description="Delete this entry?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmState({ open: false, id: null })}
      />
    </section>
  )
}

export default AdminHallOfFameListPage
