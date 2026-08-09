import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  const refreshMe = async () => {
    try {
      const { data } = await api.get('/auth/me')
      setAdmin(data.admin)
      return data.admin
    } catch {
      setAdmin(null)
      return null
    }
  }

  useEffect(() => {
    refreshMe().finally(() => setLoading(false))
  }, [])

  const login = async (adminId, password) => {
    const { data } = await api.post('/auth/login', { adminId, password })
    return data
  }

  const verifyOtp = async (loginId, otp) => {
    const { data } = await api.post('/auth/verify-otp', { loginId, otp })
    setAdmin(data.admin)
    return data
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore
    }
    setAdmin(null)
  }

  const value = useMemo(
    () => ({ admin, loading, login, verifyOtp, logout, refreshMe }),
    [admin, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
