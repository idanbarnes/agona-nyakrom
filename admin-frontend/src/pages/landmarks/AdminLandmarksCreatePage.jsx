import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { createLandmark } from '../../services/api/adminLandmarksApi.js'
import { getAuthToken } from '../../lib/auth.js'
import SimpleRichTextEditor from '../../components/richText/SimpleRichTextEditor.jsx'
import PhotoUploadField from '../../components/forms/PhotoUploadField.jsx'
import FormActions from '../../components/ui/form-actions.jsx'
import { resolveAdminCancelTarget } from '../../lib/adminCancelTarget.js'
import {
  Card,
  CardContent,
  CardFooter,
  FormField,
  InlineError,
  Input,
} from '../../components/ui/index.jsx'

function AdminLandmarksCreatePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const cancelTarget = resolveAdminCancelTarget(location.pathname)
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    image: null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitAction, setSubmitAction] = useState('publish')
  const [errorMessage, setErrorMessage] = useState('')

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

    if (!getAuthToken()) {
      navigate('/login', { replace: true })
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
      const response = await createLandmark(formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to create landmark.')
      }
      window.alert(
        action === 'draft'
          ? 'Landmark draft saved successfully'
          : 'Landmark published successfully',
      )
      navigate('/admin/landmarks', { replace: true })
    } catch (error) {

      const message = error.message || 'Unable to create landmark.'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold break-words md:text-2xl">Create Landmark</h1>
        <p className="text-sm text-muted-foreground">
          Add a landmark description and imagery.
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
                textareaId="landmark-description-create"
              />
            </FormField>

            <div className="rounded-xl border border-border bg-background/60">
              <PhotoUploadField
                label="Image (optional)"
                value={formState.image?.name || ''}
                valueType="text"
                valueId="image"
                valuePlaceholder="Select image"
                fileId="image-file"
                fileName="image"
                acceptedFileTypes="image/*"
                onChange={handleFileChange}
              />
            </div>
          </CardContent>
          <CardFooter>
            <FormActions
              mode="publish"
              onCancel={() => navigate(cancelTarget)}
              onAction={(action) => {
                void handleSubmit(action)
              }}
              isSubmitting={isSubmitting}
              submitAction={submitAction}
              disableCancel={isSubmitting}
            />
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default AdminLandmarksCreatePage
