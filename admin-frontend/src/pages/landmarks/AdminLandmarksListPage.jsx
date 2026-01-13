import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  deleteLandmark,
  getAllLandmarks,
} from '../../services/api/adminLandmarksApi.js'
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

function AdminLandmarksListPage() {
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

  const fetchLandmarks = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const payload = await getAllLandmarks({ page, limit })
      // Accept either { data: { items, total } } or a direct array for flexibility.
      const data = payload?.data ?? payload
      const list = Array.isArray(data)
        ? data
        : data?.items || data?.landmarks || []

      setItems(list)
      setTotal(data?.total ?? payload?.total ?? null)
    } catch (error) {
      if (error.status === 401) {
        // Session expired or invalid; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      setErrorMessage(error.message || 'Unable to load landmarks.')
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

    fetchLandmarks()
  }, [fetchLandmarks, navigate, page])

  const handleDelete = async (id) => {
    setErrorMessage('')
    setSuccessMessage('')

    if (!window.confirm('Delete this landmark?')) {
      return
    }

    try {
      const response = await deleteLandmark(id)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to delete landmark.')
      }
      window.alert('Landmark deleted successfully')
      setSuccessMessage('Landmark deleted.')
      fetchLandmarks()
    } catch (error) {
      if (error.status === 401) {
        // Token is no longer valid; send the user back to login.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to delete landmark.'
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
    <section>
      <h2>Landmarks</h2>
      <p>
        <Link to="/admin/landmarks/create">Create landmark</Link>
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
              <th>Name/Title</th>
              <th>Slug</th>
              <th>Status</th>
              <th>Updated At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5}>No landmarks found.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id || item._id}>
                  <td>{item.name || item.title || 'Untitled'}</td>
                  <td>{item.slug || '-'}</td>
                  <td>
                    {typeof item.published === 'boolean'
                      ? item.published
                        ? 'Published'
                        : 'Draft'
                      : item.status || 'Unknown'}
                  </td>
                  <td>{formatDate(item.updatedAt || item.updated_at)}</td>
                  <td>
                    <Link to={`/admin/landmarks/edit/${item.id || item._id}`}>
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id || item._id)}
                    >
                      Delete
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

export default AdminLandmarksListPage
