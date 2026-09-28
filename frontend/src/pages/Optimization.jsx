import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { analysisApi, extractErrorMessage } from '../services/api.js'
import AnalysisPicker from '../components/AnalysisPicker.jsx'
import { Loading } from '../components/States.jsx'
import { LevelBadge } from '../components/ScoreIndicators.jsx'
import { useToast } from '../hooks/useToast.jsx'

const PRIORITIES = [
  {
    value: 'balanced',
    label: 'Balanced',
    description: 'Balanced overall decision',
  },
  {
    value: 'cost',
    label: 'Lowest Cost',
    description: 'Prioritize packaging cost',
  },
  {
    value: 'shelf_life',
    label: 'Maximum Shelf Life',
    description: 'Prioritize storage life',
  },
  {
    value: 'sustainability',
    label: 'Maximum Sustainability',
    description: 'Prioritize environmental performance',
  },
  {
    value: 'protection',
    label: 'Maximum Protection',
    description: 'Prioritize food protection',
  },
]

export default function Optimization() {
  const { pushToast } = useToast()

  const [baseAnalysisId, setBaseAnalysisId] = useState(null)
  const [baseAnalysis, setBaseAnalysis] = useState(null)

  const [results, setResults] = useState({})
  const [loadingPriority, setLoadingPriority] = useState(null)
  const [loadingBase, setLoadingBase] = useState(false)

  async function handleSelectBase(id) {
    setBaseAnalysisId(id)
    setLoadingBase(true)
    setResults({})

    try {
      const res = await analysisApi.get(id)
      setBaseAnalysis(res.data)
    } catch (err) {
      pushToast(extractErrorMessage(err), 'error')
      setBaseAnalysisId(null)
      setBaseAnalysis(null)
    } finally {
      setLoadingBase(false)
    }
  }

  async function runPriority(priority) {
    if (!baseAnalysis) return

    setLoadingPriority(priority)

    try {
      const res = await analysisApi.create({
        food_product_id: baseAnalysis.food_product_id,
        moisture_pct: baseAnalysis.moisture_pct,
        fat_pct: baseAnalysis.fat_pct,
        ph: baseAnalysis.ph,
        target_shelf_life_months:
          baseAnalysis.target_shelf_life_months,
        storage_temperature_c:
          baseAnalysis.storage_temperature_c,
        relative_humidity_pct:
          baseAnalysis.relative_humidity_pct,
        oxygen_sensitivity:
          baseAnalysis.oxygen_sensitivity,
        light_sensitivity:
          baseAnalysis.light_sensitivity,
        transportation_condition:
          baseAnalysis.transportation_condition,
        priority,
      })

      const rec = await analysisApi.recommendation(res.data.id)

      setResults((prev) => ({
        ...prev,
        [priority]: {
          analysisId: res.data.id,
          ...rec.data,
        },
      }))
    } catch (err) {
      pushToast(extractErrorMessage(err), 'error')
    } finally {
      setLoadingPriority(null)
    }
  }

  if (!baseAnalysisId) {
    return (
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-semibold">
              ↗
            </div>

            <div>
              <h1 className="font-display text-2xl font-semibold text-slate-900">
                Optimization
              </h1>

              <p className="text-sm text-slate-500">
                Recalculate the packaging recommendation according to
                different business priorities.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">
            Select Base Analysis
          </h2>

          <p className="mt-1 mb-5 text-xs text-slate-500">
            Choose an existing food analysis to explore how the
            recommendation changes.
          </p>

          <AnalysisPicker onSelect={handleSelectBase} />
        </div>
      </div>
    )
  }

  if (loadingBase || !baseAnalysis) {
    return <Loading label="Loading base analysis…" />
  }

  const foodName =
    baseAnalysis.food_name ||
    baseAnalysis.foodName ||
    'Food Product'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-50 flex items-center justify-center text-brand-600 font-semibold">
              ↗
            </div>

            <div>
              <h1 className="font-display text-2xl font-semibold text-slate-900">
                Optimization
              </h1>

              <p className="text-sm text-slate-500">
                Explore how different priorities affect the packaging
                recommendation.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setBaseAnalysisId(null)
            setBaseAnalysis(null)
            setResults({})
          }}
          className="btn-secondary"
        >
          Change Analysis
        </button>
      </div>

      {/* Selected analysis */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Base Analysis
        </p>

        <div className="mt-2 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900">
              {foodName}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Existing analysis #{baseAnalysis.id}
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
            Current Priority:{' '}
            {PRIORITIES.find(
              (p) => p.value === baseAnalysis.priority
            )?.label || 'Balanced'}
          </span>
        </div>
      </div>

      {/* Priority selector */}
      <div>
        <div className="mb-3">
          <h2 className="text-sm font-semibold text-slate-900">
            Optimization Objectives
          </h2>

          <p className="text-xs text-slate-500">
            Run the same food requirements through different weighting
            priorities.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {PRIORITIES.map((priority) => {
            const active = Boolean(results[priority.value])
            const loading = loadingPriority === priority.value

            return (
              <button
                key={priority.value}
                type="button"
                onClick={() => runPriority(priority.value)}
                disabled={loadingPriority !== null}
                className={`
                  rounded-xl
                  border
                  p-4
                  text-left
                  transition-all
                  duration-200
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                  ${
                    active
                      ? 'border-brand-500/40 bg-brand-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-brand-500/30 hover:shadow-sm'
                  }
                `}
              >
                <div
                  className={`
                    mb-3 flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold
                    ${
                      active
                        ? 'bg-brand-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }
                  `}
                >
                  {loading ? '…' : '✓'}
                </div>

                <p className="text-sm font-semibold text-slate-900">
                  {loading ? 'Running…' : priority.label}
                </p>

                <p className="mt-1 text-[11px] leading-4 text-slate-500">
                  {priority.description}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Results */}
      {Object.keys(results).length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-slate-200 text-brand-600">
            ↗
          </div>

          <h3 className="mt-4 text-sm font-semibold text-slate-900">
            Choose an optimization objective
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            PackAI will recalculate the packaging recommendation using
            the selected priority.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {PRIORITIES.map((priority) => {
          const result = results[priority.value]

          if (!result) return null

          return (
            <div
              key={priority.value}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
                    {priority.label}
                  </p>

                  <h3 className="mt-2 font-display text-lg font-semibold text-slate-900">
                    {result.packaging_name ||
                      result.packagingName ||
                      'Packaging Recommendation'}
                  </h3>
                </div>

                <div className="rounded-lg bg-brand-50 px-3 py-2 text-right">
                  <p className="text-xl font-display font-semibold text-brand-600">
                    {Math.round(
                      Number(result.overall_suitability_pct || 0)
                    )}
                    %
                  </p>

                  <p className="text-[10px] text-slate-500">
                    suitability
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Cost
                  </p>

                  <div className="mt-1">
                    <LevelBadge level={result.cost_level} />
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Sustainability
                  </p>

                  <div className="mt-1">
                    <LevelBadge
                      level={result.sustainability_level}
                      positive
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-slate-50 p-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-400">
                  Estimated Shelf Life
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  ~{result.estimated_shelf_life_months} months
                </p>
              </div>

              <Link
                to={`/analysis/${result.analysisId}/recommendation`}
                className="mt-4 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline"
              >
                View full breakdown →
              </Link>
            </div>
          )
        })}
      </div>
    </div>
  )
}