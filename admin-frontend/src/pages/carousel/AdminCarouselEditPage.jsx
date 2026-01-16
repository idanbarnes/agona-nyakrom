import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getSingleSlide,
  updateSlide,
} from '../../services/api/adminCarouselApi.js'
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

function AdminCarouselEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [initialState, setInitialState] = useState(null)
  const [formState, setFormState] = useState({
    title: '',
    subtitle: '',
    caption: '',
    cta_text: '',
    cta_url: '',
    display_order: '',
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

    const fetchSlide = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const payload = await getSingleSlide(id)
        const data = payload?.data ?? payload
        const slide = data?.slide || data

        const nextState = {
          title: slide?.title || '',
          subtitle: slide?.subtitle || '',
          caption: slide?.caption || '',
          cta_text: slide?.cta_text || slide?.ctaText || '',
          cta_url: slide?.cta_url || slide?.ctaUrl || '',
          display_order: slide?.display_order ?? slide?.displayOrder ?? '',
          published: Boolean(slide?.published),
          image: null,
          existingImageUrl:
            slide?.image_url || slide?.imageUrl || slide?.image || '',
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

        setErrorMessage(error.message || 'Unable to load slide.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSlide()
  }, [id, navigate])

  const hasChanges = useMemo(() => {
    if (!initialState) {
      return false
    }

    return (
      autoDrafted ||
      formState.title !== initialState.title ||
      formState.subtitle !== initialState.subtitle ||
      formState.caption !== initialState.caption ||
      formState.cta_text !== initialState.cta_text ||
      formState.cta_url !== initialState.cta_url ||
      String(formState.display_order) !== String(initialState.display_order) ||
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
    // Force publish on successful save when leaving auto-draft mode.
    formData.append('published', 'true')
    if (formState.image) {
      formData.append('image', formState.image)
    }

    setIsSubmitting(true)
    try {
      const response = await updateSlide(id, formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to update slide.')
      }
      setFormState((current) => ({ ...current, published: true }))
      setAutoDrafted(false)
      window.alert('Carousel slide edited successfully')
      navigate('/admin/carousel', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to update slide.'
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
          <h1 className="text-xl font-semibold break-words md:text-2xl">
            Edit Carousel Slide
          </h1>
          <p className="text-sm text-muted-foreground">
            Update the slide details and republish when ready.
          </p>
        </header>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold break-words md:text-2xl">
          Edit Carousel Slide
        </h1>
        <p className="text-sm text-muted-foreground">
          Refresh carousel messaging and imagery.
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
                  disabled={autoDrafted}
                  className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <span className="text-sm text-muted-foreground">
                  Publishing is enabled after saving changes.
                </span>
              </div>
            </FormField>

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
          </CardContent>
          <CardFooter>
            <Button
              variant="secondary"
              type="button"
              onClick={() => navigate('/admin/carousel')}
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

export default AdminCarouselEditPage
