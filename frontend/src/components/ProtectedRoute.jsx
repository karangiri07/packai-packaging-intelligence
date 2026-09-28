import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { Loading } from './States.jsx'
import MainLayout from '../layouts/MainLayout.jsx'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loading label="Checking session…" /></div>
  if (!user) return <Navigate to="/login" replace />

  return <MainLayout>{children}</MainLayout>
}
