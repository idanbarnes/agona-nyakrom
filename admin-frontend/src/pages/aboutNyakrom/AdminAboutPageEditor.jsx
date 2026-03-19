import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { getAuthToken } from '../../lib/auth.js'
import {
  getAboutPage,
  saveAboutPage,
  uploadAboutInlineImage,
} from '../../services/api/adminAboutNyakromApi.js'
import SimpleRichTextEditor from '../../components/richText/SimpleRichTextEditor.jsx'
import PhotoUploadField from '../../components/forms/PhotoUploadField.jsx'
import FormActions from '../../components/ui/form-actions.jsx'
import { resolveAdminCancelTarget } from '../../lib/adminCancelTarget.js'

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
  const location = useLocation()
  const navigate = useNavigate()
  const [state, setState] = useState(initialState)
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const [submitAction, setSubmitAction] = useState('publish')
  const cancelTarget = resolveAdminCancelTarget(location.pathname)

  useEffect(() => {
    if (!getAuthToken()) return navigate('/login', { replace: true })
    getAboutPage(slug)
      .then((res) => setState({ ...initialState, ...(res.data || res) }))
      .catch((err) => {
        setMessage(err?.message || 'Unable to load page details.')
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
  const onSubmit = async (action = 'publish') => {
    setSaving(true)
    setMessage('')
    setSubmitAction(action)
    try {
      const nextState = { ...state, published: action === 'publish' }
      await saveAboutPage(slug, nextState)
      setState((current) => ({ ...current, published: nextState.published }))
      setMessage(
        nextState.published
          ? 'Page published successfully.'
          : 'Page saved as draft successfully.'
      )
    } catch (err) {
      setMessage(err.message || 'Unable to save page.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">About Nyakrom: {labels[slug] || slug}</h2>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void onSubmit('publish')
        }}
        className="space-y-3"
      >
        <input name="page_title" placeholder="Page Title" value={state.page_title || ''} onChange={onChange} className="w-full rounded border px-3 py-2" />
        <input name="subtitle" placeholder="Subtitle (optional)" value={state.subtitle || ''} onChange={onChange} className="w-full rounded border px-3 py-2" />

        <SimpleRichTextEditor
          textareaId="about-body"
          value={state.body || ''}
          onChange={(nextBody) => setState((s) => ({ ...s, body: nextBody }))}
          onUploadImage={uploadBodyImage}
        />

        <input name="seo_meta_title" placeholder="SEO Meta Title (optional)" value={state.seo_meta_title || ''} onChange={onChange} className="w-full rounded border px-3 py-2" />
        <textarea name="seo_meta_description" placeholder="SEO Meta Description (optional)" value={state.seo_meta_description || ''} onChange={onChange} className="w-full rounded border px-3 py-2" />
        <div className="rounded-xl border border-border bg-background/60">
          <PhotoUploadField
            label="SEO Share Image URL (optional)"
            value={state.seo_share_image || ''}
            valueType="url"
            valueName="seo_share_image"
            onValueChange={onChange}
            valuePlaceholder="https://example.com/share-image.jpg"
            fileId="seo_share_image_file"
            fileName="seo_share_image_file"
            acceptedFileTypes="image/*"
            onChange={insertSeoImage}
            existingAssetUrl={state.seo_share_image || ''}
          />
        </div>
        <FormActions
          mode="publish"
          onCancel={() => navigate(cancelTarget)}
          onAction={(action) => {
            void onSubmit(action)
          }}
          isSubmitting={saving}
          submitAction={submitAction}
        />
      </form>
    </section>
  )
}
