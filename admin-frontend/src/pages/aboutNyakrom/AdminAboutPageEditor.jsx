import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'
import { getAboutPage, saveAboutPage, uploadAboutInlineImage } from '../../services/api/adminAboutNyakromApi.js'

const labels = {
  history: 'History',
  'who-we-are': 'Who We Are',
  'about-agona-nyakrom-town': 'About Agona Nyakrom Town',
}

export default function AdminAboutPageEditor() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState({ page_title: '', subtitle: '', body: '', published: false, seo_meta_title: '', seo_meta_description: '', seo_share_image: '' })
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!getAuthToken()) return navigate('/login', { replace: true })
    getAboutPage(slug)
      .then((res) => setState((res.data || res)))
      .catch((err) => {
        if (err.status === 401) {
          clearAuthToken(); navigate('/login', { replace: true })
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

  const insertImage = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    const uploaded = await uploadAboutInlineImage(file)
    const src = uploaded?.data?.image_url || ''
    if (!src) return
    const caption = window.prompt('Caption (optional)') || ''
    const html = `<figure><img src="${src}" alt="${caption}" /><figcaption>${caption}</figcaption></figure>`
    setState((s) => ({ ...s, body: `${s.body || ''}\n${html}` }))
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    try {
      await saveAboutPage(slug, state)
      setMessage('Saved successfully')
    } catch (err) {
      setMessage(err.message)
    }
  }

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">About Nyakrom: {labels[slug] || slug}</h2>
      {message ? <p>{message}</p> : null}
      <form onSubmit={onSubmit} className="space-y-3">
        <input name="page_title" placeholder="Page Title" value={state.page_title || ''} onChange={onChange} className="w-full rounded border px-3 py-2" />
        <input name="subtitle" placeholder="Subtitle" value={state.subtitle || ''} onChange={onChange} className="w-full rounded border px-3 py-2" />
        <div className="flex gap-2 text-sm">
          <button type="button" onClick={() => wrapSelection('<strong>', '</strong>')}>Bold</button>
          <button type="button" onClick={() => wrapSelection('<em>', '</em>')}>Italic</button>
          <button type="button" onClick={() => wrapSelection('<u>', '</u>')}>Underline</button>
          <button type="button" onClick={() => wrapSelection('<h2>', '</h2>')}>H2</button>
          <button type="button" onClick={() => wrapSelection('<h3>', '</h3>')}>H3</button>
          <button type="button" onClick={() => wrapSelection('<ul><li>', '</li></ul>')}>Bullets</button>
          <button type="button" onClick={() => wrapSelection('<ol><li>', '</li></ol>')}>Numbered</button>
          <button type="button" onClick={() => wrapSelection('<blockquote>', '</blockquote>')}>Quote</button>
          <button type="button" onClick={() => wrapSelection('<a href="https://">', '</a>')}>Link</button>
          <label className="cursor-pointer">Image<input type="file" className="hidden" onChange={insertImage} /></label>
        </div>
        <textarea id="about-body" name="body" rows={16} value={state.body || ''} onChange={onChange} className="w-full rounded border px-3 py-2" />
        <label className="flex items-center gap-2"><input type="checkbox" name="published" checked={Boolean(state.published)} onChange={onChange} />Published</label>
        <input name="seo_meta_title" placeholder="SEO Meta Title" value={state.seo_meta_title || ''} onChange={onChange} className="w-full rounded border px-3 py-2" />
        <textarea name="seo_meta_description" placeholder="SEO Meta Description" value={state.seo_meta_description || ''} onChange={onChange} className="w-full rounded border px-3 py-2" />
        <input name="seo_share_image" placeholder="SEO Share Image URL" value={state.seo_share_image || ''} onChange={onChange} className="w-full rounded border px-3 py-2" />
        <button className="rounded bg-black px-4 py-2 text-white" type="submit">Save</button>
      </form>
    </section>
  )
}
