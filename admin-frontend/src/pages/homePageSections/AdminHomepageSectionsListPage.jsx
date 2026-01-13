import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  deleteSection,
  getAllSections,
  updateSection,
} from '../../services/api/adminHomepageSectionsApi.js'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'

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
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || ''
  )

  const sortedItems = useMemo(() => {
    return [...items].sort((left, right) => {
      const leftOrder = Number(left.display_order ?? left.displayOrder ?? 0)
      const rightOrder = Number(right.display_order ?? right.displayOrder ?? 0)
      return leftOrder - rightOrder
    })
  }, [items])

  const fetchSections = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')
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

      setErrorMessage(error.message || 'Unable to load homepage sections.')
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
    setErrorMessage('')
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
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setIsReordering(false)
    }
  }

  return (
    <section>
      <h2>Homepage Sections</h2>
      <p>
        <Link to="/admin/homepage-sections/create">Create section</Link>
      </p>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      {successMessage ? <p role="status">{successMessage}</p> : null}

      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Section key</th>
              <th>Title</th>
              <th>Status</th>
              <th>Updated At</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.length === 0 ? (
              <tr>
                <td colSpan={6}>No sections found.</td>
              </tr>
            ) : (
              sortedItems.map((item, index) => (
                <tr key={item.id || item._id}>
                  <td>{item.display_order ?? item.displayOrder ?? '-'}</td>
                  <td>{item.section_key || item.sectionKey || '-'}</td>
                  <td>{item.title || '-'}</td>
                  <td>
                    {typeof item.published === 'boolean'
                      ? item.published
                        ? 'Published'
                        : 'Draft'
                      : item.status || 'Unknown'}
                  </td>
                  <td>{formatDate(item.updated_at || item.updatedAt)}</td>
                  <td>
                    <Link to={`/admin/homepage-sections/edit/${item.id || item._id}`}>
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
    </section>
  )
}

export default AdminHomepageSectionsListPage
