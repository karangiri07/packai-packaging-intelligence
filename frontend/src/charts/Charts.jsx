import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
} from 'recharts'

const AXIS_COLOR = '#64748b'
const GRID_COLOR = 'rgba(255,255,255,0.06)'

const tooltipStyle = {
  background: '#1a2b26',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  fontSize: 12,
  color: '#e2e8f0',
}

export function SuitabilityBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
        <XAxis dataKey="name" tick={{ fill: AXIS_COLOR, fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
        <YAxis domain={[0, 100]} tick={{ fill: AXIS_COLOR, fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Bar dataKey="score" fill="#22c56a" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function CostVsShelfLifeChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart margin={{ top: 8, right: 16, left: -8, bottom: 8 }}>
        <CartesianGrid stroke={GRID_COLOR} />
        <XAxis type="number" dataKey="cost" name="Cost index" domain={[0, 10]} tick={{ fill: AXIS_COLOR, fontSize: 11 }} label={{ value: 'Cost index', position: 'insideBottom', offset: -4, fill: AXIS_COLOR, fontSize: 11 }} />
        <YAxis type="number" dataKey="shelfLife" name="Shelf life (months)" tick={{ fill: AXIS_COLOR, fontSize: 11 }} label={{ value: 'Est. shelf life', angle: -90, position: 'insideLeft', fill: AXIS_COLOR, fontSize: 11 }} />
        <ZAxis type="number" dataKey="score" range={[60, 260]} name="Score" />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={tooltipStyle} formatter={(v, n) => [v, n]} labelFormatter={() => ''} />
        <Scatter data={data} fill="#22c56a" />
      </ScatterChart>
    </ResponsiveContainer>
  )
}

export function SustainabilityVsPerformanceChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart margin={{ top: 8, right: 16, left: -8, bottom: 8 }}>
        <CartesianGrid stroke={GRID_COLOR} />
        <XAxis type="number" dataKey="sustainability" name="Sustainability" domain={[0, 10]} tick={{ fill: AXIS_COLOR, fontSize: 11 }} label={{ value: 'Sustainability score', position: 'insideBottom', offset: -4, fill: AXIS_COLOR, fontSize: 11 }} />
        <YAxis type="number" dataKey="score" name="Overall score" domain={[0, 100]} tick={{ fill: AXIS_COLOR, fontSize: 11 }} label={{ value: 'Overall score', angle: -90, position: 'insideLeft', fill: AXIS_COLOR, fontSize: 11 }} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={tooltipStyle} />
        <Scatter data={data} fill="#4ade87" />
      </ScatterChart>
    </ResponsiveContainer>
  )
}

export function ScoreBreakdownRadar({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid stroke={GRID_COLOR} />
        <PolarAngleAxis dataKey="dimension" tick={{ fill: AXIS_COLOR, fontSize: 11 }} />
        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: AXIS_COLOR, fontSize: 9 }} />
        <Radar dataKey="pct" stroke="#22c56a" fill="#22c56a" fillOpacity={0.35} />
        <Tooltip contentStyle={tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  )
}
