import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  createAnnouncement,
  getAnnouncement,
  updateAnnouncement,
} from '../../services/api/adminAnnouncementsApi.js'
import { getAuthToken } from '../../lib/auth.js'
import { buildApiUrl } from '../../lib/apiClient.js'
import { resolveAdminCancelTarget } from '../../lib/adminCancelTarget.js'
import PhotoUploadField from '../../components/forms/PhotoUploadField.jsx'
import AdminInlinePreviewLayout from '../../components/preview/AdminInlinePreviewLayout.jsx'
import FormActions from '../../components/ui/form-actions.jsx'
import {
  Card,
  CardContent,
  CardFooter,
  FormField,
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

function AdminAnnouncementFormPage({ mode = 'create' }) {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const cancelTarget = resolveAdminCancelTarget(location.pathname)
  const [initialState, setInitialState] = useState(null)
  const [formState, setFormState] = useState({
    title: '',
    slug: '',
    excerpt: '',
    body: '',
    flyer_alt_text: '',
    flyer_image: null,
    existingFlyerUrl: '',
  })
  const [isLoading, setIsLoading] = useState(mode === 'edit')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitAction, setSubmitAction] = useState('publish')
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
        setFormState(nextState)
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
      formState.title !== initialState.title ||
      formState.slug !== initialState.slug ||
      formState.excerpt !== initialState.excerpt ||
      formState.body !== initialState.body ||
      formState.flyer_alt_text !== initialState.flyer_alt_text ||
      Boolean(formState.flyer_image)
    )
  }, [formState, initialState, mode])

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

  const handleSubmit = async (action) => {
    setErrorMessage('')
    setSubmitAction(action)

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

    const allowPublishWithoutFieldChanges =
      mode === 'edit' && action === 'publish'

    if (mode === 'edit' && !hasChanges && !allowPublishWithoutFieldChanges) {
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

    formData.append('is_published', String(action === 'publish'))

    if (formState.flyer_image) {
      formData.append('flyer_image', formState.flyer_image)
    }

    setIsSubmitting(true)
    try {
      if (mode === 'edit') {
        await updateAnnouncement(id, formData)
        window.alert(
          action === 'draft'
            ? 'Announcement draft saved successfully'
            : 'Announcement published successfully',
        )
      } else {
        await createAnnouncement(formData)
        window.alert(
          action === 'draft'
            ? 'Announcement draft saved successfully'
            : 'Announcement published successfully',
        )
      }

      navigate('/admin/announcements', {
        replace: true,
        state: {
          successMessage:
            action === 'draft'
              ? 'Announcement draft saved.'
              : `Announcement ${mode === 'edit' ? 'updated and published' : 'published'}.`,
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
      <form>
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
              <div className="rounded-xl border border-border bg-background/60">
                <PhotoUploadField
                  label=""
                  value={formState.flyer_image?.name || ''}
                  valueType="text"
                  valueId="flyer_image"
                  valuePlaceholder="Select image"
                  fileId="flyer_image_file"
                  fileName="flyer_image"
                  acceptedFileTypes="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  helperText="Max 5MB. JPG, PNG, or WebP."
                  previewSrc={previewUrl || formState.existingFlyerUrl}
                  previewAlt={formState.flyer_alt_text || 'Announcement flyer preview'}
                  previewFallback="Announcement"
                  previewClassName="h-24 w-32 rounded-md object-cover"
                  error={fileError}
                />
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

          </CardContent>
          <CardFooter>
            <FormActions
              mode="publish"
              onCancel={() => navigate(cancelTarget)}
              onAction={(action) => {
                void handleSubmit(action)
              }}
              isSubmitting={isSubmitting}
              submitAction={submitAction}
              disableCancel={isSubmitting}
              disableDraft={mode === 'edit' && !hasChanges}
            />
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
