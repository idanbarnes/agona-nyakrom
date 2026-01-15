import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSection } from '../../services/api/adminHomepageSectionsApi.js'
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

function AdminHomepageSectionsCreatePage() {
  const navigate = useNavigate()
  const [formState, setFormState] = useState({
    section_key: '',
    title: '',
    content: '',
    display_order: '',
    published: false,
    is_featured: false,
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

    if (!formState.section_key.trim()) {
      setErrorMessage('Section key is required.')
      return
    }

    if (
      formState.display_order === '' ||
      Number.isNaN(Number(formState.display_order))
    ) {
      setErrorMessage('Display order is required.')
      return
    }

    const payload = {
      section_key: formState.section_key.trim(),
      title: formState.title.trim(),
      content: formState.content.trim(),
      display_order: Number(formState.display_order),
      published: formState.published,
      is_featured: formState.is_featured,
    }

    const hasFile = Boolean(formState.image)
    const formData = new FormData()

    if (hasFile) {
      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, String(value ?? ''))
      })
      formData.append('image', formState.image)
    }

    setIsSubmitting(true)
    try {
      const response = await createSection(hasFile ? formData : payload)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to create section.')
      }
      window.alert('Homepage section created successfully')
      navigate('/admin/homepage-sections', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      if (
        typeof error.message === 'string' &&
        error.message.toLowerCase().includes('section_key')
      ) {
        setErrorMessage('Section key already exists.')
        return
      }

      const message = error.message || 'Unable to create section.'
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
          Create Homepage Section
        </h1>
        <p className="text-sm text-muted-foreground">
          Define the section key, content, and display order for the homepage.
        </p>
      </header>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-5 md:space-y-6">
            <InlineError message={errorMessage} />
            <FormField label="Section key" htmlFor="section_key" required>
              <Input
                id="section_key"
                name="section_key"
                type="text"
                value={formState.section_key}
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField label="Title (optional)" htmlFor="title">
              <Input
                id="title"
                name="title"
                type="text"
                value={formState.title}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Content (optional)" htmlFor="content">
              <Textarea
                id="content"
                name="content"
                value={formState.content}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Display order" htmlFor="display_order" required>
              <Input
                id="display_order"
                name="display_order"
                type="number"
                value={formState.display_order}
                onChange={handleChange}
                required
              />
            </FormField>

            <div className="grid gap-5 md:grid-cols-2">
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
                    Publish this section immediately.
                  </span>
                </div>
              </FormField>

              <FormField label="Featured" htmlFor="is_featured">
                <div className="flex items-center gap-2">
                  <input
                    id="is_featured"
                    name="is_featured"
                    type="checkbox"
                    checked={formState.is_featured}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <span className="text-sm text-muted-foreground">
                    Highlight this section in featured areas.
                  </span>
                </div>
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
          </CardContent>
          <CardFooter>
            <Button
              variant="secondary"
              type="button"
              onClick={() => navigate('/admin/homepage-sections')}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create section'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default AdminHomepageSectionsCreatePage
