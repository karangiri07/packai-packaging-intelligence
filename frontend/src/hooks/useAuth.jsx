import React, { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

function clearStoredSession() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('user')
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      clearStoredSession()
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleAuthExpired = () => {
      clearStoredSession()
      setUser(null)
    }

    window.addEventListener('packai:auth-expired', handleAuthExpired)
    return () => window.removeEventListener('packai:auth-expired', handleAuthExpired)
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setLoading(false)
      return
    }

    authApi.me()
      .then((res) => {
        setUser(res.data)
        localStorage.setItem('user', JSON.stringify(res.data))
      })
      .catch((error) => {
        // A failed session validation means the token is genuinely invalid.
        // Keep the normal navigation flow intact for all other API errors.
        if (error.response?.status === 401) {
          clearStoredSession()
          setUser(null)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  function handleAuthResponse(data) {
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setUser(data.user)
  }

  async function login(email, password) {
    const res = await authApi.login({ email, password })
    handleAuthResponse(res.data)
  }

  async function register(fullName, email, password) {
    const res = await authApi.register({ full_name: fullName, email, password })
    handleAuthResponse(res.data)
  }

  function logout() {
    clearStoredSession()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
