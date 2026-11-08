import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, Trophy, Users, Sparkles } from 'lucide-react'
import { Button, Input, Field } from '../components/ui'
import { useAuth, DEFAULT_BUSINESS_ENTITY_ID } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const REMEMBER_KEY = 'rh_remember_email'

const highlights = [
  { icon: Trophy, title: 'Live leaderboards', text: 'Rank every student by the points they earn.' },
  { icon: Users, title: 'Class & grade views', text: 'Filter the roster and drill into any student.' },
  { icon: Sparkles, title: 'Analytics that move', text: 'Interactive, drag-and-drop reward charts.' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const { isDark } = useTheme()
  const [email, setEmail] = useState(() => localStorage.getItem(REMEMBER_KEY) || '')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(Boolean(localStorage.getItem(REMEMBER_KEY)))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }
    setLoading(true)
    try {
      if (remember) localStorage.setItem(REMEMBER_KEY, email.trim())
      else localStorage.removeItem(REMEMBER_KEY)

      await login(email.trim(), password, DEFAULT_BUSINESS_ENTITY_ID)
    } catch (err) {
      setError(err?.message || 'Unable to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-zinc-950">
      {/* Brand panel */}
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-rose-600 p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-black/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-white/90">
            <img src="/logo.png" alt="Reward Hub" className="h-full w-full object-contain p-1" />
          </span>
          <div className="leading-tight">
            <p className="text-lg font-extrabold tracking-tight">Reward Hub</p>
            <p className="text-xs font-medium text-white/70">Student rewards platform</p>
          </div>
        </div>

        <div className="relative">
          <h1 className="max-w-md text-4xl font-extrabold leading-tight tracking-tight">
            Recognize effort. Reward progress. Celebrate every student.
          </h1>
          <p className="mt-4 max-w-md text-sm text-white/80">
            One place to assign points, track performance and turn data into red-hot motivation.
          </p>

          <div className="mt-10 space-y-4">
            {highlights.map((h) => (
              <div key={h.title} className="flex items-start gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15 backdrop-blur">
                  <h.icon size={19} />
                </span>
                <div>
                  <p className="text-sm font-bold">{h.title}</p>
                  <p className="text-xs text-white/70">{h.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/60">© {new Date().getFullYear()} Reward Hub · All rights reserved</p>
      </div>

      {/* Form panel */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-12">
        <div className="absolute right-6 top-6 lg:hidden">
          <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-white shadow-[0_10px_20px_-10px_rgba(225,29,42,0.8)]">
            <img src="/logo.png" alt="Reward Hub" className="h-full w-full object-contain p-0.5" />
          </span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 lg:hidden">
            <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-white">Reward Hub</h1>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">Welcome back</h2>
          <p className="mt-1 text-sm text-zinc-500">Sign in to continue to your rewards dashboard.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Email">
              <div className="relative">
                <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu"
                  className="pl-9"
                />
              </div>
            </Field>

            <Field label="Password">
              <div className="relative">
                <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-9"
                />
              </div>
            </Field>

            <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 rounded border-zinc-300 accent-brand-600"
              />
              Remember me
            </label>

            {error && (
              <div className="rounded-xl bg-brand-50 px-3.5 py-2.5 text-sm font-semibold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                {error}
              </div>
            )}

            <Button type="submit" size="lg" loading={loading} className="w-full">
              Sign in
              {!loading && <ArrowRight size={16} />}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-zinc-400">
            Connected to reword-hub.runasp.net · {isDark ? 'dark' : 'light'} mode
          </p>
        </motion.div>
      </div>
    </div>
  )
}
