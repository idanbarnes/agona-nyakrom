import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  deleteHallOfFame,
  getAllHallOfFame,
} from '../../services/api/adminHallOfFameApi.js'
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

function AdminHallOfFameListPage() {
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

  const fetchHallOfFame = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')
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

      setErrorMessage(error.message || 'Unable to load hall of fame entries.')
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
    setErrorMessage('')
    setSuccessMessage('')

    if (!window.confirm('Delete this entry?')) {
      return
    }

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
      <h2>Hall of Fame</h2>
      <p>
        <Link to="/admin/hall-of-fame/create">Create entry</Link>
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
              <th>Name</th>
              <th>Title</th>
              <th>Featured</th>
              <th>Display Order</th>
              <th>Status</th>
              <th>Updated At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7}>No entries found.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id || item._id}>
                  <td>{item.name || 'Untitled'}</td>
                  <td>{item.title || '-'}</td>
                  <td>{item.is_featured ? 'Yes' : 'No'}</td>
                  <td>{item.display_order ?? item.displayOrder ?? '-'}</td>
                  <td>
                    {typeof item.published === 'boolean'
                      ? item.published
                        ? 'Published'
                        : 'Draft'
                      : item.status || 'Unknown'}
                  </td>
                  <td>{formatDate(item.updatedAt || item.updated_at)}</td>
                  <td>
                    <Link to={`/admin/hall-of-fame/edit/${item.id || item._id}`}>
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

export default AdminHallOfFameListPage
