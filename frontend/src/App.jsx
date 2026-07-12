import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import InterviewSetupPage from './pages/InterviewSetupPage'
import InterviewPage from './pages/InterviewPage'
import ReportPage from './pages/ReportPage'
import HistoryPage from './pages/HistoryPage'
import ProfilePage from './pages/ProfilePage'
import AnalyticsPage from './pages/AnalyticsPage'
import LeaderboardPage from './pages/LeaderboardPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(15, 23, 42, 0.95)',
              color: '#fff',
              border: '1px solid rgba(124, 58, 237, 0.3)',
              borderRadius: '12px',
              backdropFilter: 'blur(20px)',
            },
          }}
        />
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/interview/setup" element={<ProtectedRoute><InterviewSetupPage /></ProtectedRoute>} />
          <Route path="/interview/:sessionId" element={<ProtectedRoute><InterviewPage /></ProtectedRoute>} />
          <Route path="/interview/:sessionId/report" element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />
          <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><LeaderboardPage /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
