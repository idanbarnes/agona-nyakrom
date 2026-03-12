import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Cropper from 'react-easy-crop'
import { createSlide } from '../../services/api/adminCarouselApi.js'
import { getAuthToken } from '../../lib/auth.js'
import { getCroppedImageDataUrl } from '../../lib/cropImage.js'
import PhotoUploadField from '../../components/forms/PhotoUploadField.jsx'
import FormActions from '../../components/ui/form-actions.jsx'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  FormField,
  InlineError,
  Input,
  Modal,
  Textarea,
} from '../../components/ui/index.jsx'

function AdminCarouselCreatePage() {
  const navigate = useNavigate()
  const [formState, setFormState] = useState({
    title: '',
    subtitle: '',
    caption: '',
    cta_text: '',
    cta_url: '',
    display_order: '',
    image: null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitAction, setSubmitAction] = useState('publish')
  const [errorMessage, setErrorMessage] = useState('')
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [cropPreview, setCropPreview] = useState('')
  const [cropData, setCropData] = useState(null)
  const [imageSrc, setImageSrc] = useState('')
  const [mediaDimensions, setMediaDimensions] = useState(null)
  const [cropError, setCropError] = useState('')

  useEffect(() => {
    if (!formState.image) {
      setImageSrc('')
      return undefined
    }

    const objectUrl = URL.createObjectURL(formState.image)
    setImageSrc(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [formState.image])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    const nextValue = type === 'checkbox' ? checked : value
    setFormState((current) => ({ ...current, [name]: nextValue }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null
    setFormState((current) => ({ ...current, image: file }))
    setCropData(null)
    setCropPreview('')
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setMediaDimensions(null)
    setCropError('')
    if (file) {
      setCropModalOpen(true)
    }
  }

  const handleCropComplete = (_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels)
  }

  const handleApplyCrop = async () => {
    if (!croppedAreaPixels || !mediaDimensions) {
      setCropError('Please adjust the crop area before applying.')
      return
    }

    const normalizedCrop = {
      x: croppedAreaPixels.x / mediaDimensions.naturalWidth,
      y: croppedAreaPixels.y / mediaDimensions.naturalHeight,
      w: croppedAreaPixels.width / mediaDimensions.naturalWidth,
      h: croppedAreaPixels.height / mediaDimensions.naturalHeight,
    }

    try {
      const preview = await getCroppedImageDataUrl(
        imageSrc,
        croppedAreaPixels,
      )
      setCropPreview(preview)
    } catch (cropError) {
      console.error(cropError)
    }

    setCropData(normalizedCrop)
    setCropError('')
    setCropModalOpen(false)
  }

  const handleCancelCrop = () => {
    setCropModalOpen(false)
    setFormState((current) => ({ ...current, image: null }))
    setCropData(null)
    setCropPreview('')
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    setMediaDimensions(null)
    setCropError('')
  }

  const handleSubmit = async (action) => {
    setErrorMessage('')
    setSubmitAction(action)

    if (!getAuthToken()) {
      navigate('/login', { replace: true })
      return
    }

    if (!formState.image) {
      setErrorMessage('Image is required.')
      return
    }

    if (!cropData) {
      setErrorMessage('Please crop the image to continue.')
      return
    }

    if (
      formState.display_order === '' ||
      Number.isNaN(Number(formState.display_order))
    ) {
      setErrorMessage('Display order is required.')
      return
    }

    const formData = new FormData()
    formData.append('title', formState.title.trim())
    formData.append('subtitle', formState.subtitle.trim())
    formData.append('caption', formState.caption.trim())
    formData.append('cta_text', formState.cta_text.trim())
    formData.append('cta_url', formState.cta_url.trim())
    formData.append('display_order', String(Number(formState.display_order)))
    formData.append('published', String(action === 'publish'))
    formData.append('image', formState.image)
    formData.append('crop_x', String(cropData.x))
    formData.append('crop_y', String(cropData.y))
    formData.append('crop_w', String(cropData.w))
    formData.append('crop_h', String(cropData.h))

    setIsSubmitting(true)
    try {
      const response = await createSlide(formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to create slide.')
      }
      window.alert(
        action === 'draft'
          ? 'Carousel draft saved successfully'
          : 'Carousel slide published successfully',
      )
      navigate('/admin/carousel', { replace: true })
    } catch (error) {

      const message = error.message || 'Unable to create slide.'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold break-words md:text-2xl">
          Create Carousel Slide
        </h1>
        <p className="text-sm text-muted-foreground">
          Add slide copy, call-to-action details, and ordering for the carousel.
        </p>
      </header>
      <form>
        <Card>
          <CardContent className="space-y-5 md:space-y-6">
            <InlineError message={errorMessage} />
            <FormField label="Title" htmlFor="title">
              <Input
                id="title"
                name="title"
                type="text"
                value={formState.title}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Subtitle" htmlFor="subtitle">
              <Input
                id="subtitle"
                name="subtitle"
                type="text"
                value={formState.subtitle}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Caption" htmlFor="caption">
              <Textarea
                id="caption"
                name="caption"
                value={formState.caption}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="CTA text" htmlFor="cta_text">
              <Input
                id="cta_text"
                name="cta_text"
                type="text"
                value={formState.cta_text}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="CTA URL" htmlFor="cta_url">
              <Input
                id="cta_url"
                name="cta_url"
                type="text"
                value={formState.cta_url}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Display order" htmlFor="display_order" required>
              <Input
                id="display_order"
                name="display_order"
                type="number"
                value={formState.display_order}
                onChange={handleChange}
                required
              />
            </FormField>
            <FormField label="Image" htmlFor="image" required>
              <div className="rounded-xl border border-border bg-background/60">
                <PhotoUploadField
                  label=""
                  value={formState.image?.name || ''}
                  valueType="text"
                  valueId="image"
                  valuePlaceholder="Select image"
                  fileId="image-file"
                  fileName="image"
                  acceptedFileTypes="image/*"
                  onChange={handleFileChange}
                  required
                  instructions="Recommended image size: 1920 x 800 (wide banner). You will crop the image before saving."
                  previewSrc={cropPreview}
                  previewAlt="Cropped preview"
                  previewContainerClassName="mt-1 max-w-xs"
                  previewClassName="h-24 w-full rounded-md object-cover"
                />
              </div>
            </FormField>
          </CardContent>
          <CardFooter>
            <FormActions
              mode="publish"
              onCancel={() => navigate('/admin/carousel')}
              onAction={(nextAction) => {
                void handleSubmit(nextAction)
              }}
              isSubmitting={isSubmitting}
              submitAction={submitAction}
              disableCancel={isSubmitting}
            />
          </CardFooter>
        </Card>
      </form>
      <Modal
        open={cropModalOpen}
        onClose={handleCancelCrop}
        closeOnOverlayClick={false}
        size="lg"
        title="Crop carousel image"
        footer={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" type="button" onClick={handleCancelCrop}>
              Cancel
            </Button>
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setCrop({ x: 0, y: 0 })
                setZoom(1)
              }}
            >
              Reset
            </Button>
            <Button variant="primary" type="button" onClick={handleApplyCrop}>
              Apply Crop
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="relative h-64 w-full overflow-hidden rounded-lg bg-muted">
            {imageSrc ? (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1920 / 800}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
                onMediaLoaded={(mediaSize) => {
                  setMediaDimensions(mediaSize)
                }}
              />
            ) : null}
          </div>
          <div>
            <label className="text-sm font-medium">Zoom</label>
            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="mt-2 w-full"
            />
          </div>
          {cropError ? (
            <p className="text-sm text-danger">{cropError}</p>
          ) : null}
        </div>
      </Modal>
    </div>
  )
}

export default AdminCarouselCreatePage

