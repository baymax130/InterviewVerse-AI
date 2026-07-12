import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, ThumbsUp, ThumbsDown, Lightbulb, Clock, ChevronDown, ChevronUp, Brain } from 'lucide-react'
import { interviewService } from '../services'
import toast from 'react-hot-toast'

function Timer({ enabled, onTimeUp }) {
  const [seconds, setSeconds] = useState(120)
  useEffect(() => {
    if (!enabled) return
    if (seconds <= 0) { onTimeUp?.(); return }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [seconds, enabled, onTimeUp])
  if (!enabled) return null
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-mono font-bold
      ${seconds < 30 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-white/60 border border-white/10'}`}>
      <Clock className="w-4 h-4" />
      {mins}:{String(secs).padStart(2, '0')}
    </div>
  )
}

function EvaluationCard({ evaluation, questionIndex }) {
  const [expanded, setExpanded] = useState(true)
  const score = evaluation.score || 0
  const color = score >= 7 ? '#10b981' : score >= 5 ? '#f59e0b' : '#ef4444'

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="glass p-5 border-l-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-black" style={{ color }}>{score.toFixed(1)}<span className="text-sm text-white/30">/10</span></div>
          <div>
            <div className="text-white font-semibold text-sm">AI Evaluation</div>
            <div className="text-white/40 text-xs">Question {questionIndex}</div>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-white/30 hover:text-white transition-colors">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Score bars */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        {[
          { label: 'Technical', val: evaluation.technical_accuracy },
          { label: 'Communication', val: evaluation.communication_rating },
          { label: 'Confidence', val: evaluation.confidence_level },
        ].map(item => (
          <div key={item.label}>
            <div className="flex justify-between text-xs text-white/40 mb-1">
              <span>{item.label}</span><span>{item.val?.toFixed(1)}</span>
            </div>
            <div className="progress-bar h-1.5">
              <div className="progress-fill h-full" style={{ width: `${(item.val || 0) * 10}%` }} />
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden space-y-3 pt-2">
            <p className="text-white/70 text-sm leading-relaxed">{evaluation.feedback_summary}</p>
            {evaluation.strengths?.length > 0 && (
              <div>
                <div className="text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <ThumbsUp className="w-3.5 h-3.5" /> Strengths
                </div>
                <div className="flex flex-wrap gap-2">
                  {evaluation.strengths.map(s => <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{s}</span>)}
                </div>
              </div>
            )}
            {evaluation.weaknesses?.length > 0 && (
              <div>
                <div className="text-red-400 text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <ThumbsDown className="w-3.5 h-3.5" /> Weaknesses
                </div>
                <div className="flex flex-wrap gap-2">
                  {evaluation.weaknesses.map(s => <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">{s}</span>)}
                </div>
              </div>
            )}
            {evaluation.improvement_tips?.length > 0 && (
              <div>
                <div className="text-brand-400 text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5" /> Tips
                </div>
                <ul className="space-y-1">
                  {evaluation.improvement_tips.map(t => <li key={t} className="text-xs text-white/60 flex gap-2"><span>•</span><span>{t}</span></li>)}
                </ul>
              </div>
            )}
            {evaluation.better_answer && (
              <div>
                <div className="text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Brain className="w-3.5 h-3.5" /> Expected Answer
                </div>
                <p className="text-white/60 text-xs leading-relaxed p-3 bg-cyan-500/5 rounded-lg border border-cyan-500/10">{evaluation.better_answer}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function InterviewPage() {
  const { sessionId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()

  const [session] = useState(location.state?.session || null)
  const [currentQuestion, setCurrentQuestion] = useState(location.state?.question || null)
  const [progress, setProgress] = useState(location.state?.progress || { current: 1, total: 10 })
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [evaluations, setEvaluations] = useState([])
  const [isComplete, setIsComplete] = useState(false)
  const answerRef = useRef(null)

  useEffect(() => {
    if (!currentQuestion) {
      // Reload session if navigated directly
      interviewService.getSession(sessionId)
        .then(res => {
          const questions = res.data.questions
          const last = questions[questions.length - 1]
          if (last && !last.answer) setCurrentQuestion(last)
          else if (res.data.session.status === 'completed') setIsComplete(true)
        })
        .catch(() => toast.error('Failed to load session.'))
    }
  }, [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async () => {
    if (!answer.trim()) return toast.error('Please write an answer before submitting.')
    if (!currentQuestion) return
    setSubmitting(true)
    try {
      const res = await interviewService.submitAnswer(sessionId, {
        answer,
        question_id: currentQuestion.id,
      })
      const { evaluation, progress: newProgress, next_question, is_complete } = res.data

      setEvaluations(prev => [...prev, { ...evaluation, questionIndex: progress.current }])
      setProgress(newProgress)
      setAnswer('')

      if (is_complete || newProgress.is_complete) {
        setIsComplete(true)
        setCurrentQuestion(null)
        toast.success(`Interview complete! Preparing your report... 🎉`)
        setTimeout(() => navigate(`/interview/${sessionId}/report`), 2000)
      } else {
        setCurrentQuestion(next_question)
        answerRef.current?.focus()
        toast.success('Answer submitted! Next question ready.')
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit answer.')
    } finally {
      setSubmitting(false)
    }
  }

  if (isComplete) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass p-10 text-center max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-black text-white mb-2">Interview Complete!</h2>
          <p className="text-white/60 mb-6">Generating your AI performance report…</p>
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </motion.div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen animated-bg flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const progressPct = ((progress.current - 1) / progress.total) * 100  // progress bar: filled portion = questions answered so far

  return (
    <div className="min-h-screen animated-bg">
      <div className="orb w-72 h-72 top-0 right-0 opacity-10" style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />

      {/* Top bar */}
      <header className="sticky top-0 z-50 glass-dark border-b border-white/5 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center">
            <Brain className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <div className="text-white text-sm font-semibold capitalize">{session?.mode?.replace('_', ' ')} Interview</div>
            <div className="text-white/40 text-xs">{session?.role}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Timer enabled={session?.mode === 'mock' || session?.mode === 'rapid_fire'} />
          <div className="text-white/60 text-sm font-medium">
            Q{progress.current} / {progress.total}
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="progress-bar rounded-none h-1">
        <motion.div className="progress-fill h-full" initial={{ width: 0 }} animate={{ width: `${progressPct}%` }} transition={{ duration: 0.5 }} />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Current question */}
        <AnimatePresence mode="wait">
          <motion.div key={currentQuestion.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="glass p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400 capitalize">{currentQuestion.question_type?.replace('_', ' ')}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-white/40 capitalize">{currentQuestion.difficulty_level}</span>
              <span className="text-xs text-white/30 ml-auto">Q{progress.current}</span>
            </div>
            <p className="text-white text-lg leading-relaxed font-medium">{currentQuestion.question_text}</p>
          </motion.div>
        </AnimatePresence>

        {/* Answer input */}
        <div className="glass p-1">
          <textarea
            ref={answerRef}
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Type your answer here… Be as detailed as you like. Think out loud, explain your reasoning."
            className="w-full bg-transparent text-white placeholder-white/30 resize-none outline-none p-5 text-sm leading-relaxed min-h-[160px]"
            onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') handleSubmit() }}
          />
          <div className="flex items-center justify-between px-5 pb-4">
            <span className="text-white/20 text-xs">{answer.length} chars • Ctrl+Enter to submit</span>
            <motion.button onClick={handleSubmit} disabled={submitting || !answer.trim()}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Evaluating…</>
              ) : (
                <><Send className="w-4 h-4" /> Submit Answer</>
              )}
            </motion.button>
          </div>
        </div>

        {/* Previous evaluations */}
        {evaluations.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-white/50 text-sm font-medium uppercase tracking-wider">Previous Evaluations</h3>
            {[...evaluations].reverse().map((ev, i) => (
              <EvaluationCard key={i} evaluation={ev} questionIndex={ev.questionIndex} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
