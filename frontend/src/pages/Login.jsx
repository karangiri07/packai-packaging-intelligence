import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'
import { useToast } from '../hooks/useToast.jsx'
import { extractErrorMessage } from '../services/api.js'

export default function Login() {
  const { login } = useAuth()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      pushToast(extractErrorMessage(err), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="card w-full max-w-sm p-8">
        <Link to="/" className="flex items-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center text-ink-900 font-bold">P</div>
          <span className="font-display font-semibold text-lg">PackAI</span>
        </Link>
        <h1 className="font-display text-xl font-semibold mb-1">Welcome back</h1>
        <p className="text-sm text-slate-500 mb-6">Log in to continue your packaging analyses.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <button type="submit" disabled={submitting} className="btn-primary w-full disabled:opacity-60">
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>
        <p className="text-sm text-slate-500 mt-6 text-center">
          Don't have an account? <Link to="/register" className="text-brand-400 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  )
}
