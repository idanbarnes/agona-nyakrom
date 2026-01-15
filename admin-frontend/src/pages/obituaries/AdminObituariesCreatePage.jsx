import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createObituary } from '../../services/api/adminObituariesApi.js'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  FormField,
  InlineError,
  Input,
  Textarea,
} from '../../components/ui/index.jsx'

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
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold md:text-2xl">Create Obituary</h1>
        <p className="text-sm text-muted-foreground">
          Capture key biographical details and memorial information.
        </p>
      </header>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-5 md:space-y-6">
            <InlineError message={errorMessage} />
            <FormField label="Full name" htmlFor="full_name" required>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                value={formState.full_name}
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField label="Age (optional)" htmlFor="age">
              <Input
                id="age"
                name="age"
                type="number"
                value={formState.age}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Summary" htmlFor="summary" required>
              <Textarea
                id="summary"
                name="summary"
                value={formState.summary}
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField label="Biography" htmlFor="biography" required>
              <Textarea
                id="biography"
                name="biography"
                value={formState.biography}
                onChange={handleChange}
                required
              />
            </FormField>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Date of birth (optional)" htmlFor="date_of_birth">
                <Input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  value={formState.date_of_birth}
                  onChange={handleChange}
                />
              </FormField>

              <FormField label="Date of death" htmlFor="date_of_death" required>
                <Input
                  id="date_of_death"
                  name="date_of_death"
                  type="date"
                  value={formState.date_of_death}
                  onChange={handleChange}
                  required
                />
              </FormField>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Burial date (optional)" htmlFor="burial_date">
                <Input
                  id="burial_date"
                  name="burial_date"
                  type="date"
                  value={formState.burial_date}
                  onChange={handleChange}
                />
              </FormField>

              <FormField label="Funeral date (optional)" htmlFor="funeral_date">
                <Input
                  id="funeral_date"
                  name="funeral_date"
                  type="date"
                  value={formState.funeral_date}
                  onChange={handleChange}
                />
              </FormField>
            </div>

            <FormField label="Image (optional)" htmlFor="image">
              <div className="rounded-lg border border-border bg-background p-4">
                <Input
                  id="image"
                  name="image"
                  type="file"
                  onChange={handleFileChange}
                />
              </div>
            </FormField>

            <FormField label="Published" htmlFor="published">
              <div className="flex items-center gap-2">
                <input
                  id="published"
                  name="published"
                  type="checkbox"
                  checked={formState.published}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <span className="text-sm text-muted-foreground">
                  Publish this obituary immediately.
                </span>
              </div>
            </FormField>
          </CardContent>
          <CardFooter>
            <Button
              variant="secondary"
              type="button"
              onClick={() => navigate('/admin/obituaries')}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create obituary'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default AdminObituariesCreatePage
