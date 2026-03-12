import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  getSingleLandmark,
  updateLandmark,
} from '../../services/api/adminLandmarksApi.js'
import { getAuthToken } from '../../lib/auth.js'
import SimpleRichTextEditor from '../../components/richText/SimpleRichTextEditor.jsx'
import PhotoUploadField from '../../components/forms/PhotoUploadField.jsx'
import AdminInlinePreviewLayout from '../../components/preview/AdminInlinePreviewLayout.jsx'
import FormActions from '../../components/ui/form-actions.jsx'
import {
  Card,
  CardContent,
  CardFooter,
  FormField,
  InlineError,
  Input,
} from '../../components/ui/index.jsx'

function AdminLandmarksEditPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [initialState, setInitialState] = useState(null)
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    image: null,
    existingImageUrl: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitAction, setSubmitAction] = useState('publish')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!getAuthToken()) {
      navigate('/login', { replace: true })
      return
    }

    const fetchLandmark = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const payload = await getSingleLandmark(id)
        const data = payload?.data ?? payload
        const landmark = data?.landmark || data

        const nextState = {
          name: landmark?.name || '',
          description: landmark?.description || '',
          published: Boolean(landmark?.published),
          image: null,
          existingImageUrl:
            landmark?.image_url ||
            landmark?.imageUrl ||
            landmark?.image ||
            landmark?.images?.original ||
            landmark?.images?.large ||
            landmark?.images?.medium ||
            landmark?.images?.thumbnail ||
            '',
        }

        setInitialState(nextState)
        setFormState(nextState)
      } catch (error) {

        setErrorMessage(error.message || 'Unable to load landmark.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchLandmark()
  }, [id, navigate])

  const hasChanges = useMemo(() => {
    if (!initialState) {
      return false
    }

    return (
      formState.name !== initialState.name ||
      formState.description !== initialState.description ||
      Boolean(formState.image)
    )
  }, [formState, initialState])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    const nextValue = type === 'checkbox' ? checked : value
    setFormState((current) => ({ ...current, [name]: nextValue }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null
    setFormState((current) => ({ ...current, image: file }))
  }

  const handleSubmit = async (action) => {
    setErrorMessage('')
    setSubmitAction(action)

    const allowPublishWithoutFieldChanges = action === 'publish'

    if (!hasChanges && !allowPublishWithoutFieldChanges) {
      setErrorMessage('No changes to update.')
      return
    }

    if (!formState.name.trim()) {
      setErrorMessage('Name is required.')
      return
    }

    const formData = new FormData()
    formData.append('name', formState.name.trim())
    formData.append('description', formState.description.trim())
    formData.append('published', String(action === 'publish'))
    if (formState.image) {
      formData.append('image', formState.image)
    }

    setIsSubmitting(true)
    try {
      const response = await updateLandmark(id, formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to update landmark.')
      }
      window.alert(
        action === 'draft'
          ? 'Landmark draft saved successfully'
          : 'Landmark published successfully',
      )
      navigate('/admin/landmarks', { replace: true })
    } catch (error) {

      const message = error.message || 'Unable to update landmark.'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold break-words md:text-2xl">Edit Landmark</h1>
          <p className="text-sm text-muted-foreground">
            Update landmark information and republish when ready.
          </p>
        </header>
        <p>Loading...</p>
      </div>
    )
  }

  const formContent = (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold break-words md:text-2xl">Edit Landmark</h1>
        <p className="text-sm text-muted-foreground">
          Adjust the landmark description and media as needed.
        </p>
      </header>
      <form>
        <Card>
          <CardContent className="space-y-5 md:space-y-6">
            <InlineError message={errorMessage} />
            <FormField label="Name" htmlFor="name">
              <Input
                id="name"
                name="name"
                type="text"
                value={formState.name}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Description" htmlFor="description">
              <SimpleRichTextEditor
                value={formState.description}
                onChange={(nextDescription) =>
                  setFormState((current) => ({ ...current, description: nextDescription }))
                }
                textareaId={`landmark-description-edit-${id}`}
              />
            </FormField>

            <div className="rounded-xl border border-border bg-background/60">
              <PhotoUploadField
                label="Replace image (optional)"
                value={formState.image?.name || ''}
                valueType="text"
                valueId="image"
                valuePlaceholder="Select image"
                fileId="image-file"
                fileName="image"
                acceptedFileTypes="image/*"
                onChange={handleFileChange}
                existingAssetUrl={formState.existingImageUrl}
              />
            </div>
          </CardContent>
          <CardFooter>
            <FormActions
              mode="publish"
              onCancel={() => navigate('/admin/landmarks')}
              onAction={(action) => {
                void handleSubmit(action)
              }}
              isSubmitting={isSubmitting}
              submitAction={submitAction}
              disableCancel={isSubmitting}
              disableDraft={!hasChanges}
            />
          </CardFooter>
        </Card>
      </form>
    </div>
  )

  return (
    <AdminInlinePreviewLayout
      resource="landmarks"
      itemId={id}
      query={location.search}
      storageKey="landmarks-preview-pane-width">
      {formContent}
    </AdminInlinePreviewLayout>
  )
}

export default AdminLandmarksEditPage
