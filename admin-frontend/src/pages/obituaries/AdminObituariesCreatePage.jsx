import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { createObituary } from '../../services/api/adminObituariesApi.js'
import { getAuthToken } from '../../lib/auth.js'
import { useDraftAutosave } from '../../hooks/useDraftAutosave.js'
import { resolveAdminCancelTarget } from '../../lib/adminCancelTarget.js'
import SimpleRichTextEditor from '../../components/richText/SimpleRichTextEditor.jsx'
import PhotoUploadField from '../../components/forms/PhotoUploadField.jsx'
import FormActions from '../../components/ui/form-actions.jsx'
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  FormField,
  InlineError,
  Input,
} from '../../components/ui/index.jsx'

const dateOnlyFields = new Set(['date_of_birth', 'date_of_death'])

function formatDraftTime(timestamp) {
  if (!timestamp) {
    return 'local storage'
  }

  const parsed = new Date(timestamp)
  if (Number.isNaN(parsed.getTime())) {
    return 'local storage'
  }

  return parsed.toLocaleString()
}

function ArrowLeftIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 12H5" />
      <path d="M12 19l-7-7 7-7" />
    </svg>
  )
}

function AdminObituariesCreatePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const cancelTarget = resolveAdminCancelTarget(location.pathname)
  const previewUrlRef = useRef({ deceased: null, poster: null })
  const draftAppliedRef = useRef(false)
  const [formState, setFormState] = useState({
    full_name: '',
    biography: '',
    date_of_birth: '',
    date_of_death: '',
    deceased_photo_url: '',
    poster_image_url: '',
    visitation_date: '',
    visitation_location: '',
    funeral_location: '',
    burial_location: '',
    burial_date: '',
    funeral_date: '',
    image: null,
    deceased_image: null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitAction, setSubmitAction] = useState('publish')
  const [errorMessage, setErrorMessage] = useState('')
  const [draftMessage, setDraftMessage] = useState('')
  const biographyText = (formState.biography || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const draftPayload = {
    ...formState,
    image: null,
    deceased_image: null,
  }
  const { restoredDraft, restoredAt, clearDraft } = useDraftAutosave({
    key: 'admin:draft:obituaries:create',
    data: draftPayload,
    enabled: !isSubmitting,
  })

  useEffect(() => {
    if (!restoredDraft || draftAppliedRef.current) {
      return
    }

    draftAppliedRef.current = true
    setFormState((current) => ({
      ...current,
      ...restoredDraft,
      image: null,
      deceased_image: null,
    }))
    setDraftMessage(`Restored unsaved draft from ${formatDraftTime(restoredAt)}.`)
  }, [restoredAt, restoredDraft])

  const normalizeDateInput = (value) => {
    if (typeof value !== 'string') {
      return value
    }

    const trimmed = value.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed
    }
    if (trimmed.includes('T')) {
      return trimmed.split('T')[0]
    }

    return trimmed
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    const nextValue = dateOnlyFields.has(name) ? normalizeDateInput(value) : value
    setFormState((current) => ({ ...current, [name]: nextValue }))
  }

  useEffect(() => {
    const previewUrls = previewUrlRef.current
    return () => {
      if (previewUrls.deceased) {
        URL.revokeObjectURL(previewUrls.deceased)
      }
      if (previewUrls.poster) {
        URL.revokeObjectURL(previewUrls.poster)
      }
    }
  }, [])

  const handleUploadFileChange = (slot, event) => {
    const file = event.target.files?.[0] || null
    if (!file) {
      return
    }

    if (previewUrlRef.current[slot]) {
      URL.revokeObjectURL(previewUrlRef.current[slot])
    }
    const previewUrl = URL.createObjectURL(file)
    previewUrlRef.current[slot] = previewUrl

    setFormState((current) => ({
      ...current,
      image: slot === 'poster' ? file : current.image,
      deceased_image: slot === 'deceased' ? file : current.deceased_image,
      deceased_photo_url:
        slot === 'deceased' ? previewUrl : current.deceased_photo_url,
      poster_image_url: slot === 'poster' ? previewUrl : current.poster_image_url,
    }))

    event.target.value = ''
  }

  const handleSubmit = async (action) => {
    setErrorMessage('')
    setSubmitAction(action)

    if (!getAuthToken()) {
      navigate('/login', { replace: true })
      return
    }

    const normalizedName = formState.full_name.trim()
    const normalizedBiography = formState.biography.trim()

    if (!normalizedName || !biographyText) {
      setErrorMessage('Full name and biography are required.')
      return
    }

    if (!formState.date_of_birth) {
      setErrorMessage('Date of birth is required.')
      return
    }

    if (!formState.date_of_death) {
      setErrorMessage('Date of death is required.')
      return
    }

    const publishedValue = action === 'publish'
    const formData = new FormData()
    formData.append('full_name', normalizedName)
    // The API requires a summary. Store plain text extracted from rich content.
    formData.append('summary', biographyText)
    formData.append('biography', normalizedBiography)
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
    if (formState.visitation_date) {
      formData.append('visitation_date', formState.visitation_date)
    }
    if (formState.visitation_location.trim()) {
      formData.append('visitation_location', formState.visitation_location.trim())
    }
    if (formState.funeral_location.trim()) {
      formData.append('funeral_location', formState.funeral_location.trim())
    }
    if (formState.burial_location.trim()) {
      formData.append('burial_location', formState.burial_location.trim())
    }
    const deceasedPhotoUrl = formState.deceased_photo_url.trim()
    const posterImageUrl = formState.poster_image_url.trim()

    if (
      deceasedPhotoUrl &&
      !formState.deceased_image &&
      !deceasedPhotoUrl.startsWith('blob:')
    ) {
      formData.append('deceased_photo_url', deceasedPhotoUrl)
    }
    if (posterImageUrl && !formState.image && !posterImageUrl.startsWith('blob:')) {
      formData.append('poster_image_url', posterImageUrl)
    }
    formData.append('published', String(publishedValue))
    formData.append('is_published', String(publishedValue))
    if (formState.image) {
      formData.append('image', formState.image)
    }
    if (formState.deceased_image) {
      formData.append('deceased_image', formState.deceased_image)
    }

    setIsSubmitting(true)
    try {
      const response = await createObituary(formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to create obituary.')
      }
      clearDraft()
      window.alert(
        action === 'draft'
          ? 'Obituary draft saved successfully'
          : 'Obituary published successfully',
      )
      navigate('/admin/obituaries', { replace: true })
    } catch (error) {
      const message = error.message || 'Unable to create obituary.'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 md:space-y-8">
      <header className="space-y-3">
        <Link
          to="/admin/obituaries"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900 hover:no-underline"
        >
          <ArrowLeftIcon />
          <span>Back to Dashboard</span>
        </Link>
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Create New Obituary
          </h1>
          <p className="text-sm text-slate-500 md:text-base">
            Fill in the details to create a new obituary
          </p>
        </div>
      </header>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          void handleSubmit('publish')
        }}
        className="space-y-6"
      >
        <InlineError message={errorMessage} />
        {draftMessage ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {draftMessage}
          </p>
        ) : null}

        <Card>
          <CardHeader className="space-y-1.5">
            <CardTitle>Basic Information</CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter the deceased person&apos;s basic details
            </p>
          </CardHeader>
          <CardContent className="space-y-5 md:space-y-6">
            <FormField label="Full Name" htmlFor="full_name" required>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                value={formState.full_name}
                onChange={handleChange}
                placeholder="e.g., Margaret Ellen Thompson"
                required
              />
            </FormField>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Birth Date" htmlFor="date_of_birth" required>
                <Input
                  id="date_of_birth"
                  name="date_of_birth"
                  type="date"
                  value={formState.date_of_birth}
                  onChange={handleChange}
                  placeholder="mm/dd/yyyy"
                  required
                />
              </FormField>

              <FormField label="Death Date" htmlFor="date_of_death" required>
                <Input
                  id="date_of_death"
                  name="date_of_death"
                  type="date"
                  value={formState.date_of_death}
                  onChange={handleChange}
                  placeholder="mm/dd/yyyy"
                  required
                />
              </FormField>
            </div>

            <FormField
              label="Biography / Life Story"
              htmlFor="biography"
              required
              helpText="Share the life story and memories..."
            >
              <SimpleRichTextEditor
                textareaId="biography"
                value={formState.biography}
                onChange={(nextValue) =>
                  setFormState((current) => ({ ...current, biography: nextValue }))
                }
              />
            </FormField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1.5">
            <CardTitle>Images</CardTitle>
            <p className="text-sm text-muted-foreground">
              Upload photos for the obituary
            </p>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border rounded-xl border border-border bg-background/60">
              <PhotoUploadField
                label="Deceased Photo URL"
                value={formState.deceased_photo_url}
                valueType="url"
                valueId="deceased_photo_url"
                valueName="deceased_photo_url"
                onValueChange={handleChange}
                valuePlaceholder="https://example.com/photo.jpg"
                fileId="deceased_photo_file"
                fileName="deceased_photo_file"
                acceptedFileTypes="image/*"
                onChange={(event) => handleUploadFileChange('deceased', event)}
                helperText="Photo of the deceased person. If left empty, a default photo will be used."
              />

              <PhotoUploadField
                label="Obituary Poster Image URL"
                value={formState.poster_image_url}
                valueType="url"
                valueId="poster_image_url"
                valueName="poster_image_url"
                onValueChange={handleChange}
                valuePlaceholder="https://example.com/poster.jpg"
                fileId="poster_image_file"
                fileName="poster_image_file"
                acceptedFileTypes="image/*"
                onChange={(event) => handleUploadFileChange('poster', event)}
                helperText="Decorative poster image for the obituary (e.g., flowers, memorial design). If left empty, a default image will be used."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1.5">
            <CardTitle>Service Information</CardTitle>
            <p className="text-sm text-muted-foreground">
              Add funeral, visitation, and burial details
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <section className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900">Visitation</h3>
              <div className="grid gap-5 md:grid-cols-2">
                <FormField label="Date & Time" htmlFor="visitation_date">
                  <Input
                    id="visitation_date"
                    name="visitation_date"
                    type="datetime-local"
                    value={formState.visitation_date}
                    onChange={handleChange}
                  />
                </FormField>

                <FormField label="Location" htmlFor="visitation_location">
                  <Input
                    id="visitation_location"
                    name="visitation_location"
                    type="text"
                    value={formState.visitation_location}
                    onChange={handleChange}
                    placeholder="e.g., Johnson Funeral Home, 456 Oak Avenue"
                  />
                </FormField>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900">Funeral Service</h3>
              <div className="grid gap-5 md:grid-cols-2">
                <FormField label="Date & Time" htmlFor="funeral_date">
                  <Input
                    id="funeral_date"
                    name="funeral_date"
                    type="datetime-local"
                    value={formState.funeral_date}
                    onChange={handleChange}
                  />
                </FormField>

                <FormField label="Location" htmlFor="funeral_location">
                  <Input
                    id="funeral_location"
                    name="funeral_location"
                    type="text"
                    value={formState.funeral_location}
                    onChange={handleChange}
                    placeholder="e.g., St. Mary's Church, 123 Main Street"
                  />
                </FormField>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-base font-semibold text-slate-900">Burial</h3>
              <div className="grid gap-5 md:grid-cols-2">
                <FormField label="Date & Time" htmlFor="burial_date">
                  <Input
                    id="burial_date"
                    name="burial_date"
                    type="datetime-local"
                    value={formState.burial_date}
                    onChange={handleChange}
                  />
                </FormField>

                <FormField label="Location" htmlFor="burial_location">
                  <Input
                    id="burial_location"
                    name="burial_location"
                    type="text"
                    value={formState.burial_location}
                    onChange={handleChange}
                    placeholder="e.g., Springfield Memorial Cemetery"
                  />
                </FormField>
              </div>
            </section>
          </CardContent>
        </Card>

        <FormActions
          mode="publish"
          onCancel={() => navigate(cancelTarget)}
          onAction={(action) => {
            void handleSubmit(action)
          }}
          isSubmitting={isSubmitting}
          submitAction={submitAction}
          disableCancel={isSubmitting}
        />
      </form>
    </div>
  )
}

export default AdminObituariesCreatePage
