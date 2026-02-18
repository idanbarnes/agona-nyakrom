import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getAsafoDetail } from '../../api/endpoints.js'
import RichTextRenderer from '../../components/RichTextRenderer.jsx'

export default function AsafoDetail() {
  const { slug } = useParams()
  const [item, setItem] = useState(null)

  useEffect(() => {
    getAsafoDetail(slug).then((res) => setItem(res?.data || null))
  }, [slug])

  if (!item) return <section className="container py-10">Loading...</section>

  return (
    <section className="bg-background py-10">
      <div className="container max-w-5xl space-y-4">
        <h1 className="text-3xl font-semibold">{item.title || item.name}</h1>
        <div className="rounded-2xl border border-border/70 bg-surface px-5 py-6 shadow-sm sm:px-8 sm:py-9 md:px-12">
          <RichTextRenderer html={item.body || ''} />
        </div>
      </div>
    </section>
  )
}
