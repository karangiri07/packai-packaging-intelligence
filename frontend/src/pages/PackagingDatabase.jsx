import React, { useEffect, useState } from 'react'
import { packagingApi } from '../services/api.js'
import { Loading, ErrorState } from '../components/States.jsx'

export default function PackagingDatabase() {
  const [packaging, setPackaging] = useState([])
  const [status, setStatus] = useState('loading')

  function load() {
    setStatus('loading')
    packagingApi.list().then((res) => { setPackaging(res.data); setStatus('ready') }).catch(() => setStatus('error'))
  }
  useEffect(load, [])

  if (status === 'loading') return <Loading label="Loading packaging database…" />
  if (status === 'error') return <ErrorState onRetry={load} />

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Packaging Database</h1>
        <p className="text-sm text-slate-500">{packaging.length} candidate materials evaluated by the scoring engine. Values are approximate demo figures.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {packaging.map((p) => (
          <div key={p.id} className="card p-5">
            <h3 className="font-display font-semibold mb-1">{p.name}</h3>
            <p className="text-xs text-slate-500 mb-3">{p.category}</p>
            <ul className="text-xs text-slate-400 space-y-1 mb-3">
              <li>Thickness: {p.thickness_micron_min}–{p.thickness_micron_max} µm</li>
              <li>OTR: {p.otr_cc_m2_day} cc/m²/day · WVTR: {p.wvtr_g_m2_day} g/m²/day</li>
              <li>Oxygen barrier: {p.oxygen_barrier}/10 · Moisture barrier: {p.moisture_barrier}/10</li>
              <li>Mechanical strength: {p.mechanical_strength}/10 · Light barrier: {p.light_barrier}/10</li>
              <li>Cost index: {p.cost_index}/10 · Sustainability: {p.sustainability_score}/10 · Recyclability: {p.recyclability_score}/10</li>
              <li>MAP compatible: {p.map_compatible ? 'Yes' : 'No'}</li>
            </ul>
            {p.notes && <p className="text-[11px] text-slate-500 italic border-t border-white/5 pt-2">{p.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
