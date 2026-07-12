import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, ArrowRight, ArrowLeft, ChevronDown } from 'lucide-react'
import { interviewService } from '../services'
import AppLayout from '../components/layout/AppLayout'
import toast from 'react-hot-toast'

const MODES = [
  { id: 'practice', name: 'Practice Mode', emoji: '📚', desc: 'Relaxed practice with hints. Perfect for beginners.', color: '#10b981' },
  { id: 'mock', name: 'Mock Interview', emoji: '⏱️', desc: 'Real interview simulation with timer. No hints.', color: '#7c3aed' },
  { id: 'hr', name: 'HR Interview', emoji: '🤝', desc: 'Behavioral & communication skills focused.', color: '#ec4899' },
  { id: 'technical', name: 'Technical Interview', emoji: '💻', desc: 'Deep technical: coding, system design, debugging.', color: '#06b6d4' },
  { id: 'rapid_fire', name: 'Rapid Fire', emoji: '⚡', desc: '15 quick-fire questions with countdown timer.', color: '#f59e0b' },
  { id: 'dream_company', name: 'Dream Company', emoji: '🚀', desc: 'Questions styled for top tech companies.', color: '#3b82f6' },
]

const ROLES = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Software Engineer',
  'Python Developer', 'Java Developer', 'C++ Developer', 'JavaScript Developer',
  'React Developer', 'Node.js Developer', 'Machine Learning Engineer', 'AI Engineer',
  'Data Scientist', 'Cloud Engineer', 'DevOps Engineer', 'Cybersecurity Analyst',
  'Database Engineer', 'Android Developer', 'UI/UX Designer', 'HR',
  'Business Analyst', 'Product Manager', 'Data Analyst', 'QA Engineer',
  'Freshers (Any)', 'Custom Role',
]

const DIFFICULTIES = [
  { id: 'easy', name: 'Easy', desc: 'Beginner friendly', color: '#10b981', emoji: '🌱' },
  { id: 'medium', name: 'Medium', desc: 'Balanced challenge', color: '#f59e0b', emoji: '🔥' },
  { id: 'hard', name: 'Hard', desc: 'Expert level', color: '#ef4444', emoji: '💀' },
  { id: 'adaptive', name: 'Adaptive', desc: 'AI-adjusted in real-time', color: '#7c3aed', emoji: '🤖' },
]

const COMPANIES = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Tesla', 'Adobe', 'IBM', 'TCS', 'Infosys', 'Accenture', 'Wipro', 'Capgemini']
const LANGUAGES = ['English', 'Hindi', 'Spanish', 'French', 'German', 'Portuguese', 'Chinese']

const TECHNOLOGIES = [
  'Python', 'Java', 'C++', 'JavaScript', 'TypeScript',
  'React', 'Node.js', 'SQL', 'DBMS', 'Operating Systems',
  'Computer Networks', 'Data Structures & Algorithms',
  'Machine Learning', 'Artificial Intelligence', 'HR', 'Custom',
]

export default function InterviewSetupPage() {
  const [step, setStep] = useState(1)
  const [config, setConfig] = useState({ mode: '', role: '', difficulty: 'medium', language: 'English', technology: '', customTechnology: '', company: '', customRole: '' })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const set = (k, v) => setConfig(prev => ({ ...prev, [k]: v }))
  const finalRole = config.role === 'Custom Role' ? config.customRole : config.role

  const finalTechnology = config.technology === 'Custom' ? config.customTechnology : config.technology

  const handleStart = async () => {
    if (!config.mode || !finalRole) return toast.error('Please complete all selections.')
    setLoading(true)
    try {
      const res = await interviewService.start({
        mode: config.mode,
        role: finalRole,
        difficulty: config.difficulty,
        language: config.language,
        technology: finalTechnology,
        company: config.mode === 'dream_company' ? config.company : '',
      })
      toast.success('Interview starting! 🚀')
      navigate(`/interview/${res.data.session.id}`, { state: { session: res.data.session, question: res.data.question, progress: res.data.progress } })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start interview.')
    } finally {
      setLoading(false)
    }
  }

  const canNext = () => {
    if (step === 1) return !!config.mode
    if (step === 2) return !!(config.role && (config.role !== 'Custom Role' || config.customRole))
    if (step === 3) return !!config.difficulty
    return true
  }

  return (
    <AppLayout activePage="New Interview">
      <div className="min-h-screen p-6 md:p-8 pb-20 md:pb-8">
        {/* Progress steps */}
        <div className="max-w-3xl mx-auto mb-8">
          <div className="flex items-center gap-2 mb-2">
            {['Mode', 'Role', 'Settings', 'Confirm'].map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${step > i + 1 ? 'bg-brand-500 text-white' : step === i + 1 ? 'bg-brand-500/30 border-2 border-brand-500 text-brand-400' : 'bg-white/5 text-white/30'}`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium ${step === i + 1 ? 'text-white' : 'text-white/30'}`}>{s}</span>
                {i < 3 && <div className={`flex-1 h-0.5 rounded ${step > i + 1 ? 'bg-brand-500' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Mode */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-3xl font-black text-white mb-2">Choose Interview Mode</h2>
                <p className="text-white/50 mb-6">Select how you want to practice today</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {MODES.map(m => (
                    <motion.button key={m.id} whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }}
                      onClick={() => set('mode', m.id)}
                      className={`glass p-5 text-left transition-all ${config.mode === m.id ? 'border-2 neon-purple' : 'border border-white/10 hover:border-white/20'}`}
                      style={config.mode === m.id ? { borderColor: m.color, boxShadow: `0 0 20px ${m.color}30` } : {}}>
                      <div className="text-2xl mb-2">{m.emoji}</div>
                      <div className="font-bold text-white text-sm mb-1">{m.name}</div>
                      <div className="text-white/50 text-xs leading-relaxed">{m.desc}</div>
                      {config.mode === m.id && <div className="w-full h-0.5 rounded-full mt-3" style={{ background: m.color }} />}
                    </motion.button>
                  ))}
                </div>

                {config.mode === 'dream_company' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                    <label className="text-white/70 text-sm font-medium block mb-2">Select Company</label>
                    <div className="relative">
                      <select value={config.company} onChange={e => set('company', e.target.value)}
                        className="input-dark appearance-none pr-10">
                        <option value="">Choose a company…</option>
                        {COMPANIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 pointer-events-none" />
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Step 2: Role */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-3xl font-black text-white mb-2">Your Target Role</h2>
                <p className="text-white/50 mb-6">Questions will be tailored to your role</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {ROLES.map(r => (
                    <motion.button key={r} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => set('role', r)}
                      className={`glass p-3 text-sm font-medium transition-all text-left
                        ${config.role === r ? 'border-brand-500 bg-brand-500/10 text-brand-400' : 'text-white/70 hover:text-white hover:border-white/20'}`}>
                      {r}
                    </motion.button>
                  ))}
                </div>
                {config.role === 'Custom Role' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                    <input value={config.customRole} onChange={e => set('customRole', e.target.value)}
                      placeholder="Enter your role (e.g. Blockchain Developer)" className="input-dark" />
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Step 3: Settings */}
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-3xl font-black text-white mb-2">Configure Settings</h2>
                <p className="text-white/50 mb-6">Fine-tune your interview experience</p>

                <div className="space-y-6">
                  <div>
                    <label className="text-white/70 text-sm font-semibold block mb-3">Difficulty Level</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {DIFFICULTIES.map(d => (
                        <motion.button key={d.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                          onClick={() => set('difficulty', d.id)}
                          className={`glass p-4 text-center transition-all ${config.difficulty === d.id ? 'border-2' : 'border border-white/10'}`}
                          style={config.difficulty === d.id ? { borderColor: d.color, boxShadow: `0 0 15px ${d.color}30` } : {}}>
                          <div className="text-2xl mb-1">{d.emoji}</div>
                          <div className="font-bold text-white text-sm">{d.name}</div>
                          <div className="text-white/40 text-xs mt-0.5">{d.desc}</div>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-white/70 text-sm font-semibold block mb-2">Technology / Topic</label>
                    <div className="relative">
                      <select value={config.technology} onChange={e => set('technology', e.target.value)}
                        className="select-dark appearance-none pr-10">
                        <option value="">— None / General —</option>
                        {TECHNOLOGIES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 pointer-events-none" />
                    </div>
                    {config.technology === 'Custom' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-2">
                        <input value={config.customTechnology} onChange={e => set('customTechnology', e.target.value)}
                          placeholder="e.g. Kubernetes, GraphQL, Rust…" className="input-dark" />
                      </motion.div>
                    )}
                  </div>

                  <div>
                    <label className="text-white/70 text-sm font-semibold block mb-2">Language</label>
                    <div className="relative">
                      <select value={config.language} onChange={e => set('language', e.target.value)}
                        className="select-dark appearance-none pr-10">
                        {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Confirm */}
            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-3xl font-black text-white mb-2">Ready to Begin?</h2>
                <p className="text-white/50 mb-6">Review your interview configuration</p>
                <div className="glass p-6 space-y-4 mb-6">
                  {[
                    ['Mode', MODES.find(m => m.id === config.mode)?.name || config.mode],
                    ['Role', finalRole],
                    ['Difficulty', DIFFICULTIES.find(d => d.id === config.difficulty)?.name],
                    finalTechnology && ['Technology', finalTechnology],
                    ['Language', config.language],
                    config.company && ['Company', config.company],
                  ].filter(Boolean).map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-white/50 text-sm">{k}</span>
                      <span className="text-white font-semibold">{v}</span>
                    </div>
                  ))}
                </div>
                <motion.button onClick={handleStart} disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-lg">
                  {loading ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating Questions…</>
                  ) : (
                    <><Zap className="w-6 h-6" /> Start Interview Now!</>
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button onClick={() => setStep(s => s - 1)} disabled={step === 1}
              className="btn-secondary flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            {step < 4 && (
              <button onClick={() => setStep(s => s + 1)} disabled={!canNext()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                Next <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
