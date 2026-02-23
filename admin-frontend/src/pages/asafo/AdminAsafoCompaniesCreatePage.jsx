import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import SimpleRichTextEditor from '../../components/richText/SimpleRichTextEditor.jsx'
import { createAsafoCompany, uploadAsafoInlineImage } from '../../services/api/adminAsafoApi.js'

const SECTION_PRESETS = {
  'who-are-asafo-companies': {
    label: 'Who Are Asafo Companies',
    entry_type: 'introduction',
    company_key: '',
    title: 'Who Are Asafo Companies',
    display_order: 10,
  },
  'adonsten-asafo': {
    label: 'Adonsten Asafo',
    entry_type: 'company',
    company_key: 'adonten',
    title: 'Adonsten Asafo',
    display_order: 20,
  },
  'kyeremu-asafo': {
    label: 'Kyeremu Asafo',
    entry_type: 'company',
    company_key: 'kyeremu',
    title: 'Kyeremu Asafo',
    display_order: 30,
  },
}

const DEFAULT_SECTION = 'who-are-asafo-companies'

const getInitialState = (sectionKey) => {
  const preset = SECTION_PRESETS[sectionKey] || SECTION_PRESETS[DEFAULT_SECTION]
  return {
    section_key: sectionKey,
    entry_type: preset.entry_type,
    company_key: preset.company_key,
    title: preset.title,
    subtitle: '',
    body: '',
    display_order: preset.display_order,
    published: false,
    seo_meta_title: '',
    seo_meta_description: '',
    seo_share_image: '',
  }
}

const buildPayload = (state) => ({
  entry_type: state.entry_type,
  company_key: state.company_key,
  title: state.title,
  subtitle: state.subtitle,
  body: state.body,
  display_order: state.display_order,
  published: state.published,
  seo_meta_title: state.seo_meta_title,
  seo_meta_description: state.seo_meta_description,
  seo_share_image: state.seo_share_image,
})

export default function AdminAsafoCompaniesCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const requestedSection = searchParams.get('section')
  const initialSection = SECTION_PRESETS[requestedSection] ? requestedSection : DEFAULT_SECTION
  const [state, setState] = useState(getInitialState(initialSection))
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const form = new FormData()
    Object.entries(buildPayload(state)).forEach(([key, value]) =>
      form.append(key, String(value ?? '')),
    )
    try {
      await createAsafoCompany(form)
      navigate('/admin/asafo-companies')
    } catch (err) {
      setError(err.message || 'Failed to save Asafo section')
    }
  }

  const uploadBodyImage = async (file) => {
    const uploaded = await uploadAsafoInlineImage(file)
    return uploaded?.data?.image_url || ''
  }

  const onSectionChange = (nextSection) => {
    const preset = SECTION_PRESETS[nextSection] || SECTION_PRESETS[DEFAULT_SECTION]
    setState((current) => ({
      ...current,
      section_key: nextSection,
      entry_type: preset.entry_type,
      company_key: preset.company_key,
      title: preset.title,
      display_order: preset.display_order,
    }))
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <h2 className="text-2xl font-semibold">Create Asafo Section</h2>
      <p className="text-sm text-slate-600">
        Use one page for each section: Who Are Asafo Companies, Adonsten Asafo, and Kyeremu Asafo.
      </p>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <select
        className="w-full rounded border px-3 py-2"
        value={state.section_key}
        onChange={(e) => onSectionChange(e.target.value)}
      >
        <option value="who-are-asafo-companies">
          {SECTION_PRESETS['who-are-asafo-companies'].label}
        </option>
        <option value="adonsten-asafo">{SECTION_PRESETS['adonsten-asafo'].label}</option>
        <option value="kyeremu-asafo">{SECTION_PRESETS['kyeremu-asafo'].label}</option>
      </select>

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
