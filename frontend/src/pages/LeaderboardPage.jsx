import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { profileService } from '../services'
import AppLayout from '../components/layout/AppLayout'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const RANK_ICONS = { 1: '🥇', 2: '🥈', 3: '🥉' }
const RANK_COLORS = { 1: '#f59e0b', 2: '#94a3b8', 3: '#b45309' }

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    profileService.getLeaderboard()
      .then(res => setLeaders(res.data.leaderboard))
      .catch(() => toast.error('Failed to load leaderboard'))
      .finally(() => setLoading(false))
  }, [])

  const maxXP = leaders[0]?.xp || 1

  return (
    <AppLayout activePage="Leaderboard">
      <div className="p-6 md:p-8 pb-20 md:pb-8 max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🏆</div>
          <h1 className="text-2xl font-black text-white">Leaderboard</h1>
          <p className="text-white/50 text-sm mt-1">Top performers ranked by XP</p>
        </div>

        {/* Top 3 podium */}
        {!loading && leaders.length >= 3 && (
          <div className="flex items-end justify-center gap-4 mb-8">
            {[leaders[1], leaders[0], leaders[2]].map((leader, i) => {
              const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3
              const height = actualRank === 1 ? 'h-32' : actualRank === 2 ? 'h-24' : 'h-20'
              return (
                <motion.div key={leader.username} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                  className="flex flex-col items-center gap-2">
                  <div className="text-2xl">{RANK_ICONS[actualRank]}</div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                    {leader.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="text-xs font-medium text-white truncate max-w-16 text-center">{leader.username}</div>
                  <div className={`${height} w-16 rounded-t-xl flex items-center justify-center`}
                    style={{ background: `${RANK_COLORS[actualRank]}20`, border: `2px solid ${RANK_COLORS[actualRank]}40` }}>
                    <span className="text-xs font-bold" style={{ color: RANK_COLORS[actualRank] }}>{leader.xp} XP</span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Full list */}
        {loading ? (
          <div className="space-y-3">
            {Array(8).fill(0).map((_, i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}
          </div>
        ) : (
          <div className="space-y-2">
            {leaders.map((leader, i) => {
              const isMe = leader.username === user?.username
              return (
                <motion.div key={leader.username} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className={`flex items-center gap-4 p-4 rounded-2xl transition-all ${isMe ? 'glass neon-purple border-brand-500/30' : 'glass'}`}>
                  <div className="w-8 text-center font-black" style={{ color: RANK_COLORS[leader.rank] || 'rgba(255,255,255,0.3)', fontSize: leader.rank <= 3 ? 20 : 14 }}>
                    {RANK_ICONS[leader.rank] || leader.rank}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {leader.username?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">{leader.username}</span>
                      {isMe && <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/30 text-brand-400">You</span>}
                    </div>
                    <div className="text-white/40 text-xs">Level {leader.level} • {leader.total_interviews} interviews • Avg {leader.average_score}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-black text-white">{leader.xp.toLocaleString()}</div>
                    <div className="text-white/30 text-xs">XP</div>
                    <div className="progress-bar w-20 mt-1 h-1">
                      <div className="progress-fill h-full" style={{ width: `${(leader.xp / maxXP) * 100}%` }} />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
