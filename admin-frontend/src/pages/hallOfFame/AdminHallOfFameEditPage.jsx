import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  getSingleHallOfFame,
  updateHallOfFame,
  uploadHallOfFameInlineImage,
} from '../../services/api/adminHallOfFameApi.js'
import { getAuthToken } from '../../lib/auth.js'
import HallOfFameForm from './HallOfFameForm.jsx'
import AdminInlinePreviewLayout from '../../components/preview/AdminInlinePreviewLayout.jsx'

function AdminHallOfFameEditPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [initialState, setInitialState] = useState(null)
  const [formState, setFormState] = useState({
    id: '',
    name: '',
    title: '',
    body: '',
    published: false,
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

    const fetchEntry = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const payload = await getSingleHallOfFame(id)
        const data = payload?.data ?? payload
        const entry = data?.entry || data
        const normalizedBody =
          entry?.body || entry?.bio || entry?.description || entry?.content || ''

        const nextState = {
          id: entry?.id || id,
          name: entry?.name || entry?.full_name || '',
          title: entry?.title || entry?.position || entry?.role || '',
          body: normalizedBody,
          published:
            typeof entry?.published === 'boolean'
              ? entry.published
              : Boolean(entry?.isPublished),
          image: null,
          existingImageUrl:
            entry?.imageUrl ||
            entry?.images?.medium ||
            entry?.images?.large ||
            entry?.images?.original ||
            entry?.image_url ||
            entry?.image ||
            '',
        }

        setInitialState(nextState)
        setFormState(nextState)
      } catch (error) {

        setErrorMessage(error.message || 'Unable to load entry.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchEntry()
  }, [id, navigate])

  const hasChanges = useMemo(() => {
    if (!initialState) return false
    return (
      formState.name !== initialState.name ||
      formState.title !== initialState.title ||
      formState.body !== initialState.body ||
      Boolean(formState.image)
    )
  }, [formState, initialState])

  const handleChange = (field, value) => {
    setFormState((current) => ({ ...current, [field]: value }))
  }

  const handleUploadBodyImage = async (file) => {
    const uploaded = await uploadHallOfFameInlineImage(file)
    return uploaded?.data?.image_url || ''
  }

  const handleSubmit = async (action) => {
    setErrorMessage('')
    setSubmitAction(action)

    const allowPublishWithoutFieldChanges = action === 'publish'

    if (!hasChanges && !allowPublishWithoutFieldChanges) {
      setErrorMessage('No changes to update.')
      return
    }

    const formData = new FormData()
    formData.append('name', formState.name.trim())
    formData.append('title', formState.title.trim())
    formData.append('body', formState.body)
    formData.append('published', String(action === 'publish'))
    if (formState.image) {
      formData.append('image', formState.image)
    }

    setIsSubmitting(true)
    try {
      const response = await updateHallOfFame(id, formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to update entry.')
      }
      navigate('/admin/hall-of-fame', {
        replace: true,
        state: {
          successMessage:
            action === 'draft'
              ? 'Hall of Fame draft saved.'
              : 'Hall of Fame entry updated and published.',
        },
      })
    } catch (error) {

      setErrorMessage(error.message || 'Unable to update entry.')
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
            Update portrait, profile details, and publication status.
          </p>
        </header>
        <p>Loading...</p>
      </div>
    )
  }

  const formContent = (
    <HallOfFameForm
      title="Edit Hall of Fame Entry"
      description="Refine this entry and publish when ready."
      value={formState}
      submitting={isSubmitting}
      submitAction={submitAction}
      errorMessage={errorMessage}
      disableDraft={!hasChanges}
      onChange={handleChange}
      onCancel={() => navigate('/admin/hall-of-fame')}
      onSubmitAction={handleSubmit}
      onUploadImage={handleUploadBodyImage}
    />
  )

  return (
    <AdminInlinePreviewLayout
      resource="hall-of-fame"
      itemId={id}
      query={location.search}
      storageKey="hall-of-fame-preview-pane-width">
      {formContent}
    </AdminInlinePreviewLayout>
  )
}

export default AdminHallOfFameEditPage
