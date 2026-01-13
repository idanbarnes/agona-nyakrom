import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSlide } from '../../services/api/adminCarouselApi.js'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'

function AdminCarouselCreatePage() {
  const navigate = useNavigate()
  const [formState, setFormState] = useState({
    title: '',
    subtitle: '',
    caption: '',
    cta_text: '',
    cta_url: '',
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

    if (!formState.image) {
      setErrorMessage('Image is required.')
      return
    }

    if (
      formState.display_order === '' ||
      Number.isNaN(Number(formState.display_order))
    ) {
      setErrorMessage('Display order is required.')
      return
    }

    const formData = new FormData()
    formData.append('title', formState.title.trim())
    formData.append('subtitle', formState.subtitle.trim())
    formData.append('caption', formState.caption.trim())
    formData.append('cta_text', formState.cta_text.trim())
    formData.append('cta_url', formState.cta_url.trim())
    formData.append('display_order', String(Number(formState.display_order)))
    formData.append('published', String(formState.published))
    formData.append('image', formState.image)

    setIsSubmitting(true)
    try {
      const response = await createSlide(formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to create slide.')
      }
      window.alert('Carousel slide created successfully')
      navigate('/admin/carousel', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to create slide.'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section>
      <h2>Create Carousel Slide</h2>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      <form onSubmit={handleSubmit}>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          value={formState.title}
          onChange={handleChange}
        />

        <label htmlFor="subtitle">Subtitle</label>
        <input
          id="subtitle"
          name="subtitle"
          type="text"
          value={formState.subtitle}
          onChange={handleChange}
        />

        <label htmlFor="caption">Caption</label>
        <textarea
          id="caption"
          name="caption"
          value={formState.caption}
          onChange={handleChange}
        />

        <label htmlFor="cta_text">CTA text</label>
        <input
          id="cta_text"
          name="cta_text"
          type="text"
          value={formState.cta_text}
          onChange={handleChange}
        />

        <label htmlFor="cta_url">CTA URL</label>
        <input
          id="cta_url"
          name="cta_url"
          type="text"
          value={formState.cta_url}
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

        <label htmlFor="image">Image</label>
        <input id="image" name="image" type="file" onChange={handleFileChange} />

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create slide'}
        </button>
      </form>
    </section>
  )
}

export default AdminCarouselCreatePage
