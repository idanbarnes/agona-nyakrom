import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getSingleObituary,
  updateObituary,
} from '../../services/api/adminObituariesApi.js'
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

function AdminObituariesEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [initialState, setInitialState] = useState(null)
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
    existingImageUrl: '',
  })
  const [autoDrafted, setAutoDrafted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const normalizeDate = (value) => {
    if (!value) {
      return ''
    }

    if (typeof value === 'string') {
      const trimmed = value.trim()
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed
      }
      if (trimmed.includes('T')) {
        return trimmed.split('T')[0]
      }
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return ''
    }

    // Align with input[type="date"] expected format (YYYY-MM-DD).
    return date.toISOString().slice(0, 10)
  }

  useEffect(() => {
    if (!getAuthToken()) {
      navigate('/login', { replace: true })
      return
    }

    const fetchObituary = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const payload = await getSingleObituary(id)
        const data = payload?.data ?? payload
        const obituary = data?.obituary || data

        const nextState = {
          full_name: obituary?.full_name || obituary?.fullName || '',
          age: obituary?.age ?? '',
          summary: obituary?.summary || '',
          biography: obituary?.biography || '',
          date_of_birth: normalizeDate(
            obituary?.date_of_birth || obituary?.dateOfBirth
          ),
          date_of_death: normalizeDate(
            obituary?.date_of_death || obituary?.dateOfDeath
          ),
          burial_date: normalizeDate(
            obituary?.burial_date || obituary?.burialDate
          ),
          funeral_date: normalizeDate(
            obituary?.funeral_date || obituary?.funeralDate
          ),
          published: Boolean(
            obituary?.published ?? obituary?.is_published ?? obituary?.isPublished
          ),
          image: null,
          existingImageUrl:
            obituary?.image_url || obituary?.imageUrl || obituary?.image || '',
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

        setErrorMessage(error.message || 'Unable to load obituary.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchObituary()
  }, [id, navigate])

  const hasChanges = useMemo(() => {
    if (!initialState) {
      return false
    }

    return (
      autoDrafted ||
      formState.full_name !== initialState.full_name ||
      String(formState.age) !== String(initialState.age) ||
      formState.summary !== initialState.summary ||
      formState.biography !== initialState.biography ||
      formState.date_of_birth !== initialState.date_of_birth ||
      formState.date_of_death !== initialState.date_of_death ||
      formState.burial_date !== initialState.burial_date ||
      formState.funeral_date !== initialState.funeral_date ||
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

    if (!formState.full_name || !formState.summary || !formState.biography) {
      setErrorMessage('Full name, summary, and biography are required.')
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
    // Force publish on successful save when leaving auto-draft mode.
    formData.append('published', 'true')
    formData.append('is_published', 'true')
    if (formState.image) {
      formData.append('image', formState.image)
    }

    setIsSubmitting(true)
    try {
      const response = await updateObituary(id, formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to update obituary.')
      }
      setFormState((current) => ({ ...current, published: true }))
      setAutoDrafted(false)
      window.alert('Obituary edited successfully')
      navigate('/admin/obituaries', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to update obituary.'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold break-words md:text-2xl">Edit Obituary</h1>
          <p className="text-sm text-muted-foreground">
            Update obituary details and republish when ready.
          </p>
        </header>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold break-words md:text-2xl">Edit Obituary</h1>
        <p className="text-sm text-muted-foreground">
          Keep the memorial information accurate and up to date.
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

              <FormField label="Date of death (optional)" htmlFor="date_of_death">
                <Input
                  id="date_of_death"
                  name="date_of_death"
                  type="date"
                  value={formState.date_of_death}
                  onChange={handleChange}
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

            <FormField
              label="Replace image (optional)"
              htmlFor="image"
              helpText={
                formState.existingImageUrl ? (
                  <span>
                    Current image:{' '}
                    <a
                      href={formState.existingImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      View
                    </a>
                  </span>
                ) : null
              }
            >
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
                  disabled={autoDrafted}
                  className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <span className="text-sm text-muted-foreground">
                  Publishing is enabled after saving changes.
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
            <Button
              variant="primary"
              type="submit"
              loading={isSubmitting}
              disabled={!hasChanges}
            >
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default AdminObituariesEditPage
