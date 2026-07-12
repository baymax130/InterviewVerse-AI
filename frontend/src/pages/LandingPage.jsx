import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, Zap, Trophy, BarChart3, Star, ChevronRight, Check, ArrowRight, Sparkles, Target, TrendingUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const FEATURES = [
  { icon: Brain, title: 'AI-Powered Interviews', desc: 'IBM watson AI simulates real interviewer behavior, adapts to your answers, and asks follow-up questions.', color: 'from-purple-500 to-violet-600', tag: 'Live' },
  { icon: Target, title: 'Role-Specific Questions', desc: 'Get questions tailored to your exact role — from Frontend Dev to ML Engineer. Industry-accurate.', color: 'from-cyan-500 to-blue-600', tag: 'Smart' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Track your progress, identify weak areas, and measure improvement with beautiful interactive charts.', color: 'from-pink-500 to-rose-600', tag: 'Insights' },
  { icon: TrendingUp, title: 'Adaptive Difficulty', desc: 'AI adjusts difficulty based on your performance. Performs well? Questions get harder automatically.', color: 'from-orange-500 to-amber-600', tag: 'AI' },
  { icon: Trophy, title: 'Gamification', desc: 'Earn XP, level up, unlock achievements, maintain streaks and climb the leaderboard.', color: 'from-emerald-500 to-teal-600', tag: 'Fun' },
  { icon: Sparkles, title: 'Instant AI Feedback', desc: 'After every answer, get detailed feedback: strengths, weaknesses, ideal answers, and study resources.', color: 'from-indigo-500 to-purple-600', tag: 'Real-time' },
]

const MODES = [
  { name: 'Practice Mode', desc: 'Relaxed learning with hints', color: '#10b981', emoji: '📚' },
  { name: 'Mock Interview', desc: 'Real simulation with timer', color: '#7c3aed', emoji: '⏱️' },
  { name: 'HR Interview', desc: 'Behavioral & communication', color: '#ec4899', emoji: '🤝' },
  { name: 'Technical', desc: 'Coding & system design', color: '#06b6d4', emoji: '💻' },
  { name: 'Rapid Fire', desc: '15 questions, countdown', color: '#f59e0b', emoji: '⚡' },
  { name: 'Dream Company', desc: 'Google, Amazon, Meta & more', color: '#3b82f6', emoji: '🚀' },
]

const TESTIMONIALS = [
  { name: 'Priya S.', role: 'Frontend Dev @ Google', text: 'InterviewVerse AI completely changed how I prep. Got 3 offers in one month!', rating: 5 },
  { name: 'Rahul M.', role: 'SDE Intern @ Amazon', text: 'The adaptive difficulty is insane. Felt like a real interview every single time.', rating: 5 },
  { name: 'Ananya K.', role: 'ML Engineer @ Microsoft', text: 'The AI feedback is brutally honest and incredibly helpful. 10/10 would recommend.', rating: 5 },
]

const FAQS = [
  { q: 'Is this free to use?', a: 'Yes, the core platform is free. Just set up your IBM watsonx.ai credentials to unlock the full AI experience.' },
  { q: 'Which roles are supported?', a: 'Over 25 roles including Frontend, Backend, ML Engineer, Data Scientist, DevOps, UI/UX, and more.' },
  { q: 'How does the AI generate questions?', a: 'We use IBM Granite LLM to dynamically generate role-specific, difficulty-adaptive questions that mirror real interviews.' },
  { q: 'Can I download my report?', a: 'Yes! After each interview, you can download a detailed PDF report with scores, feedback, and a learning roadmap.' },
  { q: 'Is my data secure?', a: 'All data is stored locally in your SQLite database. JWT authentication protects your account.' },
]

export default function LandingPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleStart = () => navigate(user ? '/interview/setup' : '/register')

  return (
    <div className="min-h-screen animated-bg overflow-x-hidden">
      {/* Floating orbs */}
      <div className="orb w-96 h-96 top-0 left-1/4 opacity-20" style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
      <div className="orb w-80 h-80 top-1/3 right-0 opacity-15" style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />
      <div className="orb w-64 h-64 bottom-1/3 left-0 opacity-10" style={{ background: 'radial-gradient(circle, #ec4899, transparent)' }} />

      {/* Navbar */}
      <nav className="relative z-50 px-6 py-5 flex items-center justify-between max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent">InterviewVerse AI</span>
        </motion.div>
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard" className="btn-primary text-sm">Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn-secondary text-sm">Login</Link>
              <Link to="/register" className="btn-primary text-sm">Get Started Free</Link>
            </>
          )}
        </motion.div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 text-center px-6 pt-20 pb-32 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>Powered by IBM watsonx.ai Granite</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black mb-6 leading-none">
            <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">Master Every</span>
            <br />
            <span className="bg-gradient-to-r from-brand-400 via-cyan-400 to-pink-400 bg-clip-text text-transparent">Interview with AI</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/60 mb-12 max-w-2xl mx-auto leading-relaxed">
            Practice Real Interviews. Receive Instant Feedback. Get Hired Faster.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <motion.button onClick={handleStart} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
              <Zap className="w-5 h-5" />
              Start Interview Now
              <ArrowRight className="w-5 h-5" />
            </motion.button>
            <motion.button onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="btn-secondary flex items-center gap-2 text-lg px-8 py-4">
              Explore Features
            </motion.button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="grid grid-cols-3 gap-6 mt-20 max-w-xl mx-auto">
          {[['25+', 'Roles'], ['6', 'Interview Modes'], ['100%', 'AI Powered']].map(([num, label]) => (
            <div key={label} className="glass p-4">
              <div className="text-3xl font-black bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent">{num}</div>
              <div className="text-white/50 text-sm mt-1">{label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Interview Modes */}
      <section className="relative z-10 px-6 py-20 max-w-7xl mx-auto">
        <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-4">Choose Your Battle</motion.h2>
        <p className="text-white/50 text-center mb-12">6 powerful interview modes for every situation</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {MODES.map((mode, i) => (
            <motion.div key={mode.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="glass p-6 cursor-pointer group">
              <div className="text-3xl mb-3">{mode.emoji}</div>
              <h3 className="font-bold text-white group-hover:text-brand-400 transition-colors">{mode.name}</h3>
              <p className="text-white/50 text-sm mt-1">{mode.desc}</p>
              <div className="w-full h-0.5 rounded-full mt-4 opacity-60" style={{ background: mode.color }} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 py-20 max-w-7xl mx-auto">
        <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-4">Everything You Need</motion.h2>
        <p className="text-white/50 text-center mb-12">A complete interview preparation ecosystem</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -6 }} className="glass p-6 group">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4`}>
                <f.icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-bold text-white">{f.title}</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-400">{f.tag}</span>
              </div>
              <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 px-6 py-20 max-w-7xl mx-auto">
        <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-12">What Students Say</motion.h2>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <motion.div key={t.name} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ delay: i * 0.15 }}
              className="glass p-6">
              <div className="flex gap-0.5 mb-4">
                {Array(t.rating).fill(0).map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-white/70 italic mb-4">"{t.text}"</p>
              <div>
                <div className="font-semibold text-white">{t.name}</div>
                <div className="text-brand-400 text-sm">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="relative z-10 px-6 py-20 max-w-3xl mx-auto">
        <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          className="text-4xl font-bold text-center mb-12">FAQs</motion.h2>
        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <motion.details key={i} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="glass p-5 cursor-pointer group">
              <summary className="font-semibold text-white list-none flex justify-between items-center">
                {faq.q}
                <ChevronRight className="w-5 h-5 text-brand-400 group-open:rotate-90 transition-transform" />
              </summary>
              <p className="text-white/60 text-sm mt-3 leading-relaxed">{faq.a}</p>
            </motion.details>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative z-10 px-6 py-20 max-w-4xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="glass p-12 neon-purple">
          <h2 className="text-4xl font-black mb-4">Ready to Get Hired?</h2>
          <p className="text-white/60 mb-8 text-lg">Join thousands of students mastering interviews with AI</p>
          <motion.button onClick={handleStart} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2">
            <Zap className="w-5 h-5" /> Start for Free <ArrowRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 px-6 py-10 text-center text-white/30 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-brand-500" />
          <span className="font-semibold text-white/50">InterviewVerse AI</span>
        </div>
        <p>Built with IBM watsonx.ai Granite • Final Year Engineering Project • {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}
