import { useEffect, useMemo, useState } from 'react'
import { getCarousel, getHomepage } from '../api/endpoints.js'
import {
  Button,
  Card,
  CardContent,
  ErrorState,
  ImageWithFallback,
  Skeleton,
} from '../components/ui/index.jsx'
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

// Prefer processed banner variants, falling back through common image sizes.
function selectSlideImages(slide) {
  const images = slide?.images || {}

  const desktop =
    images.desktop ||
    images.large ||
    images.original ||
    slide?.image ||
    slide?.image_url ||
    ''
  const tablet =
    images.tablet ||
    images.medium ||
    images.large ||
    images.original ||
    slide?.image ||
    slide?.image_url ||
    ''
  const mobile =
    images.mobile ||
    images.thumbnail ||
    images.medium ||
    images.large ||
    images.original ||
    slide?.image ||
    slide?.image_url ||
    ''

  return { desktop, tablet, mobile }
}

function selectSectionImage(section) {
  const images = section?.images || {}

  return (
    images.large ||
    images.medium ||
    images.thumbnail ||
    images.original ||
    section?.image ||
    section?.image_url ||
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

function selectItemImage(item) {
  if (!item || typeof item !== 'object') {
    return ''
  }

  const images = item?.images || {}

  return (
    images.medium ||
    images.thumbnail ||
    images.large ||
    images.original ||
    item?.image ||
    item?.image_url ||
    item?.thumbnail ||
    item?.thumbnail_url ||
    ''
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
        setHomepage(homepageResult.value?.data ?? homepageResult.value)
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

  useEffect(() => {
    if (slides.length < 2) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length)
    }, 7000)

    return () => window.clearInterval(timer)
  }, [slides.length])

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
  const slideImages = selectSlideImages(activeSlideData)
  const primarySlideImage =
    slideImages.desktop || slideImages.tablet || slideImages.mobile
  const slideImageUrl = primarySlideImage ? resolveAssetUrl(primarySlideImage) : ''
  const slideSrcSet = [
    slideImages.mobile ? `${resolveAssetUrl(slideImages.mobile)} 768w` : null,
    slideImages.tablet ? `${resolveAssetUrl(slideImages.tablet)} 1280w` : null,
    slideImages.desktop ? `${resolveAssetUrl(slideImages.desktop)} 1920w` : null,
  ]
    .filter(Boolean)
    .join(', ')

  const showHero =
    heroTitle ||
    heroSubtitle ||
    (heroCtaText && heroCtaLink) ||
    settings?.siteName

  if (loading) {
    return (
      <section className="container space-y-3 py-6 md:py-10">
        <p className="text-sm text-muted-foreground">
          Loading homepage data...
        </p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="container space-y-3 py-6 md:py-10">
        <p className="text-sm text-muted-foreground">
          Unable to load homepage data.
        </p>
        <pre className="text-sm text-muted-foreground">
          {error?.message || String(error)}
        </pre>
      </section>
    )
  }

  return (
    <section className="space-y-12 md:space-y-16">
      <section className="container">
        {carouselLoading ? (
          <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
            <div className="flex h-[55vh] flex-col justify-end p-6 md:h-[65vh] md:p-10 lg:h-[80vh]">
              <div className="space-y-4">
                <Skeleton className="h-6 w-2/3 bg-muted/70" />
                <Skeleton className="h-4 w-1/2 bg-muted/70" />
                <Skeleton className="h-10 w-32 bg-muted/70" />
              </div>
            </div>
          </div>
        ) : slides.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/40 px-6 py-10 text-center text-sm text-muted-foreground">
            No slides available.
          </div>
        ) : (
          <article className="relative h-[55vh] overflow-hidden rounded-3xl border border-border bg-surface shadow-xl shadow-primary/10 md:h-[65vh] lg:h-[80vh]">
            <ImageWithFallback
              src={slideImageUrl}
              alt={slideTitle || 'Carousel slide'}
              fallbackText="No image"
              srcSet={slideSrcSet || undefined}
              sizes="(max-width: 768px) 768px, (max-width: 1024px) 1280px, 1920px"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/30 to-transparent" />
            <div className="absolute inset-0 flex items-end">
              <div className="max-w-xl space-y-4 p-6 text-white md:p-10">
                {slideTitle && (
                  <h2 className="text-2xl font-semibold leading-tight break-words md:text-4xl">
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
              className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4 md:px-6"
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
                className="group h-12 w-12 rounded-full border border-white/40 bg-black/35 text-white shadow-lg shadow-black/25 backdrop-blur transition hover:bg-black/55 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous slide"
              >
                <span
                  aria-hidden="true"
                  className="text-xl transition group-hover:-translate-x-0.5"
                >
                  ‹
                </span>
              </Button>
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
                className="group h-12 w-12 rounded-full border border-white/40 bg-black/35 text-white shadow-lg shadow-black/25 backdrop-blur transition hover:bg-black/55 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next slide"
              >
                <span
                  aria-hidden="true"
                  className="text-xl transition group-hover:translate-x-0.5"
                >
                  ›
                </span>
              </Button>
            </nav>
            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/20 bg-black/35 px-4 py-2 backdrop-blur">
              {slides.map((slide, index) => (
                <button
                  key={slide?.id || slide?.slug || index}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  className="flex h-6 w-10 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40"
                  aria-label={`Go to slide ${index + 1}`}
                  aria-current={index === activeSlide ? 'true' : undefined}
                >
                  <span
                    className={`h-2 w-full rounded-full transition ${
                      index === activeSlide ? 'bg-white' : 'bg-white/50'
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

      {showHero && (
        <section className="py-8 md:py-12">
          <div className="container">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                {heroTitle && (
                  <h2 className="text-2xl font-semibold break-words md:text-4xl">
                    {heroTitle}
                  </h2>
                )}
                {heroSubtitle && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {heroSubtitle}
                  </p>
                )}
              </div>
              {heroCtaText && heroCtaLink && (
                <Button as="a" href={heroCtaLink} variant="ghost">
                  {heroCtaText}
                </Button>
              )}
            </div>
            {settings?.siteName && (
              <p className="mt-4 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Site:</span>{' '}
                {settings.siteName}
              </p>
            )}
          </div>
        </section>
      )}

      {sections.length > 0 && (
        <section className="space-y-8 md:space-y-12">
          {sections.map((section, index) => {
            const sectionTitle = pickFirstString(
              section?.title,
              section?.name,
              `Section ${index + 1}`,
            )
            const sectionSubtitle = pickFirstString(
              section?.subtitle,
              section?.summary,
            )
            const sectionBody = pickFirstString(
              section?.content,
              section?.description,
            )
            const sectionImage = selectSectionImage(section)
            const sectionImageUrl = sectionImage
              ? resolveAssetUrl(sectionImage)
              : ''

            return (
              <section
                key={section?.id || section?.slug || index}
                className="border-t border-border py-8 md:py-12"
              >
                <div className="container">
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,_1.1fr)_minmax(0,_0.9fr)] lg:items-start">
                    <div className="space-y-3">
                      <div>
                        <h2 className="text-xl font-semibold break-words md:text-2xl">
                          {sectionTitle}
                        </h2>
                        {sectionSubtitle && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {sectionSubtitle}
                          </p>
                        )}
                      </div>
                      {sectionBody && (
                        <Card className="border border-border/70 bg-surface/90">
                          <CardContent className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                              {sectionBody}
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                    <div>
                      <Card className="overflow-hidden border border-border/70 bg-surface/90 shadow-sm">
                        {sectionImageUrl ? (
                          <div className="aspect-[4/3] w-full overflow-hidden bg-muted/40">
                            <ImageWithFallback
                              src={sectionImageUrl}
                              alt={sectionTitle}
                              fallbackText="No image"
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="flex h-full min-h-[220px] items-center justify-center bg-muted/40 text-sm text-muted-foreground">
                            No image available
                          </div>
                        )}
                      </Card>
                    </div>
                  </div>
                </div>
              </section>
            )
          })}
        </section>
      )}

      {featuredBlocks.length > 0 && (
        <section>
          {featuredBlocks.map((block, index) => {
            const blockTitle = pickFirstString(
              block?.title,
              block?.name,
              `Featured ${index + 1}`,
            )
            const blockSubtitle = pickFirstString(
              block?.subtitle,
              block?.summary,
            )
            return (
              <section
                key={block?.id || block?.title || index}
                className="border-t border-border py-8 md:py-12"
              >
                <div className="container">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold break-words md:text-2xl">
                        {blockTitle}
                      </h2>
                      {blockSubtitle && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {blockSubtitle}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-6">
                    {Array.isArray(block?.items) ? (
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {block.items.map((item, itemIndex) => {
                          const itemLabel = formatItemLabel(item)
                          const itemImagePath = selectItemImage(item)
                          const itemImageUrl = itemImagePath
                            ? resolveAssetUrl(itemImagePath)
                            : ''

                          return (
                            <Card
                              key={item?.id || item?.slug || itemIndex}
                              className="overflow-hidden"
                            >
                              {itemImageUrl && (
                                <div className="aspect-[4/3] w-full overflow-hidden bg-muted/40">
                                  <ImageWithFallback
                                    src={itemImageUrl}
                                    alt={itemLabel || 'Featured item'}
                                    fallbackText="No image"
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              )}
                              <CardContent className="space-y-2">
                                <p className="text-sm font-medium text-foreground">
                                  {itemLabel}
                                </p>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    ) : (
                      <Card>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {formatItemLabel(block?.items)}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </section>
            )
          })}
        </section>
      )}
    </section>
  )
}

export default Home
