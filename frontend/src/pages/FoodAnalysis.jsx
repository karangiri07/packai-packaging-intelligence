import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { foodApi, packagingApi, analysisApi, extractErrorMessage } from '../services/api.js'
import { Loading, ErrorState } from '../components/States.jsx'
import { useToast } from '../hooks/useToast.jsx'

const PRIORITIES = [
  { value: 'balanced', label: 'Balanced', icon: '◈' },
  { value: 'cost', label: 'Lowest Cost', icon: '₹' },
  { value: 'shelf_life', label: 'Shelf Life', icon: '◷' },
  { value: 'sustainability', label: 'Sustainable', icon: '♻' },
  { value: 'protection', label: 'Protection', icon: '◇' },
]
const DEMO_SCENARIOS = ['Potato Chips', 'Milk', 'Spices', 'Rice', 'Pickles']

export default function FoodAnalysis() {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const [foods, setFoods] = useState([])
  const [packaging, setPackaging] = useState([])
  const [status, setStatus] = useState('loading')
  const [selectedFoodId, setSelectedFoodId] = useState('')
  const [currentPackagingId, setCurrentPackagingId] = useState('')
  const [form, setForm] = useState(null)
  const [priority, setPriority] = useState('balanced')
  const [submitting, setSubmitting] = useState(false)

  function loadData() {
    setStatus('loading')
    Promise.all([foodApi.list(), packagingApi.list()])
      .then(([foodsRes, packagingRes]) => { setFoods(foodsRes.data); setPackaging(packagingRes.data); setStatus('ready') })
      .catch(() => setStatus('error'))
  }
  useEffect(loadData, [])

  function applyFood(food) {
    setSelectedFoodId(String(food.id))
    setForm({ moisture_pct: food.moisture_pct, fat_pct: food.fat_pct, ph: food.ph, target_shelf_life_months: food.typical_shelf_life_months, storage_temperature_c: food.storage_temperature_c, relative_humidity_pct: 60, oxygen_sensitivity: food.oxygen_sensitivity, light_sensitivity: food.light_sensitivity, transportation_condition: food.transportation_condition })
  }
  function handleFoodChange(e) {
    const food = foods.find((f) => String(f.id) === e.target.value)
    if (food) applyFood(food)
  }
  async function handleDemoScenario(name) {
    const food = foods.find((f) => f.name === name)
    if (!food) return
    applyFood(food)
    setSubmitting(true)
    try {
      const res = await analysisApi.create({ food_product_id: food.id, priority: 'balanced' })
      navigate(`/analysis/${res.data.id}/recommendation`)
    } catch (err) { pushToast(extractErrorMessage(err), 'error'); setSubmitting(false) }
  }
  function updateField(field, value) { setForm((f) => ({ ...f, [field]: value })) }
  async function handleSubmit(e) {
    e.preventDefault()
    if (!selectedFoodId || !form) return pushToast('Select a food commodity first.', 'error')
    setSubmitting(true)
    try {
      const res = await analysisApi.create({
        food_product_id: Number(selectedFoodId),
        current_packaging_id: currentPackagingId ? Number(currentPackagingId) : null,
        moisture_pct: Number(form.moisture_pct), fat_pct: Number(form.fat_pct), ph: Number(form.ph),
        target_shelf_life_months: Number(form.target_shelf_life_months), storage_temperature_c: Number(form.storage_temperature_c),
        relative_humidity_pct: Number(form.relative_humidity_pct), oxygen_sensitivity: form.oxygen_sensitivity,
        light_sensitivity: form.light_sensitivity, transportation_condition: form.transportation_condition, priority,
      })
      pushToast('Analysis complete — recommendation ready.', 'success')
      navigate(`/analysis/${res.data.id}/recommendation`)
    } catch (err) { pushToast(extractErrorMessage(err), 'error') }
    finally { setSubmitting(false) }
  }

  if (status === 'loading') return <Loading label="Loading analysis workspace…" />
  if (status === 'error') return <ErrorState onRetry={loadData} message="Couldn't load food and packaging databases." />

  return (
    <div className="space-y-7">
      <div className="page-hero">
        <div>
          <span className="eyebrow">DECISION ENGINE</span>
          <h1 className="page-title">Food Packaging Analysis</h1>
          <p className="page-subtitle">Turn food properties and packaging requirements into a measurable, explainable recommendation.</p>
        </div>
        <div className="hero-stat"><span>{foods.length}</span><small>food profiles</small></div>
      </div>

      <div className="card p-5 demo-panel">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div><p className="label mb-1">Fast demo</p><p className="text-sm text-slate-300">Run a seeded scenario in one click.</p></div>
          <span className="status-pill">LIVE DATA</span>
        </div>
        <div className="flex flex-wrap gap-2">{DEMO_SCENARIOS.map((name) => <button key={name} type="button" onClick={() => handleDemoScenario(name)} disabled={submitting} className="chip-button">{name}</button>)}</div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="card p-6">
          <div className="section-heading"><span className="step-number">01</span><div><h2>Choose the commodity</h2><p>Select a food profile and review its critical storage properties.</p></div></div>
          <label className="label">Food commodity</label>
          <select className="input input-lg" value={selectedFoodId} onChange={handleFoodChange} required>
            <option value="" disabled>Select a food…</option>
            {foods.map((f) => <option key={f.id} value={f.id}>{f.name} — {f.category}</option>)}
          </select>
        </div>

        {form && <>
          <div className="card p-6">
            <div className="section-heading"><span className="step-number">02</span><div><h2>Current packaging</h2><p>Optional, but recommended for the before-vs-after optimization view.</p></div></div>
            <select className="input input-lg" value={currentPackagingId} onChange={(e) => setCurrentPackagingId(e.target.value)}>
              <option value="">No current packaging specified</option>
              {packaging.map((pkg) => <option key={pkg.id} value={pkg.id}>{pkg.name} — {pkg.category}</option>)}
            </select>
            {currentPackagingId && <p className="hint mt-2">The result page will compare this package against the optimized recommendation.</p>}
          </div>

          <div className="card p-6">
            <div className="section-heading"><span className="step-number">03</span><div><h2>Food requirements</h2><p>Adjust the seeded values when your scenario needs different conditions.</p></div></div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[['moisture_pct','Moisture %','0.1',0,100],['fat_pct','Fat %','0.1',0,100],['ph','pH','0.1',0,14],['target_shelf_life_months','Target shelf life (months)','1',1,60],['storage_temperature_c','Storage temperature (°C)','1',-30,60],['relative_humidity_pct','Relative humidity (%)','1',0,100]].map(([field,label,step,min,max]) => <div key={field}><label className="label">{label}</label><input type="number" step={step} min={min} max={max} className="input" value={form[field]} onChange={(e) => updateField(field, e.target.value)} required /></div>)}
              <div><label className="label">Oxygen sensitivity</label><select className="input" value={form.oxygen_sensitivity} onChange={(e) => updateField('oxygen_sensitivity', e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
              <div><label className="label">Light sensitivity</label><select className="input" value={form.light_sensitivity} onChange={(e) => updateField('light_sensitivity', e.target.value)}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
              <div><label className="label">Transportation</label><select className="input" value={form.transportation_condition} onChange={(e) => updateField('transportation_condition', e.target.value)}><option value="ambient">Ambient</option><option value="refrigerated">Refrigerated</option><option value="frozen">Frozen</option></select></div>
            </div>
          </div>

          <div className="card p-6">
            <div className="section-heading"><span className="step-number">04</span><div><h2>Optimization objective</h2><p>The same scoring engine will re-weight candidates around this priority.</p></div></div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">{PRIORITIES.map((p) => <button key={p.value} type="button" onClick={() => setPriority(p.value)} className={`priority-card ${priority === p.value ? 'priority-active' : ''}`}><span>{p.icon}</span><strong>{p.label}</strong></button>)}</div>
            <button type="submit" disabled={submitting} className="btn-primary w-full mt-6 disabled:opacity-60">{submitting ? 'Analyzing packaging options…' : 'Run Multi-Factor Analysis →'}</button>
          </div>
        </>}
      </form>
    </div>
  )
}
