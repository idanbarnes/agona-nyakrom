import { useEffect, useState } from 'react'
import {
  createLeader,
  deleteLeader,
  listLeaders,
  toggleLeaderPublish,
  updateLeader,
  updateLeaderDisplayOrder,
} from '../../services/api/adminAboutNyakromApi.js'

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

export default function AdminLeadershipGovernancePage() {
  const [category, setCategory] = useState('traditional')
  const [leaders, setLeaders] = useState([])
  const [form, setForm] = useState(initial)
  const [editingId, setEditingId] = useState('')

  const load = () => listLeaders(category).then((res) => setLeaders(res.data || []))
  useEffect(() => {
    load()
  }, [category])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => {
      if (k !== 'photo' && v !== undefined) fd.append(k, v)
    })
    if (form.photo) fd.append('photo', form.photo)
    if (editingId) await updateLeader(editingId, fd)
    else await createLeader(fd)
    setForm({ ...initial, category })
    setEditingId('')
    load()
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setForm({ ...initial, ...item, display_order: item.display_order ?? '', photo: null })
  }

  const moveLeader = async (leader, direction) => {
    const delta = direction === 'up' ? -1 : 1
    await updateLeaderDisplayOrder(leader.id, (leader.display_order ?? 0) + delta)
    load()
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Leadership & Governance</h2>
      <div className="flex gap-2">
        <button className={`rounded border px-3 py-1 ${category === 'traditional' ? 'bg-black text-white' : ''}`} onClick={() => { setCategory('traditional'); setForm((f) => ({ ...f, category: 'traditional' })) }}>Traditional</button>
        <button className={`rounded border px-3 py-1 ${category === 'community_admin' ? 'bg-black text-white' : ''}`} onClick={() => { setCategory('community_admin'); setForm((f) => ({ ...f, category: 'community_admin' })) }}>Community Admin</button>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-2 rounded border p-3">
        <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded border px-2 py-1">
          <option value="traditional">Traditional</option>
          <option value="community_admin">Community Admin</option>
        </select>
        <input className="rounded border px-2 py-1" placeholder="Display order" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} />
        <label><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Published</label>
        <input className="rounded border px-2 py-1" placeholder="Role title" value={form.role_title} onChange={(e) => setForm({ ...form, role_title: e.target.value })} />
        <input className="rounded border px-2 py-1" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input className="rounded border px-2 py-1" placeholder="Slug (optional)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        <input type="file" onChange={(e) => setForm({ ...form, photo: e.target.files?.[0] || null })} />
        <textarea className="rounded border px-2 py-1" placeholder="Short bio snippet" value={form.short_bio_snippet} onChange={(e) => setForm({ ...form, short_bio_snippet: e.target.value })} />
        <textarea className="rounded border px-2 py-1" placeholder="Full bio" value={form.full_bio} onChange={(e) => setForm({ ...form, full_bio: e.target.value })} />
        <button className="rounded bg-black px-4 py-2 text-white" type="submit">{editingId ? 'Update' : 'Create'} Leader</button>
      </form>

      <ul className="space-y-2">
        {leaders.map((item) => (
          <li key={item.id} className="rounded border p-3">
            <p className="font-medium">{item.name || item.role_title || 'Untitled'} ({item.category})</p>
            <p className="text-sm text-muted-foreground">Order: {item.display_order ?? '—'} · {item.published ? 'Published' : 'Draft'}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button className="rounded border px-2 py-1" onClick={() => startEdit(item)}>Edit</button>
              <button className="rounded border px-2 py-1" onClick={() => moveLeader(item, 'up')}>↑</button>
              <button className="rounded border px-2 py-1" onClick={() => moveLeader(item, 'down')}>↓</button>
              <button className="rounded border px-2 py-1" onClick={async () => { await toggleLeaderPublish(item.id, !item.published); load() }}>{item.published ? 'Unpublish' : 'Publish'}</button>
              <button className="rounded border px-2 py-1 text-red-600" onClick={async () => { if (window.confirm('Delete this leader?')) { await deleteLeader(item.id); load() } }}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
