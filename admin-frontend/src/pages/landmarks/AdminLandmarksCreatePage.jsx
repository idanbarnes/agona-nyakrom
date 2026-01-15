import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createLandmark } from '../../services/api/adminLandmarksApi.js'
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

function AdminLandmarksCreatePage() {
  const navigate = useNavigate()
  const [formState, setFormState] = useState({
    name: '',
    title: '',
    description: '',
    location: '',
    google_map_link: '',
    category: '',
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

    if (!formState.name.trim() && !formState.title.trim()) {
      setErrorMessage('Name or title is required.')
      return
    }

    const formData = new FormData()
    formData.append('name', formState.name.trim())
    formData.append('title', formState.title.trim())
    formData.append('description', formState.description.trim())
    formData.append('address', formState.location.trim())
    formData.append('video_url', formState.google_map_link.trim())
    formData.append('category', formState.category.trim())
    formData.append('published', String(formState.published))
    if (formState.image) {
      formData.append('image', formState.image)
    }

    setIsSubmitting(true)
    try {
      const response = await createLandmark(formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to create landmark.')
      }
      window.alert('Landmark created successfully')
      navigate('/admin/landmarks', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to create landmark.'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold md:text-2xl">Create Landmark</h1>
        <p className="text-sm text-muted-foreground">
          Provide location details, descriptions, and imagery for the landmark.
        </p>
      </header>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-5 md:space-y-6">
            <InlineError message={errorMessage} />
            <FormField label="Name" htmlFor="name">
              <Input
                id="name"
                name="name"
                type="text"
                value={formState.name}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Title" htmlFor="title">
              <Input
                id="title"
                name="title"
                type="text"
                value={formState.title}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Description" htmlFor="description">
              <Textarea
                id="description"
                name="description"
                value={formState.description}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Location" htmlFor="location">
              <Input
                id="location"
                name="location"
                type="text"
                value={formState.location}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Google map link" htmlFor="google_map_link">
              <Input
                id="google_map_link"
                name="google_map_link"
                type="url"
                value={formState.google_map_link}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Category" htmlFor="category">
              <Input
                id="category"
                name="category"
                type="text"
                value={formState.category}
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
                  Publish this landmark immediately.
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
              onClick={() => navigate('/admin/landmarks')}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create landmark'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default AdminLandmarksCreatePage
