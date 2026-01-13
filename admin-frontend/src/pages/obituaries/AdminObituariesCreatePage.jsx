import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createObituary } from '../../services/api/adminObituariesApi.js'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'

function AdminObituariesCreatePage() {
  const navigate = useNavigate()
  const dateFields = new Set([
    'date_of_birth',
    'date_of_death',
    'burial_date',
    'funeral_date',
  ])
  const [formState, setFormState] = useState({
    full_name: '',
    age: '',
    summary: '',
    biography: '',
    date_of_birth: '',
    date_of_death: '',
    burial_date: '',
    funeral_date: '',
    published: false,
    image: null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const normalizeDateInput = (value) => {
    if (typeof value !== 'string') {
      return value
    }

    const trimmed = value.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed
    }
    if (trimmed.includes('T')) {
      return trimmed.split('T')[0]
    }

    return trimmed
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    const rawValue = type === 'checkbox' ? checked : value
    const nextValue = dateFields.has(name) ? normalizeDateInput(rawValue) : rawValue
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

    if (!formState.full_name || !formState.summary || !formState.biography) {
      setErrorMessage('Full name, summary, and biography are required.')
      return
    }

    if (!formState.date_of_death) {
      setErrorMessage('Date of death is required.')
      return
    }

    const formData = new FormData()
    formData.append('full_name', formState.full_name)
    if (formState.age) {
      formData.append('age', formState.age)
    }
    formData.append('summary', formState.summary)
    formData.append('biography', formState.biography)
    if (formState.date_of_birth) {
      formData.append('date_of_birth', formState.date_of_birth)
    }
    if (formState.date_of_death) {
      formData.append('date_of_death', formState.date_of_death)
    }
    if (formState.burial_date) {
      formData.append('burial_date', formState.burial_date)
    }
    if (formState.funeral_date) {
      formData.append('funeral_date', formState.funeral_date)
    }
    formData.append('published', String(formState.published))
    formData.append('is_published', String(formState.published))
    if (formState.image) {
      formData.append('image', formState.image)
    }

    setIsSubmitting(true)
    try {
      const response = await createObituary(formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to create obituary.')
      }
      window.alert('Obituary created successfully')
      navigate('/admin/obituaries', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to create obituary.'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section>
      <h2>Create Obituary</h2>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      <form onSubmit={handleSubmit}>
        <label htmlFor="full_name">Full name</label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          value={formState.full_name}
          onChange={handleChange}
          required
        />

        <label htmlFor="age">Age (optional)</label>
        <input
          id="age"
          name="age"
          type="number"
          value={formState.age}
          onChange={handleChange}
        />

        <label htmlFor="summary">Summary</label>
        <textarea
          id="summary"
          name="summary"
          value={formState.summary}
          onChange={handleChange}
          required
        />

        <label htmlFor="biography">Biography</label>
        <textarea
          id="biography"
          name="biography"
          value={formState.biography}
          onChange={handleChange}
          required
        />

        <label htmlFor="date_of_birth">Date of birth (optional)</label>
        <input
          id="date_of_birth"
          name="date_of_birth"
          type="date"
          value={formState.date_of_birth}
          onChange={handleChange}
        />

        <label htmlFor="date_of_death">Date of death</label>
        <input
          id="date_of_death"
          name="date_of_death"
          type="date"
          value={formState.date_of_death}
          onChange={handleChange}
          required
        />

        <label htmlFor="burial_date">Burial date (optional)</label>
        <input
          id="burial_date"
          name="burial_date"
          type="date"
          value={formState.burial_date}
          onChange={handleChange}
        />

        <label htmlFor="funeral_date">Funeral date (optional)</label>
        <input
          id="funeral_date"
          name="funeral_date"
          type="date"
          value={formState.funeral_date}
          onChange={handleChange}
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
          {isSubmitting ? 'Creating...' : 'Create obituary'}
        </button>
      </form>
    </section>
  )
}

export default AdminObituariesCreatePage
