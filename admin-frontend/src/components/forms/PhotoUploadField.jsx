import { useId, useRef } from 'react'
import { Button, ImageWithFallback, Input } from '../ui/index.jsx'

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

export default function PhotoUploadField({
  label,
  value = '',
  fileValue = null,
  onValueChange,
  valueType = 'url',
  valueId,
  valueName,
  valuePlaceholder = '',
  fileId,
  fileName,
  onChange,
  onRemove,
  removeLabel = 'Remove',
  buttonLabel = 'Upload',
  helperText,
  instructions,
  aspectRatioHint,
  acceptedFileTypes = 'image/*',
  previewSrc = '',
  previewAlt = 'Image preview',
  previewFallback = 'No image',
  existingAssetUrl = '',
  existingAssetLabel = 'Current image',
  error = '',
  disabled = false,
  required = false,
  previewContainerClassName = 'mt-1',
  previewClassName = 'h-24 w-32 rounded-md object-cover',
  children,
}) {
  const autoId = useId()
  const inputFileRef = useRef(null)
  const resolvedValueId = valueId || `${autoId}-value`
  const resolvedFileId = fileId || `${autoId}-file`
  const resolvedFileName = fileName || resolvedFileId
  const displayValue = value || fileValue?.name || ''

  return (
    <div className="space-y-2 p-4">
      {label ? (
        <p className="text-sm font-medium text-foreground">
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          id={resolvedValueId}
          name={valueName}
          type={valueType}
          value={displayValue}
          onChange={onValueChange}
          placeholder={valuePlaceholder}
          className="flex-1"
          readOnly={!onValueChange}
          disabled={disabled}
          required={Boolean(onValueChange) && required}
          error={error}
          aria-invalid={error ? 'true' : undefined}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="h-10 shrink-0"
          onClick={() => inputFileRef.current?.click()}
          disabled={disabled}
        >
          <UploadIcon />
          {buttonLabel}
        </Button>
        {onRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-10 shrink-0"
            onClick={onRemove}
            disabled={disabled}
          >
            {removeLabel}
          </Button>
        ) : null}
        <Input
          ref={inputFileRef}
          id={resolvedFileId}
          name={resolvedFileName}
          type="file"
          accept={acceptedFileTypes}
          className="hidden"
          onChange={onChange}
          disabled={disabled}
          required={required}
        />
      </div>
      {helperText ? <p className="text-xs text-muted-foreground">{helperText}</p> : null}
      {instructions ? <p className="text-xs text-muted-foreground">{instructions}</p> : null}
      {aspectRatioHint ? (
        <p className="text-xs text-muted-foreground">Recommended ratio: {aspectRatioHint}</p>
      ) : null}
      {existingAssetUrl ? (
        <p className="text-xs text-muted-foreground">
          {existingAssetLabel}:{' '}
          <a
            href={existingAssetUrl}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            View
          </a>
        </p>
      ) : null}
      {previewSrc ? (
        <div className={previewContainerClassName}>
          <ImageWithFallback
            src={previewSrc}
            alt={previewAlt}
            className={previewClassName}
            fallbackText={previewFallback}
          />
        </div>
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {children}
    </div>
  )
}
