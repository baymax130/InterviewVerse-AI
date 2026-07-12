import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, Lock } from 'lucide-react'
import { profileService } from '../services'
import AppLayout from '../components/layout/AppLayout'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const SKILLS_SUGGESTIONS = ['JavaScript', 'React', 'Python', 'Java', 'Node.js', 'SQL', 'AWS', 'Docker', 'Git', 'TypeScript', 'C++', 'Machine Learning', 'Data Structures', 'Algorithms']

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [streak, setStreak] = useState(null)
  const [achievements, setAchievements] = useState([])
  const [form, setForm] = useState({})
  const [skillInput, setSkillInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('profile')
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' })

  useEffect(() => {
    profileService.getProfile().then(res => {
      setProfile(res.data.profile)
      setStreak(res.data.streak)
      setAchievements(res.data.achievements || [])
      setForm({ ...res.data.profile, username: res.data.user.username })
    }).catch(() => toast.error('Failed to load profile'))
  }, [])

  const set = (k) => (e) => setForm(prev => ({ ...prev, [k]: e.target.value }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await profileService.updateProfile(form)
      updateUser(res.data.user)
      setProfile(res.data.profile)
      toast.success('Profile updated! ✓')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  const addSkill = (skill) => {
    const skills = form.skills || []
    if (!skills.includes(skill) && skills.length < 15) {
      setForm(prev => ({ ...prev, skills: [...skills, skill] }))
    }
    setSkillInput('')
  }
  const removeSkill = (skill) => setForm(prev => ({ ...prev, skills: (prev.skills || []).filter(s => s !== skill) }))

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (pwForm.new_password !== pwForm.confirm) return toast.error('Passwords do not match.')
    setSaving(true)
    try {
      await profileService.changePassword({ current_password: pwForm.current_password, new_password: pwForm.new_password })
      toast.success('Password changed!')
      setPwForm({ current_password: '', new_password: '', confirm: '' })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password.')
    } finally {
      setSaving(false)
    }
  }

  const BADGE_ICONS = { first_interview: '⭐', ten_interviews: '🎓', perfect_score: '🏆', speed_demon: '⚡', week_streak: '🔥' }

  return (
    <AppLayout activePage="Profile">
      <div className="p-6 md:p-8 space-y-6 pb-20 md:pb-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-500 flex items-center justify-center text-white text-3xl font-black">
              {user?.username?.[0]?.toUpperCase()}
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">{user?.username}</h1>
            <p className="text-white/50 text-sm">{user?.email}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs px-3 py-1 rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/20">Level {user?.level}</span>
              <span className="text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/20">{user?.xp} XP</span>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">🔥 {streak?.current_streak || 0} streak</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-white/10">
          {['profile', 'achievements', 'security'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`pb-3 px-4 text-sm font-medium capitalize transition-colors ${tab === t ? 'text-brand-400 border-b-2 border-brand-400' : 'text-white/40 hover:text-white/70'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { label: 'Full Name', key: 'full_name', placeholder: 'John Doe' },
                { label: 'Username', key: 'username', placeholder: 'johndoe' },
                { label: 'College', key: 'college', placeholder: 'MIT, IIT, etc.' },
                { label: 'Branch', key: 'branch', placeholder: 'Computer Science' },
                { label: 'Year', key: 'year', placeholder: 'Final Year' },
                { label: 'Target Role', key: 'target_role', placeholder: 'Software Engineer' },
                { label: 'Target Company', key: 'target_company', placeholder: 'Google' },
                { label: 'Preferred Language', key: 'preferred_language', placeholder: 'English' },
                { label: 'LinkedIn', key: 'linkedin', placeholder: 'linkedin.com/in/you' },
                { label: 'GitHub', key: 'github', placeholder: 'github.com/you' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="text-white/60 text-sm block mb-1.5">{label}</label>
                  <input value={form[key] || ''} onChange={set(key)} placeholder={placeholder} className="input-dark" />
                </div>
              ))}
            </div>

            <div>
              <label className="text-white/60 text-sm block mb-1.5">Bio</label>
              <textarea value={form.bio || ''} onChange={set('bio')} placeholder="Tell us about yourself…"
                className="input-dark resize-none h-24" />
            </div>

            {/* Skills */}
            <div>
              <label className="text-white/60 text-sm block mb-2">Skills</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {(form.skills || []).map(s => (
                  <span key={s} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm">
                    {s}
                    <button onClick={() => removeSkill(s)} className="text-brand-400/60 hover:text-red-400 transition-colors text-xs">×</button>
                  </span>
                ))}
              </div>
              <input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && skillInput.trim()) addSkill(skillInput.trim()) }}
                placeholder="Type a skill and press Enter…" className="input-dark mb-2" />
              <div className="flex flex-wrap gap-2">
                {SKILLS_SUGGESTIONS.filter(s => !(form.skills || []).includes(s) && s.toLowerCase().includes(skillInput.toLowerCase())).slice(0, 8).map(s => (
                  <button key={s} onClick={() => addSkill(s)}
                    className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-brand-500/30 transition-colors">
                    + {s}
                  </button>
                ))}
              </div>
            </div>

            <motion.button onClick={handleSave} disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="btn-primary flex items-center gap-2 px-6 py-3">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile
            </motion.button>
          </motion.div>
        )}

        {/* Achievements Tab */}
        {tab === 'achievements' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="mb-4">
              <div className="text-white/50 text-sm">🏅 {achievements.length} badge{achievements.length !== 1 ? 's' : ''} earned</div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {achievements.length > 0 ? achievements.map(a => (
                <div key={a.id} className="glass p-5 text-center">
                  <div className="text-3xl mb-2">{BADGE_ICONS[a.badge_id] || '🏅'}</div>
                  <div className="font-bold text-white text-sm">{a.badge_name}</div>
                  <div className="text-white/40 text-xs mt-1">{a.badge_description}</div>
                  <div className="text-white/20 text-xs mt-2">{new Date(a.earned_at).toLocaleDateString()}</div>
                </div>
              )) : (
                <div className="col-span-full text-center py-12 text-white/30">
                  Complete interviews to earn achievements! 🎯
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Security Tab */}
        {tab === 'security' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-brand-400" />
              Change Password
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {[
                { label: 'Current Password', key: 'current_password' },
                { label: 'New Password', key: 'new_password' },
                { label: 'Confirm New Password', key: 'confirm' },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="text-white/60 text-sm block mb-1.5">{label}</label>
                  <input type="password" value={pwForm[key]} onChange={e => setPwForm(prev => ({ ...prev, [key]: e.target.value }))}
                    className="input-dark" />
                </div>
              ))}
              <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="btn-primary flex items-center gap-2 px-6 py-3">
                <Lock className="w-4 h-4" />
                Update Password
              </motion.button>
            </form>
          </motion.div>
        )}
      </div>
    </AppLayout>
  )
}
