import { useState } from 'react'
import { AppProvider, useApp, THEMES } from './context/AppContext'
import logo from './assets/logo.png'
import { SvgIcon, ICONS, StatusBar, Spinner } from './components/ui'
import { PremiumLogo } from './components/PremiumLogo'
import Dashboard from './pages/Dashboard'
import Rooms from './pages/Rooms'
import Residents from './pages/Residents'
import CheckInOut from './pages/CheckInOut'
import Billing from './pages/Billing'
import { Meals, Complaints, Notifications, Readmission, Reports, Settings, Auth } from './pages/OtherPages'
import Home from './pages/Home'
import { motion, AnimatePresence } from 'framer-motion'
import './index.css'

const NAV = [
  { section: 'Main' },
  { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { id: 'rooms', label: 'Rooms', icon: 'home' },
  { id: 'residents', label: 'Residents', icon: 'users' },
  { id: 'checkinout', label: 'Check In/Out', icon: 'login', badge: 'map' },
  { section: 'Finance' },
  { id: 'billing', label: 'Billing', icon: 'card' },
  { section: 'Hostel' },
  { id: 'meals', label: 'Meal Planner', icon: 'food' },
  { id: 'complaints', label: 'Complaints', icon: 'alert' },
  { id: 'readmission', label: 'Readmission', icon: 'refresh' },
  { section: 'System' },
  { id: 'notifications', label: 'Notifications', icon: 'bell', badge: 'notif' },
  { id: 'reports', label: 'Reports', icon: 'bar' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
]

const TITLES = { dashboard: 'Dashboard', rooms: 'Room Management', residents: 'Residents', checkinout: 'Check In / Out', billing: 'Billing & Fees', meals: 'Meal Planner', complaints: 'Complaints', readmission: 'Readmission', notifications: 'Notifications', reports: 'Reports & Analytics', settings: 'Settings', auth: 'Authentication' }

const PAGE_MAP = { dashboard: Dashboard, rooms: Rooms, residents: Residents, checkinout: CheckInOut, billing: Billing, meals: Meals, complaints: Complaints, readmission: Readmission, notifications: Notifications, reports: Reports, settings: Settings, auth: Auth }

function Inner() {
  const [page, setPage] = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navigateTo = (id) => {
    setPage(id)
    setMobileOpen(false)
  }
  const {
    unreadCount, connected, settings, user, signOut, isAdmin, loading,
    language, setLanguage, LANGUAGES, t,
    themeName, toggleTheme, showLanding, setShowLanding
  } = useApp()

  const PageComponent = PAGE_MAP[page] || Dashboard

  // Show landing page first
  if (showLanding && !user) {
    return <Home onLogin={() => setShowLanding(false)} />
  }

  // Show loading while checking auth
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 120 }}><Spinner size={48} /></div>
  }

  // Show auth page if not logged in
  if (!user) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="auth"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.4 }}
        >
          <Auth />
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <div className="layout">
      {/* Mobile overlay */}
      <div className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`} onClick={() => setMobileOpen(false)} />
      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-logo">
          <img
            src={logo}
            alt="BCH Logo"
            style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
          />
          {!collapsed && (
            <div className="logo-text">
              <span>{settings.hostel_name?.split('(')[1]?.replace(')', '') || 'BCH'}</span>
              <small>DORM HQ</small>
            </div>
          )}
          <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
            <SvgIcon d={collapsed ? ICONS.chevronRight : ICONS.chevronLeft} size={16} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((n, i) => n.section ? (
            !collapsed && <div key={i} className="nav-group-label">{n.section}</div>
          ) : (
            (!isAdmin && ['rooms', 'residents', 'billing', 'reports', 'settings'].includes(n.id)) ? null : (
              <button key={n.id} className={`nav-btn ${page === n.id ? 'active' : ''}`} onClick={() => navigateTo(n.id)}>
                <div className="nav-icon"><SvgIcon d={ICONS[n.icon]} size={18} /></div>
                {!collapsed && <span className="nav-lbl">{n.label}</span>}
                {!collapsed && n.badge === 'notif' && unreadCount > 0 && <span className="nav-bdg">{unreadCount}</span>}
                {collapsed && (n.badge === 'notif' && unreadCount > 0 || n.badge === 'map') && <div className="nav-dot" />}
              </button>
            )
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button className="nav-btn theme-toggle" onClick={toggleTheme} style={{ marginBottom: 16 }}>
            <div className="nav-icon"><SvgIcon d={themeName === 'midnight' ? ICONS.sun : ICONS.moon} size={16} /></div>
            {!collapsed && <span className="nav-lbl">{themeName === 'midnight' ? 'Light Mode' : 'Dark Mode'}</span>}
          </button>

          <div className="user-row" style={{ padding: collapsed ? '0 10px' : '0 4px' }}>
            <div className="user-ava">{(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}</div>
            {!collapsed && (
              <div className="user-info" style={{ marginRight: 'auto' }}>
                <strong>{user.user_metadata?.full_name || 'User'}</strong>
                <small>{isAdmin ? 'Admin' : 'Student'}</small>
              </div>
            )}
            {!collapsed && (
              <button className="sidebar-toggle" style={{ marginRight: 8 }} onClick={toggleTheme}>
                <span style={{ fontSize: 14 }}>{themeName === 'midnight' ? '🌙' : '☀️'}</span>
              </button>
            )}
            {!collapsed && (
              <button className="sidebar-toggle" onClick={signOut}>
                <SvgIcon d={ICONS.logout} size={14} />
              </button>
            )}
            {collapsed && (
              <button className="sidebar-toggle" style={{ padding: 4, width: 24, height: 24 }} onClick={toggleTheme}>
                <span style={{ fontSize: 12 }}>{themeName === 'midnight' ? '🌙' : '☀️'}</span>
              </button>
            )}
          </div>
          {!collapsed && (
            <div style={{ marginTop: 12, textAlign: 'center', fontSize: 10, color: 'var(--muted)', opacity: 0.6 }}>
              Dev by <strong>TIMON BISWAS</strong>
            </div>
          )}
        </div>
      </aside>

      {/* Main Container */}
      <main className="main" style={{ marginLeft: collapsed ? 56 : 230 }}>
        <header className="topbar">
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
            <SvgIcon d={ICONS.menu} size={20} />
          </button>
          <div className="topbar-title">
            <h1>{t(page) || TITLES[page]}</h1>
            <time>{new Date().toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</time>
          </div>
          <div className="topbar-right">
            {/* Language selector icon simplified */}
            <button className="btn btn-ghost btn-sm" onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}>
              {language.toUpperCase()}
            </button>
            <button className="btn btn-ghost btn-sm" style={{ position: 'relative' }} onClick={() => navigateTo('notifications')}>
              <SvgIcon d={ICONS.bell} size={14} />
              {unreadCount > 0 && <span className="notif-dot">{unreadCount}</span>}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => navigateTo('settings')}>
              <SvgIcon d={ICONS.settings} size={14} />
            </button>
          </div>
        </header>

        <section className="content">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <PageComponent onNav={setPage} />
            </motion.div>
          </AnimatePresence>
        </section>
      </main>
      <StatusBar connected={connected} />
    </div>
  )
}

export default function App() { return <AppProvider><Inner /></AppProvider> }
