import { useState, useEffect } from 'react'
import { roomsApi, residentsApi, feesApi, complaintsApi, assignmentsApi } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { SvgIcon, ICONS, Empty, Spinner } from '../components/ui'
import MapMonitor from '../components/MapMonitor'
import StudentDashboard from '../components/StudentDashboard'

export default function Dashboard({ onNav }) {
  const { settings, profile, isAdmin, connected, t } = useApp()
  const [stats, setStats] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const cur = settings.currency_symbol || '৳'

  useEffect(() => {
    if (!connected) { setLoading(false); return }
    if (!isAdmin) { setLoading(false); return } // Student data is handled in StudentDashboard

    Promise.all([
      roomsApi.getAll(),
      residentsApi.getAll(),
      feesApi.getAll(),
      complaintsApi.getAll(),
      assignmentsApi.getAll(),
    ]).then(([r, res, f, c, a]) => {
      const rooms = r.data || []
      const residents = res.data || []
      const fees = f.data || []
      const complaints = c.data || []
      const allLogs = a.data || []
      setLogs(allLogs)
      setStats({
        totalRooms: rooms.length,
        occupied: rooms.filter(x => x.status === 'occupied').length,
        available: rooms.filter(x => x.status === 'available').length,
        activeResidents: residents.filter(x => x.status === 'active').length,
        collected: fees.filter(x => x.status === 'paid').reduce((s, x) => s + x.amount, 0),
        pending: fees.filter(x => x.status !== 'paid').reduce((s, x) => s + x.amount, 0),
        overdueCount: fees.filter(x => x.status === 'overdue').length,
        openComplaints: complaints.filter(x => x.status === 'open').length,
        recentFees: fees.filter(x => x.status !== 'paid').slice(0, 5),
        recentLogs: allLogs.slice(0, 6),
        floors: Array.from({ length: settings.total_floors || 4 }, (_, i) => i + 1).map(fl => {
          const fr = rooms.filter(x => x.floor === fl)
          const occ = fr.filter(x => x.status === 'occupied').length
          return { fl, total: fr.length, occ, pct: fr.length ? Math.round(occ / fr.length * 100) : 0 }
        }),
      })
      setLoading(false)
    }).catch(err => {
      console.error('Dashboard logic error:', err)
      setLoading(false)
    })
  }, [connected, isAdmin])

  if (!connected) return (
    <div>
      <div className="conn-banner">
        <span style={{ fontSize: 22 }}>🔌</span>
        <div>
          <div style={{ fontWeight: 700 }}>Not connected to Supabase</div>
          <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 2 }}>Go to <strong>Settings</strong> to configure your Supabase URL and API key, then run the SQL schema.</div>
        </div>
        <button className="btn btn-accent btn-sm" style={{ marginLeft: 'auto' }} onClick={() => onNav('settings')}>Open Settings →</button>
      </div>
      <div className="empty-state"><div className="ei">🏠</div><div className="et">Welcome to {settings.hostel_name || 'DormHQ'}</div><div className="es">Connect Supabase to get started. All data will be stored in your own database.</div></div>
    </div>
  )

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>

  if (!isAdmin) {
    return <StudentDashboard onNav={onNav} />
  }

  if (!stats) return null

  return (
    <div>
      {settings.welcome_message && (
        <div style={{ marginBottom: 20, padding: '16px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text)' }}>
          <strong>{t('welcome')}!</strong> {settings.welcome_message}
        </div>
      )}

      {/* Stats */}
      <div className="g-4 fu fu1" style={{ marginBottom: 16 }}>
        {[
          { cls: 'sc1', ico: ICONS.home, val: stats.totalRooms, lbl: t('total_rooms'), chg: `${stats.available} ${t('available')}`, up: true },
          { cls: 'sc2', ico: ICONS.users, val: stats.activeResidents, lbl: t('active_residents'), chg: `${stats.occupied} rooms occupied`, up: true },
          { cls: 'sc3', ico: ICONS.money, val: `${cur}${(stats.collected / 1000).toFixed(1)}K`, lbl: t('collected'), chg: `${t('this_month')}`, up: true },
          { cls: 'sc4', ico: ICONS.alert, val: stats.overdueCount, lbl: t('overdue_bills'), chg: `${stats.openComplaints} complaints open`, up: false },
        ].map(s => (
          <div key={s.lbl} className={`stat-card ${s.cls}`}>
            <div className="stat-ico"><SvgIcon d={s.ico} size={18} /></div>
            <div className="stat-val">{s.val}</div>
            <div className="stat-lbl">{s.lbl}</div>
            <div className={`stat-chg ${s.up ? 'chg-up' : 'chg-dn'}`}>{s.chg}</div>
          </div>
        ))}
      </div>

      <div className="g-2 fu fu2">
        {/* Occupancy */}
        <div className="card">
          <div className="card-hdr">
            <div><div className="card-title">Floor Occupancy</div><div className="card-sub">Live room status</div></div>
            <span className="badge badge-yellow">{stats.totalRooms ? Math.round(stats.occupied / stats.totalRooms * 100) : 0}% Full</span>
          </div>
          {stats.floors.map(f => (
            <div key={f.fl} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                <span>Floor {f.fl}</span>
                <span style={{ color: 'var(--muted)' }}>{f.occ}/{f.total} rooms occupied</span>
              </div>
              <div className="progress">
                <div className="progress-bar" style={{ width: `${f.pct}%`, background: f.pct > 90 ? 'var(--red)' : f.pct > 50 ? 'var(--accent)' : 'var(--blue)' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Map Monitor - Admin Only Detail */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-hdr" style={{ padding: '16px 18px 0' }}>
            <div className="card-title">Hostel Location</div>
          </div>
          <div style={{ height: 260 }}>
            <MapMonitor />
          </div>
        </div>
      </div>

      <div className="g-2 fu fu2" style={{ marginTop: 16 }}>
        {/* Recent Fees */}
        <div className="card">
          <div className="card-hdr">
            <div className="card-title">Pending Revenue</div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNav('billing')}>Review All →</button>
          </div>
          {stats.recentFees.length > 0 ? (
            <table className="table table-sm">
              <thead><tr><th>Resident</th><th>Due</th><th>Amount</th></tr></thead>
              <tbody>
                {stats.recentFees.map(f => (
                  <tr key={f.id}>
                    <td>{f.residents?.full_name || 'Guest'}</td>
                    <td>{format(new Date(f.due_date), 'MMM d')}</td>
                    <td style={{ fontWeight: 600 }}>{cur}{f.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <Empty icon="💰" title="No pending fees" sub="Everything is paid up!" />}
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-hdr">
            <div className="card-title">Recent Activity</div>
          </div>
          {logs.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {logs.slice(0, 5).map(l => (
                <div key={l.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.status === 'completed' ? 'var(--muted)' : 'var(--accent)', marginTop: 6 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{l.residents?.full_name} — {l.status === 'active' ? 'Check-in' : 'Check-out'}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>Room {l.rooms?.room_number} • {format(new Date(l.created_at), 'MMM d, h:mm a')}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : <Empty icon="📋" title="No recent activity" sub="Check-ins will appear here" />}
        </div>
      </div>
    </div>
  )
}
