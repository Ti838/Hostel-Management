import { useState, useEffect, useCallback } from 'react'
import { roomsApi, residentsApi, feesApi, complaintsApi, assignmentsApi, residentsApi as resApi, authApi, settingsApi } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { SvgIcon, ICONS, Empty, Spinner, Modal, ModalFooter } from '../components/ui'
import { format } from 'date-fns'
import logo from '../assets/logo.png'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

const S_BADGE = { open: 'badge-red', in_progress: 'badge-blue', resolved: 'badge-green', closed: 'badge-muted' }
const P_BADGE = { low: 'badge-muted', medium: 'badge-blue', high: 'badge-yellow', urgent: 'badge-red' }
const CAT_ICON = { maintenance: '🔧', food: '🍽️', noise: '🔊', cleanliness: '🧹', security: '🔒', electrical: '⚡', plumbing: '🚿', other: '📋' }

export function Meals() {
  const { connected } = useApp()
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!connected) { setLoading(false); return }
    const start = format(new Date(), 'yyyy-MM-dd')
    const end = format(new Date(Date.now() + 7 * 86400000), 'yyyy-MM-dd')
    mealsApi.getWeek(start, end).then(res => {
      if (res.data) setMeals(res.data)
      setLoading(false)
    })
  }, [connected])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>

  return (
    <div>
      <div className="shdr">
        <h2>Meal Planner</h2>
        <p>Manage daily breakfast, lunch, and dinner menus</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {meals.length === 0 ? (
          <Empty icon="🍽️" title="No meals planned" sub="Check back later for the weekly menu." />
        ) : (
          meals.map(m => (
            <div key={m.id} className="card" style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{m.meal_type.toUpperCase()}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{format(new Date(m.meal_date), 'EEEE, MMM do')}</div>
              </div>
              <div style={{ fontWeight: 600, color: 'var(--accent)' }}>{m.menu_item}</div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export function Complaints() {
  const { connected, isAdmin, profile } = useApp()
  const [complaints, setComplaints] = useState([])
  const [residents, setResidents] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ resident_id: '', title: '', description: '', category: 'maintenance', priority: 'medium', room_id: '' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!connected) { setLoading(false); return }
    const [c, r, rm] = await Promise.all([complaintsApi.getAll(), resApi.active(), roomsApi.getAll()])
    let data = c.data || []
    if (!isAdmin && profile?.resident_id) {
      data = data.filter(item => item.resident_id === profile.resident_id)
    }
    setComplaints(data); setResidents(r.data || []); setRooms(rm.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [connected])

  const filtered = tab === 'all' ? complaints : complaints.filter(c => c.status === tab)

  async function addComplaint(e) {
    e.preventDefault(); setSaving(true)
    const payload = { ...form, status: 'open' }
    if (!isAdmin && profile?.resident_id) {
      payload.resident_id = profile.resident_id
      const resident = residents.find(r => r.id === profile.resident_id)
      if (resident?.room_assignments?.[0]?.room_id) {
        payload.room_id = resident.room_assignments[0].room_id
      }
    }
    const { error } = await complaintsApi.create(payload)
    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Complaint submitted!')
    setShowAdd(false); setSaving(false); load()
  }

  async function updateStatus(id, status) {
    const updates = { status }
    if (status === 'resolved') updates.resolved_at = new Date().toISOString()
    await complaintsApi.update(id, updates)
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
    toast.success(`Marked as ${status}`)
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div className="shdr" style={{ marginBottom: 0 }}><h2>Complaints</h2><p>Resident issues and maintenance requests</p></div>
        {connected && <button className="btn btn-accent" onClick={() => setShowAdd(true)}><SvgIcon d={ICONS.plus} size={14} /> New Complaint</button>}
      </div>
      <div className="g-4" style={{ marginBottom: 16 }}>
        {[['Open', complaints.filter(c => c.status === 'open').length, 'var(--red)'], ['In Progress', complaints.filter(c => c.status === 'in_progress').length, 'var(--blue)'], ['Resolved', complaints.filter(c => c.status === 'resolved').length, 'var(--green)'], ['Total', complaints.length, 'var(--accent)']].map(([l, v, c]) => (
          <div key={l} className="card" style={{ textAlign: 'center', padding: '14px' }}>
            <div style={{ fontFamily: 'Fraunces,serif', fontSize: 28, color: c }}>{v}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{l}</div>
          </div>
        ))}
      </div>
      <div className="tabs">
        {[['all', 'All'], ['open', 'Open'], ['in_progress', 'In Progress'], ['resolved', 'Resolved'], ['closed', 'Closed']].map(([k, l]) => (
          <button key={k} className={`tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}>{l} <span style={{ opacity: .6, marginLeft: 3 }}>({complaints.filter(c => k === 'all' || c.status === k).length})</span></button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? <Empty icon="📋" title="No complaints" sub="Complaints will appear here" /> : filtered.map(c => (
          <div key={c.id} className="card" style={{ padding: '14px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 16 }}>{CAT_ICON[c.category] || '📋'}</span>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{c.title}</span>
                  <span className={`badge ${P_BADGE[c.priority]}`}>{c.priority}</span>
                  <span className={`badge ${S_BADGE[c.status]}`} style={{ textTransform: 'capitalize' }}>{c.status.replace('_', ' ')}</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 7 }}>{c.description}</div>
                <div style={{ display: 'flex', gap: 14, fontSize: 10.5, color: 'var(--muted)', flexWrap: 'wrap' }}>
                  <span>👤 {c.residents?.full_name || 'Anonymous'}</span>
                  {c.rooms && <span>🚪 Room {c.rooms.room_number}</span>}
                  <span>📅 {new Date(c.created_at).toLocaleDateString('en-GB')}</span>
                  {c.resolved_at && <span style={{ color: 'var(--green)' }}>✓ Resolved {new Date(c.resolved_at).toLocaleDateString('en-GB')}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                {isAdmin && (
                  <>
                    {c.status === 'open' && <button className="btn btn-blue btn-xs" onClick={() => updateStatus(c.id, 'in_progress')}>Assign</button>}
                    {(c.status === 'open' || c.status === 'in_progress') && <button className="btn btn-success btn-xs" onClick={() => updateStatus(c.id, 'resolved')}>Resolve</button>}
                    {c.status === 'resolved' && <button className="btn btn-ghost btn-xs" onClick={() => updateStatus(c.id, 'closed')}>Close</button>}
                  </>
                )}
                {!isAdmin && c.status === 'open' && <button className="btn btn-ghost btn-xs" onClick={() => updateStatus(c.id, 'closed')}>Cancel</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Submit Complaint">
        <form onSubmit={addComplaint}>
          {isAdmin && (
            <div className="form-group"><label className="form-label">Resident</label><select className="form-input" value={form.resident_id} onChange={e => setForm({ ...form, resident_id: e.target.value })}><option value="">Anonymous</option>{residents.map(r => <option key={r.id} value={r.id}>{r.full_name}</option>)}</select></div>
          )}
          <div className="form-group"><label className="form-label">Title *</label><input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="Brief title" /></div>
          <div className="g2">
            <div className="form-group"><label className="form-label">Category</label><select className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{Object.keys(CAT_ICON).map(c => <option key={c} value={c} style={{ textTransform: 'capitalize' }}>{c}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Priority</label><select className="form-input" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>{['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p}</option>)}</select></div>
          </div>
          {isAdmin && (
            <div className="form-group"><label className="form-label">Room</label><select className="form-input" value={form.room_id} onChange={e => setForm({ ...form, room_id: e.target.value })}><option value="">—</option>{rooms.map(r => <option key={r.id} value={r.id}>Room {r.room_number}</option>)}</select></div>
          )}
          <div className="form-group"><label className="form-label">Description *</label><textarea className="form-input" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} required placeholder="Detailed description…" /></div>
          <ModalFooter><button type="button" className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button><button type="submit" className="btn btn-accent" disabled={saving}>{saving ? 'Saving…' : 'Submit'}</button></ModalFooter>
        </form>
      </Modal>
    </div>
  )
}

export function Notifications() {
  const { connected, unreadCount, notifications, loadNotifications } = useApp()

  const markAllRead = async () => {
    await notificationsApi.markAllAsRead()
    loadNotifications()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div className="shdr" style={{ marginBottom: 0 }}><h2>Notifications</h2><p>Updates, alerts, and system messages</p></div>
        {unreadCount > 0 && <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Mark all as read</button>}
      </div>
      {notifications.length === 0 ? <Empty icon="🔔" title="No notifications" sub="New alerts will appear here." /> : (
        <div className="card" style={{ padding: 0 }}>
          {notifications.map(n => (
            <div key={n.id} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 15, background: n.is_read ? 'transparent' : 'rgba(240,165,0,0.03)' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                {n.type === 'payment' ? '💳' : n.type === 'alert' ? '🚨' : 'ℹ️'}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: n.is_read ? 'var(--text)' : 'var(--accent)' }}>{n.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{n.message}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6 }}>{format(new Date(n.created_at), 'PPPp')}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function Readmission() {
  return (
    <div>
      <div className="shdr"><h2>Readmission</h2><p>Manage session renewals and readmission forms</p></div>
      <Empty icon="🔄" title="Readmission session closed" sub="Next readmission cycle starts June 2026." />
    </div>
  )
}

export function Reports() {
  const { connected } = useApp()
  const [data, setData] = useState([])

  useEffect(() => {
    if (!connected) return
    roomsApi.getAll().then(res => {
      const rooms = res.data || []
      const floors = [1, 2, 3, 4].map(fl => {
        const fr = rooms.filter(r => r.floor === fl)
        const occ = fr.filter(r => r.status === 'occupied').length
        return { fl, total: fr.length, occ, rev: occ * 5000, pct: fr.length ? Math.round(occ / fr.length * 100) : 0 }
      })
      setData(floors)
    })
  }, [connected])

  return (
    <div>
      <div className="shdr"><h2>Reports & Analytics</h2><p>Overview of hostel performance and occupancy</p></div>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap"><table>
          <thead><tr><th>Floor</th><th>Occupancy Rate</th><th>Status</th><th>Monthly Revenue</th><th>Rating</th></tr></thead>
          <tbody>{data.map(f => (
            <tr key={f.fl}>
              <td>Floor {f.fl}</td>
              <td style={{ width: '30%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="progress" style={{ flex: 1 }}><div className="progress-bar" style={{ width: `${f.pct}%` }} /></div>
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{f.pct}%</span>
                </div>
              </td>
              <td><span className={`badge ${f.pct > 80 ? 'badge-green' : f.pct > 50 ? 'badge-yellow' : 'badge-red'}`}>{f.occ}/{f.total} Rooms</span></td>
              <td style={{ color: 'var(--accent)', fontWeight: 700 }}>৳{f.rev.toLocaleString()}</td>
              <td><span className={`badge ${f.pct > 80 ? 'badge-green' : 'badge-yellow'}`}>{f.pct > 80 ? 'Excellent' : 'Good'}</span></td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>
    </div>
  )
}

export function Settings() {
  const { settings, setSettings, connected } = useApp()
  const [loading, setLoading] = useState(false)

  async function save(e) {
    e.preventDefault(); setLoading(true)
    const { error } = await settingsApi.update(settings)
    if (error) toast.error(error.message); else toast.success('Settings saved!')
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="shdr"><h2>Settings</h2><p>Configure hostel details and system preferences</p></div>
      <div className="card">
        <form onSubmit={save}>
          <div className="form-group"><label className="form-label">Hostel Name</label><input className="form-input" value={settings.hostel_name} onChange={e => setSettings({ ...settings, hostel_name: e.target.value })} /></div>
          <div className="g2">
            <div className="form-group"><label className="form-label">Currency Symbol</label><input className="form-input" value={settings.currency_symbol} onChange={e => setSettings({ ...settings, currency_symbol: e.target.value })} /></div>
            <div className="form-group"><label className="form-label">Base Monthly Rent</label><input className="form-input" type="number" value={settings.base_monthly_rent} onChange={e => setSettings({ ...settings, base_monthly_rent: e.target.value })} /></div>
          </div>
          <div className="form-group"><label className="form-label">Welcome Message</label><textarea className="form-input" rows={2} value={settings.welcome_message} onChange={e => setSettings({ ...settings, welcome_message: e.target.value })} /></div>
          <ModalFooter style={{ padding: 0, marginTop: 24 }}><button type="submit" className="btn btn-accent" disabled={loading}>{loading ? 'Saving…' : 'Save Changes'}</button></ModalFooter>
        </form>
      </div>
    </div>
  )
}

export function Auth() {
  const { signIn, signUp, loading: appLoading, t } = useApp()
  const [submitting, setSubmitting] = useState(false)
  const [mode, setMode] = useState('login') // 'login' or 'signup'

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    const { email, password, fullName } = e.target.elements
    try {
      if (mode === 'login') {
        const { error } = await signIn(email.value, password.value)
        if (error) throw error
        toast.success('Welcome back!')
      } else {
        const { error } = await signUp(email.value, password.value, fullName.value)
        if (error) throw error
        toast.success('Account created! Please check your email.')
        setMode('login')
      }
    } catch (error) {
      toast.error(error.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (appLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size={40} /></div>

  return (
    <div className="auth-page" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at top right, var(--surface) 0%, var(--bg) 100%)',
      padding: 20
    }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="card auth-card glass"
          style={{ width: '100%', maxWidth: 420, padding: '40px 32px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <img
              src={logo}
              alt="BCH Logo"
              style={{ width: 80, height: 80, margin: '0 auto 16px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--surface)' }}
            />
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: 24 }}>{mode === 'login' ? 'Welcome Back' : 'Join BCH'}</h1>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{mode === 'login' ? 'Sign in to manage your stay' : 'Create an account to get started'}</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input className="form-input" name="fullName" required placeholder="Timon Biswas" style={{ background: 'var(--bg)' }} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" name="email" required placeholder="email@example.com" style={{ background: 'var(--bg)' }} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" name="password" required placeholder="••••••••" style={{ background: 'var(--bg)' }} />
            </div>

            <button className="btn btn-accent btn-lg" type="submit" disabled={submitting} style={{ marginTop: 8, height: 48, width: '100%' }}>
              {submitting ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 32, fontSize: 13, color: 'var(--muted)' }}>
            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
            <button
              className="link"
              type="button"
              style={{ marginLeft: 6, fontWeight: 700, color: 'var(--accent)' }}
              onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            >
              {mode === 'login' ? 'Sign Up' : 'Log In'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
