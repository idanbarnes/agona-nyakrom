import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  createClan,
  createClanLeader,
  updateClan,
} from '../../services/api/adminClansApi.js'
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
import SimpleRichTextEditor from '../../components/richText/SimpleRichTextEditor.jsx'

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
    caption: '',
    body: '',
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

    if (!formState.body) {
      setErrorMessage('Content is required.')
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
    formData.append('intro', formState.caption)
    formData.append('history', formState.body)
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
        rollbackFormData.append('intro', formState.caption)
        rollbackFormData.append('history', formState.body)
        rollbackFormData.append('published', 'false')
        try {
          await updateClan(clanId, rollbackFormData)
        } catch {
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
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold break-words md:text-2xl">
          Create Family Clan
        </h1>
        <p className="text-sm text-muted-foreground">
          Add clan details, leaders, and publishing preferences.
        </p>
      </header>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-5 md:space-y-6">
            <InlineError message={errorMessage} />
            <div className="space-y-5 rounded-lg border border-border bg-background p-4 md:space-y-6 md:p-5">
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

              <div className="grid gap-5 md:grid-cols-2">
                <FormField label="Caption (optional)" htmlFor="caption">
                  <Textarea
                    id="caption"
                    name="caption"
                    value={formState.caption}
                    onChange={handleChange}
                  />
                </FormField>

                <FormField label="Content" htmlFor="clan-create-rich-text" required>
                  <SimpleRichTextEditor
                    value={formState.body}
                    onChange={(nextBody) =>
                      setFormState((current) => ({ ...current, body: nextBody }))
                    }
                    textareaId="clan-create-rich-text"
                  />
                </FormField>
              </div>
            </div>

            <div className="space-y-6 rounded-lg border border-border bg-background p-4 md:p-5">
              <div>
                <h2 className="text-base font-semibold">Leaders</h2>
                <p className="text-sm text-muted-foreground">
                  Add and organize current and past leadership entries.
                </p>
              </div>

              <div className="space-y-4 rounded-lg border border-border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">Current Leaders</h3>
                    <p className="text-sm text-muted-foreground">
                      Add current leadership details in order of display.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => addLeader('current')}
                  >
                    Add leader
                  </Button>
                </div>
                <div className="space-y-4">
                  {leaders.current.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No current leaders added yet.
                    </p>
                  ) : null}
                  {leaders.current.map((leader, index) => (
                    <div
                      key={leader.id}
                      className="space-y-4 rounded-lg border border-border bg-background p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold">
                          Leader {index + 1}
                        </p>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => removeLeader('current', leader.id)}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid gap-5 md:grid-cols-2">
                        <FormField label="Name (optional)">
                          <Input
                            type="text"
                            value={leader.name}
                            onChange={(event) =>
                              updateLeader('current', leader.id, {
                                name: event.target.value,
                              })
                            }
                          />
                        </FormField>
                        <FormField label="Title (optional)">
                          <Input
                            type="text"
                            value={leader.title}
                            onChange={(event) =>
                              updateLeader('current', leader.id, {
                                title: event.target.value,
                              })
                            }
                          />
                        </FormField>
                      </div>
                      <FormField label="Position" errorText={leader.error} required>
                        <Input
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
                      </FormField>
                      <FormField label="Image (optional)">
                        <div className="rounded-lg border border-border bg-background p-4">
                          <Input
                            type="file"
                            onChange={(event) =>
                              updateLeader('current', leader.id, {
                                image: event.target.files?.[0] || null,
                              })
                            }
                          />
                        </div>
                      </FormField>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 rounded-lg border border-border bg-background p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">Past Leaders</h3>
                    <p className="text-sm text-muted-foreground">
                      Add historical leadership details and images.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => addLeader('past')}
                  >
                    Add leader
                  </Button>
                </div>
                <div className="space-y-4">
                  {leaders.past.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No past leaders added yet.
                    </p>
                  ) : null}
                  {leaders.past.map((leader, index) => (
                    <div
                      key={leader.id}
                      className="space-y-4 rounded-lg border border-border bg-background p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold">
                          Leader {index + 1}
                        </p>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => removeLeader('past', leader.id)}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid gap-5 md:grid-cols-2">
                        <FormField label="Name (optional)">
                          <Input
                            type="text"
                            value={leader.name}
                            onChange={(event) =>
                              updateLeader('past', leader.id, {
                                name: event.target.value,
                              })
                            }
                          />
                        </FormField>
                        <FormField label="Title (optional)">
                          <Input
                            type="text"
                            value={leader.title}
                            onChange={(event) =>
                              updateLeader('past', leader.id, {
                                title: event.target.value,
                              })
                            }
                          />
                        </FormField>
                      </div>
                      <FormField label="Position" errorText={leader.error} required>
                        <Input
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
                      </FormField>
                      <FormField label="Image (optional)">
                        <div className="rounded-lg border border-border bg-background p-4">
                          <Input
                            type="file"
                            onChange={(event) =>
                              updateLeader('past', leader.id, {
                                image: event.target.files?.[0] || null,
                              })
                            }
                          />
                        </div>
                      </FormField>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
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
                  Publish this clan profile immediately.
                </span>
              </div>
            </FormField>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                type="button"
                onClick={() => navigate('/admin/clans')}
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create clan'}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default AdminClansCreatePage
