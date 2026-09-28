import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi } from '../services/api.js'
import { Loading, ErrorState } from '../components/States.jsx'

function StatCard({ label, value, hint }) {
  return (
    <div className="card p-5">
      <p className="label mb-2">{label}</p>
      <p className="text-3xl font-display font-semibold">{value}</p>
      {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')

  function load() {
    setStatus('loading')
    dashboardApi.summary()
      .then((res) => { setData(res.data); setStatus('ready') })
      .catch(() => setStatus('error'))
  }

  useEffect(load, [])

  if (status === 'loading') return <Loading label="Loading dashboard…" />
  if (status === 'error') return <ErrorState onRetry={load} message="Couldn't load the dashboard." />

  return (
    <div className="space-y-8">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Packaging intelligence</p>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">A quick view of your food packaging decisions, recommendations, and optimization activity.</p>
        </div>
        <div className="hero-actions">
          <Link to="/analyze" className="btn-primary">+ New Analysis</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Analyses" value={data.total_analyses} />
        <StatCard label="Food Products" value={data.total_food_products} />
        <StatCard label="Packaging Materials" value={data.total_packaging_materials} />
        <StatCard label="Avg. Suitability" value={`${data.average_suitability_score}%`} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-6">
          <h2 className="font-display font-semibold mb-4">Recent Analyses</h2>
          {data.recent_analyses.length === 0 ? (
            <p className="text-sm text-slate-500">No analyses yet. Run your first food analysis to get started.</p>
          ) : (
            <ul className="space-y-3">
              {data.recent_analyses.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="text-slate-200">{a.food_name}</p>
                    <p className="text-xs text-slate-500">Priority: {a.priority}</p>
                  </div>
                  <Link to={`/analysis/${a.id}/recommendation`} className="text-brand-400 hover:underline text-xs">
                    View →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-display font-semibold mb-4">Insights</h2>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-slate-500">Most recommended packaging</p>
              <p className="text-slate-200 font-medium">{data.most_recommended_packaging || '—'}</p>
            </div>
            <div>
              <p className="text-slate-500">Recommendations generated</p>
              <p className="text-slate-200 font-medium">{data.recommendations_count}</p>
            </div>
            <div>
              <p className="text-slate-500">Average suitability across analyses</p>
              <p className="text-slate-200 font-medium">{data.average_suitability_score}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
