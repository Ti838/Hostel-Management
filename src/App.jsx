import { useState } from 'react'
import { AppProvider, useApp } from './context/AppContext'
import { SvgIcon, ICONS, StatusBar } from './components/ui'
import { PremiumLogo } from './components/PremiumLogo'
import Dashboard from './pages/Dashboard'
import Rooms from './pages/Rooms'
import Residents from './pages/Residents'
import CheckInOut from './pages/CheckInOut'
import Billing from './pages/Billing'
import { Meals, Complaints, Notifications, Readmission, Reports, Settings } from './pages/OtherPages'
import './index.css'

const NAV = [
  { section: 'Main' },
  { id:'dashboard',   label:'Dashboard',    icon:'grid' },
  { id:'rooms',       label:'Rooms',        icon:'home' },
  { id:'residents',   label:'Residents',    icon:'users' },
  { id:'checkinout',  label:'Check In/Out', icon:'login', badge:'map' },
  { section: 'Finance' },
  { id:'billing',     label:'Billing',      icon:'card' },
  { section: 'Hostel' },
  { id:'meals',       label:'Meal Planner', icon:'food' },
  { id:'complaints',  label:'Complaints',   icon:'alert' },
  { id:'readmission', label:'Readmission',  icon:'refresh' },
  { section: 'System' },
  { id:'notifications', label:'Notifications', icon:'bell', badge:'notif' },
  { id:'reports',     label:'Reports',      icon:'bar' },
  { id:'settings',    label:'Settings',     icon:'settings' },
]

const TITLES = { dashboard:'Dashboard', rooms:'Room Management', residents:'Residents', checkinout:'Check In / Out', billing:'Billing & Fees', meals:'Meal Planner', complaints:'Complaints', readmission:'Readmission', notifications:'Notifications', reports:'Reports & Analytics', settings:'Settings', auth:'Authentication' }

const PAGE_MAP = { dashboard:Dashboard, rooms:Rooms, residents:Residents, checkinout:CheckInOut, billing:Billing, meals:Meals, complaints:Complaints, readmission:Readmission, notifications:Notifications, reports:Reports, settings:Settings, auth:Auth }

function Inner() {
  const [page, setPage] = useState('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const { unreadCount, notifications, setNotifications, connected, settings, user, signOut, isAdmin, loading, language, setLanguage, LANGUAGES, t } = useApp()

  const PageComponent = PAGE_MAP[page] || Dashboard

  // Show auth page if not logged in
  if (!loading && !user) {
    return <Auth />
  }

  // Show loading while checking auth
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
  }

  const TITLES = {
    dashboard: t('dashboard'),
    rooms: t('rooms'),
    residents: t('residents'),
    checkinout: t('checkinout'),
    billing: t('billing'),
    meals: t('meals'),
    complaints: t('complaints'),
    readmission: t('readmission'),
    notifications: t('notifications'),
    reports: t('reports'),
    settings: t('settings'),
    auth: t('auth')
  }

  // Show auth page if not logged in
  if (!loading && !user) {
    return <Auth />
  }

  // Show loading while checking auth
  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
  }

  function getBadge(item) {
    if (item.badge === 'notif') return unreadCount > 0 ? unreadCount : null
    return null
  }

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-logo">
          {settings.logo_url ? (
            <img src={settings.logo_url} alt="Logo" style={{width:32,height:32,borderRadius:6}}/>
          ) : (
            <PremiumLogo size={32} />
          )}
          {!collapsed && (
            <div className="logo-text">
              <span>{settings.hostel_name || 'DormHQ'}</span>
              <small>Hostel Management</small>
            </div>
          )}
          <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)}>
            <SvgIcon d={collapsed ? ICONS.menu : ICONS.x} size={13}/>
          </button>
        </div>

        {/* Language selector */}
        {!collapsed && (
          <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>
            <select
              value={language}
              onChange={e => setLanguage(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                border: '1px solid var(--border)',
                borderRadius: 6,
                background: 'var(--surface)',
                color: 'var(--text)',
                fontSize: 12
              }}
            >
              {Object.entries(LANGUAGES).map(([code, lang]) => (
                <option key={code} value={code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* User info */}
        {!collapsed && user && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', marginBottom: 8 }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 4 }}>Logged in as</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{user.user_metadata?.full_name || user.email}</div>
            <div style={{ fontSize: 11, color: 'var(--accent)', textTransform: 'uppercase' }}>{isAdmin ? 'Admin' : 'Student'}</div>
          </div>
        )}

        <nav className="sidebar-nav">
          {NAV.filter(item => {
            if (item.section) return true
            if (item.id === 'meals' && settings.enable_meals === false) return false
            if (item.id === 'complaints' && settings.enable_complaints === false) return false
            if (item.id === 'readmission' && settings.enable_readmission === false) return false
            if (item.id === 'notifications' && settings.enable_notifications === false) return false
            if (item.id === 'reports' && settings.enable_reports === false) return false
            return true
          }).map((item, i) => {
            if (item.section) {
              if (collapsed) return null
              return <div key={i} className="nav-group-label">{item.section}</div>
            }
            const badge = getBadge(item)
            return (
              <button
                key={item.id}
                className={`nav-btn ${page === item.id ? 'active' : ''}`}
                onClick={() => setPage(item.id)}
                title={collapsed ? item.label : undefined}
              >
                <span className="nav-icon"><SvgIcon d={ICONS[item.icon]} size={15}/></span>
                {!collapsed && <span className="nav-lbl">{item.label}</span>}
                {!collapsed && badge ? <span className="nav-bdg">{badge}</span> : null}
                {collapsed && badge ? <span className="nav-dot"/> : null}
              </button>
            )
          })}
        </nav>

        {!collapsed && (
          <div className="sidebar-bottom">
            <div className="user-row">
              <div className="user-ava">{(user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase()}</div>
              <div className="user-info">
                <strong>{user?.user_metadata?.full_name || t('user')}</strong>
                <small><StatusBar connected={connected}/></small>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 8 }} onClick={signOut}>
              <SvgIcon d={ICONS.logout} size={14} style={{ marginRight: 6 }} />
              {t('sign_out')}
            </button>
          </div>
        )}
      </aside>

      {/* Main */}
      <main className="main">
        <header className="topbar">
          <div className="topbar-title">
            <h1>{TITLES[page]}</h1>
            <time>{new Date().toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}</time>
          </div>
          <div className="topbar-right">
            <button className="btn btn-ghost btn-sm" style={{ position:'relative' }} onClick={() => setPage('notifications')}>
              <SvgIcon d={ICONS.bell} size={14}/>
              {unreadCount > 0 && <span style={{ position:'absolute', top:-5, right:-5, background:'var(--red)', color:'#fff', borderRadius:'50%', width:16, height:16, fontSize:9, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800 }}>{unreadCount}</span>}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage('settings')}>
              <SvgIcon d={ICONS.settings} size={14}/>
            </button>
          </div>
        </header>

        <div className="page-wrap">
          <div key={page} className="pg">
            <PageComponent
              onNav={setPage}
              notifications={notifications}
              setNotifications={setNotifications}
            />
          </div>
        </div>
      </main>
    </div>
  )
}

export default function App() {
  return <AppProvider><Inner/></AppProvider>
}
