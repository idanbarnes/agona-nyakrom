import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { createBlock } from '../../services/api/adminHomepageBlocksApi.js'
import { getAuthToken } from '../../lib/auth.js'
import FormActions from '../../components/ui/form-actions.jsx'
import { resolveAdminCancelTarget } from '../../lib/adminCancelTarget.js'
import {
  Card,
  CardContent,
  CardFooter,
  FormField,
  InlineError,
  Input,
  Select,
  Textarea,
} from '../../components/ui/index.jsx'
import SimpleRichTextEditor from '../../components/richText/SimpleRichTextEditor.jsx'
import PhotoUploadField from '../../components/forms/PhotoUploadField.jsx'
import GatewayCardsManager from './GatewayCardsManager.jsx'
import WhoWeAreGalleryImagePreview from './WhoWeAreGalleryImagePreview.jsx'
import {
  buildPayload,
  getWhoWeAreDefaultGallery,
  getWhoWeAreDefaultStats,
  resetTypeSpecificFields,
  validateByType,
  WHO_WE_ARE_STAT_ICON_OPTIONS,
} from './homepageBlockFormUtils.js'

const BLOCK_TYPE_OPTIONS = [
  { value: '', label: 'Select block type' },
  { value: 'editorial_feature', label: 'Editorial Feature' },
  { value: 'who_we_are', label: 'Who We Are' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'hall_of_fame_spotlight', label: 'Hall of Fame Spotlight' },
  { value: 'news_highlight', label: 'News Highlight' },
  { value: 'cultural_break', label: 'Cultural Break' },
  { value: 'gateway_links', label: 'Gateway Links' },
]

const TEXT_CONTENT_BLOCK_TYPES = ['editorial_feature', 'welcome']
const WELCOME_TEMPLATE = {
  title: 'A Vision for Our Future',
  subtitle: 'Message from Leadership',
  body: [
    'As we stand at the crossroads of tradition and modernity, Nyakrom continues to embody the values that have sustained our community for generations. Our rich cultural heritage serves as the foundation upon which we build a prosperous future for all.',
    'Through unity, respect for our elders, and commitment to progress, we are creating opportunities that honor our past while embracing innovation. Our township thrives because of the dedication of every citizen who calls Nyakrom home.',
    'Together, we are not just preserving history - we are making it.',
  ].join('\n\n'),
  cta_label: 'Nana Kwame Asante',
  cta_href: 'Paramount Chief of Nyakrom',
  layout_variant: 'image_left',
  media_alt_text: 'Portrait representing Nyakrom leadership and heritage',
}

const applyWelcomeTemplate = (state) => ({
  ...state,
  title: state.title?.trim() ? state.title : WELCOME_TEMPLATE.title,
  subtitle: state.subtitle?.trim() ? state.subtitle : WELCOME_TEMPLATE.subtitle,
  body: state.body?.trim() ? state.body : WELCOME_TEMPLATE.body,
  cta_label: state.cta_label?.trim() ? state.cta_label : WELCOME_TEMPLATE.cta_label,
  cta_href: state.cta_href?.trim() ? state.cta_href : WELCOME_TEMPLATE.cta_href,
  layout_variant: state.layout_variant || WELCOME_TEMPLATE.layout_variant,
  media_alt_text: state.media_alt_text?.trim()
    ? state.media_alt_text
    : WELCOME_TEMPLATE.media_alt_text,
})

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

function AdminHomepageSectionsCreatePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const cancelTarget = resolveAdminCancelTarget(location.pathname)
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
    who_we_are_paragraph_one: '',
    who_we_are_stats: getWhoWeAreDefaultStats(),
    who_we_are_gallery: getWhoWeAreDefaultGallery(),
    who_we_are_gallery_files: [null, null, null, null],
    hof_selection_mode: 'random',
    hof_items_count: 3,
    hof_manual_item_ids: [],
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
    gateway_items: [],
    gateway_columns_desktop: 3,
    gateway_columns_tablet: 2,
    gateway_columns_mobile: 1,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitAction, setSubmitAction] = useState('publish')
  const [errorMessage, setErrorMessage] = useState('')

  const blockType = formState.block_type
  const isTextContentBlock = TEXT_CONTENT_BLOCK_TYPES.includes(blockType)
  const isWhoWeAreBlock = blockType === 'who_we_are'
  const isWelcomeBlock = blockType === 'welcome'
  const usesHomepageImagePreviewModal =
    blockType === 'welcome' || blockType === 'editorial_feature'

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    const nextValue = type === 'checkbox' ? checked : value
    if (name === 'block_type') {
      setFormState((current) => {
        const resetState = resetTypeSpecificFields(
          { ...current, [name]: nextValue },
          nextValue
        )
        const nextFormState = {
          ...resetState,
          who_we_are_gallery_files: [null, null, null, null],
        }
        if (nextValue === 'welcome') {
          return applyWelcomeTemplate(nextFormState)
        }
        return nextFormState
      })
      return
    }
    if (name === 'hof_selection_mode' && nextValue !== 'manual') {
      setFormState((current) => ({
        ...current,
        hof_selection_mode: nextValue,
        hof_manual_item_ids: [],
      }))
      return
    }
    if (name === 'news_feature_mode' && nextValue !== 'manual') {
      setFormState((current) => ({
        ...current,
        news_feature_mode: nextValue,
        news_featured_item_id: '',
      }))
      return
    }
    if (name === 'background_style' && nextValue !== 'image') {
      setFormState((current) => ({
        ...current,
        background_style: nextValue,
        background_image_id: '',
      }))
      return
    }
    if (name === 'hof_show_cta' && !nextValue) {
      setFormState((current) => ({
        ...current,
        hof_show_cta: false,
        hof_cta_label: '',
        hof_cta_href: '',
      }))
      return
    }
    setFormState((current) => ({ ...current, [name]: nextValue }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null
    setFormState((current) => ({ ...current, media_image_file: file }))
  }

  const handleWhoWeAreStatChange = (index, field, value) => {
    setFormState((current) => ({
      ...current,
      who_we_are_stats: (current.who_we_are_stats || []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }))
  }

  const handleWhoWeAreGalleryChange = (index, field, value) => {
    setFormState((current) => ({
      ...current,
      who_we_are_gallery: (current.who_we_are_gallery || []).map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }))
  }

  const handleWhoWeAreGalleryFileChange = (index, file) => {
    setFormState((current) => {
      const nextFiles = [...(current.who_we_are_gallery_files || [null, null, null, null])]
      nextFiles[index] = file || null
      return {
        ...current,
        who_we_are_gallery_files: nextFiles,
      }
    })
  }

  const handleSubmit = async (action) => {
    setErrorMessage('')
    setSubmitAction(action)

    if (!getAuthToken()) {
      navigate('/login', { replace: true })
      return
    }

    const errors = validateByType(formState, blockType)
    if (errors.length > 0) {
      setErrorMessage(errors.join(' '))
      return
    }

    const payload = {
      ...buildPayload(formState, blockType),
      is_published: action === 'publish',
    }

    const hasMainImageFile = isTextContentBlock && Boolean(formState.media_image_file)
    const hasWhoWeAreGalleryFiles =
      isWhoWeAreBlock &&
      (formState.who_we_are_gallery_files || []).some(Boolean)
    const hasFile = hasMainImageFile || hasWhoWeAreGalleryFiles
    const formData = new FormData()

    if (hasFile) {
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined) {
          return
        }
        if (
          key === 'gateway_items' ||
          key === 'who_we_are_stats' ||
          key === 'who_we_are_gallery'
        ) {
          formData.append(key, JSON.stringify(value))
          return
        }
        formData.append(key, String(value ?? ''))
      })
      if (hasMainImageFile) {
        formData.append('image', formState.media_image_file)
      }
      if (hasWhoWeAreGalleryFiles) {
        ;(formState.who_we_are_gallery_files || []).forEach((file, index) => {
          if (!file) {
            return
          }
          formData.append(`who_we_are_gallery_image_${index}`, file)
        })
      }
    }

    setIsSubmitting(true)
    try {
      const response = await createBlock(hasFile ? formData : payload)
      if (response?.success === false) {
        throw new Error(response?.message || 'Unable to create block.')
      }
      window.alert(
        action === 'draft'
          ? 'Homepage block draft saved successfully'
          : 'Homepage block published successfully',
      )
      navigate('/admin/homepage-sections', { replace: true })
    } catch (error) {

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
      <form>
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
              <FormField label={isWelcomeBlock ? 'Heading' : 'Title'} htmlFor="title">
                <Input
                  id="title"
                  name="title"
                  type="text"
                  value={formState.title}
                  onChange={handleChange}
                />
              </FormField>

              <FormField
                label={isWelcomeBlock ? 'Badge label' : 'Subtitle'}
                htmlFor="subtitle"
              >
                <Input
                  id="subtitle"
                  name="subtitle"
                  type="text"
                  value={formState.subtitle}
                  onChange={handleChange}
                />
              </FormField>
            </div>

            {isTextContentBlock && (
              <>
                <FormField label={isWelcomeBlock ? 'Message body' : 'Body'} htmlFor="body" required>
                  <Textarea
                    id="body"
                    name="body"
                    value={formState.body}
                    onChange={handleChange}
                  />
                </FormField>

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField
                    label={isWelcomeBlock ? 'Leader name' : 'CTA label'}
                    htmlFor="cta_label"
                  >
                    <Input
                      id="cta_label"
                      name="cta_label"
                      type="text"
                      value={formState.cta_label}
                      onChange={handleChange}
                    />
                  </FormField>

                  <FormField
                    label={isWelcomeBlock ? 'Leader role' : 'CTA link'}
                    htmlFor="cta_href"
                  >
                    <Input
                      id="cta_href"
                      name="cta_href"
                      type="text"
                      value={formState.cta_href}
                      onChange={handleChange}
                    />
                  </FormField>
                </div>
              </>
            )}

            {isWhoWeAreBlock && (
              <div className="space-y-5 rounded-xl border border-border/60 bg-muted/20 p-4">
                <p className="text-sm font-medium text-foreground">
                  Who We Are Content (Figma Structure)
                </p>

                <div className="grid gap-5 md:grid-cols-2">
                  <FormField
                    label="Primary CTA label"
                    htmlFor="cta_label"
                    required
                  >
                    <Input
                      id="cta_label"
                      name="cta_label"
                      type="text"
                      value={formState.cta_label}
                      onChange={handleChange}
                    />
                  </FormField>

                  <FormField
                    label="Primary CTA link"
                    htmlFor="cta_href"
                    required
                  >
                    <Input
                      id="cta_href"
                      name="cta_href"
                      type="text"
                      value={formState.cta_href}
                      onChange={handleChange}
                    />
                  </FormField>
                </div>

                <FormField
                  label="Paragraph one"
                  htmlFor="who_we_are_paragraph_one"
                  required
                >
                  <SimpleRichTextEditor
                    value={formState.who_we_are_paragraph_one}
                    onChange={(value) =>
                      setFormState((current) => ({
                        ...current,
                        who_we_are_paragraph_one: value,
                      }))
                    }
                    textareaId="who-we-are-paragraph-one-create"
                  />
                </FormField>

                <div className="space-y-4">
                  <p className="text-sm font-medium text-foreground">
                    Stats (exactly 4)
                  </p>
                  {(formState.who_we_are_stats || []).map((item, index) => (
                    <div
                      key={`stat-${index}`}
                      className="grid gap-4 rounded-lg border border-border bg-background p-4 md:grid-cols-3"
                    >
                      <FormField
                        label={`Stat ${index + 1} icon`}
                        htmlFor={`who_we_are_stats_${index}_icon`}
                        required
                      >
                        <Select
                          id={`who_we_are_stats_${index}_icon`}
                          value={item?.icon_key || ''}
                          onChange={(event) =>
                            handleWhoWeAreStatChange(
                              index,
                              'icon_key',
                              event.target.value
                            )
                          }
                        >
                          <option value="">Select icon</option>
                          {WHO_WE_ARE_STAT_ICON_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Select>
                      </FormField>

                      <FormField
                        label={`Stat ${index + 1} label`}
                        htmlFor={`who_we_are_stats_${index}_label`}
                        required
                      >
                        <Input
                          id={`who_we_are_stats_${index}_label`}
                          type="text"
                          value={item?.label || ''}
                          onChange={(event) =>
                            handleWhoWeAreStatChange(
                              index,
                              'label',
                              event.target.value
                            )
                          }
                        />
                      </FormField>

                      <FormField
                        label={`Stat ${index + 1} value`}
                        htmlFor={`who_we_are_stats_${index}_value`}
                        required
                      >
                        <Input
                          id={`who_we_are_stats_${index}_value`}
                          type="text"
                          value={item?.value || ''}
                          onChange={(event) =>
                            handleWhoWeAreStatChange(
                              index,
                              'value',
                              event.target.value
                            )
                          }
                        />
                      </FormField>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <p className="text-sm font-medium text-foreground">
                    Gallery images (exactly 4)
                  </p>
                  {(formState.who_we_are_gallery || []).map((item, index) => (
                    <div
                      key={`gallery-${index}`}
                      className="grid gap-4 rounded-lg border border-border bg-background p-4 md:grid-cols-2"
                    >
                      <FormField
                        label={`Image ${index + 1} upload`}
                        htmlFor={`who_we_are_gallery_${index}_image`}
                        required
                      >
                        <div className="rounded-xl border border-border bg-background/60">
                          <PhotoUploadField
                            label=""
                            value={formState.who_we_are_gallery_files?.[index]?.name || ''}
                            valueType="text"
                            valueId={`who_we_are_gallery_${index}_image`}
                            valuePlaceholder="Select image"
                            acceptedFileTypes="image/*"
                            onChange={(event) =>
                              handleWhoWeAreGalleryFileChange(
                                index,
                                event.target.files?.[0] || null
                              )
                            }
                          >
                            <WhoWeAreGalleryImagePreview
                              file={formState.who_we_are_gallery_files?.[index] || null}
                              imageUrl={
                                item?.image_id ||
                                item?.imageId ||
                                item?.image_url ||
                                item?.imageUrl ||
                                item?.url ||
                                item?.src ||
                                ''
                              }
                              altText={item?.alt_text || `Who We Are gallery image ${index + 1}`}
                            />
                          </PhotoUploadField>
                        </div>
                      </FormField>

                      <FormField
                        label={`Image ${index + 1} alt text`}
                        htmlFor={`who_we_are_gallery_${index}_alt`}
                      >
                        <Input
                          id={`who_we_are_gallery_${index}_alt`}
                          type="text"
                          value={item?.alt_text || ''}
                          onChange={(event) =>
                            handleWhoWeAreGalleryChange(
                              index,
                              'alt_text',
                              event.target.value
                            )
                          }
                        />
                      </FormField>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-5 md:grid-cols-2">
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

            </div>

            {isTextContentBlock && (
              <div className="space-y-5 rounded-xl border border-border/60 bg-muted/20 p-4">
                <p className="text-sm font-medium text-foreground">
                  {isWelcomeBlock ? 'Welcome Message Settings' : 'Content Block Settings'}
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

                <FormField
                  label="Image upload"
                  htmlFor="media_image_file"
                  helpText={
                    isWelcomeBlock
                      ? 'Upload the leadership portrait/image shown on the left side of the Welcome block.'
                      : null
                  }
                >
	                  <div className="rounded-xl border border-border bg-background/60">
	                    <PhotoUploadField
	                      label=""
	                      value={formState.media_image_file?.name || ''}
                      valueType="text"
                      valueId="media_image_file"
                      fileId="media_image_file_input"
                      fileName="media_image_file"
	                      valuePlaceholder="Select image"
	                      acceptedFileTypes="image/*"
	                      onChange={handleFileChange}
	                    >
	                      {usesHomepageImagePreviewModal ? (
	                        <WhoWeAreGalleryImagePreview
	                          file={formState.media_image_file || null}
	                          imageUrl={formState.media_image_id || ''}
	                          altText={
	                            formState.media_alt_text ||
	                            `${
	                              isWelcomeBlock ? 'Welcome' : 'Editorial Feature'
	                            } block image preview`
	                          }
	                        />
	                      ) : null}
	                    </PhotoUploadField>
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

                {formState.hof_selection_mode === 'manual' && (
                  <FormField
                    label="Manual item IDs (comma separated)"
                    htmlFor="hof_manual_item_ids"
                  >
                    <Input
                      id="hof_manual_item_ids"
                      name="hof_manual_item_ids"
                      type="text"
                      value={formState.hof_manual_item_ids.join(', ')}
                      onChange={(event) =>
                        setFormState((current) => ({
                          ...current,
                          hof_manual_item_ids: event.target.value
                            .split(',')
                            .map((item) => item.trim())
                            .filter(Boolean),
                        }))
                      }
                      placeholder="uuid-1, uuid-2"
                    />
                  </FormField>
                )}

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

                  {formState.hof_show_cta && (
                    <FormField label="CTA label" htmlFor="hof_cta_label">
                      <Input
                        id="hof_cta_label"
                        name="hof_cta_label"
                        type="text"
                        value={formState.hof_cta_label}
                        onChange={handleChange}
                      />
                    </FormField>
                  )}
                </div>

                {formState.hof_show_cta && (
                  <FormField label="CTA link" htmlFor="hof_cta_href">
                    <Input
                      id="hof_cta_href"
                      name="hof_cta_href"
                      type="text"
                      value={formState.hof_cta_href}
                      onChange={handleChange}
                    />
                  </FormField>
                )}
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

                {formState.news_feature_mode === 'manual' && (
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
                )}

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

                  {formState.background_style === 'image' && (
                    <FormField
                      label="Background image URL"
                      htmlFor="background_image_id"
                    >
                      <Input
                        id="background_image_id"
                        name="background_image_id"
                        type="text"
                        value={formState.background_image_id}
                        onChange={handleChange}
                      />
                    </FormField>
                  )}
                </div>
              </div>
            )}

            {blockType === 'gateway_links' && (
              <div className="space-y-5 rounded-xl border border-border/60 bg-muted/20 p-4">
                <p className="text-sm font-medium text-foreground">
                  Gateway Links Settings
                </p>

                <GatewayCardsManager
                  items={formState.gateway_items}
                  onChange={(items) =>
                    setFormState((current) => ({ ...current, gateway_items: items }))
                  }
                />

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
            <FormActions
              mode="publish"
              onCancel={() => navigate(cancelTarget)}
              onAction={(action) => {
                void handleSubmit(action)
              }}
              isSubmitting={isSubmitting}
              submitAction={submitAction}
              disableCancel={isSubmitting}
            />
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}

export default AdminHomepageSectionsCreatePage
