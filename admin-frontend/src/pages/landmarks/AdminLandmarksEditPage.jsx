import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getSingleLandmark,
  updateLandmark,
} from '../../services/api/adminLandmarksApi.js'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  FormField,
  InlineError,
  Input,
  Textarea,
} from '../../components/ui/index.jsx'

function AdminLandmarksEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [initialState, setInitialState] = useState(null)
  const [formState, setFormState] = useState({
    name: '',
    title: '',
    description: '',
    location: '',
    google_map_link: '',
    category: '',
    published: false,
    image: null,
    existingImageUrl: '',
  })
  const [autoDrafted, setAutoDrafted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
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
          title: landmark?.title || '',
          description: landmark?.description || '',
          location: landmark?.location || landmark?.address || '',
          google_map_link:
            landmark?.google_map_link ||
            landmark?.googleMapLink ||
            landmark?.video_url ||
            '',
          category: landmark?.category || '',
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
        // Auto-draft the UI when entering edit mode.
        setFormState({ ...nextState, published: false })
        setAutoDrafted(true)
      } catch (error) {
        if (error.status === 401) {
          // Token expired; force re-authentication.
          clearAuthToken()
          navigate('/login', { replace: true })
          return
        }

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
      autoDrafted ||
      formState.name !== initialState.name ||
      formState.title !== initialState.title ||
      formState.description !== initialState.description ||
      formState.location !== initialState.location ||
      formState.google_map_link !== initialState.google_map_link ||
      formState.category !== initialState.category ||
      formState.published !== initialState.published ||
      Boolean(formState.image)
    )
  }, [autoDrafted, formState, initialState])

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

    if (!hasChanges) {
      setErrorMessage('No changes to update.')
      return
    }

    if (!formState.name.trim() && !formState.title.trim()) {
      setErrorMessage('Name or title is required.')
      return
    }

    const formData = new FormData()
    formData.append('name', formState.name.trim())
    formData.append('title', formState.title.trim())
    formData.append('description', formState.description.trim())
    formData.append('address', formState.location.trim())
    formData.append('video_url', formState.google_map_link.trim())
    formData.append('category', formState.category.trim())
    // Force publish on successful save when leaving auto-draft mode.
    formData.append('published', 'true')
    if (formState.image) {
      formData.append('image', formState.image)
    }

    setIsSubmitting(true)
    try {
      const response = await updateLandmark(id, formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to update landmark.')
      }
      setFormState((current) => ({ ...current, published: true }))
      setAutoDrafted(false)
      window.alert('Landmark edited successfully')
      navigate('/admin/landmarks', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

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

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold break-words md:text-2xl">Edit Landmark</h1>
        <p className="text-sm text-muted-foreground">
          Adjust the landmark details and media as needed.
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

            <FormField label="Title" htmlFor="title">
              <Input
                id="title"
                name="title"
                type="text"
                value={formState.title}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Description" htmlFor="description">
              <Textarea
                id="description"
                name="description"
                value={formState.description}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Location" htmlFor="location">
              <Input
                id="location"
                name="location"
                type="text"
                value={formState.location}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Google map link" htmlFor="google_map_link">
              <Input
                id="google_map_link"
                name="google_map_link"
                type="url"
                value={formState.google_map_link}
                onChange={handleChange}
              />
            </FormField>

            <FormField label="Category" htmlFor="category">
              <Input
                id="category"
                name="category"
                type="text"
                value={formState.category}
                onChange={handleChange}
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
                  disabled={autoDrafted}
                  className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <span className="text-sm text-muted-foreground">
                  Publishing is enabled after saving changes.
                </span>
              </div>
            </FormField>

            <FormField
              label="Replace image (optional)"
              htmlFor="image"
              helpText={
                formState.existingImageUrl ? (
                  <span>
                    Current image:{' '}
                    <a
                      href={formState.existingImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      View
                    </a>
                  </span>
                ) : null
              }
            >
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
            <Button
              variant="primary"
              type="submit"
              loading={isSubmitting}
              disabled={!hasChanges}
            >
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default AdminLandmarksEditPage
