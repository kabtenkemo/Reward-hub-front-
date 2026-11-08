import { useEffect, useState } from 'react'
import AppLayout, { NAV_ITEMS } from './components/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import PointsPage from './pages/PointsPage'
import LeaderboardPage from './pages/LeaderboardPage'
import ReportsPage from './pages/ReportsPage'
import SettingsPage from './pages/SettingsPage'
import { useAuth } from './context/AuthContext'

const PAGES = {
  dashboard: DashboardPage,
  points: PointsPage,
  leaderboard: LeaderboardPage,
  reports: ReportsPage,
  settings: SettingsPage,
}

export function canAccessPage(role, key) {
  const item = NAV_ITEMS.find((i) => i.key === key)
  if (!item) return false
  return !item.roles || item.roles.includes(role)
}

function Splash() {
  return (
    <div className="grid min-h-screen place-items-center bg-white dark:bg-zinc-950">
      <div className="flex flex-col items-center gap-4">
        <span className="grid h-14 w-14 animate-pulse place-items-center overflow-hidden rounded-2xl bg-white shadow-[0_10px_24px_-12px_rgba(225,29,42,0.9)]">
          <img src="/logo.png" alt="Reward Hub" className="h-full w-full object-contain p-1" />
        </span>
        <p className="text-sm font-semibold text-zinc-400">Loading Reward Hub…</p>
      </div>
    </div>
  )
}

export default function App() {
  const { isAuthenticated, booting, role, user, logout } = useAuth()
  const [page, setPage] = useState('dashboard')

  useEffect(() => {
    if (!canAccessPage(role, page)) {
      setPage('dashboard')
    }
  }, [page, role])

  if (booting) return <Splash />
  if (!isAuthenticated) return <LoginPage />

  const Page = PAGES[page] || DashboardPage

  return (
    <AppLayout active={page} onNavigate={setPage} user={user} role={role} onLogout={logout}>
      <Page />
    </AppLayout>
  )
}
