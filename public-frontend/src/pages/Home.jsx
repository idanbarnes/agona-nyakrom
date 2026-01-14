import { useEffect, useMemo, useState } from 'react'
import { getCarousel, getHomepage } from '../api/endpoints.js'
import { Button, ErrorState, ImageWithFallback, Skeleton } from '../components/ui/index.jsx'
import { resolveAssetUrl } from '../lib/apiBase.js'
import { usePublicSettings } from '../layouts/Layout.jsx'

function pickFirstString(...values) {
  return values.find((value) => typeof value === 'string' && value.trim())
}

function normalizeFeatured(featured) {
  if (Array.isArray(featured)) {
    return featured
  }

  if (featured && typeof featured === 'object') {
    return Object.entries(featured).map(([key, value]) => ({
      title: key,
      items: value,
    }))
  }

  return []
}

// Extract slide data across possible payload shapes.
function normalizeSlides(payload) {
  if (!payload) {
    return []
  }

  const data = payload?.data || payload

  if (Array.isArray(data)) {
    return data
  }

  return data?.items || data?.slides || []
}

// Prefer large images, falling back through common image sizes.
function selectSlideImage(slide) {
  const images = slide?.images || {}

  return (
    images.large ||
    images.medium ||
    images.thumbnail ||
    images.original ||
    slide?.image ||
    slide?.image_url ||
    ''
  )
}

function formatItemLabel(item) {
  if (!item) {
    return ''
  }

  if (typeof item === 'string' || typeof item === 'number') {
    return String(item)
  }

  return (
    item.title ||
    item.name ||
    item.slug ||
    item.id ||
    JSON.stringify(item)
  )
}

function Home() {
  const [homepage, setHomepage] = useState(null)
  const [slides, setSlides] = useState([])
  const [activeSlide, setActiveSlide] = useState(0)
  const [carouselLoading, setCarouselLoading] = useState(true)
  const [carouselError, setCarouselError] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { settings } = usePublicSettings()

  useEffect(() => {
    let isMounted = true

    const loadHomepage = async () => {
      setLoading(true)
      setError(null)
      setCarouselLoading(true)
      setCarouselError(null)

      const [homepageResult, carouselResult] = await Promise.allSettled([
        getHomepage(),
        getCarousel(),
      ])

      if (!isMounted) {
        return
      }

      if (homepageResult.status === 'fulfilled') {
        setHomepage(homepageResult.value)
      } else {
        setError(homepageResult.reason)
      }

      if (carouselResult.status === 'fulfilled') {
        setSlides(normalizeSlides(carouselResult.value))
      } else {
        setCarouselError(carouselResult.reason)
      }

      setCarouselLoading(false)
      setLoading(false)
    }

    loadHomepage()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (slides.length > 0 && activeSlide >= slides.length) {
      setActiveSlide(0)
    }
  }, [activeSlide, slides.length])

  const hero = homepage?.hero || homepage?.heroSection || {}
  const heroTitle = pickFirstString(
    hero.title,
    homepage?.heroTitle,
    homepage?.title,
  )
  const heroSubtitle = pickFirstString(
    hero.subtitle,
    hero.tagline,
    homepage?.heroSubtitle,
    homepage?.subtitle,
  )
  const heroCtaText = pickFirstString(
    hero.ctaText,
    hero.cta?.text,
    homepage?.ctaText,
    homepage?.cta?.text,
  )
  const heroCtaLink = pickFirstString(
    hero.ctaLink,
    hero.cta?.link,
    homepage?.ctaLink,
    homepage?.cta?.link,
  )

  const sections = useMemo(() => {
    const rawSections =
      homepage?.sections ||
      homepage?.homepageSections ||
      homepage?.contentSections ||
      []

    return Array.isArray(rawSections) ? rawSections : []
  }, [homepage])

  const featuredBlocks = useMemo(() => {
    const featured =
      homepage?.featured ||
      homepage?.featuredBlocks ||
      homepage?.featuredContent ||
      homepage?.featuredSections
    return normalizeFeatured(featured)
  }, [homepage])

  const activeSlideData = slides[activeSlide]
  const slideTitle = pickFirstString(
    activeSlideData?.title,
    activeSlideData?.name,
  )
  const slideSubtitle = pickFirstString(
    activeSlideData?.subtitle,
    activeSlideData?.caption,
  )
  const slideCtaText = pickFirstString(
    activeSlideData?.cta_text,
    activeSlideData?.ctaText,
  )
  const slideCtaUrl = pickFirstString(
    activeSlideData?.cta_url,
    activeSlideData?.ctaUrl,
  )
  const slideImagePath = selectSlideImage(activeSlideData)
  const slideImageUrl = slideImagePath
    ? resolveAssetUrl(slideImagePath)
    : ''

  if (loading) {
    return (
      <section>
        <h1>Home</h1>
        <p>Loading homepage data...</p>
      </section>
    )
  }

  if (error) {
    return (
      <section>
        <h1>Home</h1>
        <p>Unable to load homepage data.</p>
        <pre>{error?.message || String(error)}</pre>
      </section>
    )
  }

  return (
    <section>
      <section>
        <h1 className="text-lg font-semibold text-foreground">Carousel</h1>
        {carouselLoading ? (
          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface">
            <div className="flex h-[360px] flex-col justify-end p-6 md:h-[560px] md:p-10">
              <div className="space-y-4">
                <Skeleton className="h-6 w-2/3 bg-muted/70" />
                <Skeleton className="h-4 w-1/2 bg-muted/70" />
                <Skeleton className="h-10 w-32 bg-muted/70" />
              </div>
            </div>
          </div>
        ) : slides.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-10 text-center text-sm text-muted-foreground">
            No slides available.
          </div>
        ) : (
          <article className="relative mt-4 h-[360px] overflow-hidden rounded-2xl border border-border bg-surface md:h-[560px]">
            <ImageWithFallback
              src={slideImageUrl}
              alt={slideTitle || 'Carousel slide'}
              fallbackText="No image"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute inset-0 flex items-end">
              <div className="max-w-xl space-y-3 p-6 text-white md:p-10">
                {slideTitle && (
                  <h2 className="text-2xl font-semibold leading-tight md:text-4xl">
                    {slideTitle}
                  </h2>
                )}
                {slideSubtitle && (
                  <p className="text-sm text-white/90 md:text-base">
                    {slideSubtitle}
                  </p>
                )}
                {slideCtaText && slideCtaUrl && (
                  <div>
                    <Button
                      as="a"
                      href={slideCtaUrl}
                      variant="primary"
                      className="shadow-lg shadow-black/20"
                    >
                      {slideCtaText}
                    </Button>
                  </div>
                )}
              </div>
            </div>
            <nav
              aria-label="Carousel controls"
              className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4"
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  setActiveSlide((prev) =>
                    slides.length ? (prev - 1 + slides.length) % slides.length : 0,
                  )
                }
                disabled={slides.length < 2}
                className="h-11 w-11 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
                aria-label="Previous slide"
              >
                <span aria-hidden="true">‹</span>
              </Button>
              <div className="hidden text-sm text-white/80 md:block">
                Slide {activeSlide + 1} of {slides.length}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  setActiveSlide((prev) =>
                    slides.length ? (prev + 1) % slides.length : 0,
                  )
                }
                disabled={slides.length < 2}
                className="h-11 w-11 rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/60"
                aria-label="Next slide"
              >
                <span aria-hidden="true">›</span>
              </Button>
            </nav>
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2">
              {slides.map((slide, index) => (
                <button
                  key={slide?.id || slide?.slug || index}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  className="flex h-8 w-8 items-center justify-center"
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === activeSlide ? 'true' : undefined}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full transition ${
                      index === activeSlide ? 'bg-white' : 'bg-white/60'
                    }`}
                  />
                </button>
              ))}
            </div>
          </article>
        )}
        {carouselError && (
          <ErrorState
            className="mt-4"
            title="Slides are unavailable"
            message="Slides are unavailable right now, but the homepage is loaded."
          />
        )}
      </section>

      <h1>{heroTitle || 'Home'}</h1>
      {heroSubtitle && <p>{heroSubtitle}</p>}
      {heroCtaText && heroCtaLink && (
        <p>
          <a href={heroCtaLink}>{heroCtaText}</a>
        </p>
      )}
      {settings?.siteName && (
        <p>
          <strong>Site:</strong> {settings.siteName}
        </p>
      )}

      {sections.length > 0 && (
        <section>
          <h2>Sections</h2>
          {sections.map((section, index) => (
            <article key={section?.id || section?.slug || index}>
              <h3>{section?.title || `Section ${index + 1}`}</h3>
              <p>{section?.content || section?.description}</p>
            </article>
          ))}
        </section>
      )}

      {featuredBlocks.length > 0 && (
        <section>
          <h2>Featured</h2>
          {featuredBlocks.map((block, index) => (
            <article key={block?.id || block?.title || index}>
              <h3>{block?.title || `Featured ${index + 1}`}</h3>
              {Array.isArray(block?.items) ? (
                <ul>
                  {block.items.map((item, itemIndex) => (
                    <li key={item?.id || item?.slug || itemIndex}>
                      {formatItemLabel(item)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>{formatItemLabel(block?.items)}</p>
              )}
            </article>
          ))}
        </section>
      )}
    </section>
  )
}

export default Home
