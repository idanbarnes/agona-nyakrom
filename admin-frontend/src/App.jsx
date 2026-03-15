import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { AdminSessionProvider } from './context/AdminSessionContext.jsx'
import {
  adminRouteDefinitions,
} from './routes/routeLoaders.js'

const routeComponents = new Map(
  adminRouteDefinitions.map((definition) => [definition.key, lazy(definition.loader)]),
)

function RouteContentFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
      Loading...
    </div>
  )
}

function renderRoute(Component, props) {
  return (
    <Suspense fallback={<RouteContentFallback />}>
      <Component {...props} />
    </Suspense>
  )
}

function buildAdminRouteElement(definition) {
  const Component = routeComponents.get(definition.key)
  return renderRoute(Component, definition.componentProps)
}

function App() {
  const loginDefinition = adminRouteDefinitions.find((definition) => definition.key === 'login')
  const notFoundDefinition = adminRouteDefinitions.find(
    (definition) => definition.key === 'not-found',
  )
  const protectedDefinitions = adminRouteDefinitions.filter(
    (definition) => !['login', 'not-found'].includes(definition.key),
  )

  return (
    <AdminSessionProvider>
      <Routes>
        <Route path="/login" element={buildAdminRouteElement(loginDefinition)} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            {protectedDefinitions.map((definition) => (
              <Route
                key={definition.key}
                path={definition.path}
                element={buildAdminRouteElement(definition)}
              />
            ))}
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={buildAdminRouteElement(notFoundDefinition)} />
      </Routes>
    </AdminSessionProvider>
  )
}

export default App
