import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getSingleSlide,
  updateSlide,
} from '../../services/api/adminCarouselApi.js'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'

function AdminCarouselEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [initialState, setInitialState] = useState(null)
  const [formState, setFormState] = useState({
    title: '',
    subtitle: '',
    caption: '',
    cta_text: '',
    cta_url: '',
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

    const fetchSlide = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const payload = await getSingleSlide(id)
        const data = payload?.data ?? payload
        const slide = data?.slide || data

        const nextState = {
          title: slide?.title || '',
          subtitle: slide?.subtitle || '',
          caption: slide?.caption || '',
          cta_text: slide?.cta_text || slide?.ctaText || '',
          cta_url: slide?.cta_url || slide?.ctaUrl || '',
          display_order: slide?.display_order ?? slide?.displayOrder ?? '',
          published: Boolean(slide?.published),
          image: null,
          existingImageUrl:
            slide?.image_url || slide?.imageUrl || slide?.image || '',
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

        setErrorMessage(error.message || 'Unable to load slide.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSlide()
  }, [id, navigate])

  const hasChanges = useMemo(() => {
    if (!initialState) {
      return false
    }

    return (
      autoDrafted ||
      formState.title !== initialState.title ||
      formState.subtitle !== initialState.subtitle ||
      formState.caption !== initialState.caption ||
      formState.cta_text !== initialState.cta_text ||
      formState.cta_url !== initialState.cta_url ||
      String(formState.display_order) !== String(initialState.display_order) ||
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

    if (
      formState.display_order === '' ||
      Number.isNaN(Number(formState.display_order))
    ) {
      setErrorMessage('Display order is required.')
      return
    }

    const formData = new FormData()
    formData.append('title', formState.title.trim())
    formData.append('subtitle', formState.subtitle.trim())
    formData.append('caption', formState.caption.trim())
    formData.append('cta_text', formState.cta_text.trim())
    formData.append('cta_url', formState.cta_url.trim())
    formData.append('display_order', String(Number(formState.display_order)))
    // Force publish on successful save when leaving auto-draft mode.
    formData.append('published', 'true')
    if (formState.image) {
      formData.append('image', formState.image)
    }

    setIsSubmitting(true)
    try {
      const response = await updateSlide(id, formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to update slide.')
      }
      setFormState((current) => ({ ...current, published: true }))
      setAutoDrafted(false)
      window.alert('Carousel slide edited successfully')
      navigate('/admin/carousel', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to update slide.'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <section>
        <h2>Edit Carousel Slide</h2>
        <p>Loading...</p>
      </section>
    )
  }

  return (
    <section>
      <h2>Edit Carousel Slide</h2>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      <form onSubmit={handleSubmit}>
        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          value={formState.title}
          onChange={handleChange}
        />

        <label htmlFor="subtitle">Subtitle</label>
        <input
          id="subtitle"
          name="subtitle"
          type="text"
          value={formState.subtitle}
          onChange={handleChange}
        />

        <label htmlFor="caption">Caption</label>
        <textarea
          id="caption"
          name="caption"
          value={formState.caption}
          onChange={handleChange}
        />

        <label htmlFor="cta_text">CTA text</label>
        <input
          id="cta_text"
          name="cta_text"
          type="text"
          value={formState.cta_text}
          onChange={handleChange}
        />

        <label htmlFor="cta_url">CTA URL</label>
        <input
          id="cta_url"
          name="cta_url"
          type="text"
          value={formState.cta_url}
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

export default AdminCarouselEditPage
