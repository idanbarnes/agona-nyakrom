import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  deleteAnnouncement,
  listAnnouncements,
} from '../../services/api/adminAnnouncementsApi.js'
import { clearAuthToken, getAuthToken } from '../../lib/auth.js'
import { buildApiUrl } from '../../lib/apiClient.js'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  ImageWithFallback,
  Input,
  Pagination,
  PublishStatus,
  Select,
  StateGate,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSkeleton,
  TableToolbar,
  ToastMessage,
} from '../../components/ui/index.jsx'

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 10

function resolveAssetUrl(path) {
  if (!path) {
    return ''
  }

  if (/^https?:\/\//i.test(path)) {
    return path
  }

  return buildApiUrl(path.startsWith('/') ? path : `/${path}`)
}

function formatDate(value) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return date.toLocaleDateString()
}

function AdminAnnouncementsListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [page, setPage] = useState(DEFAULT_PAGE)
  const [limit] = useState(DEFAULT_LIMIT)
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState(
    location.state?.successMessage || '',
  )
  const [confirmState, setConfirmState] = useState({ open: false, id: null })
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
  })

  const isLastPage =
    total !== null
      ? page >= Math.ceil(total / limit)
      : items.length < limit

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const params = {
        page,
        limit,
      }

      if (filters.search) {
        params.search = filters.search
      }
      if (filters.status === 'published') {
        params.is_published = 'true'
      }
      if (filters.status === 'draft') {
        params.is_published = 'false'
      }

      const data = await listAnnouncements(params)
      const list = Array.isArray(data) ? data : data?.items || []

      setItems(list)
      setTotal(data?.total ?? null)
    } catch (error) {
      if (error.status === 401) {
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      setErrorMessage(error.message || 'Unable to load announcements.')
    } finally {
      setIsLoading(false)
    }
  }, [filters, limit, navigate, page])

  useEffect(() => {
    if (!getAuthToken()) {
      navigate('/login', { replace: true })
      return
    }

    fetchAnnouncements()
  }, [fetchAnnouncements, navigate, page])

  const handleDelete = async (id) => {
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await deleteAnnouncement(id)
      window.alert('Announcement deleted successfully')
      setSuccessMessage('Announcement deleted.')
      fetchAnnouncements()
    } catch (error) {
      if (error.status === 401) {
        clearAuthToken()
        navigate('/login', { replace: true })
        return
      }

      const message = error.message || 'Unable to delete announcement.'
      setErrorMessage(message)
      window.alert(message)
    }
  }

  const handleDeleteClick = (id) => {
    setConfirmState({ open: true, id })
  }

  const handleConfirmDelete = async () => {
    if (!confirmState.id) {
      return
    }

    try {
      await handleDelete(confirmState.id)
    } finally {
      setConfirmState({ open: false, id: null })
    }
  }

  const totalPages =
    total !== null ? Math.max(1, Math.ceil(total / limit)) : isLastPage ? page : page + 1

  const handlePageChange = (nextPage) => {
    if (nextPage < DEFAULT_PAGE || nextPage > totalPages) {
      return
    }
    setPage(nextPage)
  }

  const handleFilterChange = (event) => {
    const { name, value } = event.target
    setFilters((current) => ({ ...current, [name]: value }))
    setPage(DEFAULT_PAGE)
  }

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
    })
    setPage(DEFAULT_PAGE)
  }

  const actionLinkClassName =
    'inline-flex h-8 items-center justify-center rounded-md border border-transparent px-3 text-xs font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'

  const handleOpenInlinePreview = (announcementId) => {
    if (!announcementId) {
      return
    }

    navigate(`/admin/announcements/${announcementId}/edit?preview=1`)
  }

  return (
    <section className="space-y-4 md:space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold break-words md:text-2xl">
          Announcements
        </h2>
        {total !== null ? (
          <p className="text-sm text-muted-foreground">Total: {total}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div />
        <Button
          type="button"
          variant="primary"
          onClick={() => navigate('/admin/announcements/new')}
        >
          New announcement
        </Button>
      </div>

      <TableToolbar
        left={
          <>
            <Input
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search announcements"
              className="w-48"
            />
            <Select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-40"
            >
              <option value="all">All status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </Select>
          </>
        }
        right={
          <Button type="button" variant="secondary" onClick={handleClearFilters}>
            Clear
          </Button>
        }
      />

      {errorMessage ? (
        <ToastMessage type="error" message={errorMessage} />
      ) : null}
      {successMessage ? (
        <ToastMessage type="success" message={successMessage} />
      ) : null}

      <StateGate
        loading={isLoading}
        error={errorMessage}
        isEmpty={!isLoading && !errorMessage && items.length === 0}
        skeleton={<TableSkeleton rows={6} columns={5} />}
        errorFallback={
          <ErrorState
            message={errorMessage}
            onRetry={fetchAnnouncements}
            retryLabel="Reload announcements"
          />
        }
        empty={
          <EmptyState
            title="No announcements found"
            description="Create an announcement to keep residents informed."
            action={
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/admin/announcements/new')}
              >
                Create announcement
              </Button>
            }
          />
        }
      >
        <Table>
          <TableHead>
            <tr>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                Title
              </th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                Flyer
              </th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                Published
              </th>
              <th className="px-4 py-3 text-left font-medium whitespace-nowrap">
                Updated
              </th>
              <th className="px-4 py-3 text-right font-medium whitespace-nowrap">
                Actions
              </th>
            </tr>
          </TableHead>
          <TableBody>
            {items.map((item) => {
              const id = item.id || item._id
              const published = Boolean(
                item.is_published ?? item.isPublished ?? item.published,
              )

              return (
                <TableRow key={id}>
                  <TableCell className="max-w-xs break-words">
                    {item.title || 'Untitled'}
                  </TableCell>
                  <TableCell>
                    <ImageWithFallback
                      src={resolveAssetUrl(item.flyer_image_path)}
                      alt={item.flyer_alt_text || 'Announcement flyer'}
                      className="h-10 w-10 rounded-md object-cover"
                      fallbackText="No flyer"
                    />
                  </TableCell>
                  <TableCell>
                    <PublishStatus published={published} />
                  </TableCell>
                  <TableCell>{formatDate(item.updated_at || item.updatedAt)}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        className={actionLinkClassName}
                        onClick={() => handleOpenInlinePreview(id)}
                      >
                        Preview
                      </button>
                      <Link
                        to={`/admin/announcements/${id}/edit`}
                        className={actionLinkClassName}
                      >
                        Edit
                      </Link>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </StateGate>

      <div className="flex justify-end">
        <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
      </div>

      <ConfirmDialog
        open={confirmState.open}
        title="Delete announcement"
        description="Delete this announcement?"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmState({ open: false, id: null })}
      />
    </section>
  )
}

export default AdminAnnouncementsListPage
