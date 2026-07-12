import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Brain, Home, BarChart3, History, User, Trophy, LogOut, Zap, ChevronRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/interview/setup', icon: Zap, label: 'New Interview' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function AppLayout({ children, activePage }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Derive active state from URL so highlighting always matches the current route,
  // even when activePage prop is missing or slightly mismatched.
  const isActive = (item) => {
    if (location.pathname === item.to) return true
    if (item.to === '/interview/setup' && location.pathname.startsWith('/interview')) return true
    return activePage === item.label
  }

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen border-r border-white/5 p-6 glass-dark fixed left-0 top-0 h-full">
        <Link to="/dashboard" className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white">InterviewVerse</span>
        </Link>

        {/* User info */}
        <div className="glass p-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <div className="font-semibold text-white text-sm truncate">{user?.username}</div>
              <div className="text-white/40 text-xs">Level {user?.level} • {user?.xp} XP</div>
            </div>
          </div>
          {/* XP bar */}
          <div className="progress-bar mt-3">
            <div className="progress-fill" style={{ width: `${(user?.xp % 500) / 5}%` }} />
          </div>
          <div className="text-white/30 text-xs mt-1">{user?.xp % 500}/500 XP to next level</div>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV.map(item => {
            const active = isActive(item)
            return (
              <Link key={item.to} to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${active
                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                    : 'text-white/50 hover:text-white hover:bg-white/5'}`}>
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {item.label}
                {active && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            )
          })}
        </nav>

        <button onClick={() => { logout(); navigate('/') }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 mt-4">
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </aside>

      {/* Mobile nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-dark border-t border-white/5 flex justify-around py-3 px-2">
        {NAV.slice(0, 5).map(item => {
          const active = isActive(item)
          return (
            <Link key={item.to} to={item.to} className={`flex flex-col items-center gap-1 text-xs
              ${active ? 'text-brand-400' : 'text-white/40'}`}>
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Main content */}
      <main className="flex-1 md:ml-64 min-h-screen">
        {children}
      </main>
    </div>
  )
}
