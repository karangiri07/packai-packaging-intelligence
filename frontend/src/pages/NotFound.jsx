import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-6">
      <p className="text-5xl font-display font-semibold text-brand-400">404</p>
      <p className="text-slate-400">Page not found.</p>
      <Link to="/" className="btn-secondary mt-2">Back home</Link>
    </div>
  )
}
