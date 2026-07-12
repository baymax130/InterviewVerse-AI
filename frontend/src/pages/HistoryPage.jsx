import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { History, ArrowRight } from 'lucide-react'
import { interviewService } from '../services'
import AppLayout from '../components/layout/AppLayout'
import toast from 'react-hot-toast'

const MODE_COLORS = {
  practice: '#10b981', mock: '#7c3aed', hr: '#ec4899',
  technical: '#06b6d4', rapid_fire: '#f59e0b', dream_company: '#3b82f6',
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const load = (p = 1) => {
    setLoading(true)
    interviewService.getHistory({ page: p, per_page: 15 })
      .then(res => {
        setSessions(res.data.sessions)
        setTotalPages(res.data.pages)
        setPage(p)
      })
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  return (
    <AppLayout activePage="History">
      <div className="p-6 md:p-8 space-y-6 pb-20 md:pb-8">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <History className="w-6 h-6 text-brand-400" />
            Interview History
          </h1>
          <p className="text-white/50 text-sm mt-1">{loading ? '…' : `${sessions.length} completed sessions`}</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
          </div>
        ) : sessions.length === 0 ? (
          <div className="glass p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <div className="text-white/50 mb-4">No interviews yet. Start your first one!</div>
            <Link to="/interview/setup" className="btn-primary inline-flex items-center gap-2 px-6 py-3">
              Start Interview
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s, i) => {
              const color = MODE_COLORS[s.mode] || '#7c3aed'
              const scoreColor = s.overall_score >= 7 ? '#10b981' : s.overall_score >= 5 ? '#f59e0b' : '#ef4444'
              return (
                <motion.div key={s.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                  <Link to={`/interview/${s.id}/report`}
                    className="flex items-center gap-4 p-4 glass hover:bg-white/8 transition-all group rounded-2xl">
                    {/* Mode dot */}
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 8px ${color}60` }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-semibold text-sm">{s.role}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full capitalize" style={{ background: `${color}20`, color }}>
                          {s.mode.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-white/30 capitalize">{s.difficulty}</span>
                      </div>
                      <div className="text-white/40 text-xs mt-1">
                        {s.completed_at ? new Date(s.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        {' • '}{s.total_questions} questions
                        {s.duration_seconds > 0 && ` • ${Math.round(s.duration_seconds / 60)}m`}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <div className="font-black text-lg" style={{ color: scoreColor }}>{s.overall_score.toFixed(1)}</div>
                        <div className="text-white/30 text-xs">/ 10</div>
                      </div>
                      {s.xp_earned > 0 && (
                        <div className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400">+{s.xp_earned} XP</div>
                      )}
                      <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex gap-2 justify-center">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => load(i + 1)}
                className={`w-9 h-9 rounded-xl text-sm font-medium transition-all
                  ${page === i + 1 ? 'bg-brand-500 text-white' : 'glass text-white/50 hover:text-white'}`}>
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
