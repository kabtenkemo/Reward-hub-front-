import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  LayoutDashboard,
  Award,
  Trophy,
  FileText,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
} from 'lucide-react'
import Logo from './Logo'
import { Avatar } from './ui'
import { cn } from '../lib/format'
import { useTheme } from '../context/ThemeContext'

const STAFF_ROLES = ['Teacher', 'Admin', 'Management']
const ADMIN_ROLES = ['Admin', 'Management']

export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'points', label: 'Assign Points', icon: Award, roles: STAFF_ROLES },
  { key: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { key: 'reports', label: 'Reports', icon: FileText },
  { key: 'settings', label: 'Settings', icon: SettingsIcon, roles: ADMIN_ROLES },
]

export default function AppLayout({ active, onNavigate, user, role, onLogout, children }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { isDark, toggleTheme } = useTheme()

  const items = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role))

  const go = (key) => {
    onNavigate(key)
    setMobileOpen(false)
  }

  const navContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Logo />
        <button
          className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-zinc-100 md:hidden dark:hover:bg-zinc-800"
          onClick={() => setMobileOpen(false)}
        >
          <X size={18} />
        </button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = active === item.key
          return (
            <button
              key={item.key}
              onClick={() => go(item.key)}
              className={cn(
                'group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all',
                isActive
                  ? 'bg-gradient-to-r from-brand-600 to-rose-600 text-white shadow-[0_10px_24px_-12px_rgba(225,29,42,0.9)]'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/70 dark:hover:text-zinc-100',
              )}
            >
              <Icon size={18} className={cn('shrink-0', isActive ? 'text-white' : 'text-zinc-400 group-hover:text-brand-600')} />
              {item.label}
            </button>
          )
        })}
      </nav>
      <div className="border-t border-zinc-100 p-3 dark:border-zinc-800">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-zinc-500 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:text-zinc-400 dark:hover:bg-brand-950/50 dark:hover:text-brand-400"
        >
          <LogOut size={18} />
          Log out
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-[#f5f4ef] dark:bg-zinc-950">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-zinc-200/80 bg-white md:block dark:border-zinc-800 dark:bg-zinc-900">
        {navContent}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed inset-y-0 left-0 z-50 w-64 border-r border-zinc-200 bg-white md:hidden dark:border-zinc-800 dark:bg-zinc-900"
            >
              {navContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 bg-gradient-to-r from-brand-700 via-brand-600 to-rose-600 px-4 text-white shadow-[0_14px_30px_-20px_rgba(225,29,42,0.95)] sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="grid h-9 w-9 place-items-center rounded-lg text-white hover:bg-white/15 md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div className="md:hidden">
              <Logo collapsed />
            </div>
            <div className="hidden min-w-0 items-center md:flex">
              <p className="max-w-[320px] truncate text-lg font-extrabold text-white">
                {user?.fullNameEn || user?.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="grid h-9 w-9 place-items-center rounded-lg text-white/90 hover:bg-white/15"
              title="Toggle theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="flex items-center gap-2.5 rounded-xl border border-white/25 bg-white/10 py-1 pl-1 pr-3">
              <Avatar name={user?.fullNameEn || user?.email} size={32} />
              <p className="max-w-[160px] truncate text-base font-extrabold uppercase tracking-wide text-white">
                {role || '—'}
              </p>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  )
}
