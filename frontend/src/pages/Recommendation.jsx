import React, { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { analysisApi, packagingApi } from '../services/api.js'
import { Loading, ErrorState } from '../components/States.jsx'
import { SuitabilityRing, ScoreBar, LevelBadge } from '../components/ScoreIndicators.jsx'
import { ScoreBreakdownRadar } from '../charts/Charts.jsx'

function Metric({ label, value, tone='' }) { return <div className="metric-tile"><span>{label}</span><strong className={tone}>{value}</strong></div> }
function ComparisonCard({ current, recommended }) {
  if (!current) return null
  const rows = [
    ['Cost index', current.cost_index, recommended.cost_index, true],
    ['Sustainability', current.sustainability_score, recommended.sustainability_score, false],
    ['Recyclability', current.recyclability_score, recommended.recyclability_score, false],
  ]
  return <div className="card p-6 md:col-span-2">
    <div className="section-heading"><span className="step-number">05</span><div><h2>Current vs optimized</h2><p>See the measurable change from your current packaging to the recommended option.</p></div></div>
    <div className="grid md:grid-cols-2 gap-4 mb-5">
      <div className="compare-card compare-current"><span className="compare-label">CURRENT</span><h3>{current.name}</h3><p>{current.category}</p></div>
      <div className="compare-card compare-recommended"><span className="compare-label">RECOMMENDED</span><h3>{recommended.name}</h3><p>{recommended.category}</p></div>
    </div>
    <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr><th>Metric</th><th>Current</th><th>Recommended</th><th>Change</th></tr></thead><tbody>{rows.map(([label,a,b,lowerBetter]) => { const d=Number(b)-Number(a); const good=lowerBetter ? d<=0 : d>=0; return <tr key={label}><td>{label}</td><td>{a}/10</td><td>{b}/10</td><td className={good ? 'text-brand-300' : 'text-amber-300'}>{d>0?'+':''}{Number(d).toFixed(1)}</td></tr> })}<tr><td>Suitability</td><td>—</td><td>{Math.round(recommended.suitability)}%</td><td className="text-brand-300">Optimized</td></tr></tbody></table></div>
  </div>
}

export default function Recommendation() {
  const { id } = useParams()
  const [rec,setRec]=useState(null); const [analysis,setAnalysis]=useState(null); const [current,setCurrent]=useState(null); const [status,setStatus]=useState('loading')
  function load(){ setStatus('loading'); Promise.all([analysisApi.recommendation(id),analysisApi.get(id)]).then(async ([r,a])=>{ setRec(r.data); setAnalysis(a.data); if(a.data.current_packaging_id){ const p=await packagingApi.get(a.data.current_packaging_id); setCurrent(p.data) } setStatus('ready') }).catch(()=>setStatus('error')) }
  useEffect(load,[id])
  if(status==='loading') return <Loading label="Calculating recommendation…" />
  if(status==='error') return <ErrorState onRetry={load} message="Couldn't load this recommendation." />
  const radarData=rec.explanation_trace.map(t=>({dimension:t.dimension.replace(' Protection',''),pct:t.max_pct>0?Math.round((t.contribution_pct/t.max_pct)*100):0}))
  const recommended={name:rec.packaging_name,category:rec.packaging_category,cost_index:rec.recommended_specifications.cost_index ?? 0,sustainability_score:rec.recommended_specifications.sustainability_score ?? 0,recyclability_score:rec.recommended_specifications.recyclability_score ?? 0,suitability:rec.overall_suitability_pct}
  return <div className="space-y-6">
    <div className="page-hero"><div><span className="eyebrow">ANALYSIS #{id} · {analysis.food_name}</span><h1 className="page-title">{rec.packaging_name}</h1><p className="page-subtitle">{rec.packaging_category} · optimized for <span className="text-brand-300">{analysis.priority.replace('_',' ')}</span></p></div><div className="hero-actions"><Link to={`/analysis/${id}/comparison`} className="btn-secondary text-sm">Compare candidates</Link><Link to={`/analysis/${id}/report`} className="btn-primary text-sm">Open report</Link></div></div>
    <div className="grid md:grid-cols-4 gap-4"><div className="card p-5 flex items-center justify-center"><SuitabilityRing value={rec.overall_suitability_pct}/></div><div className="card p-5"><Metric label="Estimated shelf life" value={`~${rec.estimated_shelf_life_months} mo`} tone="text-brand-300"/></div><div className="card p-5"><Metric label="Cost level" value={rec.cost_level}/></div><div className="card p-5"><Metric label="Sustainability" value={rec.sustainability_level} tone="text-brand-300"/></div></div>
    <div className="card p-6"><div className="section-heading"><span className="step-number">01</span><div><h2>Recommended specifications</h2><p>Packaging properties used by the decision engine.</p></div></div><div className="grid grid-cols-2 md:grid-cols-4 gap-3">{Object.entries(rec.recommended_specifications).filter(([k])=>k!=='cost_index'&&k!=='sustainability_score'&&k!=='recyclability_score').map(([k,v])=><Metric key={k} label={k.replaceAll('_',' ')} value={typeof v==='boolean'?(v?'Yes':'No'):String(v)}/>)}</div></div>
    <div className="grid md:grid-cols-2 gap-4"><div className="card p-6"><div className="section-heading"><span className="step-number">02</span><div><h2>Score breakdown</h2><p>How each dimension contributes to the result.</p></div></div><div className="space-y-4">{rec.explanation_trace.map(t=><ScoreBar key={t.dimension} label={t.dimension} value={t.contribution_pct} max={t.max_pct}/>)}</div></div><div className="card p-6"><div className="section-heading"><span className="step-number">03</span><div><h2>Dimension fit</h2><p>Requirement-to-material fit across the decision factors.</p></div></div><ScoreBreakdownRadar data={radarData}/></div></div>
    <ComparisonCard current={current} recommended={recommended}/>
    <div className="card p-6"><div className="section-heading"><span className="step-number">06</span><div><h2>Why this packaging?</h2><p>Explainable rules and evidence from the scoring pipeline.</p></div></div><div className="space-y-4">{rec.rules_fired.map((rule,idx)=><div key={idx} className="rule-row"><span>{String(idx+1).padStart(2,'0')}</span><div><p>{rule.food_requirement}</p><small>→ {rule.packaging_requirement}</small></div></div>)}</div><div className="mt-5 pt-5 border-t border-white/5 space-y-3">{rec.explanation_trace.map(t=><div key={t.dimension} className="flex items-start justify-between gap-4 text-sm"><div><p className="text-slate-200 font-medium">{t.dimension}</p><p className="text-slate-500 text-xs">{t.packaging_property}</p></div><span className="status-pill">{t.match}</span></div>)}</div></div>
  </div>
}
