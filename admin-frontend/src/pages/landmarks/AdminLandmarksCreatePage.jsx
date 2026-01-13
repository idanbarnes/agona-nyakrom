import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createLandmark } from '../../services/api/adminLandmarksApi.js'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'

function AdminLandmarksCreatePage() {
  const navigate = useNavigate()
  const [formState, setFormState] = useState({
    name: '',
    title: '',
    description: '',
    location: '',
    google_map_link: '',
    category: '',
    published: false,
    image: null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

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

    if (!getAuthToken()) {
      navigate('/login', { replace: true })
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
    formData.append('published', String(formState.published))
    if (formState.image) {
      formData.append('image', formState.image)
    }

    setIsSubmitting(true)
    try {
      const response = await createLandmark(formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to create landmark.')
      }
      window.alert('Landmark created successfully')
      navigate('/admin/landmarks', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to create landmark.'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section>
      <h2>Create Landmark</h2>
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
          />
          Published
        </label>

        <label htmlFor="image">Image (optional)</label>
        <input id="image" name="image" type="file" onChange={handleFileChange} />

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create landmark'}
        </button>
      </form>
    </section>
  )
}

export default AdminLandmarksCreatePage
