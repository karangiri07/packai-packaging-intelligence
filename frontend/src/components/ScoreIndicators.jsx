import React from 'react'

export function ScoreBar({ label, value, max = 100, suffix = '' }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  const color = pct >= 75 ? 'bg-brand-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div>
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span>
        <span className="text-slate-300 font-medium">{value}{suffix} / {max}{suffix}</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function SuitabilityRing({ value }) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference
  const color = value >= 75 ? '#22c56a' : value >= 50 ? '#fbbf24' : '#f87171'
  return (
    <div className="relative w-28 h-28">
      <svg className="w-28 h-28 -rotate-90">
        <circle cx="56" cy="56" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="10" fill="none" />
        <circle
          cx="56" cy="56" r={radius} stroke={color} strokeWidth="10" fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-display font-semibold">{Math.round(value)}%</span>
        <span className="text-[10px] uppercase tracking-wide text-slate-500">Suitability</span>
      </div>
    </div>
  )
}

export function LevelBadge({ level, positive = false }) {
  // positive=true means "High" is a good outcome (e.g. sustainability),
  // positive=false means "High" is a bad outcome (e.g. cost).
  const goodStyle = 'bg-brand-500/15 text-brand-300 border-brand-500/30'
  const midStyle = 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  const badStyle = 'bg-red-500/15 text-red-300 border-red-500/30'
  const styles = positive
    ? { Low: badStyle, Medium: midStyle, High: goodStyle }
    : { Low: goodStyle, Medium: midStyle, High: badStyle }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full border ${styles[level] || midStyle}`}>
      {level}
    </span>
  )
}
