import React, { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.jsx'

const NAV_ITEMS = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: '⌂',
  },
  {
    to: '/analyze',
    label: 'Food Analysis',
    icon: '✦',
  },
  {
    to: '/comparison',
    label: 'Comparison',
    icon: '⇄',
  },
  {
    to: '/optimization',
    label: 'Optimization',
    icon: '↗',
  },
  {
    to: '/reports',
    label: 'Reports',
    icon: '▤',
  },
  {
    to: '/foods-database',
    label: 'Food Database',
    icon: '◉',
  },
  {
    to: '/packaging-database',
    label: 'Packaging Database',
    icon: '▦',
  },
  {
    to: '/about',
    label: 'Methodology',
    icon: 'ⓘ',
  },
]

export default function MainLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [profileOpen, setProfileOpen] = useState(false)

  const handleLogout = () => {
    setProfileOpen(false)
    logout()
    navigate('/')
  }

  /*
   * Controls which sidebar item stays highlighted.
   *
   * Food Analysis remains active when opening:
   * /analyze
   * /analysis/13
   * /analysis/13/recommendation
   * /analysis/13/report
   * /recommendation/13
   * etc.
   */
  const isNavItemActive = (item) => {
    const pathname = location.pathname

    if (item.to === '/dashboard') {
      return pathname === '/dashboard'
    }

    if (item.to === '/analyze') {
      return (
        pathname === '/analyze' ||
        pathname.startsWith('/analysis/') ||
        pathname.startsWith('/recommendation/') ||
        pathname.startsWith('/recommendations/') ||
        pathname.startsWith('/food-analysis/')
      )
    }

    return (
      pathname === item.to ||
      pathname.startsWith(`${item.to}/`)
    )
  }

  const userName = user?.full_name || 'User'
  const userEmail = user?.email || ''

  const userInitial =
    userName
      .trim()
      .charAt(0)
      .toUpperCase() || 'U'

  return (
    <div className="app-shell">
      {/* =====================================================
          SIDEBAR
      ====================================================== */}
      <aside className="sidebar">
        {/* =================================================
            BRAND
        ================================================== */}
        <div className="brand">
          <NavLink
            to="/dashboard"
            className="flex items-center gap-3"
            onClick={() => setProfileOpen(false)}
          >
            <div className="brand-mark">
              P
            </div>

            <div>
              <div className="font-display font-extrabold text-[17px] tracking-tight text-slate-900">
                PackAI
              </div>

              <div className="text-[9px] text-slate-500 uppercase tracking-[.19em] font-semibold">
                Decision Engine
              </div>
            </div>
          </NavLink>
        </div>

        {/* =================================================
            NAVIGATION
        ================================================== */}
        <nav className="flex-1 px-3 py-5 overflow-y-auto">
          <div className="px-3 mb-3 text-[9px] font-bold uppercase tracking-[.18em] text-slate-400">
            Workspace
          </div>

          <div className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = isNavItemActive(item)

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setProfileOpen(false)}
                  className={`nav-item ${
                    active ? 'nav-active' : ''
                  }`}
                >
                  <span className="nav-icon">
                    {item.icon}
                  </span>

                  <span>
                    {item.label}
                  </span>
                </NavLink>
              )
            })}
          </div>
        </nav>

        {/* =================================================
            PROFILE AREA
        ================================================== */}
        <div className="relative p-3">
          {/* ===============================================
              PROFILE POPUP
          ================================================ */}
          {profileOpen && (
            <div
              className="
                absolute
                bottom-[calc(100%+8px)]
                left-3
                right-3
                z-50
                overflow-hidden
                rounded-xl
                border
                border-slate-200
                bg-white
                shadow-[0_12px_35px_rgba(15,23,42,0.14)]
              "
            >
              {/* User information */}
              <div className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className="avatar">
                    {userInitial}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {userName}
                    </p>

                    <p className="truncate text-[11px] text-slate-500">
                      {userEmail}
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-100" />

              {/* Logout only */}
              <div className="p-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="
                    flex
                    w-full
                    items-center
                    gap-3
                    rounded-lg
                    px-3
                    py-2.5
                    text-left
                    text-sm
                    font-medium
                    text-slate-700
                    transition-colors
                    hover:bg-red-50
                    hover:text-red-600
                  "
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-sm transition-colors group-hover:bg-red-100">
                    ↪
                  </span>

                  <span>
                    Log out
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ===============================================
              PROFILE BUTTON
          ================================================ */}
          <button
            type="button"
            onClick={() =>
              setProfileOpen((open) => !open)
            }
            aria-expanded={profileOpen}
            aria-label="Open account menu"
            className="
              group
              flex
              w-full
              items-center
              gap-3
              rounded-xl
              border
              border-slate-200
              bg-white
              p-3
              text-left
              transition-all
              duration-200
              hover:border-slate-300
              hover:shadow-sm
            "
          >
            {/* Avatar */}
            <div className="avatar">
              {userInitial}
            </div>

            {/* User details */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {userName}
              </p>

              <p className="truncate text-[11px] text-slate-500">
                {userEmail}
              </p>
            </div>

            {/* Arrow */}
            <span
              className={`
                flex
                h-7
                w-7
                shrink-0
                items-center
                justify-center
                rounded-md
                text-slate-400
                transition-all
                duration-200
                ${
                  profileOpen
                    ? 'rotate-180 bg-slate-100 text-slate-600'
                    : 'group-hover:bg-slate-50'
                }
              `}
            >
              ↑
            </span>
          </button>
        </div>
      </aside>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}
      <main className="flex-1 min-w-0 w-full">
        <div className="content-wrap">
          {children}
        </div>
      </main>
    </div>
  )
}