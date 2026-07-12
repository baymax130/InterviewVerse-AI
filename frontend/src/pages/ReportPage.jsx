import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Download, TrendingUp, Target, Brain, Zap, ChevronDown, ChevronUp, Home, RefreshCw } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'
import { interviewService } from '../services'
import AppLayout from '../components/layout/AppLayout'
import toast from 'react-hot-toast'

function ScoreRing({ score, label, size = 80 }) {
  const pct = (score / 10) * 100
  const r = (size / 2) - 6
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const color = score >= 7 ? '#10b981' : score >= 5 ? '#f59e0b' : '#ef4444'

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={5} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="text-center -mt-14">
        <div className="font-black text-white" style={{ fontSize: size * 0.22 }}>{score.toFixed(1)}</div>
        <div className="text-white/40 text-xs">{label}</div>
      </div>
    </div>
  )
}

export default function ReportPage() {
  const { sessionId } = useParams()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    interviewService.getReport(sessionId)
      .then(res => setReport(res.data))
      .catch(() => toast.error('Failed to load report.'))
      .finally(() => setLoading(false))
  }, [sessionId])

  const handleDownloadPDF = () => {
    const url = interviewService.getPDFUrl(sessionId)
    const a = document.createElement('a')
    a.href = url
    a.download = `interview_report_${sessionId}.pdf`
    a.click()
    toast.success('Downloading PDF report…')
  }

  if (loading) {
    return (
      <AppLayout activePage="History">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-white/50">Loading your report…</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!report) {
    return <AppLayout activePage="History"><div className="p-8 text-white/50">Report not found.</div></AppLayout>
  }

  const { session, score, ai_report, answers } = report
  const radarData = score ? [
    { subject: 'Technical', value: score.technical },
    { subject: 'Communication', value: score.communication },
    { subject: 'Confidence', value: score.confidence },
    { subject: 'Problem Solving', value: score.problem_solving },
    { subject: 'Knowledge', value: score.knowledge },
    { subject: 'Consistency', value: score.consistency },
  ] : []

  return (
    <AppLayout activePage="History">
      <div className="p-6 md:p-8 space-y-6 pb-20 md:pb-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <div className="text-white/40 text-sm mb-1">Interview Report</div>
            <h1 className="text-2xl font-black text-white">{session.role}</h1>
            <div className="flex items-center gap-2 mt-1 text-white/50 text-sm">
              <span className="capitalize">{session.mode?.replace('_', ' ')}</span>
              <span>•</span>
              <span className="capitalize">{session.difficulty}</span>
              <span>•</span>
              <span>{session.total_questions} questions</span>
            </div>
          </div>
          <div className="flex gap-3">
            <motion.button onClick={handleDownloadPDF} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm">
              <Download className="w-4 h-4" /> Download PDF
            </motion.button>
            <Link to="/interview/setup" className="btn-secondary flex items-center gap-2 px-5 py-2.5 text-sm">
              <RefreshCw className="w-4 h-4" /> Retry
            </Link>
          </div>
        </motion.div>

        {/* Overall score + radar */}
        <div className="grid md:grid-cols-2 gap-6">
          {score && (
            <>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="glass p-6 flex flex-col items-center justify-center">
                <div className="text-white/50 text-sm mb-4">Overall Performance</div>
                <div className="text-7xl font-black bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent">
                  {session.overall_score.toFixed(1)}
                </div>
                <div className="text-white/30 text-sm mb-6">/10</div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/20 border border-brand-500/30">
                  <Target className="w-4 h-4 text-brand-400" />
                  <span className="text-brand-400 font-semibold text-sm">Readiness: {score.readiness_percent}%</span>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-6 w-full">
                  {[
                    { label: 'Technical', val: score.technical },
                    { label: 'Comm.', val: score.communication },
                    { label: 'Confidence', val: score.confidence },
                  ].map(item => (
                    <div key={item.label} className="text-center">
                      <div className="font-bold text-white">{item.val.toFixed(1)}</div>
                      <div className="text-white/40 text-xs">{item.label}</div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="glass p-6">
                <h3 className="font-semibold text-white mb-4">Skill Breakdown</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                    <Radar dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.2} strokeWidth={2} dot={{ fill: '#7c3aed', r: 3 }} />
                  </RadarChart>
                </ResponsiveContainer>
              </motion.div>
            </>
          )}
        </div>

        {/* AI Assessment */}
        {ai_report && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-brand-400" />
              AI Coach Assessment
            </h3>
            <p className="text-white/70 leading-relaxed text-sm mb-4">{ai_report.overall_assessment}</p>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                <div className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">Strong Areas</div>
                <ul className="space-y-1">
                  {ai_report.strong_areas?.map(a => <li key={a} className="text-white/70 text-sm flex gap-2"><span className="text-emerald-400">✓</span>{a}</li>)}
                </ul>
              </div>
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                <div className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-2">Areas to Improve</div>
                <ul className="space-y-1">
                  {ai_report.weak_areas?.map(a => <li key={a} className="text-white/70 text-sm flex gap-2"><span className="text-red-400">✗</span>{a}</li>)}
                </ul>
              </div>
            </div>

            {ai_report.motivational_message && (
              <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/10">
                <p className="text-brand-400 italic text-sm">"{ai_report.motivational_message}"</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Learning Roadmap */}
        {ai_report?.learning_roadmap && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              3-Week Learning Roadmap
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {ai_report.learning_roadmap?.map((week, i) => (
                <div key={i} className="p-4 rounded-xl border border-white/5 bg-white/2">
                  <div className="text-brand-400 font-semibold text-sm mb-1">Week {week.week}</div>
                  <div className="text-white font-medium text-sm mb-2">{week.focus}</div>
                  <ul className="space-y-1">
                    {week.resources?.map(r => <li key={r} className="text-white/50 text-xs flex gap-1"><span>→</span>{r}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Q&A Breakdown */}
        {answers?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass p-6">
            <h3 className="font-semibold text-white mb-4">Question-by-Question Breakdown</h3>
            <div className="space-y-3">
              {answers.map((ans, i) => {
                const q = ans
                const isOpen = expanded[i]
                const sc = ans.score || 0
                const color = sc >= 7 ? '#10b981' : sc >= 5 ? '#f59e0b' : '#ef4444'
                return (
                  <div key={i} className="border border-white/5 rounded-xl overflow-hidden">
                    <button onClick={() => setExpanded(prev => ({ ...prev, [i]: !prev[i] }))}
                      className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/3 transition-colors">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>
                        {sc.toFixed(1)}/10
                      </span>
                      <span className="text-white/70 text-sm flex-1 truncate">Q{i + 1}: {ans.answer_text?.slice(0, 60)}…</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-white/30 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/30 flex-shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                        <p className="text-white/60 text-sm leading-relaxed"><span className="text-white/30 text-xs block mb-1">Your answer:</span>{ans.answer_text}</p>
                        {ans.feedback_summary && <p className="text-white/60 text-sm italic bg-white/3 rounded-lg p-3">{ans.feedback_summary}</p>}
                        {ans.better_answer && (
                          <div className="bg-brand-500/5 border border-brand-500/10 rounded-lg p-3">
                            <div className="text-brand-400 text-xs font-semibold mb-1">Ideal Answer:</div>
                            <p className="text-white/60 text-xs leading-relaxed">{ans.better_answer}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          <Link to="/dashboard" className="btn-secondary flex items-center gap-2">
            <Home className="w-4 h-4" /> Dashboard
          </Link>
          <Link to="/interview/setup" className="btn-primary flex items-center gap-2">
            <Zap className="w-4 h-4" /> New Interview
          </Link>
        </div>
      </div>
    </AppLayout>
  )
}
