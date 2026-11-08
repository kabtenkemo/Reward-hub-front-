import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi, tokenStorage } from '../lib/api'

const AuthContext = createContext(null)

export const DEFAULT_BUSINESS_ENTITY_ID = Number(import.meta.env.VITE_BUSINESS_ENTITY_ID || 1)

export function resolveRole(roles, roleName) {
  const candidates = [...(roles || []), roleName]
  for (const r of candidates) {
    const n = (r || '').toLowerCase()
    if (n.includes('student')) return 'Student'
    if (n.includes('management') || n.includes('board')) return 'Management'
    if (
      n.includes('teacher') ||
      n.includes('instructor') ||
      n.includes('lead') ||
      n.includes('engineer') ||
      n.includes('supervisor') ||
      n.includes('reviewer')
    ) {
      return 'Teacher'
    }
    if (n.includes('admin') || n.includes('super') || n.includes('staff')) return 'Admin'
  }
  return 'Student'
}

function normalizeUser(data) {
  if (!data) return null
  return {
    accountId: data.accountId ?? data.AccountId ?? data.userId ?? data.UserId ?? data.id ?? data.Id,
    email: data.email || data.Email || '',
    fullNameEn: data.fullNameEn || data.FullNameEn || '',
    fullNameAr: data.fullNameAr || data.FullNameAr || '',
    role: data.role || data.Role || '',
    businessEntityId: data.businessEntityId ?? data.BusinessEntityId ?? DEFAULT_BUSINESS_ENTITY_ID,
    businessEntityName: data.businessEntityName || data.BusinessEntityName || '',
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    const jwt = tokenStorage.getJwtToken()
    const cached = tokenStorage.getUser()
    if (jwt && cached) {
      setUser(normalizeUser(cached))
      authApi.validateToken().catch(() => {
        tokenStorage.clearSession()
        setUser(null)
      })
    }
    setBooting(false)
  }, [])

  const login = useCallback(async (email, password, businessEntityId) => {
    const result = await authApi.login(email, password, businessEntityId)
    const data = result?.data || result
    const nextUser = normalizeUser(data)
    setUser(nextUser)
    return nextUser
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(() => {
    const role = resolveRole([user?.role], user?.role)
    return {
      user,
      role,
      isAuthenticated: Boolean(user),
      booting,
      login,
      logout,
    }
  }, [user, booting, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
