import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createClan,
  createClanLeader,
  updateClan,
} from '../../services/api/adminClansApi.js'
import { getAuthToken } from '../../lib/auth.js'
import {
  Card,
  CardContent,
  CardFooter,
  Checkbox,
  FormField,
  InlineError,
  Input,
  Label,
  Textarea,
} from '../../components/ui/index.jsx'
import SimpleRichTextEditor from '../../components/richText/SimpleRichTextEditor.jsx'
import PhotoUploadField from '../../components/forms/PhotoUploadField.jsx'
import FormActions from '../../components/ui/form-actions.jsx'
import { resolveAdminCancelTarget } from '../../lib/adminCancelTarget.js'
import ClanLeadersManager from './components/ClanLeadersManager.jsx'
import {
  createClanLeaderDraft,
  getNextLeaderDisplayOrder,
  moveClanLeader,
  reindexClanLeaders,
} from './clanLeaderUtils.js'

function buildLeaderFormData(leader) {
  const formData = new FormData()
  formData.append('type', leader.type)
  formData.append('name', leader.name || '')
  formData.append('title', leader.title || '')
  formData.append('position', leader.position)
  formData.append('display_order', String(leader.display_order))
  if (leader.image) {
    formData.append('image', leader.image)
  }
  return formData
}

function AdminClansCreatePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const cancelTarget = resolveAdminCancelTarget(location.pathname)
  const [formState, setFormState] = useState({
    name: '',
    caption: '',
    body: '',
    is_featured: false,
    image: null,
  })
  const [leaders, setLeaders] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitAction, setSubmitAction] = useState('publish')
  const [errorMessage, setErrorMessage] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormState((current) => ({ ...current, [name]: value }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null
    setFormState((current) => ({ ...current, image: file }))
  }

  const handleLeaderSubmit = async (leaderForm, editingLeader) => {
    setLeaders((current) => {
      const nextDisplayOrder = editingLeader
        ? editingLeader.type === leaderForm.type
          ? editingLeader.display_order
          : getNextLeaderDisplayOrder(current, leaderForm.type, editingLeader.id)
        : getNextLeaderDisplayOrder(current, leaderForm.type)

      const nextLeader = createClanLeaderDraft({
        ...editingLeader,
        ...leaderForm,
        id: editingLeader?.id,
        display_order: nextDisplayOrder,
        error: '',
      })

      const nextLeaders = editingLeader
        ? current.map((leader) => (leader.id === editingLeader.id ? nextLeader : leader))
        : [...current, nextLeader]

      return reindexClanLeaders(nextLeaders)
    })
  }

  const handleDeleteLeader = async (leader) => {
    setLeaders((current) =>
      reindexClanLeaders(current.filter((entry) => entry.id !== leader.id)),
    )
  }

  const handleMoveLeader = async (leader, direction) => {
    setLeaders((current) => moveClanLeader(current, leader.id, direction))
  }

  const handleSubmit = async (action) => {
    setErrorMessage('')
    setSubmitAction(action)

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

    if (leaders.some((leader) => !leader.position)) {
      setErrorMessage('Please complete the required leader fields before saving.')
      return
    }

    const orderedLeaders = reindexClanLeaders(leaders)
    const formData = new FormData()
    formData.append('name', formState.name)
    formData.append('intro', formState.caption)
    formData.append('history', formState.body)
    formData.append('is_featured', String(Boolean(formState.is_featured)))
    formData.append('published', String(action === 'publish'))
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

      for (const leader of orderedLeaders) {
        try {
          await createClanLeader(clanId, buildLeaderFormData(leader))
        } catch (leaderError) {
          failedLeaders.push({
            id: leader.id,
            error: leaderError.message || 'Unable to save leader.',
          })
        }
      }

      if (failedLeaders.length > 0) {
        const rollbackFormData = new FormData()
        rollbackFormData.append('name', formState.name)
        rollbackFormData.append('intro', formState.caption)
        rollbackFormData.append('history', formState.body)
        rollbackFormData.append('published', 'false')

        try {
          await updateClan(clanId, rollbackFormData)
        } catch {
          // Preserve the original leader failure state if the rollback also fails.
        }

        setLeaders((current) =>
          current.map((leader) => {
            const failedLeader = failedLeaders.find((item) => item.id === leader.id)
            return failedLeader
              ? { ...leader, error: failedLeader.error }
              : { ...leader, error: '' }
          }),
        )

        const message = 'Clan saved but some leaders failed to save.'
        setErrorMessage(message)
        window.alert(message)
        return
      }

      window.alert(
        action === 'draft'
          ? 'Clan draft saved successfully'
          : 'Clan published successfully',
      )
      navigate('/admin/clans', { replace: true })
    } catch (error) {
      const message = error.message || 'Unable to create clan.'
      setErrorMessage(message)
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

              <FormField label="Image (optional)" htmlFor="image">
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

              <div className="space-y-2">
                <Label htmlFor="is_featured">Featured</Label>
                <label
                  htmlFor="is_featured"
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background/60 px-4 py-3"
                >
                  <Checkbox
                    id="is_featured"
                    name="is_featured"
                    checked={Boolean(formState.is_featured)}
                    onCheckedChange={(checked) =>
                      setFormState((current) => ({
                        ...current,
                        is_featured: Boolean(checked),
                      }))
                    }
                    className="mt-0.5"
                  />
                  <span className="space-y-1">
                    <span className="block text-sm font-medium text-foreground">
                      Mark this clan as featured
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      Featured clans can appear in the public Clans visual spotlight.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <ClanLeadersManager
              leaders={leaders}
              onSubmitLeader={handleLeaderSubmit}
              onDeleteLeader={handleDeleteLeader}
              onMoveLeader={handleMoveLeader}
              description="Add both current and past leaders from one form, then review them in one searchable table."
              emptyDescription={'Click "Add leader" to start building the clan leadership table.'}
            />
          </CardContent>

          <CardFooter>
            <FormActions
              mode="publish"
              onCancel={() => navigate(cancelTarget)}
              onAction={(action) => {
                void handleSubmit(action)
              }}
              isSubmitting={isSubmitting}
              submitAction={submitAction}
              disableCancel={isSubmitting}
            />
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default AdminClansCreatePage
