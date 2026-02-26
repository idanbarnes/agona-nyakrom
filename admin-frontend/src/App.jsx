import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './layouts/AdminLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import AdminNewsCreatePage from './pages/news/AdminNewsCreatePage.jsx'
import AdminNewsEditPage from './pages/news/AdminNewsEditPage.jsx'
import AdminNewsListPage from './pages/news/AdminNewsListPage.jsx'
import AdminObituariesListPage from './pages/obituaries/AdminObituariesListPage.jsx'
import AdminObituariesCreatePage from './pages/obituaries/AdminObituariesCreatePage.jsx'
import AdminObituariesEditPage from './pages/obituaries/AdminObituariesEditPage.jsx'
import AdminClansListPage from './pages/clans/AdminClansListPage.jsx'
import AdminClansCreatePage from './pages/clans/AdminClansCreatePage.jsx'
import AdminClansEditPage from './pages/clans/AdminClansEditPage.jsx'
import AdminAsafoCompaniesListPage from './pages/asafo/AdminAsafoCompaniesListPage.jsx'
import AdminAsafoCompaniesSectionPage from './pages/asafo/AdminAsafoCompaniesSectionPage.jsx'
import AdminHallOfFameListPage from './pages/hallOfFame/AdminHallOfFameListPage.jsx'
import AdminHallOfFameCreatePage from './pages/hallOfFame/AdminHallOfFameCreatePage.jsx'
import AdminHallOfFameEditPage from './pages/hallOfFame/AdminHallOfFameEditPage.jsx'
import AdminGlobalSettingsPage from './pages/globalsettings/AdminGlobalSettingsPage.jsx'
import AdminHomepageSectionsListPage from './pages/homePageSections/AdminHomepageSectionsListPage.jsx'
import AdminHomepageSectionsCreatePage from './pages/homePageSections/AdminHomepageSectionsCreatePage.jsx'
import AdminHomepageSectionsEditPage from './pages/homePageSections/AdminHomepageSectionsEditPage.jsx'
import AdminLandmarksListPage from './pages/landmarks/AdminLandmarksListPage.jsx'
import AdminLandmarksCreatePage from './pages/landmarks/AdminLandmarksCreatePage.jsx'
import AdminLandmarksEditPage from './pages/landmarks/AdminLandmarksEditPage.jsx'
import AdminCarouselListPage from './pages/carousel/AdminCarouselListPage.jsx'
import AdminCarouselCreatePage from './pages/carousel/AdminCarouselCreatePage.jsx'
import AdminCarouselEditPage from './pages/carousel/AdminCarouselEditPage.jsx'
import AdminHistoryPage from './pages/history/AdminHistoryPage.jsx'
import AdminAboutPageEditor from './pages/aboutNyakrom/AdminAboutPageEditor.jsx'
import AdminLeadershipGovernancePage from './pages/aboutNyakrom/AdminLeadershipGovernancePage.jsx'
import AdminEventsListPage from './pages/events/AdminEventsListPage.jsx'
import AdminEventFormPage from './pages/events/AdminEventFormPage.jsx'
import AdminAnnouncementsListPage from './pages/announcements/AdminAnnouncementsListPage.jsx'
import AdminAnnouncementFormPage from './pages/announcements/AdminAnnouncementFormPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import AdminPreviewRedirectPage from './pages/AdminPreviewRedirectPage.jsx'

function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/admin/news" element={<AdminNewsListPage />} />
            <Route path="/admin/news/create" element={<AdminNewsCreatePage />} />
            <Route path="/admin/news/edit/:id" element={<AdminNewsEditPage />} />
            <Route path="/admin/obituaries" element={<AdminObituariesListPage />} />
            <Route
              path="/admin/obituaries/create"
              element={<AdminObituariesCreatePage />}
            />
            <Route
              path="/admin/obituaries/edit/:id"
              element={<AdminObituariesEditPage />}
            />
            <Route path="/admin/clans" element={<AdminClansListPage />} />
            <Route path="/admin/clans/create" element={<AdminClansCreatePage />} />
            <Route path="/admin/clans/edit/:id" element={<AdminClansEditPage />} />
            <Route
              path="/admin/asafo-companies"
              element={<AdminAsafoCompaniesListPage />}
            />
            <Route
              path="/admin/asafo-companies/section/:sectionId"
              element={<AdminAsafoCompaniesSectionPage />}
            />
            <Route
              path="/admin/hall-of-fame"
              element={<AdminHallOfFameListPage />}
            />
            <Route
              path="/admin/hall-of-fame/create"
              element={<AdminHallOfFameCreatePage />}
            />
            <Route
              path="/admin/hall-of-fame/edit/:id"
              element={<AdminHallOfFameEditPage />}
            />
            <Route
              path="/admin/global-settings"
              element={<AdminGlobalSettingsPage />}
            />
            <Route
              path="/admin/homepage-sections"
              element={<AdminHomepageSectionsListPage />}
            />
            <Route
              path="/admin/homepage-sections/create"
              element={<AdminHomepageSectionsCreatePage />}
            />
            <Route
              path="/admin/homepage-sections/edit/:id"
              element={<AdminHomepageSectionsEditPage />}
            />
            <Route path="/admin/landmarks" element={<AdminLandmarksListPage />} />
            <Route
              path="/admin/landmarks/create"
              element={<AdminLandmarksCreatePage />}
            />
            <Route
              path="/admin/landmarks/edit/:id"
              element={<AdminLandmarksEditPage />}
            />
            <Route path="/admin/carousel" element={<AdminCarouselListPage />} />
            <Route
              path="/admin/carousel/create"
              element={<AdminCarouselCreatePage />}
            />
            <Route
              path="/admin/carousel/edit/:id"
              element={<AdminCarouselEditPage />}
            />
            <Route path="/admin/history" element={<AdminHistoryPage />} />
            <Route path="/admin/about-nyakrom/leadership-governance" element={<AdminLeadershipGovernancePage />} />
            <Route path="/admin/about-nyakrom/:slug" element={<AdminAboutPageEditor />} />
            <Route path="/admin/events" element={<AdminEventsListPage />} />
            <Route
              path="/admin/events/new"
              element={<AdminEventFormPage mode="create" />}
            />
            <Route
              path="/admin/events/:id/edit"
              element={<AdminEventFormPage mode="edit" />}
            />
            <Route
              path="/admin/announcements"
              element={<AdminAnnouncementsListPage />}
            />
            <Route
              path="/admin/announcements/new"
              element={<AdminAnnouncementFormPage mode="create" />}
            />
            <Route
              path="/admin/announcements/:id/edit"
              element={<AdminAnnouncementFormPage mode="edit" />}
            />
            <Route
              path="/admin/:resource/:id/preview"
              element={<AdminPreviewRedirectPage />}
            />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  )
}

export default App
