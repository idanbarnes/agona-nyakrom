import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  deleteSection,
  getAllSections,
  updateSection,
} from '../../services/api/adminHomepageSectionsApi.js'
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

function AdminHomepageSectionsListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isReordering, setIsReordering] = useState(false)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || ''
  )
  const errorMessage =
    typeof error === 'string' ? error : error?.message || 'Failed to load data.'

  const sortedItems = useMemo(() => {
    return [...items].sort((left, right) => {
      const leftOrder = Number(left.display_order ?? left.displayOrder ?? 0)
      const rightOrder = Number(right.display_order ?? right.displayOrder ?? 0)
      return leftOrder - rightOrder
    })
  }, [items])
  const isEmpty = !isLoading && !error && sortedItems.length === 0

  const fetchSections = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setSuccessMessage('')

    try {
      const payload = await getAllSections()
      const data = payload?.data ?? payload
      const list = Array.isArray(data) ? data : data?.items || data?.sections || []
      setItems(list)
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
  }, [navigate])

  useEffect(() => {
    if (!getAuthToken()) {
      // Prevent unauthenticated access to admin resources.
      navigate('/login', { replace: true })
      return
    }

    fetchSections()
  }, [fetchSections, navigate])

  const handleDelete = async (id) => {
    setError(null)
    setSuccessMessage('')

    if (!window.confirm('Delete this section?')) {
      return
    }

    try {
      const response = await deleteSection(id)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to delete section.')
      }
      window.alert('Homepage section deleted successfully')
      setSuccessMessage('Section deleted.')
      fetchSections()
    } catch (error) {
      if (error.status === 401) {
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to delete section.'
      setError(message)
      window.alert(message)
    }
  }

  const handleMove = async (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const current = sortedItems[index]
    const target = sortedItems[targetIndex]

    if (!current || !target) {
      return
    }

    setError(null)
    setSuccessMessage('')
    setIsReordering(true)

    const currentOrder = Number(current.display_order ?? current.displayOrder ?? 0)
    const targetOrder = Number(target.display_order ?? target.displayOrder ?? 0)

    try {
      const [currentResponse, targetResponse] = await Promise.all([
        updateSection(current.id || current._id, { display_order: targetOrder }),
        updateSection(target.id || target._id, { display_order: currentOrder }),
      ])
      if (currentResponse?.success === false || targetResponse?.success === false) {
        throw new Error('Unable to update section order.')
      }
      setSuccessMessage('Section order updated.')
      fetchSections()
    } catch (error) {
      if (error.status === 401) {
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to update section order.'
      setError(message)
      window.alert(message)
    } finally {
      setIsReordering(false)
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Homepage Sections
          </h2>
        </div>
        <Button
          type="button"
          onClick={() => navigate('/admin/homepage-sections/create')}
        >
          Create section
        </Button>
      </div>
      {error ? <p role="alert">{errorMessage}</p> : null}
      {successMessage ? <p role="status">{successMessage}</p> : null}

      <StateGate
        loading={isLoading}
        error={error}
        isEmpty={isEmpty}
        skeleton={<TableSkeleton rows={6} columns={6} />}
        errorFallback={
          <ErrorState
            message={errorMessage}
            onRetry={fetchSections}
            retryLabel="Reload sections"
          />
        }
        empty={
          <EmptyState
            title="No sections found"
            description="Create a homepage section to organize the layout."
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/admin/homepage-sections/create')}
              >
                Create section
              </Button>
            }
          />
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <tr>
                <th className="px-4 py-3 text-left">Order</th>
                <th className="px-4 py-3 text-left">Section key</th>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Updated At</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </TableHead>
            <TableBody>
              {sortedItems.map((item, index) => {
                const id = item.id || item._id
                const published =
                  typeof item.published === 'boolean'
                    ? item.published
                    : item.status === 'published'

                return (
                  <TableRow key={id}>
                    <TableCell>
                      {item.display_order ?? item.displayOrder ?? '-'}
                    </TableCell>
                    <TableCell className="max-w-xs break-words">
                      {item.section_key || item.sectionKey || '-'}
                    </TableCell>
                    <TableCell className="max-w-xs break-words">
                      {item.title || '-'}
                    </TableCell>
                    <TableCell>
                      <PublishStatus published={published} />
                    </TableCell>
                    <TableCell>
                      {formatDate(item.updated_at || item.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/admin/homepage-sections/edit/${id}`}
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
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleMove(index, 'up')}
                          disabled={index === 0 || isReordering}
                        >
                          Move Up
                        </Button>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleMove(index, 'down')}
                          disabled={
                            index === sortedItems.length - 1 || isReordering
                          }
                        >
                          Move Down
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
    </section>
  )
}

export default AdminHomepageSectionsListPage
