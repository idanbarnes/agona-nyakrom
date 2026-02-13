import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'
import {
  getAboutPage,
  saveAboutPage,
  uploadAboutInlineImage,
} from '../../services/api/adminAboutNyakromApi.js'

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

  const wrapSelection = (prefix, suffix = prefix) => {
    const textarea = document.getElementById('about-body')
    if (!textarea) return
    const { selectionStart, selectionEnd, value } = textarea
    const selected = value.slice(selectionStart, selectionEnd)
    const next = `${value.slice(0, selectionStart)}${prefix}${selected}${suffix}${value.slice(selectionEnd)}`
    setState((s) => ({ ...s, body: next }))
  }

  const insertBlock = (html) => setState((s) => ({ ...s, body: `${s.body || ''}\n${html}` }))

  const insertImage = async (event, targetField = 'body') => {
    const file = event.target.files?.[0]
    if (!file) return
    const uploaded = await uploadAboutInlineImage(file)
    const src = uploaded?.data?.image_url || ''
    if (!src) return

    if (targetField === 'seo_share_image') {
      setState((s) => ({ ...s, seo_share_image: src }))
      return
    }

    const caption = window.prompt('Caption (optional)') || ''
    const html = `<figure><img src="${src}" alt="${caption}" /><figcaption>${caption}</figcaption></figure>`
    insertBlock(html)
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

        <div className="flex flex-wrap gap-2 text-xs">
          <button type="button" className="rounded border px-2 py-1" onClick={() => wrapSelection('<strong>', '</strong>')}>Bold</button>
          <button type="button" className="rounded border px-2 py-1" onClick={() => wrapSelection('<em>', '</em>')}>Italic</button>
          <button type="button" className="rounded border px-2 py-1" onClick={() => wrapSelection('<u>', '</u>')}>Underline</button>
          <button type="button" className="rounded border px-2 py-1" onClick={() => wrapSelection('<h2>', '</h2>')}>H2</button>
          <button type="button" className="rounded border px-2 py-1" onClick={() => wrapSelection('<h3>', '</h3>')}>H3</button>
          <button type="button" className="rounded border px-2 py-1" onClick={() => wrapSelection('<ul><li>', '</li></ul>')}>Bullets</button>
          <button type="button" className="rounded border px-2 py-1" onClick={() => wrapSelection('<ol><li>', '</li></ol>')}>Numbered</button>
          <button type="button" className="rounded border px-2 py-1" onClick={() => wrapSelection('<blockquote>', '</blockquote>')}>Quote</button>
          <button type="button" className="rounded border px-2 py-1" onClick={() => wrapSelection('<a href="https://">', '</a>')}>Link</button>
          <button type="button" className="rounded border px-2 py-1" onClick={() => wrapSelection('<p style="text-align:left">', '</p>')}>Align Left</button>
          <button type="button" className="rounded border px-2 py-1" onClick={() => wrapSelection('<p style="text-align:center">', '</p>')}>Align Center</button>
          <button type="button" className="rounded border px-2 py-1" onClick={() => wrapSelection('<p style="text-align:right">', '</p>')}>Align Right</button>
          <label className="cursor-pointer rounded border px-2 py-1">Insert Image<input type="file" accept="image/*" className="hidden" onChange={(e) => insertImage(e, 'body')} /></label>
        </div>

        <textarea id="about-body" name="body" rows={16} value={state.body || ''} onChange={onChange} className="w-full rounded border px-3 py-2" />

        <label className="flex items-center gap-2"><input type="checkbox" name="published" checked={Boolean(state.published)} onChange={onChange} />Published</label>
        <input name="seo_meta_title" placeholder="SEO Meta Title (optional)" value={state.seo_meta_title || ''} onChange={onChange} className="w-full rounded border px-3 py-2" />
        <textarea name="seo_meta_description" placeholder="SEO Meta Description (optional)" value={state.seo_meta_description || ''} onChange={onChange} className="w-full rounded border px-3 py-2" />
        <div className="space-y-2">
          <input name="seo_share_image" placeholder="SEO Share Image URL (optional)" value={state.seo_share_image || ''} onChange={onChange} className="w-full rounded border px-3 py-2" />
          <label className="inline-flex cursor-pointer rounded border px-2 py-1 text-xs">Upload SEO Share Image<input type="file" accept="image/*" className="hidden" onChange={(e) => insertImage(e, 'seo_share_image')} /></label>
        </div>
        <button className="rounded bg-black px-4 py-2 text-white" disabled={saving} type="submit">{saving ? 'Saving...' : 'Save'}</button>
      </form>
    </section>
  )
}
