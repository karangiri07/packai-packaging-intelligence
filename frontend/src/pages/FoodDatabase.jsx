import React, { useEffect, useState } from 'react'
import { foodApi, extractErrorMessage } from '../services/api.js'
import { Loading, ErrorState } from '../components/States.jsx'
import { useToast } from '../hooks/useToast.jsx'

const EMPTY_FORM = {
  name: '', category: '', moisture_pct: '', fat_pct: '', ph: '',
  oxygen_sensitivity: 'medium', light_sensitivity: 'medium', moisture_sensitivity: 'medium',
  fragility: 'low', typical_shelf_life_months: '', storage_temperature_c: '',
  humidity_sensitivity: 'medium', transportation_condition: 'ambient',
}

export default function FoodDatabase() {
  const { pushToast } = useToast()
  const [foods, setFoods] = useState([])
  const [status, setStatus] = useState('loading')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  function load() {
    setStatus('loading')
    foodApi.list().then((res) => { setFoods(res.data); setStatus('ready') }).catch(() => setStatus('error'))
  }
  useEffect(load, [])

  async function handleCreate(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await foodApi.create({
        ...form,
        moisture_pct: Number(form.moisture_pct),
        fat_pct: Number(form.fat_pct),
        ph: Number(form.ph),
        typical_shelf_life_months: Number(form.typical_shelf_life_months),
        storage_temperature_c: Number(form.storage_temperature_c),
      })
      pushToast('Custom food added.', 'success')
      setForm(EMPTY_FORM)
      setShowForm(false)
      load()
    } catch (err) {
      pushToast(extractErrorMessage(err), 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading') return <Loading label="Loading food database…" />
  if (status === 'error') return <ErrorState onRetry={load} />

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Food Database</h1>
          <p className="text-sm text-slate-500">{foods.length} commodities available for analysis.</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="btn-secondary text-sm">
          {showForm ? 'Cancel' : '+ Add Custom Food'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card p-6 grid md:grid-cols-3 gap-4">
          <input className="input" placeholder="Name" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <input className="input" placeholder="Category" required value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} />
          <input className="input" type="number" step="0.1" placeholder="Moisture %" required value={form.moisture_pct} onChange={(e) => setForm((f) => ({ ...f, moisture_pct: e.target.value }))} />
          <input className="input" type="number" step="0.1" placeholder="Fat %" required value={form.fat_pct} onChange={(e) => setForm((f) => ({ ...f, fat_pct: e.target.value }))} />
          <input className="input" type="number" step="0.1" placeholder="pH" required value={form.ph} onChange={(e) => setForm((f) => ({ ...f, ph: e.target.value }))} />
          <input className="input" type="number" placeholder="Typical shelf life (months)" required value={form.typical_shelf_life_months} onChange={(e) => setForm((f) => ({ ...f, typical_shelf_life_months: e.target.value }))} />
          <input className="input" type="number" placeholder="Storage temperature (°C)" required value={form.storage_temperature_c} onChange={(e) => setForm((f) => ({ ...f, storage_temperature_c: e.target.value }))} />
          <select className="input" value={form.oxygen_sensitivity} onChange={(e) => setForm((f) => ({ ...f, oxygen_sensitivity: e.target.value }))}>
            <option value="low">Oxygen sensitivity: Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
          <select className="input" value={form.light_sensitivity} onChange={(e) => setForm((f) => ({ ...f, light_sensitivity: e.target.value }))}>
            <option value="low">Light sensitivity: Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
          <select className="input" value={form.transportation_condition} onChange={(e) => setForm((f) => ({ ...f, transportation_condition: e.target.value }))}>
            <option value="ambient">Ambient</option><option value="refrigerated">Refrigerated</option><option value="frozen">Frozen</option>
          </select>
          <button type="submit" disabled={submitting} className="btn-primary md:col-span-3 disabled:opacity-60">
            {submitting ? 'Saving…' : 'Save Custom Food'}
          </button>
        </form>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {foods.map((f) => (
          <div key={f.id} className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-semibold">{f.name}</h3>
              {f.is_custom && <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30">Custom</span>}
            </div>
            <p className="text-xs text-slate-500 mb-3">{f.category}</p>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>Moisture: {f.moisture_pct}% · Fat: {f.fat_pct}% · pH: {f.ph}</li>
              <li>Oxygen sensitivity: {f.oxygen_sensitivity} · Light: {f.light_sensitivity}</li>
              <li>Shelf life: {f.typical_shelf_life_months} mo · Storage: {f.storage_temperature_c}°C</li>
              <li>Transport: {f.transportation_condition}</li>
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
