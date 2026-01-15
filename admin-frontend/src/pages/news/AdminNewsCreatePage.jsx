import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createNews } from '../../services/api/adminNewsApi.js'
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

function AdminNewsCreatePage() {
  const navigate = useNavigate()
  const [formState, setFormState] = useState({
    title: '',
    summary: '',
    content: '',
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

    if (!formState.title || !formState.summary || !formState.content) {
      setErrorMessage('Title, summary, and content are required.')
      return
    }

    const formData = new FormData()
    formData.append('title', formState.title)
    formData.append('summary', formState.summary)
    formData.append('content', formState.content)
    formData.append('published', String(formState.published))
    if (formState.image) {
      formData.append('image', formState.image)
    }

    setIsSubmitting(true)
    try {
      const response = await createNews(formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to create news.')
      }
      window.alert('News created successfully')
      navigate('/admin/news', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to create news.'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold md:text-2xl">Create News</h1>
        <p className="text-sm text-muted-foreground">
          Share the latest updates with a title, summary, and content.
        </p>
      </header>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-5 md:space-y-6">
            <InlineError message={errorMessage} />
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

            <FormField label="Summary" htmlFor="summary" required>
              <Textarea
                id="summary"
                name="summary"
                value={formState.summary}
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField label="Content" htmlFor="content" required>
              <Textarea
                id="content"
                name="content"
                value={formState.content}
                onChange={handleChange}
                required
              />
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
                  Make this news item visible on the site.
                </span>
              </div>
            </FormField>
          </CardContent>
          <CardFooter>
            <Button
              variant="secondary"
              type="button"
              onClick={() => navigate('/admin/news')}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create news'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default AdminNewsCreatePage
