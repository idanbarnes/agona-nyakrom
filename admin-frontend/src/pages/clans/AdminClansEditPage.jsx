import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  createClanLeader,
  deleteClanLeader,
  getSingleClan,
  reorderClanLeaders,
  updateClan,
  updateClanLeader,
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

// Draft leaders are created inline before persisting to the API.
const createDraftLeader = (type) => ({
  id: `${type}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  type,
  name: '',
  title: '',
  position: '',
  image: null,
  error: '',
})

function AdminClansEditPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [initialState, setInitialState] = useState(null)
  const [formState, setFormState] = useState({
    name: '',
    intro: '',
    history: '',
    key_contributions: '',
    published: false,
    image: null,
    existingImageUrl: '',
  })
  const [leaders, setLeaders] = useState({ current: [], past: [] })
  const [draftLeaders, setDraftLeaders] = useState({ current: [], past: [] })
  const [leaderMessage, setLeaderMessage] = useState(
    location.state?.leaderSaveError || ''
  )
  const [autoDrafted, setAutoDrafted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const hasLeaderErrors = useMemo(() => {
    const allLeaders = [
      ...leaders.current,
      ...leaders.past,
      ...draftLeaders.current,
      ...draftLeaders.past,
    ]
    return allLeaders.some((leader) => leader.error)
  }, [leaders, draftLeaders])

  const handleAuthError = (error) => {
    if (error?.status === 401) {
      clearAuthToken()
      navigate('/login', { replace: true })
      return true
    }
    return false
  }

  const updateLeaderState = (type, leaderId, updates, isDraft = false) => {
    const setter = isDraft ? setDraftLeaders : setLeaders
    setter((current) => ({
      ...current,
      [type]: current[type].map((leader) =>
        leader.id === leaderId ? { ...leader, ...updates } : leader
      ),
    }))
  }

  const addDraftLeader = (type) => {
    setDraftLeaders((current) => ({
      ...current,
      [type]: [...current[type], createDraftLeader(type)],
    }))
  }

  const removeDraftLeader = (type, leaderId) => {
    setDraftLeaders((current) => ({
      ...current,
      [type]: current[type].filter((leader) => leader.id !== leaderId),
    }))
  }

  // Use FormData when an image is present; otherwise JSON is fine.
  const buildLeaderFormData = (leader, displayOrder) => {
    const formData = new FormData()
    if (leader.type) {
      formData.append('type', leader.type)
    }
    if (leader.name) {
      formData.append('name', leader.name)
    }
    if (leader.title) {
      formData.append('title', leader.title)
    }
    if (leader.position !== undefined) {
      formData.append('position', leader.position)
    }
    if (displayOrder !== undefined) {
      formData.append('display_order', String(displayOrder))
    }
    if (leader.image) {
      formData.append('image', leader.image)
    }
    return formData
  }

  // Reorder leaders within a section and persist display_order server-side.
  const handleReorder = async (type, direction, leaderId) => {
    setLeaderMessage('')
    setErrorMessage('')

    const list = leaders[type]
    const index = list.findIndex((leader) => leader.id === leaderId)
    if (index === -1) {
      return
    }

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= list.length) {
      return
    }

    const nextList = [...list]
    const [moved] = nextList.splice(index, 1)
    nextList.splice(targetIndex, 0, moved)

    const previousState = leaders
    setLeaders((current) => ({
      ...current,
      [type]: nextList.map((leader, orderIndex) => ({
        ...leader,
        display_order: orderIndex + 1,
      })),
    }))

    try {
      await reorderClanLeaders(id, {
        current: leaders.current.map((leader) => leader.id),
        past: leaders.past.map((leader) => leader.id),
        [type]: nextList.map((leader) => leader.id),
      })
    } catch (reorderError) {
      if (handleAuthError(reorderError)) {
        return
      }
      setLeaders(previousState)
      setLeaderMessage(
        reorderError.message || 'Unable to reorder clan leaders.'
      )
    }
  }

  const handleSaveLeader = async (type, leader) => {
    setLeaderMessage('')

    if (!leader.position) {
      updateLeaderState(type, leader.id, { error: 'Position is required.' })
      return
    }

    updateLeaderState(type, leader.id, { error: '', isSaving: true })

    try {
      const payload = leader.image
        ? buildLeaderFormData(leader, leader.display_order)
        : {
            type: leader.type,
            name: leader.name || '',
            title: leader.title || '',
            position: leader.position,
            display_order: leader.display_order,
          }
      const response = await updateClanLeader(id, leader.id, payload)
      const updated = response?.data ?? response
      updateLeaderState(type, leader.id, {
        ...updated,
        image: null,
        existingImageUrl:
          updated?.image_url ||
          updated?.imageUrl ||
          updated?.image ||
          updated?.images?.medium ||
          updated?.images?.large ||
          updated?.images?.original ||
          '',
        isSaving: false,
      })
    } catch (leaderError) {
      if (handleAuthError(leaderError)) {
        return
      }
      updateLeaderState(type, leader.id, {
        error: leaderError.message || 'Unable to save leader.',
        isSaving: false,
      })
    }
  }

  const handleDeleteLeader = async (type, leaderId) => {
    setLeaderMessage('')
    setErrorMessage('')

    try {
      await deleteClanLeader(id, leaderId)
      setLeaders((current) => ({
        ...current,
        [type]: current[type].filter((leader) => leader.id !== leaderId),
      }))
    } catch (leaderError) {
      if (handleAuthError(leaderError)) {
        return
      }
      setLeaderMessage(leaderError.message || 'Unable to delete leader.')
    }
  }

  const handleCreateLeader = async (type, leader) => {
    if (!leader.position) {
      updateLeaderState(type, leader.id, { error: 'Position is required.' }, true)
      return
    }

    updateLeaderState(type, leader.id, { error: '', isSaving: true }, true)

    try {
      const response = await createClanLeader(
        id,
        buildLeaderFormData(leader, leaders[type].length + 1)
      )
      const created = response?.data ?? response
      setLeaders((current) => ({
        ...current,
        [type]: [...current[type], created],
      }))
      setDraftLeaders((current) => ({
        ...current,
        [type]: current[type].filter((entry) => entry.id !== leader.id),
      }))
    } catch (leaderError) {
      if (handleAuthError(leaderError)) {
        return
      }
      updateLeaderState(
        type,
        leader.id,
        {
          error: leaderError.message || 'Unable to save leader.',
          isSaving: false,
        },
        true
      )
    }
  }

  useEffect(() => {
    if (!getAuthToken()) {
      navigate('/login', { replace: true })
      return
    }

    const fetchClan = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const payload = await getSingleClan(id)
        const data = payload?.data ?? payload
        const clan = data?.clan || data

        const currentLeaders = data?.leaders?.current || []
        const pastLeaders = data?.leaders?.past || []

        const nextState = {
          name: clan?.name || '',
          intro: clan?.intro || '',
          history: clan?.history || '',
          key_contributions: clan?.key_contributions || '',
          published: Boolean(clan?.published),
          image: null,
          existingImageUrl: clan?.image_url || clan?.imageUrl || clan?.image || '',
        }

        setInitialState(nextState)
        // Auto-draft the UI when entering edit mode.
        setFormState({ ...nextState, published: false })
        setAutoDrafted(true)
        setLeaders({
          current: currentLeaders.map((leader) => ({
            ...leader,
            image: null,
            existingImageUrl:
              leader?.image_url ||
              leader?.imageUrl ||
              leader?.image ||
              leader?.images?.medium ||
              leader?.images?.large ||
              leader?.images?.original ||
              '',
          })),
          past: pastLeaders.map((leader) => ({
            ...leader,
            image: null,
            existingImageUrl:
              leader?.image_url ||
              leader?.imageUrl ||
              leader?.image ||
              leader?.images?.medium ||
              leader?.images?.large ||
              leader?.images?.original ||
              '',
          })),
        })
      } catch (error) {
        if (error.status === 401) {
          // Token expired; force re-authentication.
          clearAuthToken()
          navigate('/login', { replace: true })
          return
        }

        setErrorMessage(error.message || 'Unable to load clan.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchClan()
  }, [id, navigate])

  useEffect(() => {
    if (location.state?.failedLeaders?.length) {
      const failed = location.state.failedLeaders
      setDraftLeaders((current) => ({
        current: [
          ...current.current,
          ...failed.filter((leader) => leader.type === 'current'),
        ],
        past: [
          ...current.past,
          ...failed.filter((leader) => leader.type === 'past'),
        ],
      }))
    }
  }, [location.state])

  const hasChanges = useMemo(() => {
    if (!initialState) {
      return false
    }

    return (
      autoDrafted ||
      formState.name !== initialState.name ||
      formState.intro !== initialState.intro ||
      formState.history !== initialState.history ||
      formState.key_contributions !== initialState.key_contributions ||
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

    if (!formState.name || !formState.intro || !formState.history) {
      setErrorMessage('Name, intro, and history are required.')
      return
    }

    if (leaderMessage || hasLeaderErrors) {
      const message =
        leaderMessage || 'Resolve leader errors before saving the clan.'
      setErrorMessage(message)
      // Keep the user on the edit page to fix the leader errors.
      window.alert(message)
      return
    }

    const formData = new FormData()
    formData.append('name', formState.name)
    formData.append('intro', formState.intro)
    formData.append('history', formState.history)
    if (formState.key_contributions) {
      formData.append('key_contributions', formState.key_contributions)
    }
    // Force publish on successful save when leaving auto-draft mode.
    formData.append('published', 'true')
    if (formState.image) {
      formData.append('image', formState.image)
    }

    setIsSubmitting(true)
    try {
      const response = await updateClan(id, formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to update clan.')
      }
      // Confirm success before redirecting back to the list.
      setFormState((current) => ({ ...current, published: true }))
      setAutoDrafted(false)
      window.alert('Clan edited successfully')
      navigate('/admin/clans', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        // Token expired; force re-authentication.
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to update clan.'
      setErrorMessage(message)
      // Keep the user on the edit page to correct issues.
      window.alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <header className="space-y-1">
          <h1 className="text-xl font-semibold break-words md:text-2xl">
            Edit Family Clan
          </h1>
          <p className="text-sm text-muted-foreground">
            Update clan details and leadership information.
          </p>
        </header>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold break-words md:text-2xl">Edit Family Clan</h1>
        <p className="text-sm text-muted-foreground">
          Manage clan details, leaders, and publishing status.
        </p>
      </header>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-5 md:space-y-6">
            <InlineError message={errorMessage} />
            <InlineError message={leaderMessage} />
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

            <FormField label="Intro" htmlFor="intro" required>
              <Textarea
                id="intro"
                name="intro"
                value={formState.intro}
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField label="History" htmlFor="history" required>
              <Textarea
                id="history"
                name="history"
                value={formState.history}
                onChange={handleChange}
                required
              />
            </FormField>

            <FormField
              label="Key contributions (optional)"
              htmlFor="key_contributions"
            >
              <Textarea
                id="key_contributions"
                name="key_contributions"
                value={formState.key_contributions}
                onChange={handleChange}
              />
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

            <FormField
              label="Replace image (optional)"
              htmlFor="image"
              helpText={
                formState.existingImageUrl ? (
                  <span>
                    Current image:{' '}
                    <a
                      href={formState.existingImageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      View
                    </a>
                  </span>
                ) : null
              }
            >
              <div className="rounded-lg border border-border bg-background p-4">
                <Input
                  id="image"
                  name="image"
                  type="file"
                  onChange={handleFileChange}
                />
              </div>
            </FormField>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">Current Leaders</h2>
                  <p className="text-sm text-muted-foreground">
                    Manage the current leadership order.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => addDraftLeader('current')}
                >
                  Add leader
                </Button>
              </div>
              <div className="space-y-4">
                {leaders.current.map((leader, index) => (
                  <div
                    key={leader.id}
                    className="space-y-4 rounded-lg border border-border bg-background p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold">
                        Leader {index + 1}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSaveLeader('current', leader)}
                          loading={Boolean(leader.isSaving)}
                        >
                          {leader.isSaving ? 'Saving...' : 'Save leader'}
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteLeader('current', leader.id)}
                        >
                          Delete
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReorder('current', 'up', leader.id)}
                          disabled={index === 0}
                        >
                          Move up
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleReorder('current', 'down', leader.id)
                          }
                          disabled={index === leaders.current.length - 1}
                        >
                          Move down
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                      <FormField label="Name (optional)">
                        <Input
                          type="text"
                          value={leader.name || ''}
                          onChange={(event) =>
                            updateLeaderState('current', leader.id, {
                              name: event.target.value,
                            })
                          }
                        />
                      </FormField>
                      <FormField label="Title (optional)">
                        <Input
                          type="text"
                          value={leader.title || ''}
                          onChange={(event) =>
                            updateLeaderState('current', leader.id, {
                              title: event.target.value,
                            })
                          }
                        />
                      </FormField>
                    </div>
                    <FormField label="Position" errorText={leader.error} required>
                      <Input
                        type="text"
                        value={leader.position || ''}
                        onChange={(event) =>
                          updateLeaderState('current', leader.id, {
                            position: event.target.value,
                            error: '',
                          })
                        }
                        required
                      />
                    </FormField>
                    <FormField
                      label="Replace image (optional)"
                      helpText={
                        leader.existingImageUrl ? (
                          <span>
                            Current image:{' '}
                            <a
                              href={leader.existingImageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary underline-offset-4 hover:underline"
                            >
                              View
                            </a>
                          </span>
                        ) : null
                      }
                    >
                      <div className="rounded-lg border border-border bg-background p-4">
                        <Input
                          type="file"
                          onChange={(event) =>
                            updateLeaderState('current', leader.id, {
                              image: event.target.files?.[0] || null,
                            })
                          }
                        />
                      </div>
                    </FormField>
                  </div>
                ))}

                {draftLeaders.current.map((leader, index) => (
                  <div
                    key={leader.id}
                    className="space-y-4 rounded-lg border border-border bg-background p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold">
                        Draft leader {index + 1}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCreateLeader('current', leader)}
                          loading={Boolean(leader.isSaving)}
                        >
                          {leader.isSaving ? 'Saving...' : 'Save leader'}
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => removeDraftLeader('current', leader.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                      <FormField label="Name (optional)">
                        <Input
                          type="text"
                          value={leader.name || ''}
                          onChange={(event) =>
                            updateLeaderState(
                              'current',
                              leader.id,
                              { name: event.target.value },
                              true
                            )
                          }
                        />
                      </FormField>
                      <FormField label="Title (optional)">
                        <Input
                          type="text"
                          value={leader.title || ''}
                          onChange={(event) =>
                            updateLeaderState(
                              'current',
                              leader.id,
                              { title: event.target.value },
                              true
                            )
                          }
                        />
                      </FormField>
                    </div>
                    <FormField label="Position" errorText={leader.error} required>
                      <Input
                        type="text"
                        value={leader.position || ''}
                        onChange={(event) =>
                          updateLeaderState(
                            'current',
                            leader.id,
                            {
                              position: event.target.value,
                              error: '',
                            },
                            true
                          )
                        }
                        required
                      />
                    </FormField>
                    <FormField label="Image (optional)">
                      <div className="rounded-lg border border-border bg-background p-4">
                        <Input
                          type="file"
                          onChange={(event) =>
                            updateLeaderState(
                              'current',
                              leader.id,
                              {
                                image: event.target.files?.[0] || null,
                              },
                              true
                            )
                          }
                        />
                      </div>
                    </FormField>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">Past Leaders</h2>
                  <p className="text-sm text-muted-foreground">
                    Track previous leadership positions and imagery.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => addDraftLeader('past')}
                >
                  Add leader
                </Button>
              </div>
              <div className="space-y-4">
                {leaders.past.map((leader, index) => (
                  <div
                    key={leader.id}
                    className="space-y-4 rounded-lg border border-border bg-background p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold">
                        Leader {index + 1}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleSaveLeader('past', leader)}
                          loading={Boolean(leader.isSaving)}
                        >
                          {leader.isSaving ? 'Saving...' : 'Save leader'}
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteLeader('past', leader.id)}
                        >
                          Delete
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReorder('past', 'up', leader.id)}
                          disabled={index === 0}
                        >
                          Move up
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReorder('past', 'down', leader.id)}
                          disabled={index === leaders.past.length - 1}
                        >
                          Move down
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                      <FormField label="Name (optional)">
                        <Input
                          type="text"
                          value={leader.name || ''}
                          onChange={(event) =>
                            updateLeaderState('past', leader.id, {
                              name: event.target.value,
                            })
                          }
                        />
                      </FormField>
                      <FormField label="Title (optional)">
                        <Input
                          type="text"
                          value={leader.title || ''}
                          onChange={(event) =>
                            updateLeaderState('past', leader.id, {
                              title: event.target.value,
                            })
                          }
                        />
                      </FormField>
                    </div>
                    <FormField label="Position" errorText={leader.error} required>
                      <Input
                        type="text"
                        value={leader.position || ''}
                        onChange={(event) =>
                          updateLeaderState('past', leader.id, {
                            position: event.target.value,
                            error: '',
                          })
                        }
                        required
                      />
                    </FormField>
                    <FormField
                      label="Replace image (optional)"
                      helpText={
                        leader.existingImageUrl ? (
                          <span>
                            Current image:{' '}
                            <a
                              href={leader.existingImageUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary underline-offset-4 hover:underline"
                            >
                              View
                            </a>
                          </span>
                        ) : null
                      }
                    >
                      <div className="rounded-lg border border-border bg-background p-4">
                        <Input
                          type="file"
                          onChange={(event) =>
                            updateLeaderState('past', leader.id, {
                              image: event.target.files?.[0] || null,
                            })
                          }
                        />
                      </div>
                    </FormField>
                  </div>
                ))}

                {draftLeaders.past.map((leader, index) => (
                  <div
                    key={leader.id}
                    className="space-y-4 rounded-lg border border-border bg-background p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-semibold">
                        Draft leader {index + 1}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleCreateLeader('past', leader)}
                          loading={Boolean(leader.isSaving)}
                        >
                          {leader.isSaving ? 'Saving...' : 'Save leader'}
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => removeDraftLeader('past', leader.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                    <div className="grid gap-5 md:grid-cols-2">
                      <FormField label="Name (optional)">
                        <Input
                          type="text"
                          value={leader.name || ''}
                          onChange={(event) =>
                            updateLeaderState(
                              'past',
                              leader.id,
                              { name: event.target.value },
                              true
                            )
                          }
                        />
                      </FormField>
                      <FormField label="Title (optional)">
                        <Input
                          type="text"
                          value={leader.title || ''}
                          onChange={(event) =>
                            updateLeaderState(
                              'past',
                              leader.id,
                              { title: event.target.value },
                              true
                            )
                          }
                        />
                      </FormField>
                    </div>
                    <FormField label="Position" errorText={leader.error} required>
                      <Input
                        type="text"
                        value={leader.position || ''}
                        onChange={(event) =>
                          updateLeaderState(
                            'past',
                            leader.id,
                            {
                              position: event.target.value,
                              error: '',
                            },
                            true
                          )
                        }
                        required
                      />
                    </FormField>
                    <FormField label="Image (optional)">
                      <div className="rounded-lg border border-border bg-background p-4">
                        <Input
                          type="file"
                          onChange={(event) =>
                            updateLeaderState(
                              'past',
                              leader.id,
                              {
                                image: event.target.files?.[0] || null,
                              },
                              true
                            )
                          }
                        />
                      </div>
                    </FormField>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="secondary"
              type="button"
              onClick={() => navigate('/admin/clans')}
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

export default AdminClansEditPage
