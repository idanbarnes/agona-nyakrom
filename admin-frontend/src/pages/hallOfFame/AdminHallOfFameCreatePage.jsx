import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createHallOfFame,
  uploadHallOfFameInlineImage,
} from '../../services/api/adminHallOfFameApi.js'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'
import HallOfFameForm from './HallOfFameForm.jsx'

function AdminHallOfFameCreatePage() {
  const navigate = useNavigate()
  const [formState, setFormState] = useState({
    name: '',
    title: '',
    body: '',
    published: false,
    image: null,
    existingImageUrl: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleChange = (field, value) => {
    setFormState((current) => ({ ...current, [field]: value }))
  }

  const handleUploadBodyImage = async (file) => {
    const uploaded = await uploadHallOfFameInlineImage(file)
    return uploaded?.data?.image_url || ''
  }

  const handleSubmit = async () => {
    setErrorMessage('')

    if (!getAuthToken()) {
      navigate('/login', { replace: true })
      return
    }

    const formData = new FormData()
    formData.append('name', formState.name.trim())
    formData.append('title', formState.title.trim())
    formData.append('body', formState.body)
    formData.append('published', String(Boolean(formState.published)))
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
        state: { successMessage: 'Hall of Fame entry created successfully.' },
      })
    } catch (error) {
      if (error.status === 401) {
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

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
      errorMessage={errorMessage}
      submitLabel="Create entry"
      onChange={handleChange}
      onCancel={() => navigate('/admin/hall-of-fame')}
      onSubmit={handleSubmit}
      onUploadImage={handleUploadBodyImage}
    />
  )
}

export default AdminHallOfFameCreatePage
