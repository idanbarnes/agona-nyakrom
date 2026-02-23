import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import SimpleRichTextEditor from '../../components/richText/SimpleRichTextEditor.jsx'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'
import {
  createAsafoCompany,
  getAllAsafoCompanies,
  updateAsafoCompany,
  uploadAsafoInlineImage,
} from '../../services/api/adminAsafoApi.js'

const SECTION_CONFIG = {
  'who-are-asafo-companies': {
    label: 'Who Are Asafo Companies (Introduction)',
    entry_type: 'introduction',
    company_key: '',
    display_order: 10,
  },
  'adontsen-asafo-company': {
    label: 'Adontsen Asafo Company (Asafo Company 1)',
    entry_type: 'company',
    company_key: 'adonten',
    display_order: 20,
  },
  'kyeremu-asafo': {
    label: 'Kyeremu Asafo (Asafo Company 2)',
    entry_type: 'company',
    company_key: 'kyeremu',
    display_order: 30,
  },
}

const EMPTY_EDITOR_STATE = {
  title: '',
  subtitle: '',
  body: '',
  published: false,
  seo_meta_title: '',
  seo_meta_description: '',
  seo_share_image: '',
}

const normalizeSectionId = (item) => {
  if (item?.entry_type === 'introduction') return 'who-are-asafo-companies'
  const key = String(item?.company_key || '').toLowerCase()
  if (['adonten', 'adonsten', 'adontsen', 'dotsen'].includes(key)) {
    return 'adontsen-asafo-company'
  }
  if (key === 'kyeremu') return 'kyeremu-asafo'
  return ''
}

const buildPayload = (state, section) => ({
  entry_type: section.entry_type,
  company_key: section.company_key,
  display_order: section.display_order,
  title: state.title,
  subtitle: state.subtitle,
  body: state.body,
  published: Boolean(state.published),
  seo_meta_title: state.seo_meta_title,
  seo_meta_description: state.seo_meta_description,
  seo_share_image: state.seo_share_image,
})

export default function AdminAsafoCompaniesSectionPage() {
  const { sectionId } = useParams()
  const navigate = useNavigate()
  const section = SECTION_CONFIG[sectionId]
  const [entryId, setEntryId] = useState(null)
  const [state, setState] = useState(EMPTY_EDITOR_STATE)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!getAuthToken()) {
      navigate('/login', { replace: true })
      return
    }
    if (!section) {
      navigate('/admin/asafo-companies', { replace: true })
      return
    }

    let cancelled = false
    setLoading(true)
    setError('')

    getAllAsafoCompanies()
      .then((res) => {
        if (cancelled) return
        const items = res?.data || []
        const existing = items.find((item) => normalizeSectionId(item) === sectionId)
        if (!existing) {
          setEntryId(null)
          setState(EMPTY_EDITOR_STATE)
          return
        }

        setEntryId(existing.id)
        setState({
          title: existing.title || '',
          subtitle: existing.subtitle || '',
          body: existing.body || '',
          published: Boolean(existing.published),
          seo_meta_title: existing.seo_meta_title || '',
          seo_meta_description: existing.seo_meta_description || '',
          seo_share_image: existing.seo_share_image || '',
        })
      })
      .catch((err) => {
        if (cancelled) return
        if (err.status === 401) {
          clearAuthToken()
          navigate('/login', { replace: true })
          return
        }
        setError(err.message || 'Failed to load section')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [navigate, section, sectionId])

  const uploadBodyImage = async (file) => {
    const uploaded = await uploadAsafoInlineImage(file)
    return uploaded?.data?.image_url || ''
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!section) return
    setError('')
    setSaving(true)

    try {
      const form = new FormData()
      Object.entries(buildPayload(state, section)).forEach(([key, value]) => {
        form.append(key, String(value ?? ''))
      })

      if (entryId) {
        await updateAsafoCompany(entryId, form)
      } else {
        const created = await createAsafoCompany(form)
        setEntryId(created?.data?.id || created?.id || null)
      }
      navigate('/admin/asafo-companies')
    } catch (err) {
      setError(err.message || 'Failed to save section')
    } finally {
      setSaving(false)
    }
  }

  const heading = useMemo(() => section?.label || 'Asafo Section', [section])

  if (loading) return <p>Loading...</p>

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">{heading}</h2>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <form onSubmit={onSubmit} className="space-y-3">
        <input
          name="title"
          placeholder="Title"
          value={state.title}
          onChange={(e) => setState((s) => ({ ...s, title: e.target.value }))}
          className="w-full rounded border px-3 py-2"
        />
        <input
          name="subtitle"
          placeholder="Subtitle (optional)"
          value={state.subtitle}
          onChange={(e) => setState((s) => ({ ...s, subtitle: e.target.value }))}
          className="w-full rounded border px-3 py-2"
        />

        <SimpleRichTextEditor
          textareaId="asafo-body"
          value={state.body}
          onChange={(nextBody) => setState((s) => ({ ...s, body: nextBody }))}
          onUploadImage={uploadBodyImage}
        />

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(state.published)}
            onChange={(e) => setState((s) => ({ ...s, published: e.target.checked }))}
          />
          Published
        </label>
        <input
          name="seo_meta_title"
          placeholder="SEO Meta Title (optional)"
          value={state.seo_meta_title}
          onChange={(e) => setState((s) => ({ ...s, seo_meta_title: e.target.value }))}
          className="w-full rounded border px-3 py-2"
        />
        <textarea
          name="seo_meta_description"
          placeholder="SEO Meta Description (optional)"
          value={state.seo_meta_description}
          onChange={(e) => setState((s) => ({ ...s, seo_meta_description: e.target.value }))}
          className="w-full rounded border px-3 py-2"
        />
        <input
          name="seo_share_image"
          placeholder="SEO Share Image URL (optional)"
          value={state.seo_share_image}
          onChange={(e) => setState((s) => ({ ...s, seo_share_image: e.target.value }))}
          className="w-full rounded border px-3 py-2"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded border px-4 py-2"
            onClick={() => navigate('/admin/asafo-companies')}
          >
            Cancel
          </button>
          <button className="rounded bg-black px-4 py-2 text-white" disabled={saving} type="submit">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </section>
  )
}
