import { Modal } from './ui/modal.jsx'
import { Button } from './ui/button.jsx'

export default function ImageLightbox({ open, onClose, src, alt, caption }) {
  if (!open) {
    return null
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeOnOverlayClick
      size="lg"
      title="Image preview"
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center justify-center rounded-md bg-black/80 p-2">
          <img
            src={src}
            alt={alt}
            className="max-h-[72vh] w-full rounded-md object-contain"
          />
        </div>
        {caption ? (
          <p className="text-center text-sm text-muted-foreground">{caption}</p>
        ) : null}
      </div>
    </Modal>
  )
}
