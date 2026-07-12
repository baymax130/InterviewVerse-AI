import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Calendar, Target } from 'lucide-react'
import {
  ComposedChart, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Line, PieChart, Pie, Cell
} from 'recharts'
import { dashboardService } from '../services'
import AppLayout from '../components/layout/AppLayout'
import toast from 'react-hot-toast'

const COLORS = ['#7c3aed', '#06b6d4', '#ec4899', '#10b981', '#f59e0b', '#3b82f6']

const TOOLTIP_STYLE = {
  contentStyle: { background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: '8px', color: 'white' }
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null)
  const [period, setPeriod] = useState('weekly')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    dashboardService.getAnalytics(period)
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [period])

  const skeleton = <div className="skeleton h-64 rounded-2xl" />

  return (
    <AppLayout activePage="Analytics">
      <div className="p-6 md:p-8 space-y-6 pb-20 md:pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">Analytics</h1>
            <p className="text-white/50 text-sm">Track your interview performance over time</p>
          </div>
          <div className="flex gap-2">
            {['daily', 'weekly', 'monthly'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize
                  ${period === p ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'glass text-white/50 hover:text-white'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Sessions (Period)', value: data?.total_sessions || 0, icon: Calendar, color: '#7c3aed' },
            { label: 'Avg Score', value: `${data?.avg_score_period || 0}/10`, icon: Target, color: '#10b981' },
          ].map(card => (
            <motion.div key={card.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass p-4">
              <div className="flex items-center gap-2 mb-2">
                <card.icon className="w-4 h-4" style={{ color: card.color }} />
                <span className="text-white/50 text-xs">{card.label}</span>
              </div>
              <div className="text-2xl font-black text-white">{card.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Activity chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-6">
          <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-brand-400" />
            Practice Activity & Average Score
          </h3>
          <p className="text-white/40 text-xs mb-4">Interviews per day with average score</p>
          {loading ? skeleton : (
            data?.activity?.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <ComposedChart data={data.activity}>
                  <XAxis dataKey="date" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 10]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Bar yAxisId="left" dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Sessions" />
                  <Line yAxisId="right" type="monotone" dataKey="avg_score" stroke="#06b6d4" strokeWidth={2} dot={false} name="Avg Score" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center text-white/30 text-sm">
                No data for this period. Start practicing!
              </div>
            )
          )}
        </motion.div>

        {/* Difficulty breakdown */}
        {data?.difficulty_breakdown?.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                Difficulty Distribution
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={data.difficulty_breakdown} dataKey="count" nameKey="difficulty" cx="50%" cy="50%" outerRadius={80} label={({ difficulty, count }) => `${difficulty}: ${count}`}>
                    {data.difficulty_breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass p-6">
              <h3 className="font-semibold text-white mb-4">Score by Difficulty</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.difficulty_breakdown} layout="vertical">
                  <XAxis type="number" domain={[0, 10]} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} />
                  <YAxis dataKey="difficulty" type="category" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Bar dataKey="avg_score" radius={[0, 4, 4, 0]} name="Avg Score">
                    {data.difficulty_breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
