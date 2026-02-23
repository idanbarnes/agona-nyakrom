import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createObituary } from '../../services/api/adminObituariesApi.js'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'
import SimpleRichTextEditor from '../../components/richText/SimpleRichTextEditor.jsx'
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

function UploadIcon({ className = 'h-4 w-4' }) {
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
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

function SaveIcon({ className = 'h-4 w-4' }) {
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
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </svg>
  )
}

function SendIcon({ className = 'h-4 w-4' }) {
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
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function AdminObituariesCreatePage() {
  const navigate = useNavigate()
  const deceasedPhotoInputRef = useRef(null)
  const posterPhotoInputRef = useRef(null)
  const previewUrlRef = useRef({ deceased: null, poster: null })
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
  const biographyText = (formState.biography || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

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
      window.alert(
        action === 'draft'
          ? 'Obituary draft saved successfully'
          : 'Obituary published successfully',
      )
      navigate('/admin/obituaries', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

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
              <div className="space-y-2 p-4">
                <p className="text-sm font-medium text-foreground">Deceased Photo URL</p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Input
                    id="deceased_photo_url"
                    name="deceased_photo_url"
                    type="url"
                    value={formState.deceased_photo_url}
                    onChange={handleChange}
                    placeholder="https://example.com/photo.jpg"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-10 shrink-0"
                    onClick={() => deceasedPhotoInputRef.current?.click()}
                  >
                    <UploadIcon />
                    Upload
                  </Button>
                  <Input
                    ref={deceasedPhotoInputRef}
                    id="deceased_photo_file"
                    name="deceased_photo_file"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => handleUploadFileChange('deceased', event)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Photo of the deceased person. If left empty, a default photo will be
                  used.
                </p>
              </div>

              <div className="space-y-2 p-4">
                <p className="text-sm font-medium text-foreground">Obituary Poster Image URL</p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Input
                    id="poster_image_url"
                    name="poster_image_url"
                    type="url"
                    value={formState.poster_image_url}
                    onChange={handleChange}
                    placeholder="https://example.com/poster.jpg"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-10 shrink-0"
                    onClick={() => posterPhotoInputRef.current?.click()}
                  >
                    <UploadIcon />
                    Upload
                  </Button>
                  <Input
                    ref={posterPhotoInputRef}
                    id="poster_image_file"
                    name="poster_image_file"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => handleUploadFileChange('poster', event)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Decorative poster image for the obituary (e.g., flowers, memorial
                  design). If left empty, a default image will be used.
                </p>
              </div>
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

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button
            variant="secondary"
            type="button"
            onClick={() => navigate('/admin/obituaries')}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            type="button"
            loading={isSubmitting && submitAction === 'draft'}
            disabled={isSubmitting}
            onClick={() => {
              void handleSubmit('draft')
            }}
          >
            <SaveIcon />
            Save as Draft
          </Button>
          <Button
            variant="primary"
            type="button"
            className="border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600"
            loading={isSubmitting && submitAction === 'publish'}
            disabled={isSubmitting}
            onClick={() => {
              void handleSubmit('publish')
            }}
          >
            <SendIcon />
            Publish
          </Button>
        </div>
      </form>
    </div>
  )
}

export default AdminObituariesCreatePage
