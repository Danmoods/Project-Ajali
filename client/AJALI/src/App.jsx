import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing.jsx'
import Register from './pages/Register.jsx'
import Login from './pages/Login.jsx'
import AppLayout from './components/layout/AppLayout.jsx'
import Home from './pages/Home.jsx'
import ReportCategory from './pages/ReportCategory.jsx'
import ReportForm from './pages/ReportForm.jsx'
import Reports from './pages/Reports.jsx'
import IncidentDetail from './pages/IncidentDetail.jsx'
import Community from './pages/Community.jsx'
import IncidentMap from './pages/IncidentMap.jsx'
import Profile from './pages/Profile.jsx'
import AdminLayout from './components/layout/AdminLayout.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import AdminIncidents from './pages/admin/AdminIncidents.jsx'
import { RequireAuth, RequireAdmin } from './components/ProtectedRoute.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/app"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Home />} />
        <Route path="report" element={<ReportCategory />} />
        <Route path="report/new" element={<ReportForm />} />
        <Route path="reports" element={<Reports />} />
        <Route path="reports/:id" element={<IncidentDetail />} />
        <Route path="community" element={<Community />} />
        <Route path="map" element={<IncidentMap />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route
        path="/admin"
        element={
          <RequireAdmin>
            <AdminLayout />
          </RequireAdmin>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="incidents" element={<AdminIncidents />} />
        <Route path="incidents/:id" element={<IncidentDetail />} />
        <Route path="map" element={<IncidentMap />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
