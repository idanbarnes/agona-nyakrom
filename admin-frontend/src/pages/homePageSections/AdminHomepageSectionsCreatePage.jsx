import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createBlock } from '../../services/api/adminHomepageBlocksApi.js'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'
import {
  Button,
  Card,
  CardContent,
  CardFooter,
  FormField,
  InlineError,
  Input,
  Select,
  Textarea,
} from '../../components/ui/index.jsx'

const BLOCK_TYPE_OPTIONS = [
  { value: '', label: 'Select block type' },
  { value: 'editorial_feature', label: 'Editorial Feature' },
  { value: 'hall_of_fame_spotlight', label: 'Hall of Fame Spotlight' },
  { value: 'news_highlight', label: 'News Highlight' },
  { value: 'cultural_break', label: 'Cultural Break' },
  { value: 'gateway_links', label: 'Gateway Links' },
]

const THEME_VARIANTS = [
  { value: 'default', label: 'Default' },
  { value: 'muted', label: 'Muted' },
  { value: 'accent', label: 'Accent' },
  { value: 'image_bg', label: 'Image' },
]

const CONTAINER_WIDTHS = [
  { value: 'standard', label: 'Standard' },
  { value: 'wide', label: 'Wide' },
  { value: 'full_bleed', label: 'Full Bleed' },
]

const parseIdList = (value) => {
  if (!value) {
    return []
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function AdminHomepageSectionsCreatePage() {
  const navigate = useNavigate()
  const [formState, setFormState] = useState({
    block_type: '',
    title: '',
    subtitle: '',
    body: '',
    cta_label: '',
    cta_href: '',
    theme_variant: 'default',
    container_width: 'standard',
    display_order: '',
    is_published: false,
    media_image_id: '',
    media_image_file: null,
    media_alt_text: '',
    layout_variant: 'image_right',
    hof_selection_mode: 'random',
    hof_items_count: 3,
    hof_manual_item_ids: '',
    hof_filter_tag: '',
    hof_show_cta: true,
    hof_cta_label: 'View Hall of Fame',
    hof_cta_href: '/hall-of-fame',
    news_source: 'news',
    news_feature_mode: 'latest',
    news_featured_item_id: '',
    news_list_count: 4,
    news_show_dates: true,
    news_cta_label: 'View Updates',
    news_cta_href: '/updates',
    quote_text: '',
    quote_author: '',
    background_style: 'solid',
    background_image_id: '',
    background_overlay_strength: 'medium',
    gateway_items: '[]',
    gateway_columns_desktop: 3,
    gateway_columns_tablet: 2,
    gateway_columns_mobile: 1,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const blockType = formState.block_type

  const gatewayItemsHint = useMemo(
    () =>
      '[\n  { "label": "History", "description": "Discover our story", "href": "/history" }\n]',
    []
  )

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    const nextValue = type === 'checkbox' ? checked : value
    setFormState((current) => ({ ...current, [name]: nextValue }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null
    setFormState((current) => ({ ...current, media_image_file: file }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    if (!getAuthToken()) {
      navigate('/login', { replace: true })
      return
    }

    if (!formState.block_type) {
      setErrorMessage('Block type is required.')
      return
    }

    if (
      formState.display_order === '' ||
      Number.isNaN(Number(formState.display_order))
    ) {
      setErrorMessage('Display order is required.')
      return
    }

    if (blockType === 'cultural_break' && !formState.quote_text.trim()) {
      setErrorMessage('Quote text is required for a cultural break.')
      return
    }

    let parsedGatewayItems = []
    if (blockType === 'gateway_links') {
      try {
        parsedGatewayItems = JSON.parse(formState.gateway_items || '[]')
        if (!Array.isArray(parsedGatewayItems) || parsedGatewayItems.length === 0) {
          setErrorMessage('Gateway links require at least one item.')
          return
        }
      } catch (error) {
        setErrorMessage('Gateway items must be valid JSON.')
        return
      }
    }

    const payload = {
      block_type: formState.block_type,
      title: formState.title.trim(),
      subtitle: formState.subtitle.trim(),
      body: formState.body.trim(),
      cta_label: formState.cta_label.trim(),
      cta_href: formState.cta_href.trim(),
      theme_variant: formState.theme_variant,
      container_width: formState.container_width,
      display_order: Number(formState.display_order),
      is_published: formState.is_published,
      media_image_id: formState.media_image_id.trim(),
      media_alt_text: formState.media_alt_text.trim(),
      layout_variant: formState.layout_variant,
      hof_selection_mode: formState.hof_selection_mode,
      hof_items_count: Number(formState.hof_items_count),
      hof_manual_item_ids: parseIdList(formState.hof_manual_item_ids),
      hof_filter_tag: formState.hof_filter_tag.trim(),
      hof_show_cta: formState.hof_show_cta,
      hof_cta_label: formState.hof_cta_label.trim(),
      hof_cta_href: formState.hof_cta_href.trim(),
      news_source: formState.news_source,
      news_feature_mode: formState.news_feature_mode,
      news_featured_item_id: formState.news_featured_item_id.trim(),
      news_list_count: Number(formState.news_list_count),
      news_show_dates: formState.news_show_dates,
      news_cta_label: formState.news_cta_label.trim(),
      news_cta_href: formState.news_cta_href.trim(),
      quote_text: formState.quote_text.trim(),
      quote_author: formState.quote_author.trim(),
      background_style: formState.background_style,
      background_image_id: formState.background_image_id.trim(),
      background_overlay_strength: formState.background_overlay_strength,
      gateway_items:
        blockType === 'gateway_links' ? parsedGatewayItems : undefined,
      gateway_columns_desktop: Number(formState.gateway_columns_desktop),
      gateway_columns_tablet: Number(formState.gateway_columns_tablet),
      gateway_columns_mobile: Number(formState.gateway_columns_mobile),
    }

    const hasFile = Boolean(formState.media_image_file)
    const formData = new FormData()

    if (hasFile) {
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined) {
          return
        }
        if (key === 'gateway_items') {
          formData.append(key, JSON.stringify(value))
          return
        }
        formData.append(key, String(value ?? ''))
      })
      formData.append('image', formState.media_image_file)
    }

    setIsSubmitting(true)
    try {
      const response = await createBlock(hasFile ? formData : payload)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to create block.')
      }
      window.alert('Homepage block created successfully')
      navigate('/admin/homepage-sections', { replace: true })
    } catch (error) {
      if (error.status === 401) {
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to create block.'
      setErrorMessage(message)
      window.alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold break-words md:text-2xl">
          Add Homepage Block
        </h1>
        <p className="text-sm text-muted-foreground">
          Configure the block layout, content, and visibility for the homepage.
        </p>
      </header>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="space-y-5 md:space-y-6">
            <InlineError message={errorMessage} />
            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Block type" htmlFor="block_type" required>
                <Select
                  id="block_type"
                  name="block_type"
                  value={formState.block_type}
                  onChange={handleChange}
                  required
                >
                  {BLOCK_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Display order" htmlFor="display_order" required>
                <Input
                  id="display_order"
                  name="display_order"
                  type="number"
                  value={formState.display_order}
                  onChange={handleChange}
                  required
                />
              </FormField>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="Title" htmlFor="title">
                <Input
                  id="title"
                  name="title"
                  type="text"
                  value={formState.title}
                  onChange={handleChange}
                />
              </FormField>

              <FormField label="Subtitle" htmlFor="subtitle">
                <Input
                  id="subtitle"
                  name="subtitle"
                  type="text"
                  value={formState.subtitle}
                  onChange={handleChange}
                />
              </FormField>
            </div>

            <FormField label="Body" htmlFor="body">
              <Textarea
                id="body"
                name="body"
                value={formState.body}
                onChange={handleChange}
              />
            </FormField>

            <div className="grid gap-5 md:grid-cols-2">
              <FormField label="CTA label" htmlFor="cta_label">
                <Input
                  id="cta_label"
                  name="cta_label"
                  type="text"
                  value={formState.cta_label}
                  onChange={handleChange}
                />
              </FormField>

              <FormField label="CTA link" htmlFor="cta_href">
                <Input
                  id="cta_href"
                  name="cta_href"
                  type="text"
                  value={formState.cta_href}
                  onChange={handleChange}
                />
              </FormField>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <FormField label="Theme variant" htmlFor="theme_variant">
                <Select
                  id="theme_variant"
                  name="theme_variant"
                  value={formState.theme_variant}
                  onChange={handleChange}
                >
                  {THEME_VARIANTS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Container width" htmlFor="container_width">
                <Select
                  id="container_width"
                  name="container_width"
                  value={formState.container_width}
                  onChange={handleChange}
                >
                  {CONTAINER_WIDTHS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Published" htmlFor="is_published">
                <div className="flex items-center gap-2">
                  <input
                    id="is_published"
                    name="is_published"
                    type="checkbox"
                    checked={formState.is_published}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <span className="text-sm text-muted-foreground">
                    Publish this block immediately.
                  </span>
                </div>
              </FormField>
            </div>

            {blockType === 'editorial_feature' && (
              <div className="space-y-5 rounded-xl border border-border/60 bg-muted/20 p-4">
                <p className="text-sm font-medium text-foreground">
                  Editorial Feature Settings
                </p>
                <div className="grid gap-5 md:grid-cols-2">
                  <FormField label="Layout variant" htmlFor="layout_variant">
                    <Select
                      id="layout_variant"
                      name="layout_variant"
                      value={formState.layout_variant}
                      onChange={handleChange}
                    >
                      <option value="image_right">Image Right</option>
                      <option value="image_left">Image Left</option>
                      <option value="text_only">Text Only</option>
                    </Select>
                  </FormField>

                  <FormField label="Image alt text" htmlFor="media_alt_text">
                    <Input
                      id="media_alt_text"
                      name="media_alt_text"
                      type="text"
                      value={formState.media_alt_text}
                      onChange={handleChange}
                    />
                  </FormField>
                </div>

                <FormField label="Image upload" htmlFor="media_image_file">
                  <div className="rounded-lg border border-border bg-background p-4">
                    <Input
                      id="media_image_file"
                      name="media_image_file"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                </FormField>
              </div>
            )}

            {blockType === 'hall_of_fame_spotlight' && (
              <div className="space-y-5 rounded-xl border border-border/60 bg-muted/20 p-4">
                <p className="text-sm font-medium text-foreground">
                  Hall of Fame Spotlight Settings
                </p>
                <div className="grid gap-5 md:grid-cols-3">
                  <FormField
                    label="Selection mode"
                    htmlFor="hof_selection_mode"
                  >
                    <Select
                      id="hof_selection_mode"
                      name="hof_selection_mode"
                      value={formState.hof_selection_mode}
                      onChange={handleChange}
                    >
                      <option value="random">Random</option>
                      <option value="rotate_daily">Rotate Daily</option>
                      <option value="manual">Manual</option>
                    </Select>
                  </FormField>

                  <FormField label="Items count" htmlFor="hof_items_count">
                    <Input
                      id="hof_items_count"
                      name="hof_items_count"
                      type="number"
                      value={formState.hof_items_count}
                      onChange={handleChange}
                    />
                  </FormField>

                  <FormField label="Filter tag" htmlFor="hof_filter_tag">
                    <Input
                      id="hof_filter_tag"
                      name="hof_filter_tag"
                      type="text"
                      value={formState.hof_filter_tag}
                      onChange={handleChange}
                    />
                  </FormField>
                </div>

                <FormField
                  label="Manual item IDs (comma separated)"
                  htmlFor="hof_manual_item_ids"
                >
                  <Input
                    id="hof_manual_item_ids"
                    name="hof_manual_item_ids"
                    type="text"
                    value={formState.hof_manual_item_ids}
                    onChange={handleChange}
                    placeholder="uuid-1, uuid-2"
                  />
                </FormField>

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField label="Show CTA" htmlFor="hof_show_cta">
                    <div className="flex items-center gap-2">
                      <input
                        id="hof_show_cta"
                        name="hof_show_cta"
                        type="checkbox"
                        checked={formState.hof_show_cta}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <span className="text-sm text-muted-foreground">
                        Display a link to the Hall of Fame page.
                      </span>
                    </div>
                  </FormField>

                  <FormField label="CTA label" htmlFor="hof_cta_label">
                    <Input
                      id="hof_cta_label"
                      name="hof_cta_label"
                      type="text"
                      value={formState.hof_cta_label}
                      onChange={handleChange}
                    />
                  </FormField>
                </div>

                <FormField label="CTA link" htmlFor="hof_cta_href">
                  <Input
                    id="hof_cta_href"
                    name="hof_cta_href"
                    type="text"
                    value={formState.hof_cta_href}
                    onChange={handleChange}
                  />
                </FormField>
              </div>
            )}

            {blockType === 'news_highlight' && (
              <div className="space-y-5 rounded-xl border border-border/60 bg-muted/20 p-4">
                <p className="text-sm font-medium text-foreground">
                  News Highlight Settings
                </p>
                <div className="grid gap-5 md:grid-cols-3">
                  <FormField label="News source" htmlFor="news_source">
                    <Select
                      id="news_source"
                      name="news_source"
                      value={formState.news_source}
                      onChange={handleChange}
                    >
                      <option value="news">News</option>
                      <option value="announcements">Announcements</option>
                      <option value="mixed">Mixed</option>
                    </Select>
                  </FormField>

                  <FormField
                    label="Featured mode"
                    htmlFor="news_feature_mode"
                  >
                    <Select
                      id="news_feature_mode"
                      name="news_feature_mode"
                      value={formState.news_feature_mode}
                      onChange={handleChange}
                    >
                      <option value="latest">Latest</option>
                      <option value="manual">Manual</option>
                    </Select>
                  </FormField>

                  <FormField label="List count" htmlFor="news_list_count">
                    <Input
                      id="news_list_count"
                      name="news_list_count"
                      type="number"
                      value={formState.news_list_count}
                      onChange={handleChange}
                    />
                  </FormField>
                </div>

                <FormField
                  label="Featured item ID"
                  htmlFor="news_featured_item_id"
                >
                  <Input
                    id="news_featured_item_id"
                    name="news_featured_item_id"
                    type="text"
                    value={formState.news_featured_item_id}
                    onChange={handleChange}
                    placeholder="uuid"
                  />
                </FormField>

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField label="Show dates" htmlFor="news_show_dates">
                    <div className="flex items-center gap-2">
                      <input
                        id="news_show_dates"
                        name="news_show_dates"
                        type="checkbox"
                        checked={formState.news_show_dates}
                        onChange={handleChange}
                        className="h-4 w-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      <span className="text-sm text-muted-foreground">
                        Show publish dates in the list.
                      </span>
                    </div>
                  </FormField>

                  <FormField label="CTA label" htmlFor="news_cta_label">
                    <Input
                      id="news_cta_label"
                      name="news_cta_label"
                      type="text"
                      value={formState.news_cta_label}
                      onChange={handleChange}
                    />
                  </FormField>
                </div>

                <FormField label="CTA link" htmlFor="news_cta_href">
                  <Input
                    id="news_cta_href"
                    name="news_cta_href"
                    type="text"
                    value={formState.news_cta_href}
                    onChange={handleChange}
                  />
                </FormField>
              </div>
            )}

            {blockType === 'cultural_break' && (
              <div className="space-y-5 rounded-xl border border-border/60 bg-muted/20 p-4">
                <p className="text-sm font-medium text-foreground">
                  Cultural Break Settings
                </p>
                <FormField label="Quote text" htmlFor="quote_text" required>
                  <Textarea
                    id="quote_text"
                    name="quote_text"
                    value={formState.quote_text}
                    onChange={handleChange}
                    required
                  />
                </FormField>

                <FormField label="Quote author" htmlFor="quote_author">
                  <Input
                    id="quote_author"
                    name="quote_author"
                    type="text"
                    value={formState.quote_author}
                    onChange={handleChange}
                  />
                </FormField>

                <div className="grid gap-5 md:grid-cols-3">
                  <FormField
                    label="Background style"
                    htmlFor="background_style"
                  >
                    <Select
                      id="background_style"
                      name="background_style"
                      value={formState.background_style}
                      onChange={handleChange}
                    >
                      <option value="solid">Solid</option>
                      <option value="gradient">Gradient</option>
                      <option value="image">Image</option>
                    </Select>
                  </FormField>

                  <FormField
                    label="Overlay strength"
                    htmlFor="background_overlay_strength"
                  >
                    <Select
                      id="background_overlay_strength"
                      name="background_overlay_strength"
                      value={formState.background_overlay_strength}
                      onChange={handleChange}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </Select>
                  </FormField>

                  <FormField label="Background image URL" htmlFor="background_image_id">
                    <Input
                      id="background_image_id"
                      name="background_image_id"
                      type="text"
                      value={formState.background_image_id}
                      onChange={handleChange}
                    />
                  </FormField>
                </div>
              </div>
            )}

            {blockType === 'gateway_links' && (
              <div className="space-y-5 rounded-xl border border-border/60 bg-muted/20 p-4">
                <p className="text-sm font-medium text-foreground">
                  Gateway Links Settings
                </p>
                <FormField
                  label="Gateway items (JSON array)"
                  htmlFor="gateway_items"
                  required
                  helpText={
                    <span className="text-xs text-muted-foreground">
                      Example: {gatewayItemsHint}
                    </span>
                  }
                >
                  <Textarea
                    id="gateway_items"
                    name="gateway_items"
                    value={formState.gateway_items}
                    onChange={handleChange}
                    rows={6}
                    required
                  />
                </FormField>

                <div className="grid gap-5 md:grid-cols-3">
                  <FormField
                    label="Desktop columns"
                    htmlFor="gateway_columns_desktop"
                  >
                    <Input
                      id="gateway_columns_desktop"
                      name="gateway_columns_desktop"
                      type="number"
                      value={formState.gateway_columns_desktop}
                      onChange={handleChange}
                    />
                  </FormField>

                  <FormField
                    label="Tablet columns"
                    htmlFor="gateway_columns_tablet"
                  >
                    <Input
                      id="gateway_columns_tablet"
                      name="gateway_columns_tablet"
                      type="number"
                      value={formState.gateway_columns_tablet}
                      onChange={handleChange}
                    />
                  </FormField>

                  <FormField
                    label="Mobile columns"
                    htmlFor="gateway_columns_mobile"
                  >
                    <Input
                      id="gateway_columns_mobile"
                      name="gateway_columns_mobile"
                      type="number"
                      value={formState.gateway_columns_mobile}
                      onChange={handleChange}
                    />
                  </FormField>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              variant="secondary"
              type="button"
              onClick={() => navigate('/admin/homepage-sections')}
            >
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create block'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default AdminHomepageSectionsCreatePage
