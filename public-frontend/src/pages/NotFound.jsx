import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <section className="container space-y-3 py-6 md:py-10">
      <h1 className="text-2xl font-semibold text-foreground break-words md:text-3xl">
        Page not found
      </h1>
      <p className="text-sm text-muted-foreground">
        The page you are looking for does not exist. <Link to="/">Go home</Link>.
      </p>
    </section>
  )
}

export default NotFound
