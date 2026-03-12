import { useDeferredValue, useMemo, useState } from 'react'
import {
  Button,
  FormField,
  ImageWithFallback,
  InlineError,
  Input,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '../../../components/ui/index.jsx'
import PhotoUploadField from '../../../components/forms/PhotoUploadField.jsx'
import {
  LEADER_FILTER_OPTIONS,
  LEADER_TYPE_OPTIONS,
  createClanLeaderDraft,
  getClanLeaderImageUrl,
  getClanLeaderTypeLabel,
  sortClanLeaders,
} from '../clanLeaderUtils.js'

function PlusIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function SearchIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function EditIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  )
}

function TrashIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function ChevronUpIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m18 15-6-6-6 6" />
    </svg>
  )
}

function ChevronDownIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

function CloseIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </svg>
  )
}

function createFormState(leader = null) {
  const draft = createClanLeaderDraft(leader || {})

  return {
    type: draft.type,
    name: draft.name,
    title: draft.title,
    position: draft.position,
    image: null,
    existingImageUrl: draft.existingImageUrl,
  }
}

function LeaderTypeBadge({ type }) {
  const isPast = type === 'past'

  return (
    <span
      className={[
        'inline-flex rounded-full px-3 py-1 text-xs font-medium',
        isPast
          ? 'bg-amber-100 text-amber-700'
          : 'bg-emerald-100 text-emerald-700',
      ].join(' ')}
    >
      {getClanLeaderTypeLabel(type)}
    </span>
  )
}

export default function ClanLeadersManager({
  leaders,
  onSubmitLeader,
  onDeleteLeader,
  onMoveLeader,
  title = 'Leaders',
  description = 'Manage current and past clan leaders from one table.',
  addButtonLabel = 'Add leader',
  emptyTitle = 'No leaders added yet',
  emptyDescription = 'Click "Add leader" to create the first clan leadership record.',
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingLeaderId, setEditingLeaderId] = useState(null)
  const [formState, setFormState] = useState(() => createFormState())
  const [formError, setFormError] = useState('')
  const [actionError, setActionError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const deferredSearchQuery = useDeferredValue(searchQuery.trim().toLowerCase())

  const orderedLeaders = useMemo(() => sortClanLeaders(leaders), [leaders])

  const leaderMeta = useMemo(() => {
    const counts = { current: 0, past: 0 }

    return orderedLeaders.reduce((accumulator, leader) => {
      const type = leader.type === 'past' ? 'past' : 'current'
      counts[type] += 1
      accumulator[leader.id] = {
        order: counts[type],
        isFirst: counts[type] === 1,
      }
      return accumulator
    }, {})
  }, [orderedLeaders])

  const filteredLeaders = useMemo(
    () =>
      orderedLeaders.filter((leader) => {
        if (statusFilter !== 'all' && leader.type !== statusFilter) {
          return false
        }

        if (!deferredSearchQuery) {
          return true
        }

        const haystack = [leader.name, leader.title, leader.position]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return haystack.includes(deferredSearchQuery)
      }),
    [deferredSearchQuery, orderedLeaders, statusFilter],
  )

  const lastLeaderIdByType = useMemo(
    () =>
      orderedLeaders.reduce((accumulator, leader) => {
        accumulator[leader.type] = leader.id
        return accumulator
      }, {}),
    [orderedLeaders],
  )

  const currentCount = orderedLeaders.filter((leader) => leader.type === 'current').length
  const pastCount = orderedLeaders.filter((leader) => leader.type === 'past').length
  const hasActiveFilters = Boolean(searchQuery) || statusFilter !== 'all'
  const editingLeader = orderedLeaders.find((leader) => leader.id === editingLeaderId) || null

  const resetForm = () => {
    setEditingLeaderId(null)
    setFormState(createFormState())
    setFormError('')
    setIsFormOpen(false)
  }

  const openCreateForm = () => {
    setActionError('')
    setEditingLeaderId(null)
    setFormState(createFormState())
    setFormError('')
    setIsFormOpen(true)
  }

  const openEditForm = (leader) => {
    setActionError('')
    setEditingLeaderId(leader.id)
    setFormState(createFormState(leader))
    setFormError('')
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    resetForm()
  }

  const handleFieldChange = (field, value) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }))
    setFormError('')
  }

  const handleSubmit = async () => {
    if (!formState.position.trim()) {
      setFormError('Position is required.')
      return
    }

    setIsSubmitting(true)
    setFormError('')
    setActionError('')

    try {
      await onSubmitLeader(
        {
          ...formState,
          name: formState.name.trim(),
          title: formState.title.trim(),
          position: formState.position.trim(),
        },
        editingLeader,
      )
      resetForm()
    } catch (error) {
      setFormError(error?.message || 'Unable to save leader.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (leader) => {
    setActionError('')

    try {
      await onDeleteLeader(leader)
      if (editingLeaderId === leader.id) {
        resetForm()
      }
    } catch (error) {
      setActionError(error?.message || 'Unable to delete leader.')
    }
  }

  const handleMove = async (leader, direction) => {
    setActionError('')

    try {
      await onMoveLeader(leader, direction)
    } catch (error) {
      setActionError(error?.message || 'Unable to reorder leader.')
    }
  }

  return (
    <div className="space-y-6 rounded-lg border border-border bg-background p-4 md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="rounded-full bg-muted px-3 py-1">
              Total: {orderedLeaders.length}
            </span>
            <span className="rounded-full bg-muted px-3 py-1">
              Current: {currentCount}
            </span>
            <span className="rounded-full bg-muted px-3 py-1">Past: {pastCount}</span>
          </div>
        </div>

        <Button type="button" onClick={openCreateForm}>
          <PlusIcon />
          {addButtonLabel}
        </Button>
      </div>

      {isFormOpen ? (
        <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                {editingLeader ? 'Edit leader' : 'Add leader'}
              </h3>
              <p className="text-sm text-muted-foreground">
                Use one form for both current and past leadership records.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCloseForm}
              aria-label="Close leader form"
              title="Close"
            >
              <CloseIcon />
            </Button>
          </div>

          <InlineError message={formError} />

          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Leader status" htmlFor="clan-leader-status" required>
              <Select
                id="clan-leader-status"
                value={formState.type}
                onChange={(event) => handleFieldChange('type', event.target.value)}
              >
                {LEADER_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>

            <FormField label="Name (optional)" htmlFor="clan-leader-name">
              <Input
                id="clan-leader-name"
                type="text"
                value={formState.name}
                onChange={(event) => handleFieldChange('name', event.target.value)}
              />
            </FormField>

            <FormField label="Title (optional)" htmlFor="clan-leader-title">
              <Input
                id="clan-leader-title"
                type="text"
                value={formState.title}
                onChange={(event) => handleFieldChange('title', event.target.value)}
              />
            </FormField>

            <FormField
              label="Position"
              htmlFor="clan-leader-position"
              errorText={formError}
              required
            >
              <Input
                id="clan-leader-position"
                type="text"
                value={formState.position}
                onChange={(event) => handleFieldChange('position', event.target.value)}
                required
              />
            </FormField>
          </div>

          <div className="mt-5">
            <FormField label="Photo (optional)">
              <div className="rounded-xl border border-border bg-background/60">
                <PhotoUploadField
                  label=""
                  value={formState.image?.name || ''}
                  valueType="text"
                  valuePlaceholder="Select image"
                  acceptedFileTypes="image/*"
                  onChange={(event) =>
                    handleFieldChange('image', event.target.files?.[0] || null)
                  }
                  existingAssetUrl={formState.existingImageUrl}
                />
              </div>
            </FormField>
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseForm}
              disabled={isSubmitting}
            >
              Close
            </Button>
            <Button type="button" onClick={handleSubmit} loading={isSubmitting}>
              {editingLeader ? 'Save changes' : 'Save leader'}
            </Button>
          </div>
        </div>
      ) : null}

      <InlineError message={actionError} />

      <div className="rounded-xl border border-border/80 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
              <SearchIcon className="h-4 w-4" />
            </span>
            <Input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search by name, title, or position"
              className="h-11 w-full pl-10"
              aria-label="Search clan leaders"
            />
          </div>

          <div className="flex w-full flex-wrap items-center justify-end gap-2 md:w-auto md:flex-nowrap">
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-40"
              aria-label="Filter leaders by status"
            >
              {LEADER_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('all')
                }}
              >
                Clear filters
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {filteredLeaders.length} {filteredLeaders.length === 1 ? 'leader' : 'leaders'} found
      </p>

      {filteredLeaders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
          <p className="text-base font-medium">
            {orderedLeaders.length === 0 ? emptyTitle : 'No matching leaders'}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {orderedLeaders.length === 0
              ? emptyDescription
              : 'Try a different search term or status filter.'}
          </p>
        </div>
      ) : (
        <Table>
          <TableHead>
            <tr>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Photo</th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Leader</th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Title</th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Position</th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Status</th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Order</th>
              <th className="px-4 py-3 text-right font-medium whitespace-nowrap">Actions</th>
            </tr>
          </TableHead>
          <TableBody>
            {filteredLeaders.map((leader) => {
              const imageUrl = getClanLeaderImageUrl(leader)
              const titleText = leader.name || leader.position || 'Unnamed leader'
              const meta = leaderMeta[leader.id] || {
                order: leader.display_order || '-',
                isFirst: true,
              }
              const isLast = lastLeaderIdByType[leader.type] === leader.id

              return (
                <TableRow key={leader.id}>
                  <TableCell>
                    {imageUrl ? (
                      <ImageWithFallback
                        src={imageUrl}
                        alt={titleText}
                        className="h-12 w-12 rounded-md object-cover"
                      />
                    ) : (
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-border bg-muted text-xs font-semibold text-muted-foreground">
                        {titleText.slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="font-medium text-foreground">
                      {leader.name || 'No name provided'}
                    </div>
                    {leader.error ? (
                      <div className="mt-1 text-xs text-danger">{leader.error}</div>
                    ) : null}
                  </TableCell>
                  <TableCell className="max-w-xs break-words">
                    {leader.title || 'No title'}
                  </TableCell>
                  <TableCell className="max-w-xs break-words">
                    {leader.position || 'No position'}
                  </TableCell>
                  <TableCell>
                    <LeaderTypeBadge type={leader.type} />
                  </TableCell>
                  <TableCell>{meta.order}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditForm(leader)}
                        aria-label={`Edit ${titleText}`}
                        title="Edit"
                      >
                        <EditIcon />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMove(leader, 'up')}
                        disabled={meta.isFirst}
                        aria-label={`Move ${titleText} up`}
                        title="Move up"
                      >
                        <ChevronUpIcon />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleMove(leader, 'down')}
                        disabled={isLast}
                        aria-label={`Move ${titleText} down`}
                        title="Move down"
                      >
                        <ChevronDownIcon />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-danger hover:bg-red-50 hover:text-red-700"
                        onClick={() => handleDelete(leader)}
                        aria-label={`Delete ${titleText}`}
                        title="Delete"
                      >
                        <TrashIcon />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
