import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createHallOfFame } from '../../services/api/adminHallOfFameApi.js'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'

function AdminHallOfFameCreatePage() {
  const navigate = useNavigate()
  const [formState, setFormState] = useState({
    name: '',
    title: '',
    bio: '',
    achievements: '',
    is_featured: false,
    display_order: '',
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

    if (!formState.name) {
      setErrorMessage('Name is required.')
      return
    }

    if (!formState.title || !formState.bio) {
      setErrorMessage('Title and bio are required.')
      return
    }

    const formData = new FormData()
    formData.append('name', formState.name)
    formData.append('title', formState.title)
    formData.append('bio', formState.bio)
    if (formState.achievements) {
      formData.append('achievements', formState.achievements)
    }
    if (formState.display_order) {
      formData.append('display_order', String(formState.display_order))
    }
    formData.append('is_featured', String(formState.is_featured))
    formData.append('published', String(formState.published))
    if (formState.image) {
      formData.append('image', formState.image)
    }

    setIsSubmitting(true)
    try {
      const response = await createHallOfFame(formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to create entry.')
      }
      window.alert('Hall of Fame entry created successfully')
      navigate('/admin/hall-of-fame', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to create entry.'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section>
      <h2>Create Hall of Fame Entry</h2>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          value={formState.name}
          onChange={handleChange}
          required
        />

        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          value={formState.title}
          onChange={handleChange}
          required
        />

        <label htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          name="bio"
          value={formState.bio}
          onChange={handleChange}
          required
        />

        <label htmlFor="achievements">Achievements (optional)</label>
        <textarea
          id="achievements"
          name="achievements"
          value={formState.achievements}
          onChange={handleChange}
        />

        <label htmlFor="is_featured">
          <input
            id="is_featured"
            name="is_featured"
            type="checkbox"
            checked={formState.is_featured}
            onChange={handleChange}
          />
          Featured
        </label>

        <label htmlFor="display_order">Display order (optional)</label>
        <input
          id="display_order"
          name="display_order"
          type="number"
          value={formState.display_order}
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
          {isSubmitting ? 'Creating...' : 'Create entry'}
        </button>
      </form>
    </section>
  )
}

export default AdminHallOfFameCreatePage
