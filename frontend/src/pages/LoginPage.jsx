import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Brain, Mail, Lock, Eye, EyeOff, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/dashboard'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) return toast.error('Please fill all fields.')
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Welcome back! 🎉')
      navigate(from, { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen animated-bg flex items-center justify-center px-4">
      <div className="orb w-96 h-96 top-0 left-0 opacity-20" style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />
      <div className="orb w-64 h-64 bottom-0 right-0 opacity-15" style={{ background: 'radial-gradient(circle, #06b6d4, transparent)' }} />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="glass w-full max-w-md p-8 relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent">InterviewVerse AI</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
          <p className="text-white/50 text-sm mt-1">Sign in to continue your journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-white/70 text-sm font-medium block mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" className="input-dark pl-10" autoComplete="email" />
            </div>
          </div>

          <div>
            <label className="text-white/70 text-sm font-medium block mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" className="input-dark pl-10 pr-10" autoComplete="current-password" />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="button"
              onClick={() => toast('Contact admin to reset your password.', { icon: '🔐' })}
              className="text-brand-400 text-sm hover:text-brand-300 transition-colors">
              Forgot password?
            </button>
          </div>

          <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            className="btn-primary w-full flex items-center justify-center gap-2 py-3.5">
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Zap className="w-5 h-5" /> Sign In</>
            )}
          </motion.button>
        </form>

        <p className="text-center text-white/50 text-sm mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
            Create one free
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
