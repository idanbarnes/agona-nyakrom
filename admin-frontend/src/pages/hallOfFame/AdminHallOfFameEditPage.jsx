import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getSingleHallOfFame,
  updateHallOfFame,
} from '../../services/api/adminHallOfFameApi.js'
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

function AdminHallOfFameEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [initialState, setInitialState] = useState(null)
  const [formState, setFormState] = useState({
    name: '',
    title: '',
    bio: '',
    achievements: '',
    is_featured: false,
    display_order: '',
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

    const fetchEntry = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const payload = await getSingleHallOfFame(id)
        const data = payload?.data ?? payload
        const entry = data?.entry || data

        const nextState = {
          name: entry?.name || '',
          title: entry?.title || '',
          bio: entry?.bio || '',
          achievements: entry?.achievements || '',
          is_featured: Boolean(entry?.is_featured),
          display_order: entry?.display_order ?? '',
          published: Boolean(entry?.published),
          image: null,
          existingImageUrl: entry?.image_url || entry?.imageUrl || entry?.image || '',
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

        setErrorMessage(error.message || 'Unable to load entry.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchEntry()
  }, [id, navigate])

  const hasChanges = useMemo(() => {
    if (!initialState) {
      return false
    }

    return (
      autoDrafted ||
      formState.name !== initialState.name ||
      formState.title !== initialState.title ||
      formState.bio !== initialState.bio ||
      formState.achievements !== initialState.achievements ||
      String(formState.display_order) !== String(initialState.display_order) ||
      formState.is_featured !== initialState.is_featured ||
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

    if (!formState.name || !formState.title || !formState.bio) {
      setErrorMessage('Name, title, and bio are required.')
      return
    }

    const formData = new FormData()
    formData.append('name', formState.name)
    formData.append('title', formState.title)
    formData.append('bio', formState.bio)
    if (formState.achievements) {
      formData.append('achievements', formState.achievements)
    }
    if (formState.display_order !== '') {
      formData.append('display_order', String(formState.display_order))
    }
    formData.append('is_featured', String(formState.is_featured))
    // Force publish on successful save when leaving auto-draft mode.
    formData.append('published', 'true')
    if (formState.image) {
      formData.append('image', formState.image)
    }

    setIsSubmitting(true)
    try {
      const response = await updateHallOfFame(id, formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to update entry.')
      }
      setFormState((current) => ({ ...current, published: true }))
      setAutoDrafted(false)
      window.alert('Hall of Fame entry edited successfully')
      navigate('/admin/hall-of-fame', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to update entry.'
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
          <h1 className="text-xl font-semibold break-words md:text-2xl">
            Edit Hall of Fame Entry
          </h1>
          <p className="text-sm text-muted-foreground">
            Update the featured profile and republish.
          </p>
        </header>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold break-words md:text-2xl">
          Edit Hall of Fame Entry
        </h1>
        <p className="text-sm text-muted-foreground">
          Refresh the Hall of Fame story and achievements.
        </p>
      </header>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-5 md:space-y-6">
            <InlineError message={errorMessage} />
            <FormField label="Name" htmlFor="name" required>
              <Input
                id="name"
                name="name"
                type="text"
                value={formState.name}
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField label="Title" htmlFor="title" required>
              <Input
                id="title"
                name="title"
                type="text"
                value={formState.title}
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField label="Bio" htmlFor="bio" required>
              <Textarea
                id="bio"
                name="bio"
                value={formState.bio}
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField label="Achievements (optional)" htmlFor="achievements">
              <Textarea
                id="achievements"
                name="achievements"
                value={formState.achievements}
                onChange={handleChange}
              />
            </FormField>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Display order (optional)" htmlFor="display_order">
                <Input
                  id="display_order"
                  name="display_order"
                  type="number"
                  value={formState.display_order}
                  onChange={handleChange}
                />
              </FormField>

              <FormField label="Featured" htmlFor="is_featured">
                <div className="flex items-center gap-2">
                  <input
                    id="is_featured"
                    name="is_featured"
                    type="checkbox"
                    checked={formState.is_featured}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <span className="text-sm text-muted-foreground">
                    Highlight this entry on the homepage.
                  </span>
                </div>
              </FormField>
            </div>

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
              onClick={() => navigate('/admin/hall-of-fame')}
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

export default AdminHallOfFameEditPage
