import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiRequest } from '../../lib/apiClient.js'
import { resolvePreviewTargetUrl } from '../../lib/previewTargetUrl.js'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../ui/index.jsx'

const PREVIEW_MIN_WIDTH = 360
const PREVIEW_MAX_WIDTH = 920
const PREVIEW_DEFAULT_WIDTH = 560

function RefreshIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.13-3.36L23 10" />
      <path d="M20.49 15a9 9 0 0 1-14.13 3.36L1 14" />
    </svg>
  )
}

function ExternalLinkIcon({ className = 'h-4 w-4' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M14 3h7v7" />
      <path d="M10 14L21 3" />
      <path d="M21 14v7h-7" />
      <path d="M3 10V3h7" />
      <path d="M3 21l8-8" />
    </svg>
  )
}

function clampPreviewWidth(value) {
  return Math.min(PREVIEW_MAX_WIDTH, Math.max(PREVIEW_MIN_WIDTH, value))
}

function buildInlinePreviewSrc(previewUrl, options = {}) {
  const { cmsOrigin = '', previewChannel = '' } = options
  if (!previewUrl) {
    return ''
  }

  try {
    const url = new URL(previewUrl, window.location.origin)
    url.searchParams.set('iframe_preview', '1')
    if (cmsOrigin) {
      url.searchParams.set('cms_origin', cmsOrigin)
    }
    if (previewChannel) {
      url.searchParams.set('preview_channel', previewChannel)
    }
    url.searchParams.set('_preview_ts', String(Date.now()))
    return url.toString()
  } catch {
    const separator = previewUrl.includes('?') ? '&' : '?'
    const extraParts = ['iframe_preview=1']
    if (cmsOrigin) {
      extraParts.push(`cms_origin=${encodeURIComponent(cmsOrigin)}`)
    }
    if (previewChannel) {
      extraParts.push(`preview_channel=${encodeURIComponent(previewChannel)}`)
    }
    extraParts.push(`_preview_ts=${Date.now()}`)
    return `${previewUrl}${separator}${extraParts.join('&')}`
  }
}

function AdminInlinePreviewLayout({
  resource,
  itemId,
  query,
  reloadKey = 0,
  enabled = true,
  storageKey = 'admin-inline-preview-width',
  onAuthError,
  children,
}) {
  const canPreview = Boolean(enabled && resource && itemId)
  const panelRef = useRef(null)
  const iframeRef = useRef(null)
  const resizeStartRef = useRef({ x: 0, width: PREVIEW_DEFAULT_WIDTH })
  const [previewExternalUrl, setPreviewExternalUrl] = useState('')
  const [previewSrc, setPreviewSrc] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const [isPreviewVisible, setIsPreviewVisible] = useState(true)
  const [previewWidth, setPreviewWidth] = useState(PREVIEW_DEFAULT_WIDTH)
  const [isResizingPreview, setIsResizingPreview] = useState(false)
  const [previewFrameReady, setPreviewFrameReady] = useState(false)
  const previewChannel = useMemo(
    () => `cms-preview-${resource || 'resource'}-${String(itemId || 'item')}`,
    [itemId, resource],
  )
  const cmsOrigin =
    typeof window !== 'undefined' ? window.location.origin : ''
  const expectedPreviewOrigin = useMemo(() => {
    if (!previewExternalUrl) {
      return ''
    }

    try {
      return new URL(previewExternalUrl, window.location.origin).origin
    } catch {
      return ''
    }
  }, [previewExternalUrl])

  const postPreviewMessage = useCallback(
    (type, payload = {}) => {
      if (!iframeRef.current?.contentWindow || !expectedPreviewOrigin) {
        return false
      }

      iframeRef.current.contentWindow.postMessage(
        {
          source: 'admin-cms-preview',
          type,
          channel: previewChannel,
          payload,
          sent_at: Date.now(),
        },
        expectedPreviewOrigin,
      )

      return true
    },
    [expectedPreviewOrigin, previewChannel],
  )

  const refreshPreview = useCallback(async () => {
    if (!canPreview) {
      return
    }

    setPreviewLoading(true)
    setPreviewError('')

    try {
      const payload = await apiRequest(
        `/api/admin/${resource}/${encodeURIComponent(itemId)}/preview`,
      )
      const targetUrl = resolvePreviewTargetUrl(payload)
      if (!targetUrl) {
        throw new Error('Preview URL was not returned by the server.')
      }

      setPreviewExternalUrl(targetUrl)
      setPreviewFrameReady(false)
      setPreviewSrc(
        buildInlinePreviewSrc(targetUrl, {
          cmsOrigin,
          previewChannel,
        }),
      )
    } catch (error) {
      if (error.status === 401 && typeof onAuthError === 'function') {
        onAuthError(error)
        return
      }

      setPreviewExternalUrl('')
      setPreviewSrc('')
      setPreviewError(error.message || 'Unable to load preview.')
    } finally {
      setPreviewLoading(false)
    }
  }, [canPreview, cmsOrigin, itemId, onAuthError, previewChannel, resource])

  useEffect(() => {
    if (!canPreview) {
      return
    }

    void refreshPreview()
  }, [canPreview, refreshPreview])

  useEffect(() => {
    if (!canPreview) {
      return
    }

    if (!reloadKey) {
      return
    }

    if (previewFrameReady && postPreviewMessage('CMS_PREVIEW_REFRESH')) {
      return
    }

    void refreshPreview()
  }, [
    canPreview,
    postPreviewMessage,
    previewFrameReady,
    refreshPreview,
    reloadKey,
  ])

  useEffect(() => {
    if (!expectedPreviewOrigin) {
      return undefined
    }

    const handleMessage = (event) => {
      if (event.origin !== expectedPreviewOrigin) {
        return
      }

      const data = event.data || {}
      if (data.source !== 'public-preview-iframe') {
        return
      }

      if (data.channel && data.channel !== previewChannel) {
        return
      }

      if (data.type === 'PREVIEW_READY') {
        setPreviewFrameReady(true)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => {
      window.removeEventListener('message', handleMessage)
    }
  }, [expectedPreviewOrigin, previewChannel])

  useEffect(() => {
    if (!canPreview) {
      return
    }

    if (typeof window === 'undefined') {
      return
    }

    const storedWidth = Number(window.localStorage.getItem(storageKey))
    if (!Number.isFinite(storedWidth)) {
      return
    }

    setPreviewWidth(clampPreviewWidth(storedWidth))
  }, [canPreview, storageKey])

  useEffect(() => {
    if (!canPreview || typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(storageKey, String(previewWidth))
  }, [canPreview, previewWidth, storageKey])

  useEffect(() => {
    if (!isResizingPreview) {
      return undefined
    }

    const handleMouseMove = (event) => {
      const delta = resizeStartRef.current.x - event.clientX
      const nextWidth = clampPreviewWidth(resizeStartRef.current.width + delta)
      setPreviewWidth(nextWidth)
    }

    const handleMouseUp = () => {
      setIsResizingPreview(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizingPreview])

  useEffect(() => {
    if (!canPreview) {
      return
    }

    const params = new URLSearchParams(query || '')
    if (params.get('preview') !== '1') {
      return
    }

    setIsPreviewVisible(true)
    panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [canPreview, query])

  const handlePopoutPreview = () => {
    if (!previewExternalUrl) {
      return
    }

    window.open(previewExternalUrl, '_blank', 'noopener,noreferrer')
  }

  const handleClosePreview = () => {
    setIsPreviewVisible(false)
    setIsResizingPreview(false)
  }

  const handleOpenPreview = () => {
    setIsPreviewVisible(true)
    if (!previewSrc && !previewLoading) {
      void refreshPreview()
    }
  }

  const handleResizeStart = (event) => {
    resizeStartRef.current = { x: event.clientX, width: previewWidth }
    setIsResizingPreview(true)
  }

  if (!canPreview) {
    return <div className="min-w-0">{children}</div>
  }

  return (
    <div className="space-y-4 xl:flex xl:items-start xl:space-y-0">
      <div className={`min-w-0 flex-1 ${isPreviewVisible ? 'xl:pr-6' : ''}`}>
        {!isPreviewVisible ? (
          <div className="mb-4">
            <Button type="button" variant="secondary" size="sm" onClick={handleOpenPreview}>
              Open Preview
            </Button>
          </div>
        ) : null}
        {children}
      </div>

      {isPreviewVisible ? (
        <div className="min-w-0 xl:flex xl:items-stretch">
          <button
            type="button"
            className={`hidden w-3 cursor-col-resize border-x border-border/70 bg-slate-100 transition-colors hover:bg-slate-200 xl:block ${
              isResizingPreview ? 'bg-slate-200' : ''
            }`}
            onMouseDown={handleResizeStart}
            aria-label="Resize preview pane"
            title="Drag to resize preview"
          />
          <aside
            className="w-full pt-2 xl:pt-0"
            style={{ width: `min(100%, ${previewWidth}px)` }}
            ref={panelRef}
          >
            <Card className="overflow-hidden border-border/80 shadow-sm">
              <CardHeader className="space-y-2 border-b border-border/70 bg-slate-50/65">
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>Live Preview</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        void refreshPreview()
                      }}
                      disabled={previewLoading}
                    >
                      <RefreshIcon />
                      Refresh
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handlePopoutPreview}
                      disabled={!previewExternalUrl || previewLoading}
                      title="Open preview in new tab"
                    >
                      <ExternalLinkIcon />
                      Pop out
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleClosePreview}
                    >
                      Close
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Preview stays inside CMS by default. Use pop out only when needed.
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[70vh] min-h-[520px] w-full bg-white">
                  {previewError ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                      <p className="text-sm text-rose-600">{previewError}</p>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          void refreshPreview()
                        }}
                      >
                        Retry preview
                      </Button>
                    </div>
                  ) : previewLoading ? (
                    <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
                      Loading preview...
                    </div>
                  ) : previewSrc ? (
                    <iframe
                      ref={iframeRef}
                      key={previewSrc}
                      src={previewSrc}
                      title="Content preview"
                      className="h-full w-full border-0"
                      sandbox="allow-same-origin allow-scripts allow-forms"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
                      Preview is unavailable.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      ) : null}
    </div>
  )
}

export default AdminInlinePreviewLayout
