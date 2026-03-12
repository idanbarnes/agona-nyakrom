import { Button } from './button.jsx'

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

function FormActions({
  mode = 'publish',
  onCancel,
  onAction,
  onSubmit,
  isSubmitting = false,
  submitAction = 'publish',
  cancelLabel = 'Cancel',
  draftLabel = 'Save as Draft',
  publishLabel = 'Publish',
  submitLabel = 'Save changes',
  submitLoadingLabel = 'Saving...',
  disableCancel = false,
  disableDraft = false,
  disablePublish = false,
  disableSubmit = false,
  draftClassName = 'transition-transform duration-200 hover:-translate-y-0.5',
  publishClassName = 'border-emerald-600 bg-emerald-600 text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 focus-visible:ring-emerald-600',
  submitClassName = '',
  submitType = 'submit',
  className = 'flex flex-wrap items-center justify-end gap-3',
}) {
  if (mode === 'single') {
    return (
      <div className={className}>
        <Button variant="secondary" type="button" onClick={onCancel} disabled={disableCancel}>
          {cancelLabel}
        </Button>
        <Button
          variant="primary"
          type={submitType}
          onClick={onSubmit}
          className={submitClassName}
          loading={isSubmitting}
          disabled={isSubmitting || disableSubmit}
        >
          {isSubmitting ? submitLoadingLabel : submitLabel}
        </Button>
      </div>
    )
  }

  return (
    <div className={className}>
      <Button variant="secondary" type="button" onClick={onCancel} disabled={disableCancel}>
        {cancelLabel}
      </Button>
      <Button
        variant="secondary"
        type="button"
        className={draftClassName}
        loading={isSubmitting && submitAction === 'draft'}
        disabled={isSubmitting || disableDraft}
        onClick={() => onAction?.('draft')}
      >
        <SaveIcon />
        {draftLabel}
      </Button>
      <Button
        variant="primary"
        type="button"
        className={publishClassName}
        loading={isSubmitting && submitAction === 'publish'}
        disabled={isSubmitting || disablePublish}
        onClick={() => onAction?.('publish')}
      >
        <SendIcon />
        {publishLabel}
      </Button>
    </div>
  )
}

export default FormActions
