import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getHistory, saveHistory } from '../../services/api/adminHistoryApi.js'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'

function AdminHistoryPage() {
  const navigate = useNavigate()
  const [formState, setFormState] = useState({
    title: '',
    subtitle: '',
    content: '',
    highlights: '',
    published: false,
    image: null,
    existingImageUrl: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    if (!getAuthToken()) {
      navigate('/login', { replace: true })
      return
    }

    const fetchHistory = async () => {
      setIsLoading(true)
      setErrorMessage('')
      setSuccessMessage('')

      try {
        const payload = await getHistory()
        const data =
          payload && typeof payload === 'object' ? payload.data ?? payload : {}
        const highlightsValue =
          data?.highlights && typeof data.highlights === 'object'
            ? JSON.stringify(data.highlights, null, 2)
            : data?.highlights || ''

        setFormState({
          title: data?.title || '',
          subtitle: data?.subtitle || '',
          content: data?.content || '',
          highlights: highlightsValue,
          published: Boolean(data?.published),
          image: null,
          existingImageUrl:
            data?.image_url || data?.imageUrl || data?.image || '',
        })
      } catch (error) {
        if (error.status === 401) {
          // Token expired; force re-authentication.
          clearAuthToken()
          navigate('/login', { replace: true })
          return
        }

        if (error.status !== 404) {
          setErrorMessage(error.message || 'Unable to load history.')
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchHistory()
  }, [navigate])

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
    setSuccessMessage('')

    if (!getAuthToken()) {
      navigate('/login', { replace: true })
      return
    }

    if (!formState.title.trim() || !formState.content.trim()) {
      setErrorMessage('Title and content are required.')
      return
    }

    let highlightsValue = formState.highlights
    if (typeof highlightsValue === 'string' && highlightsValue.trim()) {
      try {
        const parsed = JSON.parse(highlightsValue)
        highlightsValue = JSON.stringify(parsed)
      } catch {
        setErrorMessage('Highlights must be valid JSON.')
        return
      }
    }

    const formData = new FormData()
    formData.append('title', formState.title.trim())
    formData.append('subtitle', formState.subtitle.trim())
    formData.append('content', formState.content.trim())
    formData.append('highlights', highlightsValue || '')
    formData.append('published', String(formState.published))
    if (formState.image) {
      formData.append('image', formState.image)
    }

    setIsSaving(true)
    try {
      await saveHistory(formData)
      setSuccessMessage('History saved.')
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      setErrorMessage(error.message || 'Unable to save history.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <section>
        <h2>History</h2>
        <p>Loading...</p>
      </section>
    )
  }

  return (
    <section>
      <h2>History</h2>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      {successMessage ? <p role="status">{successMessage}</p> : null}
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

        <label htmlFor="subtitle">Subtitle (optional)</label>
        <input
          id="subtitle"
          name="subtitle"
          type="text"
          value={formState.subtitle}
          onChange={handleChange}
        />

        <label htmlFor="content">Content</label>
        <textarea
          id="content"
          name="content"
          value={formState.content}
          onChange={handleChange}
          required
        />

        <label htmlFor="highlights">Highlights (JSON, optional)</label>
        <textarea
          id="highlights"
          name="highlights"
          value={formState.highlights}
          onChange={handleChange}
          rows={5}
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
        {formState.existingImageUrl ? (
          <p>
            Current image:{' '}
            <a href={formState.existingImageUrl} target="_blank" rel="noreferrer">
              View
            </a>
          </p>
        ) : null}

        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save history'}
        </button>
      </form>
    </section>
  )
}

export default AdminHistoryPage
