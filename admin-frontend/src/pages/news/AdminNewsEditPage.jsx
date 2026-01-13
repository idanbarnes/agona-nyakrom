import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSingleNews, updateNews } from '../../services/api/adminNewsApi.js'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'

function AdminNewsEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [initialState, setInitialState] = useState(null)
  const [formState, setFormState] = useState({
    title: '',
    summary: '',
    content: '',
    published: false,
    image: null,
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

    const fetchNews = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const payload = await getSingleNews(id)
        const data = payload?.data ?? payload
        const newsItem = data?.news || data

        const nextState = {
          title: newsItem?.title || '',
          summary: newsItem?.summary || '',
          content: newsItem?.content || '',
          published: Boolean(newsItem?.published),
          image: null,
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

        setErrorMessage(error.message || 'Unable to load news item.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchNews()
  }, [id, navigate])

  const hasChanges = useMemo(() => {
    if (!initialState) {
      return false
    }

    return (
      autoDrafted ||
      formState.title !== initialState.title ||
      formState.summary !== initialState.summary ||
      formState.content !== initialState.content ||
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

    if (!formState.title || !formState.summary || !formState.content) {
      setErrorMessage('Title, summary, and content are required.')
      return
    }

    const formData = new FormData()
    formData.append('title', formState.title)
    formData.append('summary', formState.summary)
    formData.append('content', formState.content)
    // Force publish on successful save when leaving auto-draft mode.
    formData.append('published', 'true')
    if (formState.image) {
      formData.append('image', formState.image)
    }

    setIsSubmitting(true)
    try {
      const response = await updateNews(id, formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to update news.')
      }
      setFormState((current) => ({ ...current, published: true }))
      setAutoDrafted(false)
      window.alert('News edited successfully')
      navigate('/admin/news', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to update news.'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <section>
        <h2>Edit News</h2>
        <p>Loading...</p>
      </section>
    )
  }

  return (
    <section>
      <h2>Edit News</h2>
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

        <label htmlFor="image">Replace image (optional)</label>
        <input id="image" name="image" type="file" onChange={handleFileChange} />

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

        <button type="submit" disabled={isSubmitting || !hasChanges}>
          {isSubmitting ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </section>
  )
}

export default AdminNewsEditPage
