import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button.jsx'
import { Checkbox } from '../components/ui/checkbox.jsx'
import { Input } from '../components/ui/input.jsx'
import { Label } from '../components/ui/label.jsx'
import {
  consumeLoginReason,
  consumePostLoginRedirect,
  setAuthToken,
} from '../lib/auth.js'
import { postJson } from '../lib/apiClient.js'

function resolveRoute(route) {
  if (!route || !route.pathname) {
    return ''
  }

  return `${route.pathname}${route.search || ''}${route.hash || ''}`
}

function EyeIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 12s3.636-7 10-7 10 7 10 7-3.636 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m3 3 18 18" />
      <path d="M10.6 10.6a3 3 0 0 0 4.24 4.24" />
      <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c6.36 0 10 7 10 7a18.7 18.7 0 0 1-3.21 4.69" />
      <path d="M6.61 6.61A18.92 18.92 0 0 0 2 12s3.64 7 10 7a10.94 10.94 0 0 0 5.17-1.38" />
    </svg>
  )
}

function LockIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function UserIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function ShieldIcon({ className = '' }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  )
}

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loginNotice] = useState(
    () => location.state?.reasonMessage || consumeLoginReason() || '',
  )
  const [redirectTo] = useState(
    () =>
      resolveRoute(location.state?.from) ||
      consumePostLoginRedirect() ||
      '/dashboard',
  )
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [formState, setFormState] = useState({
    emailOrUsername: '',
    password: '',
  })

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormState((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const payload = {
        email: formState.emailOrUsername,
        password: formState.password,
      }

      if (import.meta.env.DEV) {
        console.debug('Login payload keys:', Object.keys(payload))
      }

      const data = await postJson('/api/admin/auth/login', payload)
      if (!data?.token) {
        throw new Error('Authentication token missing from response.')
      }

      setAuthToken(data.token)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setErrorMessage(error.message || 'Unable to sign in.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="relative hidden overflow-hidden lg:flex lg:w-1/2">
        <img
          src="https://images.unsplash.com/photo-1721011694126-e25f493b91f1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxHaGFuYSUyMHRvd25zaGlwJTIwZ292ZXJubWVudCUyMGJ1aWxkaW5nfGVufDF8fHx8MTc3MjI3NTA5M3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Agona Nyakrom Township"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-blue-800/70 to-emerald-800/70" />
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <h1 className="mb-4 text-4xl font-bold text-white">
            Agona Nyakrom Township
          </h1>
          <p className="max-w-md text-lg text-white/90">
            Administrative Content Management System - Secure access for
            authorized personnel only
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-gray-50 p-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
              <ShieldIcon className="h-8 w-8 text-white" />
            </div>
            <h2 className="mb-2 text-3xl font-bold text-gray-900">Admin Login</h2>
            <p className="text-gray-600">
              Welcome back! Please enter your credentials
            </p>
            {loginNotice ? (
              <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                {loginNotice}
              </p>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="emailOrUsername">Email or username</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="emailOrUsername"
                  name="emailOrUsername"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your email or username"
                  value={formState.emailOrUsername}
                  onChange={handleChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={formState.password}
                  onChange={handleChange}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={setRememberMe}
                />
                <Label
                  htmlFor="remember"
                  className="cursor-pointer text-sm font-normal text-foreground"
                >
                  Remember me
                </Label>
              </div>
              <button
                type="button"
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              loading={isSubmitting}
              className="w-full border-transparent bg-blue-600 text-white hover:bg-blue-700"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          {errorMessage ? (
            <p
              role="alert"
              className="mt-4 rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
            >
              {errorMessage}
            </p>
          ) : null}

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              © 2026 Agona Nyakrom Township. All rights reserved.
            </p>
          </div>

          <div className="mt-8 rounded-lg border border-gray-200 bg-white p-4 lg:hidden">
            <h3 className="mb-2 font-semibold text-gray-900">
              Agona Nyakrom Township
            </h3>
            <p className="text-sm text-gray-600">
              Administrative CMS - Authorized access only
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
