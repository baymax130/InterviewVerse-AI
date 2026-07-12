import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Trophy, Flame, Target, TrendingUp, ArrowRight, BarChart2, Clock, Award, Star } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { dashboardService } from '../services'
import AppLayout from '../components/layout/AppLayout'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

function StatCard({ icon: Icon, label, value, sub, color, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="glass p-5 flex items-start gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0`}
        style={{ background: `${color}20`, border: `1px solid ${color}30` }}>
        <Icon className="w-6 h-6" style={{ color }} />
      </div>
      <div>
        <div className="text-2xl font-black text-white">{value}</div>
        <div className="text-white/60 text-sm">{label}</div>
        {sub && <div className="text-white/30 text-xs mt-0.5">{sub}</div>}
      </div>
    </motion.div>
  )
}

const MOTIVATIONAL = [
  "Every expert was once a beginner. Keep going! 🔥",
  "Consistency beats talent. Practice daily! ⚡",
  "Your dream job is one interview away! 🚀",
  "Hard work beats talent when talent doesn't work hard! 💪",
  "One more practice session = one step closer! 🎯",
]

export default function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()
  const motivational = MOTIVATIONAL[new Date().getDay() % MOTIVATIONAL.length]

  useEffect(() => {
    dashboardService.getDashboard()
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  const stats = data?.stats || {}
  const streak = data?.streak || {}

  if (loading) {
    return (
      <AppLayout activePage="Dashboard">
        <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout activePage="Dashboard">
      <div className="p-6 md:p-8 space-y-6 pb-20 md:pb-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white">
              Hey, <span className="bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent">{user?.username}</span> 👋
            </h1>
            <p className="text-white/50 mt-1">{motivational}</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/interview/setup')}
            className="btn-primary flex items-center gap-2 px-6 py-3 self-start md:self-auto">
            <Zap className="w-5 h-5" />
            Quick Start Interview
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Trophy} label="Total Interviews" value={stats.total_interviews || 0} color="#7c3aed" delay={0.1} />
          <StatCard icon={Target} label="Average Score" value={`${stats.average_score || 0}/10`} color="#06b6d4" delay={0.15} />
          <StatCard icon={Flame} label="Day Streak" value={streak.current_streak || 0} sub={`Best: ${streak.longest_streak || 0}`} color="#f59e0b" delay={0.2} />
          <StatCard icon={Star} label="Level & XP" value={`Lv.${stats.level || 1}`} sub={`${stats.xp || 0} XP total`} color="#ec4899" delay={0.25} />
        </div>

        {/* Score trend + Recent interviews */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Score Trend */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass p-6 lg:col-span-3">
            <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-400" />
              Score Trend
            </h3>
            <p className="text-white/40 text-xs mb-4">Last 10 sessions</p>
            {data?.score_trend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={data.score_trend}>
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 10]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '8px', color: 'white' }} />
                  <Line type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2.5} dot={{ fill: '#7c3aed', r: 4 }} activeDot={{ r: 6, fill: '#06b6d4' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 text-white/30 text-sm">
                Complete interviews to see your progress
              </div>
            )}
          </motion.div>

          {/* Recent Interviews */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="glass p-6 lg:col-span-2">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-400" />
              Recent Sessions
            </h3>
            <div className="space-y-3">
              {data?.recent_interviews?.length > 0 ? data.recent_interviews.map((s, i) => (
                <Link key={s.id} to={`/interview/${s.id}/report`}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group">
                  <div>
                    <div className="text-white text-sm font-medium">{s.role}</div>
                    <div className="text-white/40 text-xs capitalize">{s.mode.replace('_', ' ')}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${s.overall_score >= 7 ? 'text-emerald-400' : s.overall_score >= 5 ? 'text-amber-400' : 'text-red-400'}`}>
                      {s.overall_score.toFixed(1)}
                    </span>
                    <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white transition-colors" />
                  </div>
                </Link>
              )) : (
                <div className="text-white/30 text-sm text-center py-8">
                  No interviews yet. <Link to="/interview/setup" className="text-brand-400 hover:underline">Start one!</Link>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Skills + Achievements */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Skills */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass p-6">
            <h3 className="font-semibold text-white mb-4">Skill Insights</h3>
            <div className="space-y-4">
              {data?.strong_skills?.length > 0 && (
                <div>
                  <div className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">Strong Areas</div>
                  <div className="flex flex-wrap gap-2">
                    {data.strong_skills.map(s => (
                      <span key={s} className="px-3 py-1 rounded-full text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {data?.weak_skills?.length > 0 && (
                <div>
                  <div className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-2">Focus Areas</div>
                  <div className="flex flex-wrap gap-2">
                    {data.weak_skills.map(s => (
                      <span key={s} className="px-3 py-1 rounded-full text-xs bg-red-500/10 text-red-400 border border-red-500/20">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {(!data?.strong_skills?.length && !data?.weak_skills?.length) && (
                <p className="text-white/30 text-sm">Complete more interviews to see skill insights.</p>
              )}
            </div>
          </motion.div>

          {/* Achievements */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                Recent Achievements
              </h3>
              <Link to="/profile" className="text-brand-400 text-xs hover:text-brand-300">View all</Link>
            </div>
            <div className="space-y-3">
              {data?.achievements?.length > 0 ? data.achievements.map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-lg">🏆</div>
                  <div>
                    <div className="text-white text-sm font-medium">{a.badge_name}</div>
                    <div className="text-white/40 text-xs">{a.badge_description}</div>
                  </div>
                </div>
              )) : (
                <p className="text-white/30 text-sm">Complete interviews to earn badges!</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Role Performance */}
        {data?.role_performance?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-brand-400" />
              Performance by Role
            </h3>
            <div className="space-y-3">
              {data.role_performance.map(r => (
                <div key={r.role} className="flex items-center gap-4">
                  <div className="text-white/70 text-sm w-40 flex-shrink-0 truncate">{r.role}</div>
                  <div className="flex-1 progress-bar">
                    <div className="progress-fill" style={{ width: `${r.avg_score * 10}%` }} />
                  </div>
                  <div className="text-white/70 text-sm w-16 text-right">{r.avg_score}/10 <span className="text-white/30 text-xs">({r.count}x)</span></div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  )
}
