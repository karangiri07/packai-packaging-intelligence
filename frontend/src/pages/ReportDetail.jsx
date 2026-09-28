import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { analysisApi, extractErrorMessage } from '../services/api.js'
import { useToast } from '../hooks/useToast.jsx'
import { Loading, ErrorState } from '../components/States.jsx'

function KeyValueTable({ data }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {Object.entries(data).map(([k, v]) => (
          <tr key={k} className="border-b border-white/5 last:border-0">
            <td className="py-1.5 pr-4 text-slate-500 whitespace-nowrap">{k.replaceAll('_', ' ')}</td>
            <td className="py-1.5 text-slate-200">{String(v)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export default function ReportDetail() {
  const { id } = useParams()
  const { pushToast } = useToast()
  const [downloading, setDownloading] = useState(false)
  const [report, setReport] = useState(null)
  const [status, setStatus] = useState('loading')

  function load() {
    setStatus('loading')
    analysisApi.report(id)
      .then((res) => { setReport(res.data); setStatus('ready') })
      .catch(() => setStatus('error'))
  }

  useEffect(load, [id])

  async function downloadPdf() {
    setDownloading(true)
    try {
      const res = await analysisApi.reportPdf(id)
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `packaging_report_${id}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      pushToast(extractErrorMessage(err), 'error')
    } finally {
      setDownloading(false)
    }
  }

  // Render **bold** markers from the explanation as <strong>
  function renderExplanation(text) {
    return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={i} className="text-slate-100">{part.slice(2, -2)}</strong>
        : <React.Fragment key={i}>{part}</React.Fragment>
    )
  }

  if (status === 'loading') return <Loading label="Generating report…" />
  if (status === 'error') return <ErrorState onRetry={load} message="Couldn't load the report." />

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Packaging Report</h1>
          <p className="text-sm text-slate-500">
            {report.food_information.name} — {report.packaging_recommendation.material}
          </p>
        </div>
        <button onClick={downloadPdf} disabled={downloading} className="btn-primary text-sm disabled:opacity-60">
          {downloading ? 'Preparing PDF…' : 'Download PDF'}
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="card p-6">
          <h2 className="font-display font-semibold mb-3">Food Information</h2>
          <KeyValueTable data={report.food_information} />
        </div>
        <div className="card p-6">
          <h2 className="font-display font-semibold mb-3">Packaging Specifications</h2>
          <KeyValueTable data={report.packaging_specifications} />
        </div>
        <div className="card p-6">
          <h2 className="font-display font-semibold mb-3">Cost Analysis</h2>
          <KeyValueTable data={report.cost_analysis} />
        </div>
        <div className="card p-6">
          <h2 className="font-display font-semibold mb-3">Shelf-Life Analysis</h2>
          <KeyValueTable data={report.shelf_life_analysis} />
        </div>
        <div className="card p-6 md:col-span-2">
          <h2 className="font-display font-semibold mb-3">Sustainability Analysis</h2>
          <KeyValueTable data={report.sustainability_analysis} />
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-display font-semibold mb-3">Alternative Options</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-500 border-b border-white/5">
              <th className="py-2 pr-4">Material</th>
              <th className="py-2 pr-4">Score</th>
              <th className="py-2 pr-4">Cost Index</th>
              <th className="py-2 pr-4">Sustainability</th>
            </tr>
          </thead>
          <tbody>
            {report.alternative_options.map((a) => (
              <tr key={a.material} className="border-b border-white/5 last:border-0">
                <td className="py-2 pr-4 text-slate-200">{a.material}</td>
                <td className="py-2 pr-4">{a.score}</td>
                <td className="py-2 pr-4">{a.cost_index}</td>
                <td className="py-2 pr-4">{a.sustainability_score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-6">
        <h2 className="font-display font-semibold mb-3">Decision Explanation</h2>
        <div className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">{renderExplanation(report.decision_explanation)}</div>
      </div>

      <div className="card p-6">
        <h2 className="font-display font-semibold mb-3">Important Assumptions</h2>
        <ul className="text-sm text-slate-400 list-disc list-inside space-y-1">
          {report.important_assumptions.map((a) => <li key={a}>{a}</li>)}
        </ul>
      </div>

      <div className="card p-6 border-amber-500/20 bg-amber-500/5">
        <p className="text-xs text-amber-300/80">{report.disclaimer}</p>
      </div>
    </div>
  )
}
