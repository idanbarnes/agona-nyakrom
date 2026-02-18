import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'
import {
  getAboutPage,
  saveAboutPage,
  uploadAboutInlineImage,
} from '../../services/api/adminAboutNyakromApi.js'
import SimpleRichTextEditor from '../../components/richText/SimpleRichTextEditor.jsx'

const labels = {
  history: 'History',
  'who-we-are': 'Who We Are',
  'about-agona-nyakrom-town': 'About Agona Nyakrom Town',
}

const initialState = {
  page_title: '',
  subtitle: '',
  body: '',
  published: false,
  seo_meta_title: '',
  seo_meta_description: '',
  seo_share_image: '',
}

export default function AdminAboutPageEditor() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState(initialState)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!getAuthToken()) return navigate('/login', { replace: true })
    getAboutPage(slug)
      .then((res) => setState({ ...initialState, ...(res.data || res) }))
      .catch((err) => {
        if (err.status === 401) {
          clearAuthToken()
          navigate('/login', { replace: true })
        }
      })
  }, [slug, navigate])

  const onChange = (e) => {
    const { name, value, type, checked } = e.target
    setState((s) => ({ ...s, [name]: type === 'checkbox' ? checked : value }))
  }


  const uploadBodyImage = async (file) => {
    const uploaded = await uploadAboutInlineImage(file)
    return uploaded?.data?.image_url || ''
  }

  const insertSeoImage = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const src = await uploadBodyImage(file)
    if (src) {
      setState((s) => ({ ...s, seo_share_image: src }))
    }
    event.target.value = ''
  }
  const onSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await saveAboutPage(slug, state)
      setMessage('Saved successfully')
    } catch (err) {
      setMessage(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">About Nyakrom: {labels[slug] || slug}</h2>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <form onSubmit={onSubmit} className="space-y-3">
        <input name="page_title" placeholder="Page Title" value={state.page_title || ''} onChange={onChange} className="w-full rounded border px-3 py-2" />
        <input name="subtitle" placeholder="Subtitle (optional)" value={state.subtitle || ''} onChange={onChange} className="w-full rounded border px-3 py-2" />

        <SimpleRichTextEditor
          textareaId="about-body"
          value={state.body || ''}
          onChange={(nextBody) => setState((s) => ({ ...s, body: nextBody }))}
          onUploadImage={uploadBodyImage}
        />

        <label className="flex items-center gap-2"><input type="checkbox" name="published" checked={Boolean(state.published)} onChange={onChange} />Published</label>
        <input name="seo_meta_title" placeholder="SEO Meta Title (optional)" value={state.seo_meta_title || ''} onChange={onChange} className="w-full rounded border px-3 py-2" />
        <textarea name="seo_meta_description" placeholder="SEO Meta Description (optional)" value={state.seo_meta_description || ''} onChange={onChange} className="w-full rounded border px-3 py-2" />
        <div className="space-y-2">
          <input name="seo_share_image" placeholder="SEO Share Image URL (optional)" value={state.seo_share_image || ''} onChange={onChange} className="w-full rounded border px-3 py-2" />
          <label className="inline-flex cursor-pointer rounded border px-2 py-1 text-xs">Upload SEO Share Image<input type="file" accept="image/*" className="hidden" onChange={insertSeoImage} /></label>
        </div>
        <button className="rounded bg-black px-4 py-2 text-white" disabled={saving} type="submit">{saving ? 'Saving...' : 'Save'}</button>
      </form>
    </section>
  )
}
