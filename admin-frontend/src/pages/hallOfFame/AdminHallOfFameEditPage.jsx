import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  getSingleHallOfFame,
  updateHallOfFame,
} from '../../services/api/adminHallOfFameApi.js'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'

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
      <section>
        <h2>Edit Hall of Fame Entry</h2>
        <p>Loading...</p>
      </section>
    )
  }

  return (
    <section>
      <h2>Edit Hall of Fame Entry</h2>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          value={formState.name}
          onChange={handleChange}
          required
        />

        <label htmlFor="title">Title</label>
        <input
          id="title"
          name="title"
          type="text"
          value={formState.title}
          onChange={handleChange}
          required
        />

        <label htmlFor="bio">Bio</label>
        <textarea
          id="bio"
          name="bio"
          value={formState.bio}
          onChange={handleChange}
          required
        />

        <label htmlFor="achievements">Achievements (optional)</label>
        <textarea
          id="achievements"
          name="achievements"
          value={formState.achievements}
          onChange={handleChange}
        />

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

        <label htmlFor="display_order">Display order (optional)</label>
        <input
          id="display_order"
          name="display_order"
          type="number"
          value={formState.display_order}
          onChange={handleChange}
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

export default AdminHallOfFameEditPage
