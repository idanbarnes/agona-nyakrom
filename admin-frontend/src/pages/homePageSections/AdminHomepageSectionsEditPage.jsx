import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getSingleSection,
  updateSection,
} from '../../services/api/adminHomepageSectionsApi.js'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'

function AdminHomepageSectionsEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [initialState, setInitialState] = useState(null)
  const [formState, setFormState] = useState({
    section_key: '',
    title: '',
    content: '',
    display_order: '',
    published: false,
    is_featured: false,
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

    const fetchSection = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const payload = await getSingleSection(id)
        const data = payload?.data ?? payload
        const section = data?.section || data

        const nextState = {
          section_key: section?.section_key || section?.sectionKey || '',
          title: section?.title || '',
          content: section?.content || '',
          display_order: section?.display_order ?? section?.displayOrder ?? '',
          published: Boolean(section?.published),
          is_featured: Boolean(section?.is_featured),
          image: null,
          existingImageUrl:
            section?.image_url || section?.imageUrl || section?.image || '',
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

        setErrorMessage(error.message || 'Unable to load section.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSection()
  }, [id, navigate])

  const hasChanges = useMemo(() => {
    if (!initialState) {
      return false
    }

    return (
      autoDrafted ||
      formState.section_key !== initialState.section_key ||
      formState.title !== initialState.title ||
      formState.content !== initialState.content ||
      String(formState.display_order) !== String(initialState.display_order) ||
      formState.published !== initialState.published ||
      formState.is_featured !== initialState.is_featured ||
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

    if (!formState.section_key.trim()) {
      setErrorMessage('Section key is required.')
      return
    }

    if (
      formState.display_order === '' ||
      Number.isNaN(Number(formState.display_order))
    ) {
      setErrorMessage('Display order is required.')
      return
    }

    const payload = {
      section_key: formState.section_key.trim(),
      title: formState.title.trim(),
      content: formState.content.trim(),
      display_order: Number(formState.display_order),
      published: true,
      is_featured: formState.is_featured,
    }

    const hasFile = Boolean(formState.image)
    const formData = new FormData()

    if (hasFile) {
      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, String(value ?? ''))
      })
      formData.append('image', formState.image)
    }

    setIsSubmitting(true)
    try {
      const response = await updateSection(id, hasFile ? formData : payload)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to update section.')
      }
      setFormState((current) => ({ ...current, published: true }))
      setAutoDrafted(false)
      window.alert('Homepage section edited successfully')
      navigate('/admin/homepage-sections', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to update section.'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <section>
        <h2>Edit Homepage Section</h2>
        <p>Loading...</p>
      </section>
    )
  }

  return (
    <section>
      <h2>Edit Homepage Section</h2>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      <form onSubmit={handleSubmit}>
        <label htmlFor="section_key">Section key</label>
        <input
          id="section_key"
          name="section_key"
          type="text"
          value={formState.section_key}
          onChange={handleChange}
          required
        />

        <label htmlFor="title">Title (optional)</label>
        <input
          id="title"
          name="title"
          type="text"
          value={formState.title}
          onChange={handleChange}
        />

        <label htmlFor="content">Content (optional)</label>
        <textarea
          id="content"
          name="content"
          value={formState.content}
          onChange={handleChange}
        />

        <label htmlFor="display_order">Display order</label>
        <input
          id="display_order"
          name="display_order"
          type="number"
          value={formState.display_order}
          onChange={handleChange}
          required
        />

        <label htmlFor="published">
          <input
            id="published"
            name="published"
            type="checkbox"
            checked={formState.published}
            onChange={handleChange}
            disabled={autoDrafted}
          />
          Published
        </label>

        <label htmlFor="is_featured">
          <input
            id="is_featured"
            name="is_featured"
            type="checkbox"
            checked={formState.is_featured}
            onChange={handleChange}
          />
          Featured
        </label>

        <label htmlFor="image">Replace image (optional)</label>
        <input id="image" name="image" type="file" onChange={handleFileChange} />
        {formState.existingImageUrl ? (
          <p>
            Current image:{' '}
            <a href={formState.existingImageUrl} target="_blank" rel="noreferrer">
              View
            </a>
          </p>
        ) : null}

        <button type="submit" disabled={isSubmitting || !hasChanges}>
          {isSubmitting ? 'Saving...' : 'Save changes'}
        </button>
      </form>
    </section>
  )
}

export default AdminHomepageSectionsEditPage
