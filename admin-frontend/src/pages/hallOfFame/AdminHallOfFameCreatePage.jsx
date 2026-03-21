import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createHallOfFame,
  uploadHallOfFameInlineImage,
} from '../../services/api/adminHallOfFameApi.js'
import { getAuthToken } from '../../lib/auth.js'
import { resolveAdminCancelTarget } from '../../lib/adminCancelTarget.js'
import HallOfFameForm from './HallOfFameForm.jsx'

function AdminHallOfFameCreatePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const cancelTarget = resolveAdminCancelTarget(location.pathname)
  const [formState, setFormState] = useState({
    name: '',
    title: '',
    body: '',
    is_featured: false,
    image: null,
    existingImageUrl: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitAction, setSubmitAction] = useState('publish')
  const [errorMessage, setErrorMessage] = useState('')

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

    if (!getAuthToken()) {
      navigate('/login', { replace: true })
      return
    }

    const formData = new FormData()
    formData.append('name', formState.name.trim())
    formData.append('title', formState.title.trim())
    formData.append('body', formState.body)
    formData.append('is_featured', String(Boolean(formState.is_featured)))
    formData.append('published', String(action === 'publish'))
    if (formState.image) {
      formData.append('image', formState.image)
    }

    setIsSubmitting(true)
    try {
      const response = await createHallOfFame(formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to create entry.')
      }
      navigate('/admin/hall-of-fame', {
        replace: true,
        state: {
          successMessage:
            action === 'draft'
              ? 'Hall of Fame draft saved.'
              : 'Hall of Fame entry published.',
        },
      })
    } catch (error) {

      setErrorMessage(error.message || 'Unable to create entry.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <HallOfFameForm
      title="Create Hall of Fame Entry"
      description="Add a portrait, name, title, and rich story for this honoree."
      value={formState}
      submitting={isSubmitting}
      submitAction={submitAction}
      errorMessage={errorMessage}
      onChange={handleChange}
      onCancel={() => navigate(cancelTarget)}
      onSubmitAction={handleSubmit}
      onUploadImage={handleUploadBodyImage}
    />
  )
}

export default AdminHallOfFameCreatePage
