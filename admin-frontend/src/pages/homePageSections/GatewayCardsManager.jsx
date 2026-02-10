import { useMemo, useState } from 'react'
import {
  Button,
  FormField,
  Input,
  Select,
  Textarea,
} from '../../components/ui/index.jsx'
import { ICON_KEY_OPTIONS, getInternalLinkOptions, sanitizeGatewayItems } from './homepageBlockFormUtils.js'

const emptyCard = {
  label: '',
  description: '',
  href: '',
  icon_key: '',
  image_id: '',
  badge: '',
  display_order: '',
}

function GatewayCardsManager({ items, onChange }) {
  const [editingIndex, setEditingIndex] = useState(null)
  const [draft, setDraft] = useState(emptyCard)
  const [linkType, setLinkType] = useState('internal')
  const [visualType, setVisualType] = useState('icon')

  const internalOptions = useMemo(() => getInternalLinkOptions(), [])

  const normalizedItems = useMemo(() => sanitizeGatewayItems(items), [items])

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const resetDraft = () => {
    setDraft(emptyCard)
    setLinkType('internal')
    setVisualType('icon')
    setEditingIndex(null)
  }

  const handleSave = () => {
    const nextItems = [...normalizedItems]
    const payload = {
      ...draft,
      label: draft.label.trim(),
      description: draft.description.trim(),
      href: draft.href.trim(),
      icon_key: visualType === 'icon' ? draft.icon_key.trim() : '',
      image_id: visualType === 'image' ? draft.image_id.trim() : '',
      badge: draft.badge.trim(),
    }

    if (editingIndex !== null) {
      nextItems[editingIndex] = payload
    } else {
      nextItems.push(payload)
    }

    onChange(nextItems)
    resetDraft()
  }

  const handleEdit = (index) => {
    const item = normalizedItems[index]
    if (!item) {
      return
    }
    setDraft({
      ...emptyCard,
      ...item,
    })
    setLinkType(item.href?.startsWith('/') ? 'internal' : 'custom')
    setVisualType(item.image_id ? 'image' : 'icon')
    setEditingIndex(index)
  }

  const handleDelete = (index) => {
    const nextItems = normalizedItems.filter((_, itemIndex) => itemIndex !== index)
    onChange(nextItems)
    if (editingIndex === index) {
      resetDraft()
    }
  }

  const handleMove = (index, direction) => {
    const nextItems = [...normalizedItems]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (!nextItems[targetIndex]) {
      return
    }
    const [current] = nextItems.splice(index, 1)
    nextItems.splice(targetIndex, 0, current)
    onChange(nextItems)
  }

  const handleLinkTypeChange = (value) => {
    setLinkType(value)
    if (value === 'internal') {
      updateDraft('href', internalOptions[0]?.value || '/')
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {normalizedItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No gateway cards yet. Add your first card below.
          </p>
        ) : (
          <div className="space-y-2">
            {normalizedItems.map((item, index) => (
              <div
                key={`${item.label}-${item.href}-${index}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-background px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {item.label || 'Untitled card'}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.href}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(index)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(index)}
                  >
                    Remove
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                  >
                    Move Up
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === normalizedItems.length - 1}
                  >
                    Move Down
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
        <h4 className="text-sm font-medium text-foreground">
          {editingIndex !== null ? 'Edit gateway card' : 'Add gateway card'}
        </h4>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <FormField label="Label" htmlFor="gateway_label" required>
            <Input
              id="gateway_label"
              name="gateway_label"
              value={draft.label}
              onChange={(event) => updateDraft('label', event.target.value)}
              placeholder="Card label"
              required
            />
          </FormField>

          <FormField label="Badge" htmlFor="gateway_badge">
            <Input
              id="gateway_badge"
              name="gateway_badge"
              value={draft.badge}
              onChange={(event) => updateDraft('badge', event.target.value)}
              placeholder="Optional badge"
            />
          </FormField>
        </div>

        <FormField label="Description" htmlFor="gateway_description">
          <Textarea
            id="gateway_description"
            name="gateway_description"
            value={draft.description}
            onChange={(event) => updateDraft('description', event.target.value)}
            rows={3}
          />
        </FormField>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Link type" htmlFor="gateway_link_type">
            <Select
              id="gateway_link_type"
              name="gateway_link_type"
              value={linkType}
              onChange={(event) => handleLinkTypeChange(event.target.value)}
            >
              <option value="internal">Internal link</option>
              <option value="custom">Custom URL</option>
            </Select>
          </FormField>

          {linkType === 'internal' ? (
            <FormField label="Internal link" htmlFor="gateway_internal_href" required>
              <Select
                id="gateway_internal_href"
                name="gateway_internal_href"
                value={draft.href}
                onChange={(event) => updateDraft('href', event.target.value)}
              >
                {internalOptions.map((option) => (
                  <option key={`${option.value}-${option.label}`} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>
          ) : (
            <FormField label="Custom URL" htmlFor="gateway_href" required>
              <Input
                id="gateway_href"
                name="gateway_href"
                value={draft.href}
                onChange={(event) => updateDraft('href', event.target.value)}
                placeholder="https://example.com or /path"
                required
              />
            </FormField>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Visual type" htmlFor="gateway_visual_type">
            <Select
              id="gateway_visual_type"
              name="gateway_visual_type"
              value={visualType}
              onChange={(event) => setVisualType(event.target.value)}
            >
              <option value="icon">Icon</option>
              <option value="image">Image</option>
            </Select>
          </FormField>

          {visualType === 'icon' ? (
            <FormField label="Icon" htmlFor="gateway_icon">
              <Select
                id="gateway_icon"
                name="gateway_icon"
                value={draft.icon_key}
                onChange={(event) => updateDraft('icon_key', event.target.value)}
              >
                {ICON_KEY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>
          ) : (
            <FormField label="Image URL" htmlFor="gateway_image_id">
              <Input
                id="gateway_image_id"
                name="gateway_image_id"
                value={draft.image_id}
                onChange={(event) => updateDraft('image_id', event.target.value)}
                placeholder="/uploads/gateway-image.webp"
              />
            </FormField>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button type="button" variant="primary" onClick={handleSave}>
            {editingIndex !== null ? 'Save card' : 'Add card'}
          </Button>
          {editingIndex !== null && (
            <Button type="button" variant="secondary" onClick={resetDraft}>
              Cancel edit
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default GatewayCardsManager
