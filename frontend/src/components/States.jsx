import React from 'react'

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-slate-400">
      <div className="h-5 w-5 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="h-10 w-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">!</div>
      <p className="text-sm text-slate-300 max-w-sm">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary text-sm">Try again</button>
      )}
    </div>
  )
}

export function EmptyState({ title = 'Nothing here yet', subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <p className="text-slate-200 font-medium">{title}</p>
      {subtitle && <p className="text-sm text-slate-500 max-w-sm">{subtitle}</p>}
      {action}
    </div>
  )
}
