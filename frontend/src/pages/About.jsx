import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

const STEPS = [
  {
    number: '01',
    title: 'Requirements Mapping',
    text: `Raw food inputs such as moisture, fat, pH, oxygen/light sensitivity,
    fragility, target shelf life, storage temperature, humidity and transportation
    conditions are converted into packaging requirement targets using explicit,
    inspectable rules.`,
  },
  {
    number: '02',
    title: 'Multi-Factor Scoring Engine',
    text: `Each packaging candidate is compared against the derived requirements
    across oxygen protection, moisture protection, mechanical protection, shelf life,
    cost, sustainability and compatibility. These fit ratios are combined into a
    final 0–100 score using the selected optimization priority.`,
  },
  {
    number: '03',
    title: 'Optimization Engine',
    text: `The optimizer applies the selected priority such as Balanced, Lowest Cost,
    Maximum Shelf Life, Maximum Sustainability or Maximum Protection. A minimum
    protection floor prevents cost or sustainability priorities from selecting an
    under-protective option.`,
  },
  {
    number: '04',
    title: 'AI Explanation',
    text: `The AI/LLM is used after the structured scoring and optimization process.
    It receives the recommendation, score breakdown and alternatives, then explains
    the result and its trade-offs. It does not change the ranking.`,
  },
]

export default function About() {
  const { user } = useAuth()

  const isLoggedIn = Boolean(user)

  const backPath = isLoggedIn ? '/dashboard' : '/'
  const backLabel = isLoggedIn
    ? '← Back to Dashboard'
    : '← Back to Home'

  return (
    <div className="method-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="border-b border-slate-200 bg-white/85 backdrop-blur-lg">

        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-6">

          {/* LOGO */}

          <Link
            to={backPath}
            className="flex items-center gap-3 shrink-0"
          >

            <div className="brand-mark">
              P
            </div>

            <div>
              <div className="font-display font-extrabold text-lg text-slate-900">
                PackAI
              </div>

              <div className="text-[9px] uppercase tracking-[.18em] text-slate-400 font-bold">
                Packaging Intelligence
              </div>
            </div>

          </Link>


          {/* BACK BUTTON */}

          <Link
            to={backPath}
            className="method-back-btn"
          >
            {backLabel}
          </Link>

        </div>

      </header>


      {/* =================================================
          CONTENT
      ================================================= */}

      <main className="max-w-5xl mx-auto px-6 py-14 md:py-20">

        {/* HERO */}

        <div className="max-w-3xl mb-12">

          <p className="eyebrow">
            PackAI methodology
          </p>

          <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight mt-2 text-slate-950">
            How PackAI makes a packaging decision
          </h1>

          <p className="text-base text-slate-500 leading-7 mt-5">
            PackAI keeps the packaging decision engine and the AI
            explanation layer separate. This makes the recommendation
            transparent, inspectable and easier to understand.
          </p>

        </div>


        {/* =================================================
            METHODOLOGY STEPS
        ================================================= */}

        <div className="space-y-5">

          {STEPS.map((step) => (

            <section
              key={step.number}
              className="method-card"
            >

              <div className="method-number">
                {step.number}
              </div>

              <h2 className="font-display text-xl font-extrabold text-slate-900">
                {step.title}
              </h2>

              <p className="mt-3">
                {step.text}
              </p>

            </section>

          ))}

        </div>


        {/* =================================================
            AI SEPARATION
        ================================================= */}

        <section className="mt-10 rounded-2xl border border-blue-100 bg-blue-50/70 p-6 md:p-8">

          <div className="flex items-start gap-4">

            <div className="w-10 h-10 min-w-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center text-blue-600 font-bold">
              ✦
            </div>

            <div>

              <h2 className="font-display text-lg font-extrabold text-slate-900">
                Why separate the AI layer?
              </h2>

              <p className="text-sm text-slate-600 leading-7 mt-2">
                The ranking should come from structured requirements,
                measurable packaging properties and optimization rules.
                The AI layer is then responsible for explaining the
                structured result rather than silently changing it.
              </p>

            </div>

          </div>

        </section>


        {/* =================================================
            DISCLAIMER
        ================================================= */}

        <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-6">

          <p className="text-[10px] uppercase tracking-[.15em] font-bold text-amber-700 mb-2">
            Scientific disclaimer
          </p>

          <p className="text-sm text-amber-800 leading-7">
            PackAI is a decision-support prototype for educational and
            hackathon purposes. It is not a replacement for laboratory
            testing, food-safety validation, regulatory certification or
            professional packaging engineering. Material property values
            used in the prototype are approximate demo figures.
          </p>

        </section>

      </main>

    </div>
  )
}