import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createClan,
  createClanLeader,
  updateClan,
} from '../../services/api/adminClansApi.js'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'

// Local-only leader draft for inline creation.
const createEmptyLeader = (type) => ({
  id: `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  type,
  name: '',
  title: '',
  position: '',
  image: null,
  error: '',
})

function AdminClansCreatePage() {
  const navigate = useNavigate()
  const [formState, setFormState] = useState({
    name: '',
    intro: '',
    history: '',
    key_contributions: '',
    published: false,
    image: null,
  })
  const [leaders, setLeaders] = useState({
    current: [],
    past: [],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const updateLeader = (type, leaderId, updates) => {
    setLeaders((current) => ({
      ...current,
      [type]: current[type].map((leader) =>
        leader.id === leaderId ? { ...leader, ...updates } : leader
      ),
    }))
  }

  const addLeader = (type) => {
    setLeaders((current) => ({
      ...current,
      [type]: [...current[type], createEmptyLeader(type)],
    }))
  }

  const removeLeader = (type, leaderId) => {
    setLeaders((current) => ({
      ...current,
      [type]: current[type].filter((leader) => leader.id !== leaderId),
    }))
  }

  // Build leader payload with optional image for multipart submission.
  const buildLeaderFormData = (leader, displayOrder) => {
    const formData = new FormData()
    formData.append('type', leader.type)
    if (leader.name) {
      formData.append('name', leader.name)
    }
    if (leader.title) {
      formData.append('title', leader.title)
    }
    formData.append('position', leader.position)
    formData.append('display_order', String(displayOrder))
    if (leader.image) {
      formData.append('image', leader.image)
    }
    return formData
  }

  const validateLeaders = (type) => {
    let isValid = true
    setLeaders((current) => ({
      ...current,
      [type]: current[type].map((leader) => {
        const nextError = leader.position ? '' : 'Position is required.'
        if (nextError) {
          isValid = false
        }
        return { ...leader, error: nextError }
      }),
    }))
    return isValid
  }

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

    if (!formState.intro || !formState.history) {
      setErrorMessage('Intro and history are required.')
      return
    }

    const currentValid = validateLeaders('current')
    const pastValid = validateLeaders('past')
    if (!currentValid || !pastValid) {
      setErrorMessage('Please fill required leader fields before saving.')
      return
    }

    const formData = new FormData()
    formData.append('name', formState.name)
    formData.append('intro', formState.intro)
    formData.append('history', formState.history)
    if (formState.key_contributions) {
      formData.append('key_contributions', formState.key_contributions)
    }
    formData.append('published', String(formState.published))
    if (formState.image) {
      formData.append('image', formState.image)
    }

    setIsSubmitting(true)
    try {
      const response = await createClan(formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to create clan.')
      }
      const created = response?.data ?? response
      const clanId = created?.id

      if (!clanId) {
        throw new Error('Clan created without an id.')
      }

      const failedLeaders = []

      // Create current leaders first, then past leaders to keep ordering deterministic.
      for (let index = 0; index < leaders.current.length; index += 1) {
        const leader = leaders.current[index]
        try {
          await createClanLeader(clanId, buildLeaderFormData(leader, index + 1))
        } catch (leaderError) {
          failedLeaders.push({ ...leader, error: leaderError.message })
        }
      }

      for (let index = 0; index < leaders.past.length; index += 1) {
        const leader = leaders.past[index]
        try {
          await createClanLeader(clanId, buildLeaderFormData(leader, index + 1))
        } catch (leaderError) {
          failedLeaders.push({ ...leader, error: leaderError.message })
        }
      }

      if (failedLeaders.length > 0) {
        // Keep the clan unpublished if any leader upload fails.
        const rollbackFormData = new FormData()
        rollbackFormData.append('name', formState.name)
        rollbackFormData.append('intro', formState.intro)
        rollbackFormData.append('history', formState.history)
        if (formState.key_contributions) {
          rollbackFormData.append('key_contributions', formState.key_contributions)
        }
        rollbackFormData.append('published', 'false')
        try {
          await updateClan(clanId, rollbackFormData)
        } catch (rollbackError) {
          // If rollback fails, surface the original leader errors.
        }

        setLeaders((current) => ({
          current: current.current.map((leader) => {
            const failed = failedLeaders.find((item) => item.id === leader.id)
            return failed ? { ...leader, error: failed.error } : leader
          }),
          past: current.past.map((leader) => {
            const failed = failedLeaders.find((item) => item.id === leader.id)
            return failed ? { ...leader, error: failed.error } : leader
          }),
        }))

        const message = 'Clan saved but some leaders failed to save.'
        setErrorMessage(message)
        // Keep the user on the create page to correct the leader errors.
        window.alert(message)
        return
      }

      // Confirm success before redirecting back to the list.
      window.alert('Family clan created successfully')
      navigate('/admin/clans', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to create clan.'
      setErrorMessage(message)
      // Keep the user on the form to fix the issue.
      window.alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section>
      <h2>Create Family Clan</h2>
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

        <label htmlFor="intro">Intro</label>
        <textarea
          id="intro"
          name="intro"
          value={formState.intro}
          onChange={handleChange}
          required
        />

        <label htmlFor="history">History</label>
        <textarea
          id="history"
          name="history"
          value={formState.history}
          onChange={handleChange}
          required
        />

        <label htmlFor="key_contributions">Key contributions (optional)</label>
        <textarea
          id="key_contributions"
          name="key_contributions"
          value={formState.key_contributions}
          onChange={handleChange}
        />

        <label htmlFor="published">
          <input
            id="published"
            name="published"
            type="checkbox"
            checked={formState.published}
            onChange={handleChange}
          />
          Published
        </label>

        <label htmlFor="image">Image (optional)</label>
        <input id="image" name="image" type="file" onChange={handleFileChange} />

        <section>
          <h3>Current Leaders</h3>
          <button type="button" onClick={() => addLeader('current')}>
            Add leader
          </button>
          {leaders.current.map((leader) => (
            <div key={leader.id}>
              <label>Name (optional)</label>
              <input
                type="text"
                value={leader.name}
                onChange={(event) =>
                  updateLeader('current', leader.id, {
                    name: event.target.value,
                  })
                }
              />
              <label>Title (optional)</label>
              <input
                type="text"
                value={leader.title}
                onChange={(event) =>
                  updateLeader('current', leader.id, {
                    title: event.target.value,
                  })
                }
              />
              <label>Position</label>
              <input
                type="text"
                value={leader.position}
                onChange={(event) =>
                  updateLeader('current', leader.id, {
                    position: event.target.value,
                    error: '',
                  })
                }
                required
              />
              {leader.error ? <p role="alert">{leader.error}</p> : null}
              <label>Image (optional)</label>
              <input
                type="file"
                onChange={(event) =>
                  updateLeader('current', leader.id, {
                    image: event.target.files?.[0] || null,
                  })
                }
              />
              <button
                type="button"
                onClick={() => removeLeader('current', leader.id)}
              >
                Remove
              </button>
            </div>
          ))}
        </section>

        <section>
          <h3>Past Leaders</h3>
          <button type="button" onClick={() => addLeader('past')}>
            Add leader
          </button>
          {leaders.past.map((leader) => (
            <div key={leader.id}>
              <label>Name (optional)</label>
              <input
                type="text"
                value={leader.name}
                onChange={(event) =>
                  updateLeader('past', leader.id, {
                    name: event.target.value,
                  })
                }
              />
              <label>Title (optional)</label>
              <input
                type="text"
                value={leader.title}
                onChange={(event) =>
                  updateLeader('past', leader.id, {
                    title: event.target.value,
                  })
                }
              />
              <label>Position</label>
              <input
                type="text"
                value={leader.position}
                onChange={(event) =>
                  updateLeader('past', leader.id, {
                    position: event.target.value,
                    error: '',
                  })
                }
                required
              />
              {leader.error ? <p role="alert">{leader.error}</p> : null}
              <label>Image (optional)</label>
              <input
                type="file"
                onChange={(event) =>
                  updateLeader('past', leader.id, {
                    image: event.target.files?.[0] || null,
                  })
                }
              />
              <button type="button" onClick={() => removeLeader('past', leader.id)}>
                Remove
              </button>
            </div>
          ))}
        </section>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create clan'}
        </button>
      </form>
    </section>
  )
}

export default AdminClansCreatePage
