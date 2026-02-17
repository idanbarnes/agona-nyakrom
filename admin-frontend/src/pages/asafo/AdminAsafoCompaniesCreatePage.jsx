import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import SimpleRichTextEditor from '../../components/richText/SimpleRichTextEditor.jsx'
import { createAsafoCompany, uploadAsafoInlineImage } from '../../services/api/adminAsafoApi.js'

export default function AdminAsafoCompaniesCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const defaultType = searchParams.get('type') === 'introduction' ? 'introduction' : 'company'
  const [state, setState] = useState({
    entry_type: defaultType,
    company_key: defaultType === 'company' ? 'adonten' : '',
    title: defaultType === 'introduction' ? 'Introduction' : '',
    subtitle: '',
    body: '',
    display_order: defaultType === 'introduction' ? 10 : 20,
    published: false,
    seo_meta_title: '',
    seo_meta_description: '',
    seo_share_image: '',
  })

  const onSubmit = async (e) => {
    e.preventDefault()
    const form = new FormData()
    Object.entries(state).forEach(([key, value]) => form.append(key, String(value ?? '')))
    await createAsafoCompany(form)
    navigate('/admin/asafo-companies')
  }

  const uploadBodyImage = async (file) => {
    const uploaded = await uploadAsafoInlineImage(file)
    return uploaded?.data?.image_url || ''
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <h2 className="text-2xl font-semibold">Create Asafo Entry</h2>
      <select className="rounded border px-3 py-2" value={state.entry_type} onChange={(e) => setState((s) => ({ ...s, entry_type: e.target.value }))}>
        <option value="introduction">Introduction</option>
        <option value="company">Company</option>
      </select>
      {state.entry_type === 'company' ? (
        <select className="w-full rounded border px-3 py-2" value={state.company_key} onChange={(e) => setState((s) => ({ ...s, company_key: e.target.value }))}>
          <option value="adonten">Adonten</option>
          <option value="kyeremu">Kyeremu</option>
        </select>
      ) : null}
      <input className="w-full rounded border px-3 py-2" placeholder="Title" value={state.title} onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))} />
      <input className="w-full rounded border px-3 py-2" placeholder="Subtitle" value={state.subtitle} onChange={(e) => setState((s) => ({ ...s, subtitle: e.target.value }))} />
      <SimpleRichTextEditor value={state.body} onChange={(body) => setState((s) => ({ ...s, body }))} textareaId="asafo-body" onUploadImage={uploadBodyImage} />
      <input className="w-full rounded border px-3 py-2" placeholder="SEO Meta Title" value={state.seo_meta_title} onChange={(e) => setState((s) => ({ ...s, seo_meta_title: e.target.value }))} />
      <textarea className="w-full rounded border px-3 py-2" placeholder="SEO Meta Description" value={state.seo_meta_description} onChange={(e) => setState((s) => ({ ...s, seo_meta_description: e.target.value }))} />
      <input className="w-full rounded border px-3 py-2" placeholder="SEO Share Image" value={state.seo_share_image} onChange={(e) => setState((s) => ({ ...s, seo_share_image: e.target.value }))} />
      <label className="flex items-center gap-2"><input type="checkbox" checked={state.published} onChange={(e) => setState((s) => ({ ...s, published: e.target.checked }))} />Published</label>
      <input className="w-32 rounded border px-3 py-2" type="number" value={state.display_order} onChange={(e) => setState((s) => ({ ...s, display_order: Number(e.target.value || 0) }))} />
      <button className="rounded bg-black px-4 py-2 text-white" type="submit">Save</button>
    </form>
  )
}
