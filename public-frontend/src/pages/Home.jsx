import { useEffect, useMemo, useState } from 'react'
import { getCarousel, getHomepage } from '../api/endpoints.js'
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
        <h1>Carousel</h1>
        {carouselLoading ? (
          <p>Loading slides...</p>
        ) : slides.length === 0 ? (
          <p>No slides available.</p>
        ) : (
          <article>
            {slideImageUrl && (
              <img src={slideImageUrl} alt={slideTitle || 'Carousel slide'} />
            )}
            {slideTitle && <h2>{slideTitle}</h2>}
            {slideSubtitle && <p>{slideSubtitle}</p>}
            {slideCtaText && slideCtaUrl && (
              <p>
                <a href={slideCtaUrl}>{slideCtaText}</a>
              </p>
            )}
            <nav aria-label="Carousel controls">
              <button
                type="button"
                onClick={() =>
                  setActiveSlide((prev) =>
                    slides.length ? (prev - 1 + slides.length) % slides.length : 0,
                  )
                }
                disabled={slides.length < 2}
              >
                Prev
              </button>
              <span>
                Slide {activeSlide + 1} of {slides.length}
              </span>
              <button
                type="button"
                onClick={() =>
                  setActiveSlide((prev) =>
                    slides.length ? (prev + 1) % slides.length : 0,
                  )
                }
                disabled={slides.length < 2}
              >
                Next
              </button>
            </nav>
          </article>
        )}
        {carouselError && (
          <p>Slides are unavailable right now, but the homepage is loaded.</p>
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
