import { useEffect, useMemo, useState } from 'react'
import {
  createLeader,
  deleteLeader,
  listLeaders,
  updateLeader,
} from '../../services/api/adminAboutNyakromApi.js'
import {
  Button,
  ConfirmDialog,
  Input,
  Select,
  Textarea,
  ToastMessage,
} from '../../components/ui/index.jsx'

const initial = {
  category: 'traditional',
  display_order: '',
  published: false,
  role_title: '',
  name: '',
  short_bio_snippet: '',
  full_bio: '',
  slug: '',
  photo: null,
}

const FILTER_STORAGE_KEY = 'admin-leadership-filters'

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('en-GB')
}

function getThumbnailUrl(item) {
  return (
    item.photo_url ||
    item.photoUrl ||
    item.image_url ||
    item.imageUrl ||
    item.image ||
    item.thumbnail ||
    ''
  )
}

export default function AdminLeadershipGovernancePage() {
  const [category, setCategory] = useState('traditional')
  const [leaders, setLeaders] = useState([])
  const [form, setForm] = useState(initial)
  const [editingId, setEditingId] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')

  useEffect(() => {
    try {
      const savedFilters = JSON.parse(localStorage.getItem(FILTER_STORAGE_KEY) || '{}')
      if (savedFilters.searchTerm) {
        setSearchInput(savedFilters.searchTerm)
        setSearchTerm(savedFilters.searchTerm)
      }
      if (savedFilters.statusFilter) setStatusFilter(savedFilters.statusFilter)
      if (savedFilters.dateFilter) setDateFilter(savedFilters.dateFilter)
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
      JSON.stringify({ searchTerm, statusFilter, dateFilter }),
    )
  }, [searchTerm, statusFilter, dateFilter])

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => {
        if (k !== 'photo' && v !== undefined) fd.append(k, v)
      })

      if (form.photo) fd.append('photo', form.photo)

      if (editingId) {
        await updateLeader(editingId, fd)
        setSuccessMessage('Leader updated successfully.')
      } else {
        await createLeader(fd)
        setSuccessMessage('Leader created successfully.')
      }

      setForm({ ...initial, category })
      setEditingId('')
      setIsFormOpen(false)
      load()
    } catch (error) {
      setErrorMessage(error?.message || 'Unable to save leader.')
    }
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setForm({ ...initial, ...item, display_order: item.display_order ?? '', photo: null })
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

  const filteredLeaders = useMemo(() => {
    return leaders.filter((item) => {
      const title = (item.name || item.role_title || '').toLowerCase()
      const statusMatches =
        statusFilter === 'all' ||
        (statusFilter === 'published' && item.published) ||
        (statusFilter === 'draft' && !item.published)

      const searchMatches = !searchTerm || title.includes(searchTerm.toLowerCase())

      const itemDateRaw = item.updated_at || item.updatedAt || item.created_at || item.createdAt
      const itemDate = itemDateRaw ? new Date(itemDateRaw).toISOString().slice(0, 10) : ''
      const dateMatches = !dateFilter || itemDate === dateFilter

      return statusMatches && searchMatches && dateMatches
    })
  }, [leaders, searchTerm, statusFilter, dateFilter])

  const resetFilters = () => {
    setSearchInput('')
    setSearchTerm('')
    setStatusFilter('all')
    setDateFilter('')
  }

  const openCreateForm = () => {
    setEditingId('')
    setForm({ ...initial, category })
    setIsFormOpen(true)
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Leadership & Governance</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage leadership pages for traditional and community administrators.
          </p>
        </div>
        <Button type="button" className="self-start rounded-md px-4" onClick={openCreateForm}>
          + Create New
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant={category === 'traditional' ? 'primary' : 'secondary'}
          onClick={() => setCategory('traditional')}
        >
          Traditional
        </Button>
        <Button
          type="button"
          variant={category === 'community_admin' ? 'primary' : 'secondary'}
          onClick={() => setCategory('community_admin')}
        >
          Community Admin
        </Button>
      </div>

      {errorMessage ? <ToastMessage type="error" message={errorMessage} /> : null}
      {successMessage ? <ToastMessage type="success" message={successMessage} /> : null}

      {isFormOpen ? (
        <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-border bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label htmlFor="category" className="mb-1 block text-sm font-medium">Category</label>
              <Select id="category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="traditional">Traditional</option>
                <option value="community_admin">Community Admin</option>
              </Select>
            </div>
            <div>
              <label htmlFor="display_order" className="mb-1 block text-sm font-medium">Display Order</label>
              <Input id="display_order" placeholder="Display order" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} />
            </div>
            <div>
              <label htmlFor="role_title" className="mb-1 block text-sm font-medium">Role Title</label>
              <Input id="role_title" placeholder="Role title" value={form.role_title} onChange={(e) => setForm({ ...form, role_title: e.target.value })} />
            </div>
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium">Name</label>
              <Input id="name" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label htmlFor="slug" className="mb-1 block text-sm font-medium">Slug</label>
              <Input id="slug" placeholder="Slug (optional)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div>
              <label htmlFor="photo" className="mb-1 block text-sm font-medium">Photo</label>
              <Input id="photo" type="file" onChange={(e) => setForm({ ...form, photo: e.target.files?.[0] || null })} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            Published
          </label>

          <div>
            <label htmlFor="short_bio_snippet" className="mb-1 block text-sm font-medium">Short Bio Snippet</label>
            <Textarea id="short_bio_snippet" placeholder="Short bio snippet" value={form.short_bio_snippet} onChange={(e) => setForm({ ...form, short_bio_snippet: e.target.value })} />
          </div>
          <div>
            <label htmlFor="full_bio" className="mb-1 block text-sm font-medium">Full Bio</label>
            <Textarea id="full_bio" placeholder="Full bio" value={form.full_bio} onChange={(e) => setForm({ ...form, full_bio: e.target.value })} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit">{editingId ? 'Update Leader' : 'Create Leader'}</Button>
            <Button type="button" variant="secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="relative w-full">
            <label htmlFor="leader-search" className="mb-1 block text-sm font-medium">Search</label>
            <span className="pointer-events-none absolute left-3 top-[38px] text-muted-foreground">⌕</span>
            <Input
              id="leader-search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title..."
              className="pl-9"
            />
          </div>

          <div className="w-full md:max-w-52">
            <label htmlFor="status-filter" className="mb-1 block text-sm font-medium">Status</label>
            <Select id="status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </Select>
          </div>

          <div className="w-full md:max-w-52">
            <label htmlFor="date-filter" className="mb-1 block text-sm font-medium">Updated Date</label>
            <Input id="date-filter" type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
          </div>

          <Button type="button" variant="secondary" className="md:ml-auto" onClick={resetFilters}>
            Reset Filters
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{filteredLeaders.length} results found</p>

      <div className="overflow-x-auto rounded-xl bg-white px-3 py-3 shadow-sm sm:px-6 sm:py-4">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading leaders...</p>
        ) : filteredLeaders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-3 text-4xl text-muted-foreground">🗂️</div>
            <p className="text-base font-medium">No records found</p>
            <Button type="button" className="mt-4" onClick={openCreateForm}>
              Create First Record
            </Button>
          </div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-3 py-3 font-medium sm:px-4">Title</th>
                <th className="px-3 py-3 font-medium sm:px-4">Thumbnail / Image</th>
                <th className="px-3 py-3 font-medium sm:px-4">Status</th>
                <th className="px-3 py-3 font-medium sm:px-4">Updated Date</th>
                <th className="px-3 py-3 font-medium sm:px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaders.map((item) => {
                const title = item.name || item.role_title || 'Untitled'
                const imageUrl = getThumbnailUrl(item)
                const date = formatDate(item.updated_at || item.updatedAt || item.created_at || item.createdAt)

                return (
                  <tr key={item.id} className="border-b border-border transition-colors hover:bg-gray-50">
                    <td className="px-3 py-3 sm:px-4">
                      <div className="font-medium text-foreground">{title}</div>
                      <div className="text-xs text-muted-foreground">{item.role_title || 'No role title'}</div>
                    </td>
                    <td className="px-3 py-3 sm:px-4">
                      {imageUrl ? (
                        <img src={imageUrl} alt={title} className="h-12 w-12 rounded-md object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">N/A</div>
                      )}
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
                    <td className="px-3 py-3 sm:px-4">
                      <div className="flex items-center gap-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(item)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Delete
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
}
