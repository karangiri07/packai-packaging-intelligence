import React from 'react'
import AnalysisPicker from '../components/AnalysisPicker.jsx'
import { useNavigate } from 'react-router-dom'

export default function Reports() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-slate-500">Select an analysis to view or download its full packaging report.</p>
      </div>
      <AnalysisPicker onSelect={(id) => navigate(`/analysis/${id}/report`)} />
    </div>
  )
}
