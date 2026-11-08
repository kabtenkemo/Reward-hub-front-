const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const TOKEN_KEYS = {
  SSO: 'cas_sso_token',
  JWT: 'cas_jwt_token',
  USER: 'cas_user_info',
}

export function getCookie(name) {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'))
  return match ? decodeURIComponent(match[3]) : null
}

export const tokenStorage = {
  getSsoToken: () => localStorage.getItem(TOKEN_KEYS.SSO) || localStorage.getItem('ssoToken') || getCookie('cas_sso_token') || getCookie('ssoToken'),
  getJwtToken: () => localStorage.getItem(TOKEN_KEYS.JWT) || localStorage.getItem('token') || localStorage.getItem('accessToken'),
  getUser: () => {
    try {
      const raw = localStorage.getItem(TOKEN_KEYS.USER)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
  saveSession: (data) => {
    const ssoToken = data?.ssoToken || data?.SsoToken
    const jwtToken = data?.jwtToken || data?.JwtToken
    if (ssoToken) {
      localStorage.setItem(TOKEN_KEYS.SSO, ssoToken)
      localStorage.setItem('ssoToken', ssoToken)
    }
    if (jwtToken) {
      localStorage.setItem(TOKEN_KEYS.JWT, jwtToken)
      localStorage.setItem('token', jwtToken)
      localStorage.setItem('accessToken', jwtToken)
    }

    const accountId = data?.accountId ?? data?.AccountId ?? data?.userId ?? data?.UserId ?? data?.id ?? data?.Id
    const role = data?.role || data?.Role
    const name = data?.fullNameEn || data?.FullNameEn || data?.fullNameAr || data?.FullNameAr
    const email = data?.email || data?.Email

    if (role) localStorage.setItem('userRole', role)
    if (name) {
      localStorage.setItem('userName', name)
      localStorage.setItem('name', name)
    }
    if (email) {
      localStorage.setItem('userEmail', email)
      localStorage.setItem('email', email)
    }
    if (accountId != null) {
      localStorage.setItem('userId', String(accountId))
      localStorage.setItem('accountId', String(accountId))
      localStorage.setItem('id', String(accountId))
      localStorage.setItem('studentId', String(accountId))
    }

    const userInfo = {
      accountId: accountId,
      userId: accountId,
      id: accountId,
      email: email,
      fullNameEn: data?.fullNameEn || data?.FullNameEn,
      fullNameAr: data?.fullNameAr || data?.FullNameAr,
      role: role,
      businessEntityId: data?.businessEntityId ?? data?.BusinessEntityId,
      businessEntityName: data?.businessEntityName || data?.BusinessEntityName,
      ssoExpiresAt: data?.ssoExpiresAt || data?.SsoExpiresAt,
      jwtExpiresAt: data?.jwtExpiresAt || data?.JwtExpiresAt,
    }
    localStorage.setItem(TOKEN_KEYS.USER, JSON.stringify(userInfo))
  },
  clearSession: () => {
    localStorage.removeItem(TOKEN_KEYS.SSO)
    localStorage.removeItem(TOKEN_KEYS.JWT)
    localStorage.removeItem(TOKEN_KEYS.USER)
    localStorage.removeItem('ssoToken')
    localStorage.removeItem('token')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userName')
    localStorage.removeItem('name')
    localStorage.removeItem('userEmail')
    localStorage.removeItem('email')
    localStorage.removeItem('userId')
    localStorage.removeItem('accountId')
    localStorage.removeItem('id')
    localStorage.removeItem('studentId')
    localStorage.removeItem('rh_token')
  },
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const jwt = options.token || tokenStorage.getJwtToken() || tokenStorage.getSsoToken()
  if (jwt && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${jwt}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (response.status === 401) {
    tokenStorage.clearSession()
    const error = new Error('Session expired. Please sign in again.')
    error.status = 401
    throw error
  }

  const responseData = await response.json().catch(() => null)

  if (!response.ok) {
    const errorMessage =
      responseData?.message ||
      responseData?.title ||
      flattenValidationErrors(responseData?.errors) ||
      `Request failed with status ${response.status}`
    const error = new Error(errorMessage)
    error.status = response.status
    error.data = responseData
    throw error
  }

  return responseData
}

function flattenValidationErrors(errors) {
  if (!errors) return null
  if (Array.isArray(errors)) return errors[0] || null
  if (typeof errors === 'object') {
    const values = Object.values(errors).flat()
    if (values.length) return values[0]
  }
  return null
}

export const authApi = {
  login: async (email, password, businessEntityId) => {
    if (!businessEntityId && businessEntityId !== 0) {
      throw new Error('Business entity ID is required to sign in.')
    }

    const payload = { email, password }
    const result = await request(`/Auth/login/${businessEntityId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })

    if (result?.data) {
      tokenStorage.saveSession(result.data)
    }

    return result
  },

  exchangeToken: async (businessEntityId, explicitSsoToken = null) => {
    const ssoToken = explicitSsoToken || tokenStorage.getSsoToken()
    const result = await request('/Auth/switch', {
      method: 'POST',
      body: JSON.stringify({
        businessEntityId,
        ssoToken,
        token: ssoToken,
      }),
      headers: ssoToken ? { Authorization: `Bearer ${ssoToken}` } : {},
    })
    const data = result?.data || result
    if (data) {
      tokenStorage.saveSession(data)
    }
    return result
  },

  validateToken: async () => {
    return await request('/Auth/validate', {
      method: 'POST',
    })
  },

  logout: async () => {
    const token = tokenStorage.getJwtToken()
    try {
      return await request('/Auth/logout', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
    } finally {
      tokenStorage.clearSession()
    }
  },

  getBusinessEntities: async () => {
    return await request('/BusinessEntity', {
      method: 'GET',
    })
  },

  getPublicBusinessEntities: async () => {
    const result = await request('/BusinessEntity/public', {
      method: 'GET',
    })
    return result?.data || result || []
  },

  getProfile: async () => {
    const result = await request('/Account/profile', {
      method: 'GET',
    })
    return result?.data || result
  },

  getMyBusinessEntities: async () => {
    return await request('/BusinessEntity/my-entities', {
      method: 'GET',
    })
  },

  verifyIdentity: async (data) => {
    return await request('/Account/verify-identity', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  resetPassword: async ({ email, resetToken, newPassword, confirmPassword }) => {
    return await request('/Account/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, resetToken, newPassword, confirmPassword }),
    })
  },
}

export const rewardsApi = {
  myPoints: () => request('/rewards/me'),
  students: () => request('/rewards/students'),
  logs: (query = {}) => request(`/rewards?${new URLSearchParams(query).toString()}`),
  assignPoints: (payload) => request('/rewards', { method: 'POST', body: JSON.stringify(payload) }),
  settings: () => request('/rewards/settings'),
  updateSetting: (id, payload) =>
    request(`/rewards/settings/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  stats: () => request('/rewards/stats'),

  deductAbsencesAndLateSubmissions: () => request('/rewards/deduct-absences-late', { method: 'POST' }),
  applyStatusPoints: () => request('/rewards/apply-status-points', { method: 'POST' }),
}

export const studentsApi = {
  list: async ({ gradeId, classId, search, page = 1, pageSize = 50 } = {}) => {
    const params = new URLSearchParams()
    if (gradeId) params.set('gradeId', gradeId)
    if (classId) params.set('classId', classId)
    if (search) params.set('search', search)
    params.set('page', page)
    params.set('pageSize', pageSize)

    const result = await request(`/Students?${params.toString()}`, { method: 'GET' })
    return result?.data || { items: [], totalCount: 0, page: 1, pageSize, totalPages: 0 }
  },

  byId: async (id) => {
    const result = await request(`/Students/${id}`, { method: 'GET' })
    return result?.data || null
  },

  points: async (id) => {
    const result = await request(`/Students/${id}/points`, { method: 'GET' })
    return result?.data || null
  },

  pointsHistory: async (id) => {
    const result = await request(`/Students/${id}/points/history`, { method: 'GET' })
    return result?.data || []
  },

  rank: async (id) => {
    const result = await request(`/Students/${id}/rank`, { method: 'GET' })
    return result?.data || null
  },
}

export const referenceApi = {
  grades: async () => {
    const result = await request('/ReferenceData/grades', { method: 'GET' })
    return result?.data || []
  },

  classes: async (gradeId) => {
    const query = gradeId ? `?gradeId=${gradeId}` : ''
    const result = await request(`/ReferenceData/classes${query}`, { method: 'GET' })
    return result?.data || []
  },
}

export const teachersApi = {
  classOverview: async (classId) => {
    const query = classId ? `?classId=${classId}` : ''
    const result = await request(`/Teachers/class-overview${query}`, { method: 'GET' })
    return result?.data || null
  },
}

export const appealsApi = {
  list: async () => (await request('/Appeals', { method: 'GET' })) || [],
  mine: async () => {
    const result = await request('/Appeals/mine', { method: 'GET' })
    return result || []
  },
  create: async (payload) =>
    (await request('/Appeals', { method: 'POST', body: JSON.stringify(payload) })) || null,
  resolve: async (id, payload) =>
    (await request(`/Appeals/${id}`, { method: 'PUT', body: JSON.stringify(payload) })) || null,
}

export const adminApi = {
  dashboard: async () => (await request('/Admin/dashboard', { method: 'GET' }))?.data || null,
  pointsSummary: async () => (await request('/Admin/points/summary', { method: 'GET' }))?.data || null,
  topStudents: async (take = 10) =>
    (await request(`/Admin/top-students?take=${take}`, { method: 'GET' }))?.data || [],
  rules: async () =>
    (await request('/Admin/points/rules', { method: 'GET' }))?.data || [],
  createRule: async (payload) =>
    (await request('/Admin/points/rules', {
      method: 'POST',
      body: JSON.stringify(payload),
    }))?.data || null,
  updateRule: async (id, payload) =>
    (await request(`/Admin/points/rules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }))?.data || null,
  deleteRule: async (id) => {
    await request(`/Admin/points/rules/${id}`, { method: 'DELETE' })
    return true
  },
  recentActivity: async (take = 20) =>
    (await request(`/Admin/points/recent-activity?take=${take}`, { method: 'GET' }))?.data || [],
  additionReasons: async () =>
    (await request('/Admin/charts/addition-reasons', { method: 'GET' }))?.data || [],
  deductionReasons: async () =>
    (await request('/Admin/charts/deduction-reasons', { method: 'GET' }))?.data || [],
}

export const api = {
  get: (endpoint, options = {}) => request(endpoint, options),
  post: (endpoint, body, options = {}) =>
    request(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
}
