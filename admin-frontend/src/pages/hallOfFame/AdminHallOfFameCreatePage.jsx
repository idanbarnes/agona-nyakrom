import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createHallOfFame } from '../../services/api/adminHallOfFameApi.js'
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

function AdminHallOfFameCreatePage() {
  const navigate = useNavigate()
  const [formState, setFormState] = useState({
    name: '',
    title: '',
    bio: '',
    achievements: '',
    is_featured: false,
    display_order: '',
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

    if (!formState.name) {
      setErrorMessage('Name is required.')
      return
    }

    if (!formState.title || !formState.bio) {
      setErrorMessage('Title and bio are required.')
      return
    }

    const formData = new FormData()
    formData.append('name', formState.name)
    formData.append('title', formState.title)
    formData.append('bio', formState.bio)
    if (formState.achievements) {
      formData.append('achievements', formState.achievements)
    }
    if (formState.display_order) {
      formData.append('display_order', String(formState.display_order))
    }
    formData.append('is_featured', String(formState.is_featured))
    formData.append('published', String(formState.published))
    if (formState.image) {
      formData.append('image', formState.image)
    }

    setIsSubmitting(true)
    try {
      const response = await createHallOfFame(formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to create entry.')
      }
      window.alert('Hall of Fame entry created successfully')
      navigate('/admin/hall-of-fame', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to create entry.'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold md:text-2xl">
          Create Hall of Fame Entry
        </h1>
        <p className="text-sm text-muted-foreground">
          Celebrate distinguished community members with a featured profile.
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
                  className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <span className="text-sm text-muted-foreground">
                  Publish this Hall of Fame entry immediately.
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
              onClick={() => navigate('/admin/hall-of-fame')}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create entry'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default AdminHallOfFameCreatePage
