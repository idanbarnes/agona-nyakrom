import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <section>
      <h1>Page not found</h1>
      <p>
        The page you are looking for does not exist. <Link to="/">Go home</Link>.
      </p>
    </section>
  )
}

export default NotFound
