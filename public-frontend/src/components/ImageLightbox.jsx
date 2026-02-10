import { Modal } from './ui/modal.jsx'
import { Button } from './ui/button.jsx'

// Lightweight lightbox using the shared modal component.
export default function ImageLightbox({ open, onClose, src, alt }) {
  if (!open) {
    return null
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeOnOverlayClick
      size="lg"
      title="Flyer preview"
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="flex items-center justify-center">
        <img
          src={src}
          alt={alt}
          className="max-h-[70vh] w-full rounded-md object-contain"
        />
      </div>
    </Modal>
  )
}
