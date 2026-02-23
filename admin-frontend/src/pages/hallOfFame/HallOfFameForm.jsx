import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  FormField,
  InlineError,
  Input,
} from '../../components/ui/index.jsx'
import SimpleRichTextEditor from '../../components/richText/SimpleRichTextEditor.jsx'

function getPreviewUrl(file) {
  if (!file) return ''
  return URL.createObjectURL(file)
}

function resolveAssetUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path) || path.startsWith('data:')) {
    return path
  }

  const base = (
    import.meta.env.VITE_API_BASE_URL ||
    (import.meta.env.DEV ? 'http://localhost:5000' : '')
  ).replace(/\/$/, '')

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return base ? `${base}${normalizedPath}` : normalizedPath
}

export default function HallOfFameForm({
  title,
  description,
  value,
  submitting = false,
  errorMessage = '',
  submitLabel,
  submitDisabled = false,
  onChange,
  onCancel,
  onSubmit,
  onUploadImage,
}) {
  const [fieldErrors, setFieldErrors] = useState({})
  const previewUrl = useMemo(() => getPreviewUrl(value?.image), [value?.image])
  useEffect(() => () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const resolvedImageUrl = previewUrl || resolveAssetUrl(value?.existingImageUrl || '')

  const validate = () => {
    const nextErrors = {}
    if (!value?.name?.trim()) {
      nextErrors.name = 'Name is required.'
    }
    if (!value?.body?.trim()) {
      nextErrors.body = 'Body is required.'
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!validate()) {
      return
    }
    onSubmit(event)
  }

  const update = (field, nextValue) => {
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
    onChange(field, nextValue)
  }

  const bodyEditorId = useMemo(
    () => `hall-of-fame-body-${value?.id || 'new'}`,
    [value?.id]
  )

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold break-words md:text-2xl">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </header>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-5 md:space-y-6">
            <InlineError message={errorMessage} />

            <FormField
              label="Portrait Image (optional)"
              htmlFor="image"
              helpText="Recommended portrait ratio: 4:5. Target size: around 600 x 750."
            >
              <div className="space-y-3 rounded-lg border border-border bg-background p-4">
                <Input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={(event) => update('image', event.target.files?.[0] || null)}
                />
                <div className="w-full max-w-[240px] overflow-hidden rounded-xl border border-border bg-muted/30">
                  <div className="aspect-[4/5]">
                    {resolvedImageUrl ? (
                      <img
                        src={resolvedImageUrl}
                        alt={value?.name?.trim() || 'Hall of fame portrait preview'}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
                        No portrait selected
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </FormField>

            <FormField
              label="Name"
              htmlFor="name"
              required
              errorText={fieldErrors.name}
            >
              <Input
                id="name"
                name="name"
                type="text"
                value={value?.name || ''}
                onChange={(event) => update('name', event.target.value)}
                required
              />
            </FormField>

            <FormField label="Title / Position (optional)" htmlFor="title">
              <Input
                id="title"
                name="title"
                type="text"
                value={value?.title || ''}
                onChange={(event) => update('title', event.target.value)}
              />
            </FormField>

            <FormField
              label="Body"
              htmlFor={bodyEditorId}
              required
              errorText={fieldErrors.body}
            >
              <SimpleRichTextEditor
                value={value?.body || ''}
                onChange={(nextBody) => update('body', nextBody)}
                textareaId={bodyEditorId}
                onUploadImage={onUploadImage}
              />
            </FormField>

            <FormField label="Published" htmlFor="published">
              <div className="flex items-center gap-2">
                <input
                  id="published"
                  name="published"
                  type="checkbox"
                  checked={Boolean(value?.published)}
                  onChange={(event) => update('published', event.target.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <span className="text-sm text-muted-foreground">
                  Publish this Hall of Fame entry.
                </span>
              </div>
            </FormField>
          </CardContent>

          <CardFooter>
            <Button variant="secondary" type="button" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              loading={submitting}
              disabled={submitDisabled}
            >
              {submitting ? 'Saving...' : submitLabel}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
