import { useState, useEffect } from 'react'
import { roomsApi, residentsApi, feesApi, complaintsApi, assignmentsApi } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { SvgIcon, ICONS, Empty, Spinner } from '../components/ui'
import MapMonitor from '../components/MapMonitor'

export default function Dashboard({ onNav }) {
  const { settings, connected, t } = useApp()
  const [stats, setStats] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const cur = settings.currency_symbol || '৳'

  useEffect(() => {
    if (!connected) { setLoading(false); return }
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
        floors: [1,2,3,4].map(fl => {
          const fr = rooms.filter(x => x.floor === fl)
          const occ = fr.filter(x => x.status === 'occupied').length
          return { fl, total: fr.length, occ, pct: fr.length ? Math.round(occ/fr.length*100) : 0 }
        }),
      })
      setLoading(false)
    })
  }, [connected])

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
      <div className="empty-state"><div className="ei">🏠</div><div className="et">Welcome to DormHQ</div><div className="es">Connect Supabase to get started. All data will be stored in your own database.</div></div>
    </div>
  )

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
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
          { cls:'sc1', ico:ICONS.home,  val:stats.totalRooms,     lbl:t('total_rooms'),       chg:`${stats.available} ${t('available')}`, up:true },
          { cls:'sc2', ico:ICONS.users, val:stats.activeResidents,lbl:t('active_residents'),  chg:`${stats.occupied} rooms occupied`, up:true },
          { cls:'sc3', ico:ICONS.money, val:`${cur}${(stats.collected/1000).toFixed(1)}K`, lbl:t('collected'), chg:`${t('this_month')}`, up:true },
          { cls:'sc4', ico:ICONS.alert, val:stats.overdueCount,   lbl:t('overdue_bills'),     chg:`${stats.openComplaints} complaints open`, up:false },
        ].map(s => (
          <div key={s.lbl} className={`stat-card ${s.cls}`}>
            <div className="stat-ico"><SvgIcon d={s.ico} size={18}/></div>
            <div className="stat-val">{s.val}</div>
            <div className="stat-lbl">{s.lbl}</div>
            <div className={`stat-chg ${s.up?'chg-up':'chg-dn'}`}>{s.chg}</div>
          </div>
        ))}
      </div>

      <div className="g-2 fu fu2">
        {/* Occupancy */}
        <div className="card">
          <div className="card-hdr">
            <div><div className="card-title">Floor Occupancy</div><div className="card-sub">Live room status</div></div>
            <span className="badge badge-yellow">{stats.totalRooms ? Math.round(stats.occupied/stats.totalRooms*100) : 0}% Full</span>
          </div>
          {stats.floors.map(f => (
            <div key={f.fl} style={{ marginBottom: 12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, marginBottom:4 }}>
                <span style={{ color:'var(--muted)' }}>Floor {f.fl}</span>
                <span style={{ fontWeight:700 }}>{f.occ}/{f.total} · {f.pct}%</span>
              </div>
              <div className="prog">
                <div className="prog-fill" style={{ width:`${f.pct}%`, background: f.pct>85?'var(--red)':f.pct>65?'var(--accent)':'var(--green)' }}/>
              </div>
            </div>
          ))}
          {stats.floors.every(f => f.total === 0) && <Empty icon="🏠" title="No rooms yet" sub="Add rooms first" />}
        </div>

        {/* Recent check-in/out */}
        <div className="card">
          <div className="card-hdr">
            <div><div className="card-title">Recent Check-In / Out</div><div className="card-sub">Latest entry logs</div></div>
            <button className="btn btn-ghost btn-sm" onClick={() => onNav('checkinout')}>View all →</button>
          </div>
          {stats.recentLogs.length === 0
            ? <Empty icon="📋" title="No activity yet" sub="Check-ins will appear here" />
            : stats.recentLogs.map(log => (
              <div key={log.id} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(30,45,69,.5)' }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background: log.status==='active'?'var(--green)':'var(--red)', flexShrink:0, marginTop:4 }}/>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:600 }}>{log.residents?.full_name}</div>
                  <div style={{ fontSize:11, color:'var(--muted)' }}>
                    Room {log.rooms?.room_number} · {log.status==='active'?'Checked in':'Checked out'} · {log.in_time?.slice(0,5)}
                  </div>
                </div>
                <div style={{ fontSize:11, color:'var(--muted)', flexShrink:0 }}>
                  {new Date(log.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Pending dues */}
      <div className="card fu fu3" style={{ marginTop:14 }}>
        <div className="card-hdr">
          <div><div className="card-title">Pending Dues</div><div className="card-sub">Outstanding and overdue fees</div></div>
          <button className="btn btn-ghost btn-sm" onClick={() => onNav('billing')}>View all →</button>
        </div>
        {stats.recentFees.length === 0
          ? <Empty icon="💚" title="All dues cleared!" sub="No pending or overdue fees" />
          : <div className="table-wrap">
              <table>
                <thead><tr><th>Resident</th><th>Type</th><th>Due Date</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {stats.recentFees.map(fee => (
                    <tr key={fee.id}>
                      <td style={{ fontWeight:600 }}>{fee.residents?.full_name || '—'}</td>
                      <td style={{ textTransform:'capitalize', color:'var(--muted)' }}>{fee.fee_type?.replace(/_/g,' ')}</td>
                      <td style={{ fontSize:11.5, color:'var(--muted)' }}>{new Date(fee.due_date).toLocaleDateString('en-GB')}</td>
                      <td style={{ fontWeight:700, color: fee.status==='overdue'?'var(--red)':'var(--accent)' }}>
                        {cur}{fee.amount?.toLocaleString()}
                      </td>
                      <td><span className={`badge ${fee.status==='overdue'?'badge-red':'badge-yellow'}`}>{fee.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>

      {/* Map Monitor */}
      <div className="card fu fu4" style={{ marginTop:14 }}>
        <div className="card-hdr"><div className="card-title">Entry Monitoring</div><div className="card-sub">Hostel location + today's in/out log</div></div>
        <MapMonitor logs={logs} />
      </div>
    </div>
  )
}
