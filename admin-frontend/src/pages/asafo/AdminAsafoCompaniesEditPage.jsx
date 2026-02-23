import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import SimpleRichTextEditor from '../../components/richText/SimpleRichTextEditor.jsx'
import { getSingleAsafoCompany, updateAsafoCompany, uploadAsafoInlineImage } from '../../services/api/adminAsafoApi.js'

const SECTION_LABELS = {
  introduction: 'Who Are Asafo Companies',
  adonten: 'Adonsten Asafo',
  adonsten: 'Adonsten Asafo',
  dotsen: 'Adonsten Asafo',
  kyeremu: 'Kyeremu Asafo',
}

const buildPayload = (state) => ({
  entry_type: state.entry_type,
  company_key: state.company_key,
  title: state.title,
  subtitle: state.subtitle,
  body: state.body,
  display_order: state.display_order,
  published: Boolean(state.published),
  seo_meta_title: state.seo_meta_title,
  seo_meta_description: state.seo_meta_description,
  seo_share_image: state.seo_share_image,
})

const getSectionLabel = (state) => {
  if (!state) return ''
  if (state.entry_type === 'introduction') return SECTION_LABELS.introduction
  return SECTION_LABELS[String(state.company_key || '').toLowerCase()] || 'Asafo Company'
}

export default function AdminAsafoCompaniesEditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getSingleAsafoCompany(id).then((res) => setState(res?.data || null))
  }, [id])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const form = new FormData()
    Object.entries(buildPayload(state)).forEach(([key, value]) =>
      form.append(key, String(value ?? '')),
    )
    try {
      await updateAsafoCompany(id, form)
      navigate('/admin/asafo-companies')
    } catch (err) {
      setError(err.message || 'Failed to save Asafo section')
    }
  }

  const uploadBodyImage = async (file) => {
    const uploaded = await uploadAsafoInlineImage(file)
    return uploaded?.data?.image_url || ''
  }

  if (!state) return <p>Loading...</p>

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <h2 className="text-2xl font-semibold">Edit Asafo Section</h2>
      <p className="text-sm text-slate-600">{getSectionLabel(state)}</p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <input className="w-full rounded border px-3 py-2" placeholder="Title" value={state.title || ''} onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))} />
      <input
        className="w-full rounded border px-3 py-2"
        placeholder="Company key"
        value={state.company_key || ''}
        disabled
      />
      <input className="w-full rounded border px-3 py-2" placeholder="Subtitle" value={state.subtitle || ''} onChange={(e) => setState((s) => ({ ...s, subtitle: e.target.value }))} />
      <SimpleRichTextEditor value={state.body || ''} onChange={(body) => setState((s) => ({ ...s, body }))} textareaId="asafo-body" onUploadImage={uploadBodyImage} />
      <input className="w-full rounded border px-3 py-2" placeholder="SEO Meta Title" value={state.seo_meta_title || ''} onChange={(e) => setState((s) => ({ ...s, seo_meta_title: e.target.value }))} />
      <textarea className="w-full rounded border px-3 py-2" placeholder="SEO Meta Description" value={state.seo_meta_description || ''} onChange={(e) => setState((s) => ({ ...s, seo_meta_description: e.target.value }))} />
      <input className="w-full rounded border px-3 py-2" placeholder="SEO Share Image" value={state.seo_share_image || ''} onChange={(e) => setState((s) => ({ ...s, seo_share_image: e.target.value }))} />
      <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(state.published)} onChange={(e) => setState((s) => ({ ...s, published: e.target.checked }))} />Published</label>
      <input className="w-32 rounded border px-3 py-2" type="number" value={state.display_order ?? 0} onChange={(e) => setState((s) => ({ ...s, display_order: Number(e.target.value || 0) }))} />
      <button className="rounded bg-black px-4 py-2 text-white" type="submit">Save</button>
    </form>
  )
}
