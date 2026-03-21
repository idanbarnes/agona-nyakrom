import { useEffect, useMemo, useState } from 'react'
import {
  Card,
  CardContent,
  CardFooter,
  Checkbox,
  FormField,
  Input,
  InlineError,
  Label,
} from '../../components/ui/index.jsx'
import PhotoUploadField from '../../components/forms/PhotoUploadField.jsx'
import SimpleRichTextEditor from '../../components/richText/SimpleRichTextEditor.jsx'
import FormActions from '../../components/ui/form-actions.jsx'

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
  submitAction = 'publish',
  errorMessage = '',
  disableDraft = false,
  disablePublish = false,
  onChange,
  onCancel,
  onSubmitAction,
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

  const handleAction = (action) => {
    if (!validate()) {
      return
    }
    onSubmitAction(action)
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

      <form>
        <Card>
          <CardContent className="space-y-5 md:space-y-6">
            <InlineError message={errorMessage} />

            <FormField
              label="Portrait Image (optional)"
              htmlFor="image"
            >
              <div className="rounded-xl border border-border bg-background/60">
                <PhotoUploadField
                  label=""
                  value={value?.image?.name || ''}
                  valueType="text"
                  valueId="image"
                  fileId="image-file"
                  fileName="image"
                  acceptedFileTypes="image/*"
                  onChange={(event) => update('image', event.target.files?.[0] || null)}
                  aspectRatioHint="4:5"
                  instructions="Target size: around 600 x 750."
                  previewSrc={resolvedImageUrl}
                  previewAlt={value?.name?.trim() || 'Hall of fame portrait preview'}
                  previewFallback="No portrait selected"
                  previewContainerClassName="mt-1 w-full max-w-[240px] overflow-hidden rounded-xl border border-border bg-muted/30 aspect-[4/5]"
                  previewClassName="h-full w-full object-cover"
                />
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

            <div className="space-y-2">
              <Label htmlFor="is_featured">Featured</Label>
              <label
                htmlFor="is_featured"
                className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background/60 px-4 py-3"
              >
                <Checkbox
                  id="is_featured"
                  name="is_featured"
                  checked={Boolean(value?.is_featured)}
                  onCheckedChange={(checked) => update('is_featured', Boolean(checked))}
                  className="mt-0.5"
                />
                <span className="space-y-1">
                  <span className="block text-sm font-medium text-foreground">
                    Mark this Hall of Fame entry as featured
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Featured entries can be prioritized by the Hall of Fame CMS and API.
                  </span>
                </span>
              </label>
            </div>

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

          </CardContent>

          <CardFooter>
            <FormActions
              mode="publish"
              onCancel={onCancel}
              onAction={(action) => {
                handleAction(action)
              }}
              isSubmitting={submitting}
              submitAction={submitAction}
              disableCancel={submitting}
              disableDraft={disableDraft}
              disablePublish={disablePublish}
            />
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
