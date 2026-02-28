// Admin homepage settings page manages homepage blocks that power GET /api/public/homepage.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  deleteBlock,
  getAllBlocks,
  updateBlock,
} from '../../services/api/adminHomepageBlocksApi.js'
import { getAuthToken } from '../../lib/auth.js'
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

const BLOCK_TYPE_LABELS = {
  editorial_feature: 'Editorial Feature',
  hall_of_fame_spotlight: 'Hall of Fame Spotlight',
  news_highlight: 'News Highlight',
  cultural_break: 'Cultural Break',
  gateway_links: 'Gateway Links',
}

function AdminHomepageSectionsListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isReordering, setIsReordering] = useState(false)
  const [isPublishing, setIsPublishing] = useState(null)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || ''
  )
  const [confirmState, setConfirmState] = useState({ open: false, id: null })
  const errorMessage =
    typeof error === 'string' ? error : error?.message || 'Failed to load data.'

  const sortedItems = useMemo(() => {
    return [...items].sort((left, right) => {
      const leftOrder = Number(left.display_order ?? 0)
      const rightOrder = Number(right.display_order ?? 0)
      return leftOrder - rightOrder
    })
  }, [items])
  const isEmpty = !isLoading && !error && sortedItems.length === 0

  const fetchBlocks = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setSuccessMessage('')

    try {
      const payload = await getAllBlocks()
      const data = payload?.data ?? payload
      const list = Array.isArray(data) ? data : data?.items || data?.blocks || []
      setItems(list)
    } catch (error) {

      setError(error)
    } finally {
      setIsLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    if (!getAuthToken()) {
      navigate('/login', { replace: true })
      return
    }

    fetchBlocks()
  }, [fetchBlocks, navigate])

  const handleDelete = async (id) => {
    setError(null)
    setSuccessMessage('')

    try {
      const response = await deleteBlock(id)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to delete block.')
      }
      window.alert('Homepage block deleted successfully')
      setSuccessMessage('Block deleted.')
      fetchBlocks()
    } catch (error) {

      const message = error.message || 'Unable to delete block.'
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

    const currentOrder = Number(current.display_order ?? 0)
    const targetOrder = Number(target.display_order ?? 0)

    try {
      const [currentResponse, targetResponse] = await Promise.all([
        updateBlock(current.id, { display_order: targetOrder }),
        updateBlock(target.id, { display_order: currentOrder }),
      ])
      if (currentResponse?.success === false || targetResponse?.success === false) {
        throw new Error('Unable to update block order.')
      }
      setSuccessMessage('Block order updated.')
      fetchBlocks()
    } catch (error) {

      const message = error.message || 'Unable to update block order.'
      setError(message)
      window.alert(message)
    } finally {
      setIsReordering(false)
    }
  }

  const handleTogglePublish = async (block) => {
    setError(null)
    setSuccessMessage('')
    setIsPublishing(block.id)

    try {
      const response = await updateBlock(block.id, {
        is_published: !block.is_published,
      })
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to update publish status.')
      }
      setSuccessMessage(
        block.is_published ? 'Block unpublished.' : 'Block published.'
      )
      fetchBlocks()
    } catch (error) {

      const message = error.message || 'Unable to update publish status.'
      setError(message)
      window.alert(message)
    } finally {
      setIsPublishing(null)
    }
  }

  const actionLinkClassName =
    'inline-flex h-8 items-center justify-center rounded-md border border-transparent px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

  return (
    <section className="space-y-4 md:space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold break-words md:text-2xl">
          Homepage Blocks
        </h2>
        <p className="text-sm text-muted-foreground">
          Manage the order, content, and publishing status of homepage blocks.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div />
        <Button
          type="button"
          variant="primary"
          onClick={() => navigate('/admin/homepage-sections/create')}
        >
          Add block
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
            onRetry={fetchBlocks}
            retryLabel="Reload blocks"
          />
        }
        empty={
          <EmptyState
            title="No blocks found"
            description="Create a homepage block to organize the layout."
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/admin/homepage-sections/create')}
              >
                Add block
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
                Block type
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
              const id = item.id

              return (
                <TableRow key={id}>
                  <TableCell>{item.display_order ?? '-'}</TableCell>
                  <TableCell className="max-w-xs break-words">
                    {BLOCK_TYPE_LABELS[item.block_type] || item.block_type || '-'}
                  </TableCell>
                  <TableCell className="max-w-xs break-words">
                    {item.title || '-'}
                  </TableCell>
                  <TableCell>
                    <PublishStatus published={Boolean(item.is_published)} />
                  </TableCell>
                  <TableCell>{formatDate(item.updated_at)}</TableCell>
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
                        onClick={() => handleTogglePublish(item)}
                        disabled={isPublishing === id}
                      >
                        {item.is_published ? 'Unpublish' : 'Publish'}
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
                        disabled={index === sortedItems.length - 1 || isReordering}
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
        title="Delete homepage block"
        description="Delete this block?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmState({ open: false, id: null })}
      />
    </section>
  )
}

export default AdminHomepageSectionsListPage
