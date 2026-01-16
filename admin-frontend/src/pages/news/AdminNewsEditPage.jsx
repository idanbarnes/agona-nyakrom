import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSingleNews, updateNews } from '../../services/api/adminNewsApi.js'
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

function AdminNewsEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [initialState, setInitialState] = useState(null)
  const [formState, setFormState] = useState({
    title: '',
    summary: '',
    content: '',
    published: false,
    image: null,
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

    const fetchNews = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const payload = await getSingleNews(id)
        const data = payload?.data ?? payload
        const newsItem = data?.news || data

        const nextState = {
          title: newsItem?.title || '',
          summary: newsItem?.summary || '',
          content: newsItem?.content || '',
          published: Boolean(newsItem?.published),
          image: null,
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

        setErrorMessage(error.message || 'Unable to load news item.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchNews()
  }, [id, navigate])

  const hasChanges = useMemo(() => {
    if (!initialState) {
      return false
    }

    return (
      autoDrafted ||
      formState.title !== initialState.title ||
      formState.summary !== initialState.summary ||
      formState.content !== initialState.content ||
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

    if (!formState.title || !formState.summary || !formState.content) {
      setErrorMessage('Title, summary, and content are required.')
      return
    }

    const formData = new FormData()
    formData.append('title', formState.title)
    formData.append('summary', formState.summary)
    formData.append('content', formState.content)
    // Force publish on successful save when leaving auto-draft mode.
    formData.append('published', 'true')
    if (formState.image) {
      formData.append('image', formState.image)
    }

    setIsSubmitting(true)
    try {
      const response = await updateNews(id, formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to update news.')
      }
      setFormState((current) => ({ ...current, published: true }))
      setAutoDrafted(false)
      window.alert('News edited successfully')
      navigate('/admin/news', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to update news.'
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
          <h1 className="text-xl font-semibold break-words md:text-2xl">Edit News</h1>
          <p className="text-sm text-muted-foreground">
            Update the news content and republish when ready.
          </p>
        </header>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold break-words md:text-2xl">Edit News</h1>
        <p className="text-sm text-muted-foreground">
          Review the changes before publishing the updated news item.
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

            <FormField label="Replace image (optional)" htmlFor="image">
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
                  disabled={autoDrafted}
                  className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <span className="text-sm text-muted-foreground">
                  Publishing is enabled after saving changes.
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

export default AdminNewsEditPage
