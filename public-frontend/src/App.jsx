import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './layouts/Layout.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
// import DevApiTest from './dev/DevApiTest.jsx' //For Dev-only API test component
import {
  publicRouteDefinitions,
} from './routes/routeLoaders.js'

const routeComponents = new Map(
  publicRouteDefinitions.map((definition) => [definition.key, lazy(definition.loader)]),
)

function RouteContentFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4 py-12 text-sm text-slate-500">
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

function buildPublicRouteElement(definition) {
  const Component = routeComponents.get(definition.key)
  return renderRoute(Component, definition.componentProps)
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* <Route element={<DevApiTest />} /> Dev-only API test component */}
          {publicRouteDefinitions
            .filter((definition) => definition.key !== 'not-found')
            .map((definition) =>
              definition.index ? (
                <Route
                  key={definition.key}
                  index
                  element={buildPublicRouteElement(definition)}
                />
              ) : (
                <Route
                  key={definition.key}
                  path={definition.path}
                  element={buildPublicRouteElement(definition)}
                />
              ),
            )}
          <Route path="history" element={<Navigate to="/about/history" replace />} />
          <Route
            path="about-nyakrom/leadership-governance"
            element={<Navigate to="/about/leadership-governance" replace />}
          />
          <Route
            path="*"
            element={buildPublicRouteElement(
              publicRouteDefinitions.find((definition) => definition.key === 'not-found'),
            )}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
