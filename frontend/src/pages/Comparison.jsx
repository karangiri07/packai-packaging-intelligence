import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { analysisApi } from '../services/api.js'
import {
  Loading,
  ErrorState,
  EmptyState,
} from '../components/States.jsx'
import {
  SuitabilityBarChart,
  CostVsShelfLifeChart,
  SustainabilityVsPerformanceChart,
} from '../charts/Charts.jsx'
import AnalysisPicker from '../components/AnalysisPicker.jsx'

const SORT_OPTIONS = [
  { value: 'score', label: 'Suitability' },
  { value: 'cost', label: 'Cost — low first' },
  { value: 'shelfLife', label: 'Shelf life' },
  { value: 'sustainability', label: 'Sustainability' },
]

export default function Comparison() {
  const { id: routeId } = useParams()

  const [analysisId, setAnalysisId] = useState(routeId || null)
  const [candidates, setCandidates] = useState(null)
  const [status, setStatus] = useState(
    routeId ? 'loading' : 'pick'
  )

  const [sortBy, setSortBy] = useState('score')
  const [minSustainability, setMinSustainability] = useState(0)

  function load(id) {
    setStatus('loading')

    analysisApi
      .comparison(id)
      .then((res) => {
        setCandidates(res.data?.candidates || [])
        setStatus('ready')
      })
      .catch(() => {
        setStatus('error')
      })
  }

  useEffect(() => {
    if (analysisId) {
      load(analysisId)
    }
  }, [analysisId])

  const filtered = useMemo(() => {
    if (!candidates) return []

    const list = candidates.filter(
      (candidate) =>
        Number(candidate.sustainability_score || 0) >=
        minSustainability
    )

    const sorters = {
      score: (a, b) =>
        Number(b.final_score || 0) -
        Number(a.final_score || 0),

      cost: (a, b) =>
        Number(a.cost_index || 0) -
        Number(b.cost_index || 0),

      shelfLife: (a, b) =>
        Number(b.estimated_shelf_life_months || 0) -
        Number(a.estimated_shelf_life_months || 0),

      sustainability: (a, b) =>
        Number(b.sustainability_score || 0) -
        Number(a.sustainability_score || 0),
    }

    return [...list].sort(sorters[sortBy])
  }, [candidates, sortBy, minSustainability])

  if (!analysisId) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-semibold">
              ⇄
            </div>

            <div>
              <h1 className="font-display text-2xl font-semibold text-slate-900">
                Packaging Comparison
              </h1>

              <p className="text-sm text-slate-500">
                Compare packaging candidates across suitability, cost,
                shelf life and sustainability.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Select Analysis
          </h2>

          <p className="mt-1 mb-5 text-xs text-slate-500">
            Choose a food analysis to compare its packaging candidates.
          </p>

          <AnalysisPicker onSelect={setAnalysisId} />
        </div>
      </div>
    )
  }

  if (status === 'loading') {
    return <Loading label="Loading comparison…" />
  }

  if (status === 'error') {
    return (
      <ErrorState
        onRetry={() => load(analysisId)}
        message="Couldn't load the packaging comparison."
      />
    )
  }

  if (!filtered.length) {
    return (
      <EmptyState
        title="No candidates match your filters"
        subtitle="Try lowering the sustainability filter or choose another analysis."
      />
    )
  }

  const barData = filtered.map((candidate) => ({
    name:
      candidate.packaging_code ||
      candidate.packaging_name ||
      'Packaging',
    score: candidate.final_score,
  }))

  const scatterData = filtered.map((candidate) => ({
    cost: candidate.cost_index,
    shelfLife: candidate.estimated_shelf_life_months,
    score: candidate.final_score,
    name: candidate.packaging_name,
  }))

  const sustainData = filtered.map((candidate) => ({
    sustainability: candidate.sustainability_score,
    score: candidate.final_score,
    name: candidate.packaging_name,
  }))

  const bestCandidate = filtered[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-semibold">
              ⇄
            </div>

            <div>
              <h1 className="font-display text-2xl font-semibold text-slate-900">
                Packaging Comparison
              </h1>

              <p className="text-sm text-slate-500">
                {filtered.length} packaging candidates available for
                this analysis.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setAnalysisId(null)
            setCandidates(null)
            setStatus('pick')
          }}
          className="btn-secondary"
        >
          Change Analysis
        </button>
      </div>

      {/* Best candidate */}
      <div className="rounded-xl border border-brand-500/20 bg-brand-50/60 p-5">
        <div className="flex items-start justify-between gap-5 flex-wrap">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-600">
              Highest Suitability
            </p>

            <h2 className="mt-2 font-display text-xl font-semibold text-slate-900">
              {bestCandidate.packaging_name}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Based on the current analysis scoring.
            </p>
          </div>

          <div className="rounded-xl bg-white px-5 py-3 text-center shadow-sm">
            <p className="text-2xl font-display font-semibold text-brand-600">
              {bestCandidate.final_score}/100
            </p>

            <p className="text-[10px] uppercase tracking-wide text-slate-400">
              Suitability
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <select
          className="input w-auto text-sm"
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
        >
          {SORT_OPTIONS.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              Sort: {option.label}
            </option>
          ))}
        </select>

        <select
          className="input w-auto text-sm"
          value={minSustainability}
          onChange={(event) =>
            setMinSustainability(Number(event.target.value))
          }
        >
          <option value={0}>All sustainability levels</option>
          <option value={5}>Sustainability ≥ 5</option>
          <option value={7}>Sustainability ≥ 7</option>
        </select>
      </div>

      {/* Comparison table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left border-b border-slate-200">
                <th className="px-5 py-3 font-semibold text-slate-600">
                  Packaging Material
                </th>

                <th className="px-5 py-3 font-semibold text-slate-600">
                  Suitability
                </th>

                <th className="px-5 py-3 font-semibold text-slate-600">
                  Cost
                </th>

                <th className="px-5 py-3 font-semibold text-slate-600">
                  Shelf Life
                </th>

                <th className="px-5 py-3 font-semibold text-slate-600">
                  Sustainability
                </th>

                <th className="px-5 py-3 font-semibold text-slate-600">
                  Recyclability
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((candidate, index) => (
                <tr
                  key={candidate.packaging_id}
                  className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-600">
                        {index + 1}
                      </span>

                      <div>
                        <p className="font-semibold text-slate-900">
                          {candidate.packaging_name}
                        </p>

                        {candidate.packaging_code && (
                          <p className="mt-0.5 text-[11px] text-slate-400">
                            {candidate.packaging_code}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4 font-semibold text-brand-600">
                    {candidate.final_score}/100
                  </td>

                  <td className="px-5 py-4 text-slate-700">
                    {candidate.cost_index}/10
                  </td>

                  <td className="px-5 py-4 text-slate-700">
                    ~{candidate.estimated_shelf_life_months} mo
                  </td>

                  <td className="px-5 py-4 text-slate-700">
                    {candidate.sustainability_score}/10
                  </td>

                  <td className="px-5 py-4 text-slate-700">
                    {candidate.recyclability_score}/10
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-display font-semibold text-slate-900">
            Suitability Comparison
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Overall packaging fit score.
          </p>

          <div className="mt-4">
            <SuitabilityBarChart data={barData} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-display font-semibold text-slate-900">
            Cost vs Shelf Life
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Compare economic impact against estimated shelf life.
          </p>

          <div className="mt-4">
            <CostVsShelfLifeChart data={scatterData} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">
          <h2 className="font-display font-semibold text-slate-900">
            Sustainability vs Performance
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            See how sustainability relates to overall packaging
            performance.
          </p>

          <div className="mt-4">
            <SustainabilityVsPerformanceChart
              data={sustainData}
            />
          </div>
        </div>
      </div>
    </div>
  )
}