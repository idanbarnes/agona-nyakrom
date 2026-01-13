import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  deleteSlide,
  getAllSlides,
  updateSlide,
} from '../../services/api/adminCarouselApi.js'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'

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
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || ''
  )
  const isLastPage =
    total !== null
      ? page >= Math.ceil(total / limit)
      : items.length < limit

  const sortedItems = useMemo(() => {
    return [...items].sort((left, right) => {
      const leftOrder = Number(left.display_order ?? left.displayOrder ?? 0)
      const rightOrder = Number(right.display_order ?? right.displayOrder ?? 0)
      return leftOrder - rightOrder
    })
  }, [items])

  const fetchSlides = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')
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

      setErrorMessage(error.message || 'Unable to load carousel slides.')
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
    setErrorMessage('')
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
      setErrorMessage(message)
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

    setErrorMessage('')
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
      setErrorMessage(message)
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
    <section>
      <h2>Carousel</h2>
      <p>
        <Link to="/admin/carousel/create">Create slide</Link>
      </p>
      {total !== null ? <p>Total: {total}</p> : null}
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      {successMessage ? <p role="status">{successMessage}</p> : null}

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Thumbnail</th>
              <th>Title</th>
              <th>Status</th>
              <th>Display Order</th>
              <th>Updated At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.length === 0 ? (
              <tr>
                <td colSpan={6}>No slides found.</td>
              </tr>
            ) : (
              sortedItems.map((item, index) => (
                <tr key={item.id || item._id}>
                  <td>
                    {imageFromSlide(item) ? (
                      <img
                        src={imageFromSlide(item)}
                        alt={item.title || 'Slide'}
                        width={80}
                        height={50}
                      />
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>{item.title || '-'}</td>
                  <td>
                    {typeof item.published === 'boolean'
                      ? item.published
                        ? 'Published'
                        : 'Draft'
                      : item.status || 'Unknown'}
                  </td>
                  <td>{item.display_order ?? item.displayOrder ?? '-'}</td>
                  <td>{formatDate(item.updatedAt || item.updated_at)}</td>
                  <td>
                    <Link to={`/admin/carousel/edit/${item.id || item._id}`}>
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id || item._id)}
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0 || isReordering}
                    >
                      Move Up
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === sortedItems.length - 1 || isReordering}
                    >
                      Move Down
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      <div>
        <button type="button" onClick={handlePrevPage} disabled={page <= 1}>
          Prev
        </button>
        <span>Page {page}</span>
        <button type="button" onClick={handleNextPage} disabled={isLastPage}>
          Next
        </button>
      </div>
    </section>
  )
}

export default AdminCarouselListPage
