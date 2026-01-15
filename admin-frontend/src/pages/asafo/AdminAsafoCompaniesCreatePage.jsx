import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createAsafoCompany } from '../../services/api/adminAsafoApi.js'
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
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold md:text-2xl">
          Create Asafo Company
        </h1>
        <p className="text-sm text-muted-foreground">
          Document the company history, description, and key events.
        </p>
      </header>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-5 md:space-y-6">
            <InlineError message={errorMessage} />
            <FormField label="Name" htmlFor="name" required>
              <Input
                id="name"
                name="name"
                type="text"
                value={formState.name}
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField label="History" htmlFor="history" required>
              <Textarea
                id="history"
                name="history"
                value={formState.history}
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField label="Description" htmlFor="description" required>
              <Textarea
                id="description"
                name="description"
                value={formState.description}
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField label="Events (optional)" htmlFor="events">
              <Textarea
                id="events"
                name="events"
                value={formState.events}
                onChange={handleChange}
              />
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
                  Publish this company profile immediately.
                </span>
              </div>
            </FormField>

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
          </CardContent>
          <CardFooter>
            <Button
              variant="secondary"
              type="button"
              onClick={() => navigate('/admin/asafo-companies')}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create asafo company'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default AdminAsafoCompaniesCreatePage
