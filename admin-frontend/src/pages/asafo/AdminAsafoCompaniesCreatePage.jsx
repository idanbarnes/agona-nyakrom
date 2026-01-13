import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createAsafoCompany } from '../../services/api/adminAsafoApi.js'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'

function AdminAsafoCompaniesCreatePage() {
  const navigate = useNavigate()
  const [formState, setFormState] = useState({
    name: '',
    history: '',
    description: '',
    events: '',
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

    if (!formState.history || !formState.description) {
      setErrorMessage('History and description are required.')
      return
    }

    const formData = new FormData()
    formData.append('name', formState.name)
    formData.append('history', formState.history)
    formData.append('description', formState.description)
    if (formState.events) {
      formData.append('events', formState.events)
    }
    formData.append('published', String(formState.published))
    if (formState.image) {
      formData.append('image', formState.image)
    }

    setIsSubmitting(true)
    try {
      const response = await createAsafoCompany(formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to create asafo company.')
      }
      window.alert('Asafo company created successfully')
      navigate('/admin/asafo-companies', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to create asafo company.'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section>
      <h2>Create Asafo Company</h2>
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
          />
          Published
        </label>

        <label htmlFor="image">Image (optional)</label>
        <input id="image" name="image" type="file" onChange={handleFileChange} />

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create asafo company'}
        </button>
      </form>
    </section>
  )
}

export default AdminAsafoCompaniesCreatePage
