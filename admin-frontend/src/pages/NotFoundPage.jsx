import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <section>
      <h2>Page not found</h2>
      <p>The page you are looking for does not exist.</p>
      <Link to="/dashboard">Go to dashboard</Link>
    </section>
  )
}

export default NotFoundPage
