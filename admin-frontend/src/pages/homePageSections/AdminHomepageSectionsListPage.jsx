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
import { TableEntriesSummary } from '../../components/ui/pagination.jsx'

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

const statusFilterOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
]

const BLOCK_TYPE_LABELS = {
  editorial_feature: 'Editorial Feature',
  who_we_are: 'Who We Are',
  welcome: 'Welcome',
  hall_of_fame_spotlight: 'Hall of Fame Spotlight',
  news_highlight: 'News Highlight',
  cultural_break: 'Cultural Break',
  gateway_links: 'Gateway Links',
}

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

function ChevronUpIcon({ className = 'h-4 w-4' }) {
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
      <polyline points="18 15 12 9 6 15" />
    </svg>
  )
}

function ChevronDownIcon({ className = 'h-4 w-4' }) {
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
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function getPublishedValue(item) {
  return Boolean(item?.is_published ?? item?.isPublished ?? item?.published)
}

function AdminHomepageSectionsListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isReordering, setIsReordering] = useState(false)
  const [isPublishing, setIsPublishing] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
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
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return sortedItems.filter((item) => {
      const published = getPublishedValue(item)

      if (statusFilter === 'published' && !published) {
        return false
      }

      if (statusFilter === 'draft' && published) {
        return false
      }

      if (!query) {
        return true
      }

      const title = String(item?.title || '').toLowerCase()
      const blockType = String(
        BLOCK_TYPE_LABELS[item?.block_type] || item?.block_type || ''
      ).toLowerCase()

      return title.includes(query) || blockType.includes(query)
    })
  }, [searchQuery, sortedItems, statusFilter])
  const isEmpty = !isLoading && !error && filteredItems.length === 0
  const hasActiveFilters = searchQuery.trim() !== '' || statusFilter !== 'all'
  const totalEntries = filteredItems.length

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
  }, [])

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

  const handleUnpublish = async (block) => {
    const id = block?.id
    const published = getPublishedValue(block)
    if (!id || !published) {
      return
    }

    setError(null)
    setSuccessMessage('')
    setIsPublishing(id)

    try {
      const response = await updateBlock(id, {
        is_published: false,
      })
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to unpublish block.')
      }
      setSuccessMessage('Block unpublished.')
      fetchBlocks()
    } catch (error) {
      const message = error.message || 'Unable to unpublish block.'
      setError(message)
      window.alert(message)
    } finally {
      setIsPublishing(null)
    }
  }

  const handleMove = async (blockId, direction) => {
    const currentIndex = sortedItems.findIndex((entry) => entry?.id === blockId)
    if (currentIndex < 0) {
      return
    }

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= sortedItems.length) {
      return
    }

    const current = sortedItems[currentIndex]
    const target = sortedItems[targetIndex]
    const currentOrder = Number(current?.display_order ?? 0)
    const targetOrder = Number(target?.display_order ?? 0)

    setError(null)
    setSuccessMessage('')
    setIsReordering(true)

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
      const message = error?.message || 'Unable to update block order.'
      setError(message)
      window.alert(message)
    } finally {
      setIsReordering(false)
    }
  }

  const iconButtonClassName =
    'inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
  const neutralIconButtonClassName = `${iconButtonClassName} text-slate-600 hover:bg-accent hover:text-slate-900`

  return (
    <section className="mx-auto max-w-6xl space-y-6 pb-8 md:space-y-8">
      <header className="rounded-2xl border border-border/80 bg-gradient-to-r from-white via-slate-50 to-blue-50/40 p-5 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              Homepage Blocks Management
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Manage homepage blocks, drafts, and publication updates from one place.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            className="border-slate-900 bg-slate-900 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800"
            onClick={() => navigate('/admin/homepage-sections/create')}
          >
            <PlusIcon />
            Create Homepage Block
          </Button>
        </div>
      </header>
      {error ? <ToastMessage type="error" message={errorMessage} /> : null}
      {successMessage ? (
        <ToastMessage type="success" message={successMessage} />
      ) : null}

      <div className="rounded-xl border border-border/80 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
              <SearchIcon className="h-4 w-4" />
            </span>
            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by block title or type"
              className="h-11 w-full pl-10 transition-colors duration-200"
              aria-label="Search homepage blocks by title or type"
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
                  onClick={() => setStatusFilter(option.value)}
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
            title={hasActiveFilters ? 'No matching blocks' : 'No blocks found'}
            description={
              hasActiveFilters
                ? 'Try a different title, type, or status filter.'
                : 'Create a homepage block to organize the layout.'
            }
            action={
              hasActiveFilters ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/admin/homepage-sections/create')}
                >
                  Create block
                </Button>
              )
            }
          />
        }
      >
        <div className="mb-3 flex justify-start">
          <TableEntriesSummary totalEntries={totalEntries} />
        </div>
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
            {filteredItems.map((item) => {
              const id = item.id
              const published = getPublishedValue(item)
              const currentIndex = sortedItems.findIndex((entry) => entry?.id === id)
              const canMoveUp = published && currentIndex > 0 && !isReordering
              const canMoveDown =
                published &&
                currentIndex >= 0 &&
                currentIndex < sortedItems.length - 1 &&
                !isReordering

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
                    <PublishStatus published={published} />
                  </TableCell>
                  <TableCell>{formatDate(item.updated_at)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/admin/homepage-sections/edit/${id}`}
                        className={neutralIconButtonClassName}
                        aria-label={`Edit ${item.title || 'homepage block'}`}
                        title="Edit"
                      >
                        <EditIcon />
                      </Link>
                      <button
                        type="button"
                        className={`${iconButtonClassName} !text-red-600 hover:!bg-red-50 hover:!text-red-700`}
                        aria-label={`Delete ${item.title || 'homepage block'}`}
                        title="Delete"
                        onClick={() => handleDeleteClick(id)}
                      >
                        <TrashIcon />
                      </button>
                      <button
                        type="button"
                        className={[
                          iconButtonClassName,
                          !id || !published || isPublishing === id
                            ? 'cursor-not-allowed !text-slate-300 opacity-60 hover:translate-y-0 hover:!bg-transparent hover:!text-slate-300'
                            : '!text-red-600 hover:!bg-red-50 hover:!text-red-700',
                        ].join(' ')}
                        aria-label={`Unpublish ${item.title || 'homepage block'}`}
                        title="Unpublish"
                        disabled={!id || !published || isPublishing === id}
                        onClick={() => handleUnpublish(item)}
                      >
                        <EyeOffIcon />
                      </button>
                      <button
                        type="button"
                        className={[
                          neutralIconButtonClassName,
                          !canMoveUp
                            ? 'cursor-not-allowed opacity-40 hover:translate-y-0 hover:bg-transparent hover:text-slate-600'
                            : '',
                        ].join(' ')}
                        aria-label={`Move up ${item.title || 'homepage block'}`}
                        title="Move Up"
                        disabled={!canMoveUp}
                        onClick={() => handleMove(id, 'up')}
                      >
                        <ChevronUpIcon />
                      </button>
                      <button
                        type="button"
                        className={[
                          neutralIconButtonClassName,
                          !canMoveDown
                            ? 'cursor-not-allowed opacity-40 hover:translate-y-0 hover:bg-transparent hover:text-slate-600'
                            : '',
                        ].join(' ')}
                        aria-label={`Move down ${item.title || 'homepage block'}`}
                        title="Move Down"
                        disabled={!canMoveDown}
                        onClick={() => handleMove(id, 'down')}
                      >
                        <ChevronDownIcon />
                      </button>
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
