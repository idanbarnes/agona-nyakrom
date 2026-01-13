import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getSingleAsafoCompany,
  updateAsafoCompany,
} from '../../services/api/adminAsafoApi.js'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'

function AdminAsafoCompaniesEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [initialState, setInitialState] = useState(null)
  const [formState, setFormState] = useState({
    name: '',
    history: '',
    description: '',
    events: '',
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

    const fetchCompany = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const payload = await getSingleAsafoCompany(id)
        const data = payload?.data ?? payload
        const company = data?.company || data

        const nextState = {
          name: company?.name || '',
          history: company?.history || '',
          description: company?.description || '',
          events: company?.events || '',
          published: Boolean(company?.published),
          image: null,
          existingImageUrl:
            company?.image_url || company?.imageUrl || company?.image || '',
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

        setErrorMessage(error.message || 'Unable to load asafo company.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCompany()
  }, [id, navigate])

  const hasChanges = useMemo(() => {
    if (!initialState) {
      return false
    }

    return (
      autoDrafted ||
      formState.name !== initialState.name ||
      formState.history !== initialState.history ||
      formState.description !== initialState.description ||
      formState.events !== initialState.events ||
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

    if (!formState.name || !formState.history || !formState.description) {
      setErrorMessage('Name, history, and description are required.')
      return
    }

    const formData = new FormData()
    formData.append('name', formState.name)
    formData.append('history', formState.history)
    formData.append('description', formState.description)
    if (formState.events) {
      formData.append('events', formState.events)
    }
    // Force publish on successful save when leaving auto-draft mode.
    formData.append('published', 'true')
    if (formState.image) {
      formData.append('image', formState.image)
    }

    setIsSubmitting(true)
    try {
      const response = await updateAsafoCompany(id, formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to update asafo company.')
      }
      setFormState((current) => ({ ...current, published: true }))
      setAutoDrafted(false)
      window.alert('Asafo company edited successfully')
      navigate('/admin/asafo-companies', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to update asafo company.'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <section>
        <h2>Edit Asafo Company</h2>
        <p>Loading...</p>
      </section>
    )
  }

  return (
    <section>
      <h2>Edit Asafo Company</h2>
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

        <label htmlFor="history">History</label>
        <textarea
          id="history"
          name="history"
          value={formState.history}
          onChange={handleChange}
          required
        />

        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          value={formState.description}
          onChange={handleChange}
          required
        />

        <label htmlFor="events">Events (optional)</label>
        <textarea
          id="events"
          name="events"
          value={formState.events}
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

export default AdminAsafoCompaniesEditPage
