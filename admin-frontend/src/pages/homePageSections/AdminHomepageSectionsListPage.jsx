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
  ConfirmDialog,
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
  ToastMessage,
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
  const [confirmState, setConfirmState] = useState({ open: false, id: null })
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

  const actionLinkClassName =
    'inline-flex h-8 items-center justify-center rounded-md border border-transparent px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

  return (
    <section className="space-y-4 md:space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold break-words md:text-2xl">Homepage Sections</h2>
        <p className="text-sm text-muted-foreground">
          Manage the order and visibility of homepage sections.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div />
        <Button
          type="button"
          variant="primary"
          onClick={() => navigate('/admin/homepage-sections/create')}
        >
          Create section
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
        <Table>
          <TableHead>
            <tr>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                Order
              </th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                Section key
              </th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                Title
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
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Link
                        to={`/admin/homepage-sections/edit/${id}`}
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
      </StateGate>

      <ConfirmDialog
        open={confirmState.open}
        title="Delete homepage section"
        description="Delete this section?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmState({ open: false, id: null })}
      />
    </section>
  )
}

export default AdminHomepageSectionsListPage
