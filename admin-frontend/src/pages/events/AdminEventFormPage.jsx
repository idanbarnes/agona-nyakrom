import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getEvent, createEvent, updateEvent } from '../../services/api/adminEventsApi.js'
import { getAuthToken } from '../../lib/auth.js'
import { buildApiUrl } from '../../lib/apiClient.js'
import { resolveAdminCancelTarget } from '../../lib/adminCancelTarget.js'
import SearchableSelect from '../../components/SearchableSelect.jsx'
import { eventTags } from '../../constants/eventTags.js'
import PhotoUploadField from '../../components/forms/PhotoUploadField.jsx'
import AdminInlinePreviewLayout from '../../components/preview/AdminInlinePreviewLayout.jsx'
import FormActions from '../../components/ui/form-actions.jsx'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  FormField,
  InlineError,
  Input,
  Textarea,
  Badge,
} from '../../components/ui/index.jsx'

const MAX_FILE_SIZE = 5 * 1024 * 1024

function normalizeDate(value) {
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

  return date.toISOString().slice(0, 10)
}

function resolveAssetUrl(path) {
  if (!path) {
    return ''
  }

  if (/^https?:\/\//i.test(path)) {
    return path
  }

  return buildApiUrl(path.startsWith('/') ? path : `/${path}`)
}

function normalizeTagInput(value) {
  return String(value).trim().replace(/\s+/g, ' ')
}

function findRecommendedTag(value) {
  if (!value) return ''
  const normalized = String(value).trim().toLowerCase()
  return eventTags.find((tag) => tag.toLowerCase() === normalized) || ''
}

function AdminEventFormPage({ mode = 'create' }) {
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
    event_tag: '',
    event_date: '',
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

    const fetchEvent = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const data = await getEvent(id)
        const eventItem = data?.event || data

        const nextState = {
          title: eventItem?.title || '',
          slug: eventItem?.slug || '',
          excerpt: eventItem?.excerpt || '',
          body: eventItem?.body || '',
          event_tag: eventItem?.event_tag || '',
          event_date: normalizeDate(eventItem?.event_date),
          flyer_alt_text: eventItem?.flyer_alt_text || '',
          is_published: Boolean(
            eventItem?.is_published ?? eventItem?.isPublished ?? eventItem?.published,
          ),
          flyer_image: null,
          existingFlyerUrl: resolveAssetUrl(eventItem?.flyer_image_path || ''),
        }

        setInitialState(nextState)
        setFormState(nextState)
      } catch (error) {

        setErrorMessage(error.message || 'Unable to load event.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvent()
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
      formState.event_tag !== initialState.event_tag ||
      formState.event_date !== initialState.event_date ||
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
    const normalizedTag = normalizeTagInput(formState.event_tag)

    formData.append('excerpt', formState.excerpt)
    formData.append('body', formState.body)
    if (normalizedTag) {
      formData.append('event_tag', normalizedTag)
    } else {
      formData.append('event_tag', '')
    }
    if (formState.event_date) {
      formData.append('event_date', formState.event_date)
    }
    formData.append('flyer_alt_text', formState.flyer_alt_text)

    formData.append('is_published', String(action === 'publish'))

    if (formState.flyer_image) {
      formData.append('flyer_image', formState.flyer_image)
    }

    setIsSubmitting(true)
    try {
      if (mode === 'edit') {
        await updateEvent(id, formData)
        window.alert(
          action === 'draft'
            ? 'Event draft saved successfully'
            : 'Event published successfully',
        )
      } else {
        await createEvent(formData)
        window.alert(
          action === 'draft'
            ? 'Event draft saved successfully'
            : 'Event published successfully',
        )
      }

      navigate('/admin/events', {
        replace: true,
        state: {
          successMessage:
            action === 'draft'
              ? 'Event draft saved.'
              : `Event ${mode === 'edit' ? 'updated and published' : 'published'}.`,
        },
      })
    } catch (error) {

      const message = error.message || 'Unable to save event.'
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
            Edit Event
          </h1>
          <p className="text-sm text-muted-foreground">
            Update event details and republish when ready.
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
          {mode === 'edit' ? 'Edit Event' : 'Create Event'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {mode === 'edit'
            ? 'Review event details before publishing updates.'
            : 'Share upcoming and community events with a clear title and date.'}
        </p>
      </header>
      <form>
        <Card>
          <CardContent className="space-y-5 md:space-y-6">
            <InlineError message={errorMessage} />
            <FormField
              label="Title"
              htmlFor="title"
              required
              helpText="Required. Keep it concise and descriptive."
            >
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

            <FormField label="Body" htmlFor="body">
              <Textarea
                id="body"
                name="body"
                value={formState.body}
                onChange={handleChange}
              />
            </FormField>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField
                label="Event Tag (Type)"
                htmlFor="event_tag"
                helpText="Optional. This helps visitors understand the event type."
              >
                <div className="space-y-2">
                  <Input
                    id="event_tag"
                    name="event_tag"
                    type="text"
                    value={formState.event_tag}
                    onChange={handleChange}
                    onBlur={() => {
                      const normalized = normalizeTagInput(formState.event_tag)
                      if (normalized !== formState.event_tag) {
                        setFormState((current) => ({
                          ...current,
                          event_tag: normalized,
                        }))
                      }
                    }}
                    placeholder="e.g., Festival, Community Meeting, Funeral"
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    {findRecommendedTag(formState.event_tag) ? (
                      <Badge variant="success">Recommended</Badge>
                    ) : null}
                    {formState.event_tag ? (
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setFormState((current) => ({ ...current, event_tag: '' }))
                        }
                      >
                        Clear tag
                      </Button>
                    ) : null}
                  </div>
                </div>
              </FormField>

              <SearchableSelect
                label="Recommended Tags (search)"
                options={eventTags}
                value={formState.event_tag}
                placeholder="Search recommended tags"
                onSelect={(option) =>
                  setFormState((current) => ({ ...current, event_tag: option }))
                }
                helperText="Select a recommended tag to apply the canonical label."
              />
            </div>

            <FormField
              label="Event date"
              htmlFor="event_date"
              helpText={
                'Leave empty for Coming Soon (no date shown on public site). Past/Upcoming is determined automatically.'
              }
            >
              <Input
                id="event_date"
                name="event_date"
                type="date"
                value={formState.event_date}
                onChange={handleChange}
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
                  previewAlt={formState.flyer_alt_text || 'Event flyer preview'}
                  previewFallback="No flyer"
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
        resource="events"
        itemId={id}
        query={location.search}
        storageKey="events-preview-pane-width">
        {formContent}
      </AdminInlinePreviewLayout>
    )
  }

  return formContent
}

export default AdminEventFormPage
