import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  deleteSlide,
  getAllSlides,
  updateSlide,
} from '../../services/api/adminCarouselApi.js'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'
import {
  Button,
  EmptyState,
  ErrorState,
  ImageWithFallback,
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

function AdminCarouselListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [page, setPage] = useState(DEFAULT_PAGE)
  const [limit] = useState(DEFAULT_LIMIT)
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isReordering, setIsReordering] = useState(false)
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

  const sortedItems = useMemo(() => {
    return [...items].sort((left, right) => {
      const leftOrder = Number(left.display_order ?? left.displayOrder ?? 0)
      const rightOrder = Number(right.display_order ?? right.displayOrder ?? 0)
      return leftOrder - rightOrder
    })
  }, [items])
  const isEmpty = !isLoading && !error && sortedItems.length === 0

  const fetchSlides = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    setSuccessMessage('')

    try {
      const payload = await getAllSlides({ page, limit })
      // Accept either { data: { items, total } } or a direct array for flexibility.
      const data = payload?.data ?? payload
      const list = Array.isArray(data) ? data : data?.items || data?.slides || []

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

    fetchSlides()
  }, [fetchSlides, navigate, page])

  const handleDelete = async (id) => {
    setError(null)
    setSuccessMessage('')

    if (!window.confirm('Delete this slide?')) {
      return
    }

    try {
      const response = await deleteSlide(id)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to delete slide.')
      }
      window.alert('Carousel slide deleted successfully')
      setSuccessMessage('Slide deleted.')
      fetchSlides()
    } catch (error) {
      if (error.status === 401) {
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to delete slide.'
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

    const currentId = current.id || current._id
    const targetId = target.id || target._id

    const currentFormData = new FormData()
    currentFormData.append('display_order', String(targetOrder))
    const targetFormData = new FormData()
    targetFormData.append('display_order', String(currentOrder))

    try {
      const [currentResponse, targetResponse] = await Promise.all([
        updateSlide(currentId, currentFormData),
        updateSlide(targetId, targetFormData),
      ])
      if (currentResponse?.success === false || targetResponse?.success === false) {
        throw new Error('Unable to update slide order.')
      }
      setSuccessMessage('Slide order updated.')
      fetchSlides()
    } catch (error) {
      if (error.status === 401) {
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to update slide order.'
      setError(message)
      window.alert(message)
    } finally {
      setIsReordering(false)
    }
  }

  const handlePrevPage = () => {
    setPage((current) => Math.max(DEFAULT_PAGE, current - 1))
  }

  const handleNextPage = () => {
    setPage((current) => current + 1)
  }

  const imageFromSlide = (slide) =>
    slide?.image_url || slide?.imageUrl || slide?.image || ''

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Carousel</h2>
          {total !== null ? (
            <p className="text-sm text-muted-foreground">Total: {total}</p>
          ) : null}
        </div>
        <Button type="button" onClick={() => navigate('/admin/carousel/create')}>
          Create slide
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
            onRetry={fetchSlides}
            retryLabel="Reload slides"
          />
        }
        empty={
          <EmptyState
            title="No slides found"
            description="Create a carousel slide to highlight key stories."
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/admin/carousel/create')}
              >
                Create slide
              </Button>
            }
          />
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHead>
              <tr>
                <th className="px-4 py-3 text-left">Thumbnail</th>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Display Order</th>
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
                      <ImageWithFallback
                        src={imageFromSlide(item)}
                        alt={item.title || 'Slide'}
                        className="h-12 w-20 rounded-md object-cover"
                        fallbackText="No image"
                      />
                    </TableCell>
                    <TableCell className="max-w-xs break-words">
                      {item.title || '-'}
                    </TableCell>
                    <TableCell>
                      <PublishStatus published={published} />
                    </TableCell>
                    <TableCell>
                      {item.display_order ?? item.displayOrder ?? '-'}
                    </TableCell>
                    <TableCell>
                      {formatDate(item.updatedAt || item.updated_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/admin/carousel/edit/${id}`}
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

export default AdminCarouselListPage
