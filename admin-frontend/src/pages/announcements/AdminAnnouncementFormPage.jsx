import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  createAnnouncement,
  getAnnouncement,
  updateAnnouncement,
} from '../../services/api/adminAnnouncementsApi.js'
import { getAuthToken } from '../../lib/auth.js'
import { buildApiUrl } from '../../lib/apiClient.js'
import AdminInlinePreviewLayout from '../../components/preview/AdminInlinePreviewLayout.jsx'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  FormField,
  ImageWithFallback,
  InlineError,
  Input,
  Textarea,
} from '../../components/ui/index.jsx'

const MAX_FILE_SIZE = 5 * 1024 * 1024

function resolveAssetUrl(path) {
  if (!path) {
    return ''
  }

  if (/^https?:\/\//i.test(path)) {
    return path
  }

  return buildApiUrl(path.startsWith('/') ? path : `/${path}`)
}

function AnnouncementPlaceholder() {
  return (
    <div className="flex h-24 w-32 items-center justify-center rounded-md border border-dashed border-border bg-muted text-muted-foreground">
      <svg
        viewBox="0 0 24 24"
        width="24"
        height="24"
        aria-hidden="true"
        className="text-muted-foreground"
      >
        <path
          d="M5 4h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4Zm2 2v12h8V6H7Zm11 4h1a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-1v-2h1v-4h-1v-2Z"
          fill="currentColor"
        />
      </svg>
    </div>
  )
}

function AdminAnnouncementFormPage({ mode = 'create' }) {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [initialState, setInitialState] = useState(null)
  const [formState, setFormState] = useState({
    title: '',
    slug: '',
    excerpt: '',
    body: '',
    flyer_alt_text: '',
    is_published: false,
    flyer_image: null,
    existingFlyerUrl: '',
  })
  const [autoDrafted, setAutoDrafted] = useState(false)
  const [isLoading, setIsLoading] = useState(mode === 'edit')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [fileError, setFileError] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    if (!getAuthToken()) {
      navigate('/login', { replace: true })
      return
    }

    if (mode !== 'edit') {
      return
    }

    const fetchAnnouncement = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const data = await getAnnouncement(id)
        const announcement = data?.announcement || data

        const nextState = {
          title: announcement?.title || '',
          slug: announcement?.slug || '',
          excerpt: announcement?.excerpt || '',
          body: announcement?.body || '',
          flyer_alt_text: announcement?.flyer_alt_text || '',
          is_published: Boolean(
            announcement?.is_published ??
              announcement?.isPublished ??
              announcement?.published,
          ),
          flyer_image: null,
          existingFlyerUrl: resolveAssetUrl(announcement?.flyer_image_path || ''),
        }

        setInitialState(nextState)
        setFormState({ ...nextState, is_published: false })
        setAutoDrafted(true)
      } catch (error) {

        setErrorMessage(error.message || 'Unable to load announcement.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchAnnouncement()
  }, [id, mode, navigate])

  useEffect(() => {
    if (!formState.flyer_image) {
      setPreviewUrl('')
      return undefined
    }

    const objectUrl = URL.createObjectURL(formState.flyer_image)
    setPreviewUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [formState.flyer_image])

  const hasChanges = useMemo(() => {
    if (mode !== 'edit') {
      return true
    }

    if (!initialState) {
      return false
    }

    return (
      autoDrafted ||
      formState.title !== initialState.title ||
      formState.slug !== initialState.slug ||
      formState.excerpt !== initialState.excerpt ||
      formState.body !== initialState.body ||
      formState.flyer_alt_text !== initialState.flyer_alt_text ||
      formState.is_published !== initialState.is_published ||
      Boolean(formState.flyer_image)
    )
  }, [autoDrafted, formState, initialState, mode])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    const nextValue = type === 'checkbox' ? checked : value
    setFormState((current) => ({ ...current, [name]: nextValue }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null
    if (file && file.size > MAX_FILE_SIZE) {
      setFileError('Flyer image must be 5MB or smaller.')
      setFormState((current) => ({ ...current, flyer_image: null }))
      return
    }

    setFileError('')
    setFormState((current) => ({ ...current, flyer_image: file }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    if (!formState.title.trim()) {
      setErrorMessage('Title is required.')
      return
    }

    if (!formState.body.trim()) {
      setErrorMessage('Body is required.')
      return
    }

    if (fileError) {
      setErrorMessage(fileError)
      return
    }

    if (mode === 'edit' && !hasChanges) {
      setErrorMessage('No changes to update.')
      return
    }

    const formData = new FormData()
    formData.append('title', formState.title.trim())
    if (formState.slug.trim()) {
      formData.append('slug', formState.slug.trim())
    }
    formData.append('excerpt', formState.excerpt)
    formData.append('body', formState.body)
    formData.append('flyer_alt_text', formState.flyer_alt_text)

    if (mode === 'edit') {
      formData.append('is_published', 'true')
    } else {
      formData.append('is_published', String(formState.is_published))
    }

    if (formState.flyer_image) {
      formData.append('flyer_image', formState.flyer_image)
    }

    setIsSubmitting(true)
    try {
      if (mode === 'edit') {
        await updateAnnouncement(id, formData)
        setFormState((current) => ({ ...current, is_published: true }))
        setAutoDrafted(false)
        window.alert('Announcement updated successfully')
      } else {
        await createAnnouncement(formData)
        window.alert('Announcement created successfully')
      }

      navigate('/admin/announcements', {
        replace: true,
        state: {
          successMessage: `Announcement ${
            mode === 'edit' ? 'updated' : 'created'
          }.`,
        },
      })
    } catch (error) {

      const message = error.message || 'Unable to save announcement.'
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
            Edit Announcement
          </h1>
          <p className="text-sm text-muted-foreground">
            Update announcement details and republish when ready.
          </p>
        </header>
        <p>Loading...</p>
      </div>
    )
  }

  const formContent = (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold break-words md:text-2xl">
          {mode === 'edit' ? 'Edit Announcement' : 'Create Announcement'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {mode === 'edit'
            ? 'Review the announcement copy before publishing.'
            : 'Share an announcement with clear details and optional flyer.'}
        </p>
      </header>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-5 md:space-y-6">
            <InlineError message={errorMessage} />
            <FormField label="Title" htmlFor="title" required>
              <Input
                id="title"
                name="title"
                type="text"
                value={formState.title}
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField
              label="Slug"
              htmlFor="slug"
              helpText="Leave blank to auto-generate."
            >
              <Input
                id="slug"
                name="slug"
                type="text"
                value={formState.slug}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Excerpt" htmlFor="excerpt">
              <Textarea
                id="excerpt"
                name="excerpt"
                value={formState.excerpt}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Body" htmlFor="body" required>
              <Textarea
                id="body"
                name="body"
                value={formState.body}
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField label="Flyer image (optional)" htmlFor="flyer_image">
              <div className="rounded-lg border border-border bg-background p-4 space-y-3">
                <Input
                  id="flyer_image"
                  name="flyer_image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-muted-foreground">
                  Max 5MB. JPG, PNG, or WebP.
                </p>
                <div className="flex items-center gap-4">
                  {previewUrl || formState.existingFlyerUrl ? (
                    <ImageWithFallback
                      src={previewUrl || formState.existingFlyerUrl}
                      alt={formState.flyer_alt_text || 'Announcement flyer preview'}
                      className="h-24 w-32 rounded-md object-cover"
                      fallbackText="Announcement"
                    />
                  ) : (
                    <AnnouncementPlaceholder />
                  )}
                </div>
              </div>
            </FormField>

            <FormField label="Flyer alt text" htmlFor="flyer_alt_text">
              <Input
                id="flyer_alt_text"
                name="flyer_alt_text"
                type="text"
                value={formState.flyer_alt_text}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Published" htmlFor="is_published">
              <div className="flex items-center gap-2">
                <input
                  id="is_published"
                  name="is_published"
                  type="checkbox"
                  checked={formState.is_published}
                  onChange={handleChange}
                  disabled={autoDrafted}
                  className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <span className="text-sm text-muted-foreground">
                  {autoDrafted
                    ? 'Publishing is enabled after saving changes.'
                    : 'Make this announcement visible on the site.'}
                </span>
              </div>
            </FormField>
          </CardContent>
          <CardFooter>
            <Button
              variant="secondary"
              type="button"
              onClick={() => navigate('/admin/announcements')}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={isSubmitting}
              disabled={mode === 'edit' && !hasChanges}
            >
              {isSubmitting
                ? mode === 'edit'
                  ? 'Saving...'
                  : 'Creating...'
                : mode === 'edit'
                  ? 'Save changes'
                  : 'Create announcement'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )

  if (mode === 'edit') {
    return (
      <AdminInlinePreviewLayout
        resource="announcements"
        itemId={id}
        query={location.search}
        storageKey="announcements-preview-pane-width">
        {formContent}
      </AdminInlinePreviewLayout>
    )
  }

  return formContent
}

export default AdminAnnouncementFormPage
