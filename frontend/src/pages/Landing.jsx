import React, { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

const FEATURES = [
  {
    icon: '◎',
    title: 'Multi-factor analysis',
    desc: 'Evaluate packaging using moisture, oxygen, mechanical protection, shelf life, cost and sustainability.',
  },
  {
    icon: '↗',
    title: 'Optimization',
    desc: 'Change the optimization priority and compare how the recommended packaging changes.',
  },
  {
    icon: '✦',
    title: 'Explainable AI',
    desc: 'AI explains the structured recommendation instead of changing the underlying decision.',
  },
  {
    icon: '✓',
    title: 'Transparent scoring',
    desc: 'Every packaging candidate is scored against the same measurable requirements.',
  },
  {
    icon: '◈',
    title: 'Food intelligence',
    desc: 'Use food-specific properties to derive packaging requirements before scoring candidates.',
  },
  {
    icon: '▤',
    title: 'Decision reports',
    desc: 'Generate clear recommendation, comparison and optimization reports.',
  },
]

export default function Landing() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  /* =================================================
     REDIRECT LOGGED-IN USERS TO DASHBOARD
  ================================================= */

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true })
    }
  }, [user, navigate])

  const isLoggedIn = Boolean(user)

  /* =================================================
     LOGOUT
  ================================================= */

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="landing-page">

      {/* =================================================
          NAVBAR
      ================================================= */}

      <header className="landing-nav">
        <div className="landing-nav-inner">

          {/* LOGO */}

          <Link
            to="/"
            className="flex items-center gap-3 shrink-0"
          >
            <div className="brand-mark">
              P
            </div>

            <div>
              <div className="font-display font-extrabold text-lg tracking-tight text-slate-900">
                PackAI
              </div>

              <div className="text-[9px] text-slate-400 uppercase tracking-[.2em] font-bold">
                Packaging Intelligence
              </div>
            </div>
          </Link>


          {/* NAVIGATION */}

          <nav className="landing-nav-links">

            {/* METHODOLOGY */}

            <Link
              to="/about"
              className="landing-nav-link"
            >
              Methodology
            </Link>


            {/* GUEST */}

            {!isLoggedIn && (
              <>
                <Link
                  to="/login"
                  className="landing-nav-link"
                >
                  Log in
                </Link>

                <Link
                  to="/register"
                  className="btn-primary landing-nav-cta"
                >
                  Get Started
                </Link>
              </>
            )}


            {/* LOGGED-IN USER */}

            {isLoggedIn && (
              <>
                <Link
                  to="/dashboard"
                  className="landing-nav-link landing-dashboard-link"
                >
                  Dashboard
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn-secondary landing-logout"
                >
                  Logout
                </button>
              </>
            )}

          </nav>

        </div>
      </header>


      {/* =================================================
          HERO
      ================================================= */}

      <section className="landing-hero">

        <div className="hero-glow" />

        <div className="relative max-w-6xl mx-auto px-6 pt-20 md:pt-28 pb-24 text-center">

          {/* BADGE */}

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-100 bg-blue-50 text-blue-700 text-[11px] font-bold uppercase tracking-[.12em] mb-7">

            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />

            Multi-factor packaging intelligence

          </div>


          {/* TITLE */}

          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-[-.045em] leading-[1.03] text-slate-950 max-w-5xl mx-auto">

            Smarter packaging decisions

            <span className="block text-blue-600">
              for every food commodity.
            </span>

          </h1>


          {/* DESCRIPTION */}

          <p className="max-w-2xl mx-auto mt-7 text-base md:text-lg text-slate-500 leading-8">

            PackAI analyzes food properties, storage conditions,
            transport requirements and packaging characteristics to
            identify the most suitable packaging configuration.

          </p>


          {/* =================================================
              HERO BUTTONS
          ================================================= */}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-9">

            {!isLoggedIn ? (
              <Link
                to="/register"
                className="btn-primary px-7 py-3.5"
              >
                Start an Analysis →
              </Link>
            ) : (
              <Link
                to="/dashboard"
                className="btn-primary px-7 py-3.5"
              >
                Open Dashboard →
              </Link>
            )}

            <a
              href="#how-it-works"
              className="btn-secondary px-7 py-3.5"
            >
              See How It Works
            </a>

          </div>


          {/* TRUST POINTS */}

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 mt-10 text-xs text-slate-400">

            <span>✓ Requirement mapping</span>

            <span>✓ Multi-factor scoring</span>

            <span>✓ Optimization</span>

            <span>✓ Explainable AI</span>

          </div>

        </div>

      </section>


      {/* =================================================
          FEATURES
      ================================================= */}

      <section
        id="features"
        className="max-w-6xl mx-auto px-6 pb-24 scroll-mt-24"
      >

        <div className="text-center mb-10">

          <p className="eyebrow">
            Platform capabilities
          </p>

          <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight mt-2">
            One engine. Multiple packaging decisions.
          </h2>

          <p className="max-w-2xl mx-auto text-sm text-slate-500 mt-3 leading-6">
            PackAI combines structured decision logic, multi-factor
            scoring and AI-generated explanations into one workflow.
          </p>

        </div>


        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {FEATURES.map((feature) => (

            <div
              key={feature.title}
              className="feature-card"
            >

              <div className="feature-icon">
                {feature.icon}
              </div>

              <h3 className="font-display text-base font-bold text-slate-900 mb-2">
                {feature.title}
              </h3>

              <p className="text-sm text-slate-500 leading-6">
                {feature.desc}
              </p>

            </div>

          ))}

        </div>

      </section>


      {/* =================================================
          HOW IT WORKS
      ================================================= */}

      <section
        id="how-it-works"
        className="max-w-6xl mx-auto px-6 pb-24 scroll-mt-24"
      >

        <div className="card p-7 md:p-10">

          <div className="grid lg:grid-cols-2 gap-10 items-center">

            {/* LEFT */}

            <div>

              <p className="eyebrow">
                How PackAI works
              </p>

              <h2 className="font-display text-3xl font-extrabold tracking-tight mt-2">
                Decision first.
                <br />
                AI explanation second.
              </h2>

              <p className="text-sm text-slate-500 leading-7 mt-4 max-w-xl">

                The packaging ranking is produced by a transparent
                scoring and optimization engine. The AI layer receives
                the structured result and explains the trade-offs in
                plain language.

              </p>

              <Link
                to="/about"
                className="inline-flex mt-6 text-sm font-bold text-blue-600 hover:text-blue-700"
              >
                Explore the methodology →
              </Link>

            </div>


            {/* RIGHT */}

            <div className="grid grid-cols-2 gap-3">

              {[
                ['01', 'Food inputs'],
                ['02', 'Requirements'],
                ['03', 'Candidate scoring'],
                ['04', 'Optimization'],
                ['05', 'Recommendation'],
                ['06', 'AI explanation'],
              ].map(([number, title]) => (

                <div
                  key={number}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >

                  <div className="text-[10px] font-bold text-blue-600 mb-3">
                    {number}
                  </div>

                  <div className="font-display text-sm font-bold text-slate-800">
                    {title}
                  </div>

                </div>

              ))}

            </div>

          </div>

        </div>

      </section>


      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="landing-footer">

        <div className="max-w-6xl mx-auto px-6">

          {/* MAIN FOOTER */}

          <div className="landing-footer-main">

            {/* BRAND */}

            <div className="landing-footer-brand">

              <Link
                to="/"
                className="inline-flex items-center gap-3"
              >

                <div className="brand-mark">
                  P
                </div>

                <div>

                  <div className="font-display font-extrabold text-lg tracking-tight text-slate-900">
                    PackAI
                  </div>

                  <div className="text-[9px] text-slate-400 uppercase tracking-[.2em] font-bold">
                    Packaging Intelligence
                  </div>

                </div>

              </Link>

              <p>
                AI-powered packaging decision support for food
                commodities, combining structured requirements,
                multi-factor scoring and explainable recommendations.
              </p>

            </div>


            {/* PRODUCT */}

            <div className="landing-footer-column">

              <h3>
                Product
              </h3>

              <Link to="/about">
                Methodology
              </Link>

              <Link to={isLoggedIn ? '/dashboard' : '/register'}>
                Start Analysis
              </Link>

              <a href="#how-it-works">
                How It Works
              </a>

            </div>


            {/* CAPABILITIES */}

            <div className="landing-footer-column">

              <h3>
                Capabilities
              </h3>

              <a href="#features">
                Multi-factor Analysis
              </a>

              <a href="#features">
                Optimization
              </a>

              <a href="#features">
                Explainable AI
              </a>

              <a href="#features">
                Decision Reports
              </a>

            </div>


            {/* GET STARTED */}

            <div className="landing-footer-column">

              <h3>
                Get Started
              </h3>

              <p className="landing-footer-small">
                Ready to explore a packaging decision?
              </p>

              <Link
                to={isLoggedIn ? '/dashboard' : '/register'}
                className="btn-primary landing-footer-button"
              >
                {isLoggedIn
                  ? 'Open Dashboard →'
                  : 'Get Started →'}
              </Link>

            </div>

          </div>


          {/* BOTTOM FOOTER */}

          <div className="landing-footer-bottom">

            <p>
              © {new Date().getFullYear()} PackAI. All rights reserved.
            </p>

            <div className="flex items-center gap-5">

              <Link to="/about">
                Methodology
              </Link>

              <a href="#how-it-works">
                How It Works
              </a>

              <button
                type="button"
                onClick={() =>
                  window.scrollTo({
                    top: 0,
                    behavior: 'smooth',
                  })
                }
              >
                Back to top ↑
              </button>

            </div>

          </div>

        </div>

      </footer>

    </div>
  )
}