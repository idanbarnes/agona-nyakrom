import { useEffect, useState } from 'react'
import { createLeader, deleteLeader, listLeaders, updateLeader } from '../../services/api/adminAboutNyakromApi.js'

const initial = { category: 'traditional', display_order: '', published: false, role_title: '', name: '', short_bio_snippet: '', full_bio: '', slug: '', photo: null }

export default function AdminLeadershipGovernancePage() {
  const [category, setCategory] = useState('traditional')
  const [leaders, setLeaders] = useState([])
  const [form, setForm] = useState(initial)
  const [editingId, setEditingId] = useState('')

  const load = () => listLeaders(category).then((res) => setLeaders(res.data || []))
  useEffect(() => { load() }, [category])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (k !== 'photo' && v !== undefined) fd.append(k, v) })
    if (form.photo) fd.append('photo', form.photo)
    if (editingId) await updateLeader(editingId, fd)
    else await createLeader(fd)
    setForm(initial); setEditingId(''); load()
  }

  return <section className="space-y-4"><h2 className="text-xl font-semibold">Leadership & Governance</h2>
    <div className="flex gap-2"><button onClick={() => setCategory('traditional')}>Traditional</button><button onClick={() => setCategory('community_admin')}>Community Admin</button></div>
    <form onSubmit={handleSubmit} className="grid gap-2">
      <select value={form.category} onChange={(e)=>setForm({...form,category:e.target.value})}><option value="traditional">traditional</option><option value="community_admin">community_admin</option></select>
      <input placeholder="Display order" value={form.display_order} onChange={(e)=>setForm({...form,display_order:e.target.value})} />
      <label><input type="checkbox" checked={form.published} onChange={(e)=>setForm({...form,published:e.target.checked})}/> Published</label>
      <input placeholder="Role title" value={form.role_title} onChange={(e)=>setForm({...form,role_title:e.target.value})} />
      <input placeholder="Name" value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} />
      <input placeholder="Slug" value={form.slug} onChange={(e)=>setForm({...form,slug:e.target.value})} />
      <input type="file" onChange={(e)=>setForm({...form,photo:e.target.files?.[0]||null})} />
      <textarea placeholder="Short bio snippet" value={form.short_bio_snippet} onChange={(e)=>setForm({...form,short_bio_snippet:e.target.value})} />
      <textarea placeholder="Full bio" value={form.full_bio} onChange={(e)=>setForm({...form,full_bio:e.target.value})} />
      <button type="submit">{editingId ? 'Update' : 'Create'} Leader</button>
    </form>
    <ul className="space-y-2">{leaders.map((item)=><li key={item.id} className="border p-2"><p>{item.name || item.role_title} ({item.category})</p><button onClick={()=>{setEditingId(item.id);setForm({...initial,...item,display_order:item.display_order??'',photo:null})}}>Edit</button> <button onClick={async()=>{await deleteLeader(item.id);load()}}>Delete</button></li>)}</ul>
  </section>
}
