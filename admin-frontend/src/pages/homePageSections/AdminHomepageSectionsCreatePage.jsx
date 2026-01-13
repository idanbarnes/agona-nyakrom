import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSection } from '../../services/api/adminHomepageSectionsApi.js'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'

function AdminHomepageSectionsCreatePage() {
  const navigate = useNavigate()
  const [formState, setFormState] = useState({
    section_key: '',
    title: '',
    content: '',
    display_order: '',
    published: false,
    is_featured: false,
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

    if (!formState.section_key.trim()) {
      setErrorMessage('Section key is required.')
      return
    }

    if (
      formState.display_order === '' ||
      Number.isNaN(Number(formState.display_order))
    ) {
      setErrorMessage('Display order is required.')
      return
    }

    const payload = {
      section_key: formState.section_key.trim(),
      title: formState.title.trim(),
      content: formState.content.trim(),
      display_order: Number(formState.display_order),
      published: formState.published,
      is_featured: formState.is_featured,
    }

    const hasFile = Boolean(formState.image)
    const formData = new FormData()

    if (hasFile) {
      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, String(value ?? ''))
      })
      formData.append('image', formState.image)
    }

    setIsSubmitting(true)
    try {
      const response = await createSection(hasFile ? formData : payload)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to create section.')
      }
      window.alert('Homepage section created successfully')
      navigate('/admin/homepage-sections', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      if (
        typeof error.message === 'string' &&
        error.message.toLowerCase().includes('section_key')
      ) {
        setErrorMessage('Section key already exists.')
        return
      }

      const message = error.message || 'Unable to create section.'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section>
      <h2>Create Homepage Section</h2>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      <form onSubmit={handleSubmit}>
        <label htmlFor="section_key">Section key</label>
        <input
          id="section_key"
          name="section_key"
          type="text"
          value={formState.section_key}
          onChange={handleChange}
          required
        />

        <label htmlFor="title">Title (optional)</label>
        <input
          id="title"
          name="title"
          type="text"
          value={formState.title}
          onChange={handleChange}
        />

        <label htmlFor="content">Content (optional)</label>
        <textarea
          id="content"
          name="content"
          value={formState.content}
          onChange={handleChange}
        />

        <label htmlFor="display_order">Display order</label>
        <input
          id="display_order"
          name="display_order"
          type="number"
          value={formState.display_order}
          onChange={handleChange}
          required
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

        <label htmlFor="image">Image (optional)</label>
        <input id="image" name="image" type="file" onChange={handleFileChange} />

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create section'}
        </button>
      </form>
    </section>
  )
}

export default AdminHomepageSectionsCreatePage
