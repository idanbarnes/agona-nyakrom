import { useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Modal,
  Select,
  Table,
  TableBody,
  TableCell,
  TableEmptyState,
  TableHead,
  TableLoading,
  TableRow,
  TableToolbar,
  ToastMessage,
} from '../../components/ui/index.jsx'
import {
  createAdminUser,
  deleteAdminUser,
  getAdminUsers,
  updateAdminUser,
} from '../../services/api/adminUsersApi.js'
import { EyeIcon, EyeOffIcon } from '../../components/admin/icons.jsx'
import { isMasterAdmin } from '../../lib/auth.js'

const INITIAL_FORM_STATE = {
  name: '',
  email: '',
  password: '',
  role: 'admin',
}

const INITIAL_EDIT_FORM_STATE = {
  id: '',
  name: '',
  email: '',
  password: '',
  role: 'admin',
  active: true,
}

function formatDateTime(value) {
  if (!value) {
    return '-'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return '-'
  }

  return parsed.toLocaleString()
}

function normalizeErrorMessage(error, fallback) {
  return error?.message || fallback
}

function formatRoleLabel(role) {
  if (role === 'master_admin') {
    return 'Master admin'
  }

  return 'Admin'
}

function AdminUsersPage() {
  const canManageAdmins = isMasterAdmin()
  const [admins, setAdmins] = useState([])
  const [formState, setFormState] = useState(INITIAL_FORM_STATE)
  const [editFormState, setEditFormState] = useState(INITIAL_EDIT_FORM_STATE)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [pendingDeleteAdmin, setPendingDeleteAdmin] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isEditPasswordVisible, setIsEditPasswordVisible] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadAdmins = async () => {
      setIsLoading(true)
      setErrorMessage('')

      if (!canManageAdmins) {
        if (mounted) {
          setAdmins([])
          setIsLoading(false)
        }
        return
      }

      try {
        const data = await getAdminUsers({ limit: 100, offset: 0 })
        if (!mounted) {
          return
        }
        setAdmins(Array.isArray(data) ? data : [])
      } catch (error) {
        if (mounted) {
          setErrorMessage(
            normalizeErrorMessage(error, 'Unable to load admin accounts.'),
          )
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    void loadAdmins()

    return () => {
      mounted = false
    }
  }, [canManageAdmins])

  const activeAdminsCount = useMemo(
    () => admins.filter((admin) => admin?.active !== false).length,
    [admins],
  )

  const handleChange = (field, value) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleEditChange = (field, value) => {
    setEditFormState((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const openEditModal = (admin) => {
    setErrorMessage('')
    setSuccessMessage('')
    setIsEditPasswordVisible(false)
    setEditFormState({
      id: admin.id,
      name: admin.name || '',
      email: admin.email || '',
      password: '',
      role: admin.role || 'admin',
      active: admin.active !== false,
    })
    setIsEditModalOpen(true)
  }

  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setIsEditPasswordVisible(false)
    setEditFormState(INITIAL_EDIT_FORM_STATE)
  }

  const handleCreateAdmin = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!formState.name.trim() || !formState.email.trim() || !formState.password) {
      setErrorMessage('Name, email, and password are required.')
      return
    }

    setIsSubmitting(true)

    try {
      const created = await createAdminUser({
        name: formState.name.trim(),
        email: formState.email.trim(),
        password: formState.password,
        role: formState.role,
      })

      setAdmins((current) => [created, ...current])
      setFormState(INITIAL_FORM_STATE)
      setSuccessMessage(`Admin account created for ${created.email}.`)
    } catch (error) {
      setErrorMessage(
        normalizeErrorMessage(error, 'Unable to create the admin account.'),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUpdateAdmin = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!editFormState.name.trim() || !editFormState.email.trim()) {
      setErrorMessage('Name and email are required.')
      return
    }

    setIsUpdating(true)

    try {
      const payload = {
        name: editFormState.name.trim(),
        email: editFormState.email.trim(),
        role: editFormState.role,
        active: editFormState.active,
      }

      if (editFormState.password) {
        payload.password = editFormState.password
      }

      const updated = await updateAdminUser(editFormState.id, payload)
      setAdmins((current) =>
        current.map((admin) => (admin.id === updated.id ? updated : admin)),
      )
      setSuccessMessage(`Admin account updated for ${updated.email}.`)
      closeEditModal()
    } catch (error) {
      setErrorMessage(
        normalizeErrorMessage(error, 'Unable to update the admin account.'),
      )
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDeleteAdmin = async () => {
    if (!pendingDeleteAdmin) {
      return
    }

    setErrorMessage('')
    setSuccessMessage('')
    setIsDeleting(true)

    try {
      const deleted = await deleteAdminUser(pendingDeleteAdmin.id)
      setAdmins((current) =>
        current.filter((admin) => admin.id !== pendingDeleteAdmin.id),
      )
      setSuccessMessage(`Admin account deleted for ${deleted.email}.`)
      setPendingDeleteAdmin(null)
    } catch (error) {
      setErrorMessage(
        normalizeErrorMessage(error, 'Unable to delete the admin account.'),
      )
    } finally {
      setIsDeleting(false)
    }
  }

  if (!canManageAdmins) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Admin users</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            This area is restricted to master admins.
          </p>
        </CardHeader>
        <CardContent>
          <ToastMessage
            type="error"
            title="Access denied"
            message="Only master admins can create, update, or delete admin accounts."
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(22rem,0.9fr)]">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Admin users</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create admin accounts here instead of using Postman or the shell.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="muted">{admins.length} total</Badge>
                <Badge variant="success">{activeAdminsCount} active</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <TableToolbar
              left={
                <p className="text-sm text-muted-foreground">
                  Only master admins can create, update, or delete admin users.
                </p>
              }
            />

            {isLoading ? (
              <TableLoading rows={5} columns={5} />
            ) : admins.length ? (
              <>
                <div className="space-y-3 md:hidden">
                  {admins.map((admin) => (
                    <div
                      key={admin.id}
                      className="rounded-xl border border-border bg-surface p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-3">
                        <div className="space-y-1">
                          <p className="text-base font-semibold text-foreground">
                            {admin.name || 'Unnamed admin'}
                          </p>
                          <p className="break-all text-sm text-muted-foreground">
                            {admin.email}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="muted">{formatRoleLabel(admin.role)}</Badge>
                          <Badge variant={admin.active === false ? 'warning' : 'success'}>
                            {admin.active === false ? 'Inactive' : 'Active'}
                          </Badge>
                        </div>

                        <div className="grid gap-3 rounded-lg bg-muted/30 p-3 text-sm sm:grid-cols-2">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Last login
                            </p>
                            <p className="mt-1 text-foreground">
                              {formatDateTime(admin.last_login_at)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              Created
                            </p>
                            <p className="mt-1 text-foreground">
                              {formatDateTime(admin.created_at)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Button
                            variant="secondary"
                            className="w-full sm:flex-1"
                            onClick={() => openEditModal(admin)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            className="w-full sm:flex-1"
                            onClick={() => setPendingDeleteAdmin(admin)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden md:block">
                  <Table>
                    <TableHead>
                      <tr>
                        <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Name</th>
                        <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Email</th>
                        <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Role</th>
                        <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Status</th>
                        <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Last login</th>
                        <th className="px-4 py-3 text-left font-medium whitespace-nowrap">Created</th>
                        <th className="px-4 py-3 text-right font-medium whitespace-nowrap">Actions</th>
                      </tr>
                    </TableHead>
                    <TableBody>
                      {admins.map((admin) => (
                        <TableRow key={admin.id}>
                          <TableCell>
                            <div className="font-medium text-foreground">
                              {admin.name || 'Unnamed admin'}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{admin.email}</TableCell>
                          <TableCell>
                            <Badge variant="muted">{formatRoleLabel(admin.role)}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={admin.active === false ? 'warning' : 'success'}>
                              {admin.active === false ? 'Inactive' : 'Active'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDateTime(admin.last_login_at)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDateTime(admin.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => openEditModal(admin)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setPendingDeleteAdmin(admin)}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <TableEmptyState
                title="No admin users yet"
                description="Create the first admin from the form on the right."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create admin user</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Use a strong password. The backend enforces the minimum password length.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form className="space-y-4" onSubmit={handleCreateAdmin}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="admin-user-name">
                  Full name
                </label>
                <Input
                  id="admin-user-name"
                  value={formState.name}
                  onChange={(event) => handleChange('name', event.target.value)}
                  placeholder="Main Admin"
                  autoComplete="name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="admin-user-email">
                  Email
                </label>
                <Input
                  id="admin-user-email"
                  type="email"
                  value={formState.email}
                  onChange={(event) => handleChange('email', event.target.value)}
                  placeholder="admin@example.com"
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground" htmlFor="admin-user-role">
                  Role
                </label>
                <Select
                  id="admin-user-role"
                  value={formState.role}
                  onChange={(event) => handleChange('role', event.target.value)}
                >
                  <option value="admin">Admin</option>
                  <option value="master_admin">Master admin</option>
                </Select>
              </div>

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-foreground"
                  htmlFor="admin-user-password"
                >
                  Temporary password
                </label>
                <Input
                  id="admin-user-password"
                  type="password"
                  value={formState.password}
                  onChange={(event) => handleChange('password', event.target.value)}
                  placeholder="Use a strong password"
                  autoComplete="new-password"
                />
              </div>

              <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                Bootstrap note: the very first admin should still be created with the
                backend bootstrap token. After that, use this page for additional admin
                accounts.
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Creating admin...' : 'Create admin'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <ToastMessage type="success" message={successMessage} />
        <ToastMessage type="error" message={errorMessage} />
      </div>

      <Modal
        open={isEditModalOpen}
        onClose={closeEditModal}
        title="Edit admin user"
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="secondary" className="w-full sm:w-auto" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button className="w-full sm:w-auto" onClick={handleUpdateAdmin} loading={isUpdating}>
              Save changes
            </Button>
          </div>
        }
      >
        <form className="space-y-4" onSubmit={handleUpdateAdmin}>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="edit-admin-name">
              Full name
            </label>
            <Input
              id="edit-admin-name"
              value={editFormState.name}
              onChange={(event) => handleEditChange('name', event.target.value)}
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground" htmlFor="edit-admin-email">
              Email
            </label>
            <Input
              id="edit-admin-email"
              type="email"
              value={editFormState.email}
              onChange={(event) => handleEditChange('email', event.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="edit-admin-role">
                Role
              </label>
              <Select
                id="edit-admin-role"
                value={editFormState.role}
                onChange={(event) => handleEditChange('role', event.target.value)}
              >
                <option value="admin">Admin</option>
                <option value="master_admin">Master admin</option>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground" htmlFor="edit-admin-active">
                Status
              </label>
              <Select
                id="edit-admin-active"
                value={editFormState.active ? 'active' : 'inactive'}
                onChange={(event) =>
                  handleEditChange('active', event.target.value === 'active')
                }
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="edit-admin-password"
            >
              New password
            </label>
            <div className="relative">
              <Input
                id="edit-admin-password"
                type={isEditPasswordVisible ? 'text' : 'password'}
                value={editFormState.password}
                onChange={(event) => handleEditChange('password', event.target.value)}
                placeholder="Leave blank to keep the current password"
                autoComplete="new-password"
                className="pr-12"
              />
              <button
                type="button"
                onClick={() => setIsEditPasswordVisible((current) => !current)}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 transition-colors hover:text-slate-900 focus-visible:text-slate-900"
                aria-label={isEditPasswordVisible ? 'Hide password' : 'Show password'}
                aria-pressed={isEditPasswordVisible}
              >
                {isEditPasswordVisible ? (
                  <EyeOffIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDeleteAdmin)}
        title="Delete admin user"
        description={
          pendingDeleteAdmin
            ? `Delete the admin account for ${pendingDeleteAdmin.email}? This cannot be undone.`
            : ''
        }
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete admin'}
        onConfirm={handleDeleteAdmin}
        onCancel={() => {
          if (!isDeleting) {
            setPendingDeleteAdmin(null)
          }
        }}
      />
    </div>
  )
}

export default AdminUsersPage
