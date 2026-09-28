import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi } from '../services/api.js'
import { Loading, EmptyState } from './States.jsx'

function formatPriority(priority) {
  const labels = {
    balanced: 'Balanced',
    cost: 'Lowest Cost',
    shelf_life: 'Maximum Shelf Life',
    sustainability: 'Maximum Sustainability',
    protection: 'Maximum Protection',
  }

  return labels[priority] || priority || 'Balanced'
}

function formatDate(value) {
  if (!value) return ''

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function AnalysisPicker({ onSelect }) {
  const [analyses, setAnalyses] = useState(null)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    let mounted = true

    async function loadAnalyses() {
      try {
        const res = await dashboardApi.summary()

        if (!mounted) return

        const data = res?.data?.recent_analyses || []

        setAnalyses(data)
        setStatus('ready')
      } catch (error) {
        if (!mounted) return

        setStatus('error')
      }
    }

    loadAnalyses()

    return () => {
      mounted = false
    }
  }, [])

  /*
   * Keep only the latest analysis for each food.
   *
   * Example:
   *
   * Frozen Food #13
   * Frozen Food #10
   * Frozen Food #8
   *
   * becomes:
   *
   * Frozen Food #13
   *
   * This prevents the presentation UI from showing
   * repeated food names.
   */
  const uniqueAnalyses = useMemo(() => {
    if (!analyses) return []

    const sorted = [...analyses].sort((a, b) => {
      const dateA = new Date(
        a.created_at ||
        a.createdAt ||
        a.updated_at ||
        a.updatedAt ||
        0
      ).getTime()

      const dateB = new Date(
        b.created_at ||
        b.createdAt ||
        b.updated_at ||
        b.updatedAt ||
        0
      ).getTime()

      // If dates are unavailable, use the analysis ID.
      if (dateA === dateB) {
        return Number(b.id || 0) - Number(a.id || 0)
      }

      return dateB - dateA
    })

    const seenFoods = new Set()

    return sorted.filter((analysis) => {
      const foodName = String(
        analysis.food_name ||
        analysis.foodName ||
        'Unnamed Food'
      )
        .trim()
        .toLowerCase()

      if (seenFoods.has(foodName)) {
        return false
      }

      seenFoods.add(foodName)

      return true
    })
  }, [analyses])

  if (status === 'loading') {
    return <Loading label="Loading your analyses…" />
  }

  if (status === 'error') {
    return (
      <EmptyState
        title="Couldn't load analyses"
        subtitle="There was a problem loading your previous food analyses."
        action={
          <Link to="/analyze" className="btn-primary mt-2">
            Run Food Analysis
          </Link>
        }
      />
    )
  }

  if (!uniqueAnalyses.length) {
    return (
      <EmptyState
        title="No analyses yet"
        subtitle="Run a food analysis first, then come back here to compare or optimize its results."
        action={
          <Link to="/analyze" className="btn-primary mt-2">
            Run Food Analysis
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-3">
      {uniqueAnalyses.map((analysis) => {
        const foodName =
          analysis.food_name ||
          analysis.foodName ||
          'Unnamed Food'

        const priority = formatPriority(analysis.priority)

        const date = formatDate(
          analysis.created_at ||
          analysis.createdAt ||
          analysis.updated_at ||
          analysis.updatedAt
        )

        return (
          <button
            key={analysis.id}
            type="button"
            onClick={() => onSelect(String(analysis.id))}
            className="
              w-full
              flex
              items-center
              justify-between
              gap-4
              rounded-xl
              border
              border-slate-200
              bg-white
              px-5
              py-4
              text-left
              shadow-sm
              transition-all
              duration-200
              hover:-translate-y-[1px]
              hover:border-brand-500/40
              hover:shadow-md
              focus:outline-none
              focus:ring-2
              focus:ring-brand-500/20
            "
          >
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    bg-brand-50
                    text-brand-600
                    font-semibold
                  "
                >
                  {foodName.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <h3 className="truncate text-[15px] font-semibold text-slate-900">
                    {foodName}
                  </h3>

                  <p className="mt-1 text-[12px] text-slate-500">
                    Priority:{' '}
                    <span className="font-medium text-slate-700">
                      {priority}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-4">
              {date && (
                <span className="hidden text-xs text-slate-400 sm:block">
                  {date}
                </span>
              )}

              <span
                className="
                  rounded-lg
                  border
                  border-brand-500/20
                  bg-brand-50
                  px-3
                  py-2
                  text-xs
                  font-semibold
                  text-brand-600
                  transition-colors
                  hover:bg-brand-100
                "
              >
                Select →
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
}