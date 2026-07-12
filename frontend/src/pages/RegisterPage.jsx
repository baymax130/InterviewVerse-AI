import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, Mail, Lock, User, Eye, EyeOff, Zap, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const PERKS = ['AI-powered interview practice', 'Instant detailed feedback', 'Progress tracking & analytics', 'Badges & achievements']

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.email || !form.password) return toast.error('Please fill all fields.')
    if (form.password !== form.confirm) return toast.error('Passwords do not match.')
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters.')
    setLoading(true)
    try {
      await register(form.username, form.email, form.password)
      toast.success('Account created! Welcome to InterviewVerse 🚀')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center px-4 py-12">
      <div className="orb w-96 h-96 top-0 right-0 opacity-20" style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
      <div className="orb w-64 h-64 bottom-0 left-0 opacity-15" style={{ background: 'radial-gradient(circle, #ec4899, transparent)' }} />

      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 relative z-10">
        {/* Left panel */}
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
          className="hidden md:flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent">InterviewVerse AI</span>
          </div>
          <h2 className="text-4xl font-black text-white mb-4 leading-tight">
            Your Interview<br />
            <span className="bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent">Superpower</span>
          </h2>
          <p className="text-white/60 mb-8 leading-relaxed">Join thousands of students who landed their dream jobs using AI-powered practice.</p>
          <div className="space-y-3">
            {PERKS.map(perk => (
              <div key={perk} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-brand-400" />
                </div>
                <span className="text-white/70 text-sm">{perk}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right panel */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass p-8">
          <div className="text-center md:text-left mb-6">
            <h1 className="text-2xl font-bold text-white">Create Account</h1>
            <p className="text-white/50 text-sm mt-1">Start your interview journey today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-white/70 text-sm font-medium block mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input type="text" value={form.username} onChange={set('username')}
                  placeholder="cooldev123" className="input-dark pl-10" autoComplete="username" />
              </div>
            </div>

            <div>
              <label className="text-white/70 text-sm font-medium block mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input type="email" value={form.email} onChange={set('email')}
                  placeholder="you@example.com" className="input-dark pl-10" autoComplete="email" />
              </div>
            </div>

            <div>
              <label className="text-white/70 text-sm font-medium block mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')}
                  placeholder="Min. 6 characters" className="input-dark pl-10 pr-10" autoComplete="new-password" />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-white/70 text-sm font-medium block mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input type="password" value={form.confirm} onChange={set('confirm')}
                  placeholder="Repeat password" className="input-dark pl-10" autoComplete="new-password" />
              </div>
            </div>

            <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 mt-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Zap className="w-5 h-5" /> Create Free Account</>
              )}
            </motion.button>
          </form>

          <p className="text-center text-white/50 text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
