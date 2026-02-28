import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createLandmark } from '../../services/api/adminLandmarksApi.js'
import { getAuthToken } from '../../lib/auth.js'
import SimpleRichTextEditor from '../../components/richText/SimpleRichTextEditor.jsx'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  FormField,
  InlineError,
  Input,
} from '../../components/ui/index.jsx'

function AdminLandmarksCreatePage() {
  const navigate = useNavigate()
  const [formState, setFormState] = useState({
    name: '',
    description: '',
    published: false,
    image: null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
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

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

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
    formData.append('published', String(formState.published))
    if (formState.image) {
      formData.append('image', formState.image)
    }

    setIsSubmitting(true)
    try {
      const response = await createLandmark(formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to create landmark.')
      }
      window.alert('Landmark created successfully')
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
      <form onSubmit={handleSubmit}>
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

            <FormField label="Published" htmlFor="published">
              <div className="flex items-center gap-2">
                <input
                  id="published"
                  name="published"
                  type="checkbox"
                  checked={formState.published}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <span className="text-sm text-muted-foreground">
                  Publish this landmark immediately.
                </span>
              </div>
            </FormField>

            <FormField label="Image (optional)" htmlFor="image">
              <div className="rounded-lg border border-border bg-background p-4">
                <Input
                  id="image"
                  name="image"
                  type="file"
                  onChange={handleFileChange}
                />
              </div>
            </FormField>
          </CardContent>
          <CardFooter>
            <Button
              variant="secondary"
              type="button"
              onClick={() => navigate('/admin/landmarks')}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Landmark'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default AdminLandmarksCreatePage
