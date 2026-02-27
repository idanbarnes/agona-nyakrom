import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createNews } from '../../services/api/adminNewsApi.js'
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
  Label,
  Textarea,
} from '../../components/ui/index.jsx'

const MAX_META_DESCRIPTION_LENGTH = 160
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif']

function UploadIcon({ className = 'h-5 w-5' }) {
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

function CalendarIcon({ className = 'h-4 w-4' }) {
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
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
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

function generateSlug(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
}

function getContentText(content = '') {
  return String(content)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function AdminNewsCreatePage() {
  const navigate = useNavigate()
  const imageInputRef = useRef(null)
  const [formState, setFormState] = useState({
    title: '',
    slug: '',
    published_at: '',
    content: '',
    reporter: '',
    metaDescription: '',
    image: null,
  })
  const [hasManuallyEditedSlug, setHasManuallyEditedSlug] = useState(false)
  const [submitAction, setSubmitAction] = useState('draft')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const imageFileName = formState.image?.name || ''
  const metaDescriptionCount = formState.metaDescription.length
  const seoUrlPreview = useMemo(() => {
    if (!formState.slug) {
      return '/news/article-url-slug'
    }

    return `/news/${formState.slug}`
  }, [formState.slug])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    const nextValue = type === 'checkbox' ? checked : value

    if (name === 'title') {
      setFormState((current) => ({
        ...current,
        title: nextValue,
        slug: hasManuallyEditedSlug ? current.slug : generateSlug(nextValue),
      }))
      return
    }

    if (name === 'slug') {
      setHasManuallyEditedSlug(true)
      setFormState((current) => ({ ...current, slug: generateSlug(nextValue) }))
      return
    }

    setFormState((current) => ({ ...current, [name]: nextValue }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null

    if (!file) {
      setFormState((current) => ({ ...current, image: null }))
      return
    }

    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      setErrorMessage('Please upload a PNG, JPG, or GIF image.')
      event.target.value = ''
      return
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setErrorMessage('Featured image must be 5MB or smaller.')
      event.target.value = ''
      return
    }

    setErrorMessage('')
    setFormState((current) => ({ ...current, image: file }))
  }

  const handleSubmit = async (action) => {
    setErrorMessage('')
    setSubmitAction(action)

    if (!getAuthToken()) {
      navigate('/login', { replace: true })
      return
    }

    const normalizedTitle = formState.title.trim()
    const normalizedSlug = formState.slug.trim()
    const normalizedContent = formState.content.trim()
    const normalizedReporter = formState.reporter.trim()
    const normalizedMetaDescription = formState.metaDescription.trim()

    if (!normalizedTitle || !normalizedSlug || !normalizedContent) {
      setErrorMessage('Title, URL slug, and content are required.')
      return
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) {
      setErrorMessage('URL slug can only contain lowercase letters, numbers, and hyphens.')
      return
    }

    if (normalizedMetaDescription.length > MAX_META_DESCRIPTION_LENGTH) {
      setErrorMessage('Meta description cannot exceed 160 characters.')
      return
    }

    const fallbackSummary = getContentText(normalizedContent).slice(0, MAX_META_DESCRIPTION_LENGTH)
    const summaryToSave = normalizedMetaDescription || fallbackSummary
    if (!summaryToSave) {
      setErrorMessage('Content is too short to generate a meta description.')
      return
    }

    const publishedValue = action === 'publish'
    const formData = new FormData()
    formData.append('title', normalizedTitle)
    formData.append('slug', normalizedSlug)
    formData.append('summary', summaryToSave)
    formData.append('content', normalizedContent)
    formData.append('published', String(publishedValue))
    formData.append('status', publishedValue ? 'published' : 'draft')

    if (normalizedReporter) {
      formData.append('reporter', normalizedReporter)
    }

    if (formState.published_at) {
      formData.append('published_at', formState.published_at)
    }

    if (formState.image) {
      formData.append('image', formState.image)
    }

    setIsSubmitting(true)
    try {
      const response = await createNews(formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to create news.')
      }
      window.alert(publishedValue ? 'Article published successfully' : 'Draft saved successfully')
      navigate('/admin/news', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to create news.'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-8 md:space-y-8">
      <header className="rounded-2xl border border-border/80 bg-gradient-to-r from-white via-slate-50 to-blue-50/40 p-5 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-7">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mb-4 px-0 text-slate-700 transition-all duration-200 hover:bg-transparent hover:text-primary"
          onClick={() => navigate('/admin/news')}
        >
          <ArrowLeftIcon />
          Back to NewsList
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
          Create News Article
        </h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          Add a new article to your news section.
        </p>
      </header>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          void handleSubmit('publish')
        }}
        className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]"
      >
        <div className="space-y-6">
          <Card className="overflow-hidden border-border/80 shadow-sm transition-all duration-200 hover:shadow-md">
            <CardHeader className="space-y-1.5 border-b border-border/70 bg-slate-50/65">
              <CardTitle>Basic Information</CardTitle>
              <p className="text-sm text-muted-foreground">
                Set the main title and URL details for this article.
              </p>
            </CardHeader>
            <CardContent className="space-y-5 pt-6 md:space-y-6">
              <InlineError message={errorMessage} />

              <FormField label="Title" htmlFor="title" required>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  value={formState.title}
                  onChange={handleChange}
                  placeholder="Enter article title"
                  className="transition-colors duration-200"
                  required
                />
              </FormField>

              <FormField
                label="URL Slug"
                htmlFor="slug"
                required
                helpText="This will be used in the article URL"
              >
                <div className="space-y-3">
                  <Input
                    id="slug"
                    name="slug"
                    type="text"
                    value={formState.slug}
                    onChange={handleChange}
                    placeholder="article-url-slug"
                    className="font-mono text-sm transition-colors duration-200"
                    required
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/80 bg-slate-50/80 px-3 py-2">
                    <p className="text-xs text-muted-foreground">
                      URL preview: <span className="font-mono text-foreground">{seoUrlPreview}</span>
                    </p>
                    {hasManuallyEditedSlug ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => {
                          setHasManuallyEditedSlug(false)
                          setFormState((current) => ({
                            ...current,
                            slug: generateSlug(current.title),
                          }))
                        }}
                      >
                        Reset from title
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Auto-generated</span>
                    )}
                  </div>
                </div>
              </FormField>
            </CardContent>
          </Card>

          <Card className="overflow-hidden border-border/80 shadow-sm transition-all duration-200 hover:shadow-md">
            <CardHeader className="space-y-1.5 border-b border-border/70 bg-slate-50/65">
              <CardTitle>Article Details</CardTitle>
              <p className="text-sm text-muted-foreground">
                Add article body, author information, and supporting media.
              </p>
            </CardHeader>
            <CardContent className="space-y-5 pt-6 md:space-y-6">
              <FormField label="Content" htmlFor="content" required>
                <SimpleRichTextEditor
                  value={formState.content}
                  onChange={(nextContent) =>
                    setFormState((current) => ({
                      ...current,
                      content: nextContent,
                    }))
                  }
                  textareaId="news-create-rich-text"
                />
              </FormField>

              <FormField label="Author" htmlFor="reporter">
                <Input
                  id="reporter"
                  name="reporter"
                  type="text"
                  value={formState.reporter}
                  onChange={handleChange}
                  placeholder="Author name"
                  className="transition-colors duration-200"
                />
              </FormField>

              <div className="space-y-2">
                <Label htmlFor="image">Featured Image</Label>
                <button
                  id="image"
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="group flex w-full items-center justify-between gap-3 rounded-xl border border-dashed border-border bg-background px-4 py-4 text-left transition-all duration-200 hover:border-primary/60 hover:bg-blue-50/30 focus-visible:border-primary"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {imageFileName || 'Click to upload image'}
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                  </div>
                  <span className="rounded-lg border border-border/80 bg-white p-2 text-muted-foreground transition-colors group-hover:text-primary">
                    <UploadIcon />
                  </span>
                </button>
                <Input
                  ref={imageInputRef}
                  id="image-file"
                  name="image"
                  type="file"
                  accept=".png,.jpg,.jpeg,.gif,image/png,image/jpeg,image/gif"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              <FormField
                label="Meta Description"
                htmlFor="metaDescription"
                helpText="Brief description for SEO (150-160 characters)"
              >
                <div className="space-y-2">
                  <Textarea
                    id="metaDescription"
                    name="metaDescription"
                    value={formState.metaDescription}
                    onChange={handleChange}
                    placeholder="Brief description for SEO (150-160 characters)"
                    maxLength={MAX_META_DESCRIPTION_LENGTH}
                    className="min-h-[110px] resize-y transition-colors duration-200"
                  />
                  <p
                    className={`text-right text-xs ${
                      metaDescriptionCount > 150
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {metaDescriptionCount}/{MAX_META_DESCRIPTION_LENGTH} characters
                  </p>
                </div>
              </FormField>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
          <Card className="overflow-hidden border-border/80 shadow-sm transition-all duration-200 hover:shadow-md">
            <CardHeader className="space-y-1.5 border-b border-border/70 bg-slate-50/65">
              <CardTitle>Publish Settings</CardTitle>
              <p className="text-sm text-muted-foreground">
                Schedule your publication and choose how to save this article.
              </p>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <FormField label="Publish Date" htmlFor="published_at">
                <div className="relative">
                  <Input
                    id="published_at"
                    name="published_at"
                    type="date"
                    value={formState.published_at}
                    onChange={handleChange}
                    className="pr-10 transition-colors duration-200"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground">
                    <CalendarIcon />
                  </span>
                </div>
              </FormField>

              <div className="rounded-xl border border-border/80 bg-slate-50/80 p-4">
                <p className="text-sm font-semibold text-slate-900">Article status</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use <span className="font-medium text-foreground">Save as Draft</span> to keep this private,
                  or <span className="font-medium text-foreground">Publish</span> to make it live.
                </p>
              </div>

              <div className="grid gap-3 pt-1">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => navigate('/admin/news')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  loading={isSubmitting && submitAction === 'draft'}
                  disabled={isSubmitting}
                  className="transition-transform duration-200 hover:-translate-y-0.5"
                  onClick={() => {
                    void handleSubmit('draft')
                  }}
                >
                  <SaveIcon />
                  Save as Draft
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  loading={isSubmitting && submitAction === 'publish'}
                  disabled={isSubmitting}
                  className="border-emerald-600 bg-emerald-600 text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 focus-visible:ring-emerald-600"
                >
                  <SendIcon />
                  Publish
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}

export default AdminNewsCreatePage
