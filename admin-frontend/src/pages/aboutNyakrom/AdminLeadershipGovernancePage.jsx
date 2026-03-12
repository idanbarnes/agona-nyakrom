import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createLeader,
  deleteLeader,
  listLeaders,
  toggleLeaderPublish,
  updateLeader,
  uploadLeaderInlineImage,
} from '../../services/api/adminAboutNyakromApi.js'
import {
  Button,
  ConfirmDialog,
  Input,
  Select,
  ToastMessage,
} from '../../components/ui/index.jsx'
import PhotoUploadField from '../../components/forms/PhotoUploadField.jsx'
import SimpleRichTextEditor from '../../components/richText/SimpleRichTextEditor.jsx'
import FormActions from '../../components/ui/form-actions.jsx'
import AdminInlinePreviewLayout from '../../components/preview/AdminInlinePreviewLayout.jsx'
import { buildApiUrl } from '../../lib/apiClient.js'

const initial = {
  category: 'traditional',
  display_order: '',
  published: false,
  role_title: '',
  name: '',
  body: '',
  slug: '',
  photo: null,
}

const FILTER_STORAGE_KEY = 'admin-leadership-filters'
const DEFAULT_CATEGORY = 'traditional'
const ALLOWED_CATEGORIES = ['traditional', 'community_admin']
const statusFilterOptions = [
  { value: 'all', label: 'All Statuses' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
]

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

function EyeIcon({ className = 'h-4 w-4' }) {
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
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
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

function EyeOffIcon({ className = 'h-4 w-4' }) {
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
      <path d="M17.94 17.94A10.87 10.87 0 0 1 12 20c-7 0-11-8-11-8a21.77 21.77 0 0 1 5.06-6.94" />
      <path d="M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.8 21.8 0 0 1-3.17 4.51" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function PersonIcon({ className = 'h-5 w-5' }) {
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
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-GB')
}

function resolveAssetUrl(path) {
  if (!path) {
    return ''
  }

  if (/^https?:\/\//i.test(path)) {
    return path
  }

  return buildApiUrl(path.startsWith('/') ? path : `/${path}`)
}

function getThumbnailUrl(item) {
  const rawPath =
    item.photo ||
    item.photo_url ||
    item.photoUrl ||
    item.image_url ||
    item.imageUrl ||
    item.image ||
    item.thumbnail ||
    item.images?.medium ||
    item.images?.large ||
    item.images?.original ||
    item.images?.thumbnail ||
    ''

  return resolveAssetUrl(rawPath)
}

function getCategoryFromSearch(search) {
  const params = new URLSearchParams(search)
  const value = params.get('category')
  return ALLOWED_CATEGORIES.includes(value) ? value : ''
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function hasHtmlMarkup(value = '') {
  return /<[^>]+>/.test(String(value || ''))
}

function toRichTextHtml(value = '') {
  const text = String(value || '').trim()
  if (!text) {
    return ''
  }

  if (hasHtmlMarkup(text)) {
    return text
  }

  return text
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('\n')
}

function buildLeaderBody(item = {}) {
  const fullBio = String(item?.full_bio || '').trim()
  if (fullBio) {
    return toRichTextHtml(fullBio)
  }

  const shortBio = String(item?.short_bio_snippet || '').trim()
  return shortBio ? toRichTextHtml(shortBio) : ''
}

function buildLeaderForm(item, category) {
  return {
    ...initial,
    category: item?.category || category,
    display_order: item?.display_order ?? '',
    published: Boolean(item?.published),
    role_title: item?.role_title || '',
    name: item?.name || '',
    body: buildLeaderBody(item),
    slug: item?.slug || '',
    photo: null,
    photo_url:
      item?.photo_url ||
      item?.photoUrl ||
      item?.photo ||
      item?.image_url ||
      item?.imageUrl ||
      item?.image ||
      item?.images?.medium ||
      item?.images?.large ||
      item?.images?.original ||
      '',
  }
}

export default function AdminLeadershipGovernancePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const [category, setCategory] = useState(
    () => getCategoryFromSearch(location.search) || DEFAULT_CATEGORY,
  )
  const [leaders, setLeaders] = useState([])
  const [form, setForm] = useState(initial)
  const [editingId, setEditingId] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isFormSubmitting, setIsFormSubmitting] = useState(false)
  const [submitAction, setSubmitAction] = useState('publish')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    try {
      const savedFilters = JSON.parse(localStorage.getItem(FILTER_STORAGE_KEY) || '{}')
      if (savedFilters.searchTerm) {
        setSearchInput(savedFilters.searchTerm)
        setSearchTerm(savedFilters.searchTerm)
      }
      if (savedFilters.statusFilter) setStatusFilter(savedFilters.statusFilter)
    } catch {
      // Ignore invalid persisted filters and continue.
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setSearchTerm(searchInput.trim()), 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    localStorage.setItem(
      FILTER_STORAGE_KEY,
      JSON.stringify({ searchTerm, statusFilter }),
    )
  }, [searchTerm, statusFilter])

  useEffect(() => {
    const categoryFromQuery = getCategoryFromSearch(location.search)
    if (categoryFromQuery && categoryFromQuery !== category) {
      setCategory(categoryFromQuery)
      return
    }

    if (!categoryFromQuery) {
      const params = new URLSearchParams(location.search)
      params.set('category', category)
      navigate(
        {
          pathname: location.pathname,
          search: `?${params.toString()}`,
        },
        { replace: true },
      )
    }
  }, [category, location.pathname, location.search, navigate])

  const load = async () => {
    setIsLoading(true)
    setErrorMessage('')
    try {
      const res = await listLeaders(category)
      setLeaders(res.data || [])
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to load leaders.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setForm((current) => ({ ...current, category }))
    load()
  }, [category])

  const uploadBodyImage = async (file) => {
    const uploaded = await uploadLeaderInlineImage(file)
    return uploaded?.data?.image_url || ''
  }

  const handleSubmit = async (action) => {
    if (isFormSubmitting) {
      return
    }
    setErrorMessage('')
    setSuccessMessage('')
    setSubmitAction(action)
    setIsFormSubmitting(true)

    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (
          k !== 'photo' &&
          k !== 'published' &&
          k !== 'photo_url' &&
          v !== undefined
        ) {
          fd.append(k, v)
        }
      })
      fd.append('published', String(action === 'publish'))

      if (form.photo) fd.append('photo', form.photo)

      if (editingId) {
        await updateLeader(editingId, fd)
        setSuccessMessage(
          action === 'draft'
            ? 'Leader draft saved successfully.'
            : 'Leader published successfully.',
        )
      } else {
        await createLeader(fd)
        setSuccessMessage(
          action === 'draft'
            ? 'Leader draft saved successfully.'
            : 'Leader published successfully.',
        )
      }

      setForm({ ...initial, category })
      setEditingId('')
      setIsFormOpen(false)
      load()
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to save leader.')
    } finally {
      setIsFormSubmitting(false)
    }
  }

  const startEdit = (item) => {
    const rowId = item.id || item._id || ''
    setEditingId(rowId)
    setForm(buildLeaderForm(item, category))
    setIsFormOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget?.id) return
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await deleteLeader(deleteTarget.id)
      setSuccessMessage('Leader deleted successfully.')
      setDeleteTarget(null)
      load()
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to delete leader.')
    }
  }

  const handleUnpublish = async (item) => {
    const rowId = item.id || item._id
    if (!rowId || !item.published) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')

    try {
      await toggleLeaderPublish(rowId, false)
      setSuccessMessage('Leader unpublished successfully.')
      load()
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to unpublish leader.')
    }
  }

  const handleViewPreview = (leaderId) => {
    if (!leaderId) {
      return
    }

    const params = new URLSearchParams(location.search)
    params.set('preview', '1')
    params.set('leaderId', String(leaderId))
    params.set('category', category)
    navigate({
      pathname: location.pathname,
      search: `?${params.toString()}`,
    })
  }

  const handleCategoryChange = (nextCategory) => {
    if (!ALLOWED_CATEGORIES.includes(nextCategory)) {
      return
    }

    const params = new URLSearchParams(location.search)
    params.set('category', nextCategory)
    navigate(
      {
        pathname: location.pathname,
        search: `?${params.toString()}`,
      },
      { replace: true },
    )
  }

  const previewLeaderId = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('leaderId') || ''
  }, [location.search])

  const filteredLeaders = useMemo(() => {
    return leaders.filter((item) => {
      const title = (item.name || item.role_title || '').toLowerCase()
      const statusMatches =
        statusFilter === 'all' ||
        (statusFilter === 'published' && item.published) ||
        (statusFilter === 'draft' && !item.published)

      const searchMatches = !searchTerm || title.includes(searchTerm.toLowerCase())
      return statusMatches && searchMatches
    })
  }, [leaders, searchTerm, statusFilter])

  const resetFilters = () => {
    setSearchInput('')
    setSearchTerm('')
    setStatusFilter('all')
  }

  const openCreateForm = () => {
    setEditingId('')
    setForm({ ...initial, category })
    setIsFormOpen(true)
  }

  const iconButtonClassName =
    'inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
  const neutralIconButtonClassName = `${iconButtonClassName} text-slate-600 hover:bg-accent hover:text-slate-900`
  const bodyEditorId = `leader-body-${editingId || 'new'}`

  const pageContent = (
    <section className="mx-auto max-w-6xl space-y-6 pb-8 md:space-y-8">
      <header className="rounded-2xl border border-border/80 bg-gradient-to-r from-white via-slate-50 to-blue-50/40 p-5 shadow-sm transition-shadow duration-200 hover:shadow-md sm:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
              Leadership & Governance Management
            </h1>
            <p className="text-sm text-muted-foreground md:text-base">
              Manage leadership pages for traditional and community administrators.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            className="border-slate-900 bg-slate-900 text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800"
            onClick={openCreateForm}
          >
            <PlusIcon />
            Create Leader
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={category === 'traditional' ? 'primary' : 'secondary'}
          onClick={() => handleCategoryChange('traditional')}
        >
          Traditional
        </Button>
        <Button
          type="button"
          variant={category === 'community_admin' ? 'primary' : 'secondary'}
          onClick={() => handleCategoryChange('community_admin')}
        >
          Community Admin
        </Button>
      </div>

      {errorMessage ? <ToastMessage type="error" message={errorMessage} /> : null}
      {successMessage ? <ToastMessage type="success" message={successMessage} /> : null}

      {isFormOpen ? (
        <form className="grid gap-4 rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="category" className="mb-1 block text-sm font-medium">
                Category
              </label>
              <Select
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="traditional">Traditional</option>
                <option value="community_admin">Community Admin</option>
              </Select>
            </div>
            <div>
              <label htmlFor="display_order" className="mb-1 block text-sm font-medium">
                Display Order
              </label>
              <Input
                id="display_order"
                placeholder="Display order"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="role_title" className="mb-1 block text-sm font-medium">
                Role Title
              </label>
              <Input
                id="role_title"
                placeholder="Role title"
                value={form.role_title}
                onChange={(e) => setForm({ ...form, role_title: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="slug" className="mb-1 block text-sm font-medium">
                Slug
              </label>
              <Input
                id="slug"
                placeholder="Slug (optional)"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </div>
            <div>
              <div className="rounded-xl border border-border bg-background/60">
                <PhotoUploadField
                  label="Photo"
                  value={form.photo?.name || ''}
                  valueType="text"
                  valueId="photo"
                  valuePlaceholder="Select photo"
                  fileId="photo-file"
                  fileName="photo"
                  acceptedFileTypes="image/*"
                  onChange={(e) => setForm({ ...form, photo: e.target.files?.[0] || null })}
                  existingAssetUrl={form.photo_url || ''}
                />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor={bodyEditorId} className="mb-1 block text-sm font-medium">
              Biography
            </label>
            <SimpleRichTextEditor
              value={form.body || ''}
              onChange={(body) => setForm({ ...form, body })}
              textareaId={bodyEditorId}
              onUploadImage={uploadBodyImage}
            />
          </div>

          <FormActions
            mode="publish"
            className="flex flex-wrap justify-end gap-2"
            onCancel={() => setIsFormOpen(false)}
            onAction={(action) => {
              void handleSubmit(action)
            }}
            isSubmitting={isFormSubmitting}
            submitAction={submitAction}
            disableCancel={isFormSubmitting}
          />
        </form>
      ) : null}

      <div className="rounded-xl border border-border/80 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
              <SearchIcon className="h-4 w-4" />
            </span>
            <Input
              id="leader-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or role"
              className="h-11 w-full pl-10 transition-colors duration-200"
              aria-label="Search leaders"
            />
          </div>
          <div
            className="flex flex-wrap items-center gap-2 md:flex-nowrap md:justify-end"
            role="group"
            aria-label="Filter by publication status"
          >
            {statusFilterOptions.map((option) => {
              const isActive = statusFilter === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatusFilter(option.value)}
                  aria-pressed={isActive}
                  className={[
                    'inline-flex h-10 items-center rounded-md border px-4 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-border bg-white text-foreground hover:bg-accent',
                  ].join(' ')}
                >
                  {option.label}
                </button>
              )
            })}
            {searchTerm || statusFilter !== 'all' ? (
              <Button type="button" variant="secondary" onClick={resetFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{filteredLeaders.length} results found</p>

      <div className="overflow-x-auto rounded-xl bg-white px-3 py-3 shadow-sm sm:px-6 sm:py-4">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading leaders...</p>
        ) : filteredLeaders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <p className="text-base font-medium">No records found</p>
            <Button type="button" className="mt-4" onClick={openCreateForm}>
              Create First Record
            </Button>
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-3 font-medium sm:px-4">Photo</th>
                <th className="px-3 py-3 font-medium sm:px-4">Title</th>
                <th className="px-3 py-3 font-medium sm:px-4">Status</th>
                <th className="px-3 py-3 font-medium sm:px-4">Updated Date</th>
                <th className="px-3 py-3 text-right font-medium sm:px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaders.map((item) => {
                const rowId = item.id || item._id || ''
                const title = item.name || item.role_title || 'Untitled'
                const imageUrl = getThumbnailUrl(item)
                const date = formatDate(item.updated_at || item.updatedAt || item.created_at || item.createdAt)

                return (
                  <tr key={rowId || `${item.name}-${item.role_title}`} className="border-b border-border transition-colors hover:bg-gray-50">
                    <td className="px-3 py-3 sm:px-4">
                      {imageUrl ? (
                        <img src={imageUrl} alt={title} className="h-12 w-12 rounded-md object-cover" />
                      ) : (
                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-border bg-muted text-muted-foreground">
                          <PersonIcon className="h-5 w-5" />
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 sm:px-4">
                      <div className="font-medium text-foreground">{title}</div>
                      <div className="text-xs text-muted-foreground">{item.role_title || 'No role title'}</div>
                    </td>
                    <td className="px-3 py-3 sm:px-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm ${
                          item.published
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {item.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-3 py-3 sm:px-4">{date}</td>
                    <td className="px-3 py-3 text-right sm:px-4">
                      <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                        {rowId ? (
                          <button
                            type="button"
                            onClick={() => handleViewPreview(rowId)}
                            className={neutralIconButtonClassName}
                            aria-label={`View ${title}`}
                            title="View in split preview"
                          >
                            <EyeIcon />
                          </button>
                        ) : (
                          <span
                            className={`${neutralIconButtonClassName} cursor-not-allowed opacity-40`}
                            aria-hidden="true"
                          >
                            <EyeIcon />
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className={neutralIconButtonClassName}
                          aria-label={`Edit ${title}`}
                          title="Edit"
                        >
                          <EditIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ ...item, id: rowId })}
                          className={`${iconButtonClassName} !text-red-600 hover:!bg-red-50 hover:!text-red-700`}
                          aria-label={`Delete ${title}`}
                          title="Delete"
                        >
                          <TrashIcon />
                        </button>
                        <button
                          type="button"
                          className={[
                            iconButtonClassName,
                            !rowId || !item.published
                              ? 'cursor-not-allowed !text-slate-300 opacity-60 hover:translate-y-0 hover:!bg-transparent hover:!text-slate-300'
                              : '!text-red-600 hover:!bg-red-50 hover:!text-red-700',
                          ].join(' ')}
                          aria-label={`Unpublish ${title}`}
                          title="Unpublish"
                          disabled={!rowId || !item.published}
                          onClick={() => handleUnpublish(item)}
                        >
                          <EyeOffIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete leader"
        description="Are you sure you want to delete this leader? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </section>
  )

  return (
    <AdminInlinePreviewLayout
      resource="leaders"
      itemId={previewLeaderId}
      query={location.search}
      storageKey="leaders-preview-pane-width"
    >
      {pageContent}
    </AdminInlinePreviewLayout>
  )
}
