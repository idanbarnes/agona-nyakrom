import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getSingleLandmark,
  updateLandmark,
} from '../../services/api/adminLandmarksApi.js'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'

function AdminLandmarksEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [initialState, setInitialState] = useState(null)
  const [formState, setFormState] = useState({
    name: '',
    title: '',
    description: '',
    location: '',
    google_map_link: '',
    category: '',
    published: false,
    image: null,
    existingImageUrl: '',
  })
  const [autoDrafted, setAutoDrafted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!getAuthToken()) {
      navigate('/login', { replace: true })
      return
    }

    const fetchLandmark = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const payload = await getSingleLandmark(id)
        const data = payload?.data ?? payload
        const landmark = data?.landmark || data

        const nextState = {
          name: landmark?.name || '',
          title: landmark?.title || '',
          description: landmark?.description || '',
          location: landmark?.location || landmark?.address || '',
          google_map_link:
            landmark?.google_map_link ||
            landmark?.googleMapLink ||
            landmark?.video_url ||
            '',
          category: landmark?.category || '',
          published: Boolean(landmark?.published),
          image: null,
          existingImageUrl:
            landmark?.image_url ||
            landmark?.imageUrl ||
            landmark?.image ||
            landmark?.images?.original ||
            landmark?.images?.large ||
            landmark?.images?.medium ||
            landmark?.images?.thumbnail ||
            '',
        }

        setInitialState(nextState)
        // Auto-draft the UI when entering edit mode.
        setFormState({ ...nextState, published: false })
        setAutoDrafted(true)
      } catch (error) {
        if (error.status === 401) {
          // Token expired; force re-authentication.
          clearAuthToken()
          navigate('/login', { replace: true })
          return
        }

        setErrorMessage(error.message || 'Unable to load landmark.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLandmark()
  }, [id, navigate])

  const hasChanges = useMemo(() => {
    if (!initialState) {
      return false
    }

    return (
      autoDrafted ||
      formState.name !== initialState.name ||
      formState.title !== initialState.title ||
      formState.description !== initialState.description ||
      formState.location !== initialState.location ||
      formState.google_map_link !== initialState.google_map_link ||
      formState.category !== initialState.category ||
      formState.published !== initialState.published ||
      Boolean(formState.image)
    )
  }, [autoDrafted, formState, initialState])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    const nextValue = type === 'checkbox' ? checked : value
    setFormState((current) => ({ ...current, [name]: nextValue }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null
    setFormState((current) => ({ ...current, image: file }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    if (!hasChanges) {
      setErrorMessage('No changes to update.')
      return
    }

    if (!formState.name.trim() && !formState.title.trim()) {
      setErrorMessage('Name or title is required.')
      return
    }

    const formData = new FormData()
    formData.append('name', formState.name.trim())
    formData.append('title', formState.title.trim())
    formData.append('description', formState.description.trim())
    formData.append('address', formState.location.trim())
    formData.append('video_url', formState.google_map_link.trim())
    formData.append('category', formState.category.trim())
    // Force publish on successful save when leaving auto-draft mode.
    formData.append('published', 'true')
    if (formState.image) {
      formData.append('image', formState.image)
    }

    setIsSubmitting(true)
    try {
      const response = await updateLandmark(id, formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to update landmark.')
      }
      setFormState((current) => ({ ...current, published: true }))
      setAutoDrafted(false)
      window.alert('Landmark edited successfully')
      navigate('/admin/landmarks', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to update landmark.'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <section>
        <h2>Edit Landmark</h2>
        <p>Loading...</p>
      </section>
    )
  }

  return (
    <section>
      <h2>Edit Landmark</h2>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          value={formState.name}
          onChange={handleChange}
        />

        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          value={formState.title}
          onChange={handleChange}
        />

        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formState.description}
          onChange={handleChange}
        />

        <label htmlFor="location">Location</label>
        <input
          id="location"
          name="location"
          type="text"
          value={formState.location}
          onChange={handleChange}
        />

        <label htmlFor="google_map_link">Google map link</label>
        <input
          id="google_map_link"
          name="google_map_link"
          type="url"
          value={formState.google_map_link}
          onChange={handleChange}
        />

        <label htmlFor="category">Category</label>
        <input
          id="category"
          name="category"
          type="text"
          value={formState.category}
          onChange={handleChange}
        />

        <label htmlFor="published">
          <input
            id="published"
            name="published"
            type="checkbox"
            checked={formState.published}
            onChange={handleChange}
            disabled={autoDrafted}
          />
          Published
        </label>

        <label htmlFor="image">Replace image (optional)</label>
        <input id="image" name="image" type="file" onChange={handleFileChange} />
        {formState.existingImageUrl ? (
          <p>
            Current image:{' '}
            <a href={formState.existingImageUrl} target="_blank" rel="noreferrer">
              View
            </a>
          </p>
        ) : null}

        <button type="submit" disabled={isSubmitting || !hasChanges}>
          {isSubmitting ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </section>
  )
}

export default AdminLandmarksEditPage
