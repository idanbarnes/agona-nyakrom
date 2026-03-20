import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getAsafoDetail } from '../../api/endpoints.js'
import RichTextRenderer from '../../components/RichTextRenderer.jsx'
import {
  EmptyState,
  ErrorState,
  RichContentPageSkeleton,
} from '../../components/ui/index.jsx'
import {
  ABOUT_SECTION_LABEL,
  PUBLIC_UI_LABELS,
} from '../../constants/publicChrome.js'
import { useDocumentTitle } from '../../lib/pageTitle.js'

export default function AsafoDetail() {
  const { slug } = useParams()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  useDocumentTitle(item?.title || item?.name || 'Asafo Companies')

  useEffect(() => {
    let cancelled = false

    setLoading(true)
    setError(null)

    getAsafoDetail(slug)
      .then((res) => {
        if (cancelled) {
          return
        }

        setItem(res?.data || null)
      })
      .catch((fetchError) => {
        if (cancelled) {
          return
        }

        setItem(null)
        setError(fetchError)
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [slug])

  if (loading) {
    return <RichContentPageSkeleton sectionLabel={ABOUT_SECTION_LABEL} />
  }

  if (error) {
    return (
      <section className="bg-background py-10 sm:py-12 lg:py-16">
        <div className="container max-w-5xl space-y-8">
          <header className="space-y-3 border-b border-border pb-6 sm:pb-8">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary/80">{ABOUT_SECTION_LABEL}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">Asafo Companies</h1>
          </header>
          <ErrorState
            title="Unable to load Asafo content"
            message={error?.message || PUBLIC_UI_LABELS.unableToLoadContentMessage}
          />
        </div>
      </section>
    )
  }

  if (!item) {
    return (
      <section className="bg-background py-10 sm:py-12 lg:py-16">
        <div className="container max-w-5xl space-y-8">
          <header className="space-y-3 border-b border-border pb-6 sm:pb-8">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary/80">{ABOUT_SECTION_LABEL}</p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">Asafo Companies</h1>
          </header>
          <EmptyState
            title={PUBLIC_UI_LABELS.contentNotAvailableTitle}
            description="This Asafo Companies page has not been published yet or is temporarily unavailable."
          />
        </div>
      </section>
    )
  }

  return (
    <section className="bg-background py-10 sm:py-12 lg:py-16">
      <div className="container max-w-5xl space-y-4">
        <header className="space-y-3 border-b border-border pb-6 sm:pb-8">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary/80">{ABOUT_SECTION_LABEL}</p>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">
            {item.title || item.name}
          </h1>
        </header>
        <div className="rounded-2xl border border-border/70 bg-surface px-5 py-6 shadow-sm sm:px-8 sm:py-9 md:px-12">
          <RichTextRenderer html={item.body || ''} />
        </div>
      </div>
    </section>
  )
}
