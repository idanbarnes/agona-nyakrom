import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getSingleSection,
  updateSection,
} from '../../services/api/adminHomepageSectionsApi.js'
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

function AdminHomepageSectionsEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [initialState, setInitialState] = useState(null)
  const [formState, setFormState] = useState({
    section_key: '',
    title: '',
    content: '',
    display_order: '',
    published: false,
    is_featured: false,
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

    const fetchSection = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const payload = await getSingleSection(id)
        const data = payload?.data ?? payload
        const section = data?.section || data

        const nextState = {
          section_key: section?.section_key || section?.sectionKey || '',
          title: section?.title || '',
          content: section?.content || '',
          display_order: section?.display_order ?? section?.displayOrder ?? '',
          published: Boolean(section?.published),
          is_featured: Boolean(section?.is_featured),
          image: null,
          existingImageUrl:
            section?.image_url || section?.imageUrl || section?.image || '',
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

        setErrorMessage(error.message || 'Unable to load section.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSection()
  }, [id, navigate])

  const hasChanges = useMemo(() => {
    if (!initialState) {
      return false
    }

    return (
      autoDrafted ||
      formState.section_key !== initialState.section_key ||
      formState.title !== initialState.title ||
      formState.content !== initialState.content ||
      String(formState.display_order) !== String(initialState.display_order) ||
      formState.published !== initialState.published ||
      formState.is_featured !== initialState.is_featured ||
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
      published: true,
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
      const response = await updateSection(id, hasFile ? formData : payload)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to update section.')
      }
      setFormState((current) => ({ ...current, published: true }))
      setAutoDrafted(false)
      window.alert('Homepage section edited successfully')
      navigate('/admin/homepage-sections', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to update section.'
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
            Edit Homepage Section
          </h1>
          <p className="text-sm text-muted-foreground">
            Update the homepage content and publishing settings.
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
          Edit Homepage Section
        </h1>
        <p className="text-sm text-muted-foreground">
          Keep homepage content and ordering up to date.
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
                    disabled={autoDrafted}
                    className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <span className="text-sm text-muted-foreground">
                    Publishing is enabled after saving changes.
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
              onClick={() => navigate('/admin/homepage-sections')}
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

export default AdminHomepageSectionsEditPage
