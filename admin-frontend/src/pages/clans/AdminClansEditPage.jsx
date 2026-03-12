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
import { getAuthToken } from '../../lib/auth.js'
import {
  Card,
  CardContent,
  CardFooter,
  FormField,
  InlineError,
  Input,
} from '../../components/ui/index.jsx'
import SimpleRichTextEditor from '../../components/richText/SimpleRichTextEditor.jsx'
import PhotoUploadField from '../../components/forms/PhotoUploadField.jsx'
import AdminInlinePreviewLayout from '../../components/preview/AdminInlinePreviewLayout.jsx'
import FormActions from '../../components/ui/form-actions.jsx'
import ClanLeadersManager from './components/ClanLeadersManager.jsx'
import {
  buildClanLeaderReorderPayload,
  getNextLeaderDisplayOrder,
  moveClanLeader,
  normalizeClanLeader,
  reindexClanLeaders,
} from './clanLeaderUtils.js'

function buildLeaderFormData(leader, displayOrder) {
  const formData = new FormData()
  formData.append('type', leader.type)
  formData.append('name', leader.name || '')
  formData.append('title', leader.title || '')
  formData.append('position', leader.position)
  formData.append('display_order', String(displayOrder))
  if (leader.image) {
    formData.append('image', leader.image)
  }
  return formData
}

function AdminClansEditPage() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [initialState, setInitialState] = useState(null)
  const [formState, setFormState] = useState({
    name: '',
    caption: '',
    body: '',
    image: null,
    existingImageUrl: '',
  })
  const [leaders, setLeaders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitAction, setSubmitAction] = useState('publish')
  const [errorMessage, setErrorMessage] = useState('')

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
          caption: clan?.caption || clan?.intro || '',
          body: clan?.body || clan?.history || '',
          image: null,
          existingImageUrl: clan?.image_url || clan?.imageUrl || clan?.image || '',
        }

        setInitialState(nextState)
        setFormState(nextState)
        setLeaders(
          reindexClanLeaders(
            [...currentLeaders, ...pastLeaders].map((leader) =>
              normalizeClanLeader(leader),
            ),
          ),
        )
      } catch (error) {
        setErrorMessage(error.message || 'Unable to load clan.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchClan()
  }, [id, navigate])

  const hasChanges = useMemo(() => {
    if (!initialState) {
      return false
    }

    return (
      formState.name !== initialState.name ||
      formState.caption !== initialState.caption ||
      formState.body !== initialState.body ||
      Boolean(formState.image)
    )
  }, [formState, initialState])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormState((current) => ({ ...current, [name]: value }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null
    setFormState((current) => ({ ...current, image: file }))
  }

  const handleLeaderSubmit = async (leaderForm, editingLeader) => {
    if (editingLeader) {
      const nextDisplayOrder =
        editingLeader.type === leaderForm.type
          ? Number(editingLeader.display_order || 0) ||
            getNextLeaderDisplayOrder(leaders, leaderForm.type, editingLeader.id)
          : getNextLeaderDisplayOrder(leaders, leaderForm.type, editingLeader.id)

      const response = await updateClanLeader(
        id,
        editingLeader.id,
        buildLeaderFormData(leaderForm, nextDisplayOrder),
      )
      const updated = normalizeClanLeader(response?.data ?? response)

      setLeaders((current) =>
        reindexClanLeaders(
          current.map((leader) =>
            leader.id === editingLeader.id
              ? {
                  ...leader,
                  ...updated,
                  type: leaderForm.type,
                  display_order: nextDisplayOrder,
                  error: '',
                }
              : leader,
          ),
        ),
      )
      return
    }

    const nextDisplayOrder = getNextLeaderDisplayOrder(leaders, leaderForm.type)
    const response = await createClanLeader(
      id,
      buildLeaderFormData(leaderForm, nextDisplayOrder),
    )
    const created = normalizeClanLeader(response?.data ?? response)

    setLeaders((current) =>
      reindexClanLeaders([
        ...current,
        {
          ...created,
          type: leaderForm.type,
          display_order: nextDisplayOrder,
          error: '',
        },
      ]),
    )
  }

  const handleDeleteLeader = async (leader) => {
    await deleteClanLeader(id, leader.id)
    setLeaders((current) =>
      reindexClanLeaders(current.filter((entry) => entry.id !== leader.id)),
    )
  }

  const handleMoveLeader = async (leader, direction) => {
    const previousLeaders = leaders
    const nextLeaders = moveClanLeader(previousLeaders, leader.id, direction)

    setLeaders(nextLeaders)

    try {
      await reorderClanLeaders(id, buildClanLeaderReorderPayload(nextLeaders))
    } catch (error) {
      setLeaders(previousLeaders)
      throw error
    }
  }

  const handleSubmit = async (action) => {
    setErrorMessage('')
    setSubmitAction(action)

    if (!hasChanges && action !== 'publish') {
      setErrorMessage('No changes to update.')
      return
    }

    if (!formState.name || !formState.body) {
      setErrorMessage('Name and content are required.')
      return
    }

    const formData = new FormData()
    formData.append('name', formState.name)
    formData.append('intro', formState.caption)
    formData.append('history', formState.body)
    formData.append('published', String(action === 'publish'))
    if (formState.image) {
      formData.append('image', formState.image)
    }

    setIsSubmitting(true)
    try {
      const response = await updateClan(id, formData)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to update clan.')
      }

      window.alert(
        action === 'draft'
          ? 'Clan draft saved successfully'
          : 'Clan published successfully',
      )
      navigate('/admin/clans', { replace: true })
    } catch (error) {
      const message = error.message || 'Unable to update clan.'
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

  const formContent = (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold break-words md:text-2xl">
          Edit Family Clan
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage clan details, leaders, and publishing status.
        </p>
      </header>

      <form>
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

              <div className="grid gap-5 md:grid-cols-2">
                <FormField label="Caption (optional)" htmlFor="caption">
                  <Input
                    id="caption"
                    name="caption"
                    type="text"
                    value={formState.caption}
                    onChange={handleChange}
                  />
                </FormField>

                <FormField label="Content" htmlFor="clan-edit-rich-text" required>
                  <SimpleRichTextEditor
                    value={formState.body}
                    onChange={(nextBody) =>
                      setFormState((current) => ({ ...current, body: nextBody }))
                    }
                    textareaId="clan-edit-rich-text"
                  />
                </FormField>
              </div>

              <FormField label="Replace image (optional)" htmlFor="image">
                <div className="rounded-xl border border-border bg-background/60">
                  <PhotoUploadField
                    label=""
                    value={formState.image?.name || ''}
                    valueType="text"
                    valueId="image"
                    valuePlaceholder="Select image"
                    fileId="image-file"
                    fileName="image"
                    acceptedFileTypes="image/*"
                    onChange={handleFileChange}
                    existingAssetUrl={formState.existingImageUrl}
                  />
                </div>
              </FormField>
            </div>

            <ClanLeadersManager
              leaders={leaders}
              onSubmitLeader={handleLeaderSubmit}
              onDeleteLeader={handleDeleteLeader}
              onMoveLeader={handleMoveLeader}
              description="Create, edit, search, filter, and reorder every current and past leader from one unified table."
              emptyDescription={'Click "Add leader" to create the first clan leadership record.'}
            />
          </CardContent>

          <CardFooter>
            <FormActions
              mode="publish"
              onCancel={() => navigate('/admin/clans')}
              onAction={(action) => {
                void handleSubmit(action)
              }}
              isSubmitting={isSubmitting}
              submitAction={submitAction}
              disableCancel={isSubmitting}
              disableDraft={!hasChanges}
            />
          </CardFooter>
        </Card>
      </form>
    </div>
  )

  return (
    <AdminInlinePreviewLayout
      resource="clans"
      itemId={id}
      query={location.search}
      storageKey="clans-preview-pane-width"
    >
      {formContent}
    </AdminInlinePreviewLayout>
  )
}

export default AdminClansEditPage
