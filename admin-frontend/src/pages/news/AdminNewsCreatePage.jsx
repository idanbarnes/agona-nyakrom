import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createNews } from '../../services/api/adminNewsApi.js'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'

function AdminNewsCreatePage() {
  const navigate = useNavigate()
  const [formState, setFormState] = useState({
    title: '',
    summary: '',
    content: '',
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

    if (!formState.title || !formState.summary || !formState.content) {
      setErrorMessage('Title, summary, and content are required.')
      return
    }

    const formData = new FormData()
    formData.append('title', formState.title)
    formData.append('summary', formState.summary)
    formData.append('content', formState.content)
    formData.append('published', String(formState.published))
    if (formState.image) {
      formData.append('image', formState.image)
    }

    setIsSubmitting(true)
    try {
      const response = await createNews(formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to create news.')
      }
      window.alert('News created successfully')
      navigate('/admin/news', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to create news.'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section>
      <h2>Create News</h2>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      <form onSubmit={handleSubmit}>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          value={formState.title}
          onChange={handleChange}
          required
        />

        <label htmlFor="summary">Summary</label>
        <textarea
          id="summary"
          name="summary"
          value={formState.summary}
          onChange={handleChange}
          required
        />

        <label htmlFor="content">Content</label>
        <textarea
          id="content"
          name="content"
          value={formState.content}
          onChange={handleChange}
          required
        />

        <label htmlFor="image">Image (optional)</label>
        <input id="image" name="image" type="file" onChange={handleFileChange} />

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

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create news'}
        </button>
      </form>
    </section>
  )
}

export default AdminNewsCreatePage
