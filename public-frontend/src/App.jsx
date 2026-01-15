import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './layouts/Layout.jsx'
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
import NotFound from './pages/NotFound.jsx'
// import DevApiTest from './dev/DevApiTest.jsx' //For Dev-only API test component

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* <Route element={<DevApiTest />} /> Dev-only API test component */}
          <Route index element={<Home />} />
          <Route path="news" element={<NewsList />} />
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
          <Route path="about/history" element={<History />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
