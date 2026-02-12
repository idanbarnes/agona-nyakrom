import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Layout from './layouts/Layout.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import Home from './pages/Home.jsx'
import NewsList from './pages/news/NewsList.jsx'
import NewsDetail from './pages/news/NewsDetail.jsx'
import ObituaryList from './pages/obituaries/ObituaryList.jsx'
import ObituaryDetail from './pages/obituaries/ObituaryDetail.jsx'
import ClanList from './pages/clans/ClanList.jsx'
import ClanDetail from './pages/clans/ClanDetail.jsx'
import AsafoList from './pages/asafo/AsafoList.jsx'
import AsafoDetail from './pages/asafo/AsafoDetail.jsx'
import HallOfFameList from './pages/hallOfFame/HallOfFameList.jsx'
import HallOfFameDetail from './pages/hallOfFame/HallOfFameDetail.jsx'
import Contact from './pages/Contact.jsx'
import LandmarksList from './pages/landmarks/LandmarksList.jsx'
import LandmarksDetail from './pages/landmarks/LandmarksDetail.jsx'
import History from './pages/about/History.jsx'
import AboutRichPage from './pages/about/AboutRichPage.jsx'
import LeadershipGovernance from './pages/about/LeadershipGovernance.jsx'
import LeaderProfile from './pages/about/LeaderProfile.jsx'
import AnnouncementsEventsPage from './pages/AnnouncementsEventsPage.jsx'
import EventDetail from './pages/events/EventDetail.jsx'
import AnnouncementDetail from './pages/announcements/AnnouncementDetail.jsx'
import NotFound from './pages/NotFound.jsx'
// import DevApiTest from './dev/DevApiTest.jsx' //For Dev-only API test component

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* <Route element={<DevApiTest />} /> Dev-only API test component */}
          <Route index element={<Home />} />
          <Route path="news" element={<NewsList />} />
          <Route path="updates" element={<NewsList />} />
          <Route path="news/:slug" element={<NewsDetail />} />
          <Route path="obituaries" element={<ObituaryList />} />
          <Route path="obituaries/:slug" element={<ObituaryDetail />} />
          <Route path="clans" element={<ClanList />} />
          <Route path="clans/:slug" element={<ClanDetail />} />
          <Route path="asafo-companies" element={<AsafoList />} />
          <Route path="asafo-companies/:slug" element={<AsafoDetail />} />
          <Route path="hall-of-fame" element={<HallOfFameList />} />
          <Route path="hall-of-fame/:slug" element={<HallOfFameDetail />} />
          <Route path="landmarks" element={<LandmarksList />} />
          <Route path="landmarks/:slug" element={<LandmarksDetail />} />
          <Route path="history" element={<Navigate to="/about-nyakrom/history" replace />} />
          <Route path="about-nyakrom/:slug" element={<AboutRichPage />} />
          <Route path="about-nyakrom/leadership-governance" element={<LeadershipGovernance />} />
          <Route path="about-nyakrom/leadership-governance/:slug" element={<LeaderProfile />} />
          <Route
            path="announcements-events"
            element={<AnnouncementsEventsPage />}
          />
          <Route path="events/:slug" element={<EventDetail />} />
          <Route path="announcements/:slug" element={<AnnouncementDetail />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
