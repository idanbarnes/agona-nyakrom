import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { postJson } from '../lib/apiClient.js'
import { setAuthToken } from '../lib/auth.js'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from?.pathname || '/dashboard'
  const [formState, setFormState] = useState({
    emailOrUsername: '',
    password: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

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

      // Persist the token so protected routes can authorize admin access.
      setAuthToken(data.token)
      navigate(redirectTo, { replace: true })
    } catch (error) {
      setErrorMessage(error.message || 'Unable to sign in.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="emailOrUsername">Email or username</label>
        <input
          id="emailOrUsername"
          name="emailOrUsername"
          type="text"
          autoComplete="username"
          value={formState.emailOrUsername}
          onChange={handleChange}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={formState.password}
          onChange={handleChange}
          required
        />

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
    </section>
  )
}

export default LoginPage
