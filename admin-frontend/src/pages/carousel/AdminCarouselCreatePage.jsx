import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSlide } from '../../services/api/adminCarouselApi.js'
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

function AdminCarouselCreatePage() {
  const navigate = useNavigate()
  const [formState, setFormState] = useState({
    title: '',
    subtitle: '',
    caption: '',
    cta_text: '',
    cta_url: '',
    display_order: '',
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

    if (!formState.image) {
      setErrorMessage('Image is required.')
      return
    }

    if (
      formState.display_order === '' ||
      Number.isNaN(Number(formState.display_order))
    ) {
      setErrorMessage('Display order is required.')
      return
    }

    const formData = new FormData()
    formData.append('title', formState.title.trim())
    formData.append('subtitle', formState.subtitle.trim())
    formData.append('caption', formState.caption.trim())
    formData.append('cta_text', formState.cta_text.trim())
    formData.append('cta_url', formState.cta_url.trim())
    formData.append('display_order', String(Number(formState.display_order)))
    formData.append('published', String(formState.published))
    formData.append('image', formState.image)

    setIsSubmitting(true)
    try {
      const response = await createSlide(formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to create slide.')
      }
      window.alert('Carousel slide created successfully')
      navigate('/admin/carousel', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to create slide.'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold break-words md:text-2xl">
          Create Carousel Slide
        </h1>
        <p className="text-sm text-muted-foreground">
          Add slide copy, call-to-action details, and ordering for the carousel.
        </p>
      </header>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-5 md:space-y-6">
            <InlineError message={errorMessage} />
            <FormField label="Title" htmlFor="title">
              <Input
                id="title"
                name="title"
                type="text"
                value={formState.title}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Subtitle" htmlFor="subtitle">
              <Input
                id="subtitle"
                name="subtitle"
                type="text"
                value={formState.subtitle}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Caption" htmlFor="caption">
              <Textarea
                id="caption"
                name="caption"
                value={formState.caption}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="CTA text" htmlFor="cta_text">
              <Input
                id="cta_text"
                name="cta_text"
                type="text"
                value={formState.cta_text}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="CTA URL" htmlFor="cta_url">
              <Input
                id="cta_url"
                name="cta_url"
                type="text"
                value={formState.cta_url}
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
                  Publish this slide immediately.
                </span>
              </div>
            </FormField>

            <FormField label="Image" htmlFor="image" required>
              <div className="rounded-lg border border-border bg-background p-4">
                <Input
                  id="image"
                  name="image"
                  type="file"
                  onChange={handleFileChange}
                  required
                />
              </div>
            </FormField>
          </CardContent>
          <CardFooter>
            <Button
              variant="secondary"
              type="button"
              onClick={() => navigate('/admin/carousel')}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create slide'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default AdminCarouselCreatePage
