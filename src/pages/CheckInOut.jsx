import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { residentsApi, roomsApi, assignmentsApi } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { SvgIcon, ICONS, Empty, Spinner, Modal, ModalFooter } from '../components/ui'
import MapMonitor from '../components/MapMonitor'

function getGPS() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()   => resolve(null),
      { timeout: 8000 }
    )
  })
}

export default function CheckInOut() {
  const { settings, connected } = useApp()
  const cur = settings.currency_symbol || '৳'

  const [residents, setResidents] = useState([])
  const [rooms, setRooms] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('in')
  const [gpsLoading, setGpsLoading] = useState(false)

  // Check-in form
  const [ciForm, setCiForm] = useState({
    resident_id: '', room_id: '',
    check_in_date: new Date().toISOString().split('T')[0],
    in_time: new Date().toTimeString().slice(0,5),
    expected_checkout: '', notes: ''
  })

  // Check-out form
  const [coAssignId, setCoAssignId] = useState('')
  const [coTime, setCoTime] = useState(new Date().toTimeString().slice(0,5))
  const [coDate, setCoDate] = useState(new Date().toISOString().split('T')[0])
  const [coNotes, setCoNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!connected) { setLoading(false); return }
    const [r, rm, a] = await Promise.all([residentsApi.active(), roomsApi.available(), assignmentsApi.getAll()])
    setResidents(r.data || [])
    setRooms(rm.data || [])
    setLogs(a.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [connected])

  const activeAssignments = logs.filter(l => l.status === 'active')
  const selectedAssignment = activeAssignments.find(a => a.id === coAssignId)

  // Calculate outstanding balance for checkout
  const calcOutstanding = (assignment) => {
    if (!assignment) return 0
    const rent = assignment.rooms?.monthly_rent || 0
    const checkIn = new Date(assignment.check_in_date)
    const months = Math.max(1, Math.ceil((new Date() - checkIn) / (30 * 86400000)))
    return rent * months
  }

  async function handleCheckIn(e) {
    e.preventDefault()
    if (!ciForm.resident_id || !ciForm.room_id) { toast.error('Select resident and room'); return }
    setSaving(true)
    setGpsLoading(true)
    const gps = await getGPS()
    setGpsLoading(false)

    const payload = {
      resident_id: ciForm.resident_id,
      room_id: ciForm.room_id,
      check_in_date: ciForm.check_in_date,
      in_time: ciForm.in_time,
      expected_checkout: ciForm.expected_checkout || null,
      notes: ciForm.notes || null,
      status: 'active',
      in_lat: gps?.lat || null,
      in_lng: gps?.lng || null,
    }

    const { error: ae } = await assignmentsApi.create(payload)
    if (ae) { toast.error(ae.message); setSaving(false); return }

    // Update room status to occupied
    await roomsApi.update(ciForm.room_id, { status: 'occupied' })
    // Update resident status
    await residentsApi.update(ciForm.resident_id, { status: 'active' })

    toast.success(`✓ Checked in${gps ? ' · Location captured' : ' · GPS not available'}`)
    setCiForm({ resident_id:'', room_id:'', check_in_date:new Date().toISOString().split('T')[0], in_time:new Date().toTimeString().slice(0,5), expected_checkout:'', notes:'' })
    setSaving(false)
    load()
  }

  async function handleCheckOut() {
    if (!coAssignId) { toast.error('Select an active resident'); return }
    setSaving(true)
    setGpsLoading(true)
    const gps = await getGPS()
    setGpsLoading(false)

    const { error } = await assignmentsApi.checkout(coAssignId, {
      out_time: coTime,
      out_lat: gps?.lat || null,
      out_lng: gps?.lng || null,
      notes: coNotes || null,
    })
    if (error) { toast.error(error.message); setSaving(false); return }

    // Free up room
    if (selectedAssignment?.room_id) {
      await roomsApi.update(selectedAssignment.room_id, { status: 'available' })
    }
    // Update resident status
    if (selectedAssignment?.residents?.id) {
      await residentsApi.update(selectedAssignment.residents.id, { status: 'checked_out' })
    }

    toast.success(`✓ Checked out${gps ? ' · Location captured' : ''}`)
    setCoAssignId('')
    setCoNotes('')
    setSaving(false)
    load()
  }

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:60 }}><Spinner size={32}/></div>

  return (
    <div>
      <div className="shdr"><h2>Check In / Out</h2><p>Log resident arrivals and departures with GPS timestamps</p></div>

      <div className="tabs">
        <button className={`tab ${tab==='in'?'on':''}`}  onClick={()=>setTab('in')}>✓ Check In</button>
        <button className={`tab ${tab==='out'?'on':''}`} onClick={()=>setTab('out')}>⇤ Check Out</button>
        <button className={`tab ${tab==='log'?'on':''}`} onClick={()=>setTab('log')}>📋 Log ({logs.length})</button>
        <button className={`tab ${tab==='map'?'on':''}`} onClick={()=>setTab('map')}>📍 Map Monitor</button>
      </div>

      {tab === 'in' && (
        <div className="g-2">
          <div className="card">
            <div style={{ fontWeight:700, color:'var(--green)', marginBottom:14 }}>New Check-In</div>
            {!connected
              ? <div style={{color:'var(--muted)',fontSize:13}}>Connect Supabase first.</div>
              : <form onSubmit={handleCheckIn}>
                  <div className="form-group">
                    <label className="form-label">Select Resident *</label>
                    <select className="form-input" value={ciForm.resident_id} onChange={e=>setCiForm({...ciForm,resident_id:e.target.value})} required>
                      <option value="">— Choose resident —</option>
                      {residents.map(r=><option key={r.id} value={r.id}>{r.full_name} · {r.phone}</option>)}
                    </select>
                    {residents.length === 0 && <div style={{fontSize:11,color:'var(--accent)',marginTop:4}}>No active residents found. Add residents first.</div>}
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assign Room *</label>
                    <select className="form-input" value={ciForm.room_id} onChange={e=>setCiForm({...ciForm,room_id:e.target.value})} required>
                      <option value="">— Choose available room —</option>
                      {rooms.map(r=><option key={r.id} value={r.id}>Room {r.room_number} — {r.type} (Floor {r.floor}) · {settings.currency_symbol}{r.monthly_rent?.toLocaleString()}/mo</option>)}
                    </select>
                    {rooms.length === 0 && <div style={{fontSize:11,color:'var(--accent)',marginTop:4}}>No available rooms. Update room statuses.</div>}
                  </div>
                  <div className="g2">
                    <div className="form-group"><label className="form-label">Check-In Date</label><input className="form-input" type="date" value={ciForm.check_in_date} onChange={e=>setCiForm({...ciForm,check_in_date:e.target.value})}/></div>
                    <div className="form-group"><label className="form-label">Check-In Time</label><input className="form-input" type="time" value={ciForm.in_time} onChange={e=>setCiForm({...ciForm,in_time:e.target.value})}/></div>
                  </div>
                  <div className="form-group"><label className="form-label">Expected Checkout Date</label><input className="form-input" type="date" value={ciForm.expected_checkout} onChange={e=>setCiForm({...ciForm,expected_checkout:e.target.value})}/></div>
                  <div className="form-group"><label className="form-label">Notes</label><input className="form-input" value={ciForm.notes} onChange={e=>setCiForm({...ciForm,notes:e.target.value})} placeholder="Any notes…"/></div>
                  <div style={{fontSize:11,color:'var(--muted)',marginBottom:10,display:'flex',gap:6,alignItems:'center'}}>
                    <SvgIcon d={ICONS.pin} size={11}/>
                    {gpsLoading ? 'Capturing GPS location…' : 'GPS location will be captured automatically on submit'}
                  </div>
                  <button type="submit" className="btn btn-success" style={{width:'100%',justifyContent:'center'}} disabled={saving||gpsLoading}>
                    {saving ? 'Saving…' : '✓ Confirm Check In'}
                  </button>
                </form>
            }
          </div>
          <div className="card">
            <div style={{ fontWeight:700, color:'var(--green)', marginBottom:12 }}>Currently Inside</div>
            {activeAssignments.length === 0
              ? <Empty icon="🏨" title="No one checked in" sub="Active check-ins appear here"/>
              : activeAssignments.map(a => (
                <div key={a.id} style={{display:'flex',gap:10,padding:'9px 0',borderBottom:'1px solid rgba(30,45,69,.5)',alignItems:'center'}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:'var(--green)',flexShrink:0}}/>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:600}}>{a.residents?.full_name}</div>
                    <div style={{fontSize:11,color:'var(--muted)'}}>Room {a.rooms?.room_number} · In: {a.in_time?.slice(0,5)} · {new Date(a.check_in_date).toLocaleDateString('en-GB')}</div>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {tab === 'out' && (
        <div className="g-2">
          <div className="card">
            <div style={{ fontWeight:700, color:'var(--red)', marginBottom:14 }}>Process Check-Out</div>
            <div className="form-group">
              <label className="form-label">Active Resident</label>
              <select className="form-input" value={coAssignId} onChange={e=>setCoAssignId(e.target.value)}>
                <option value="">— Select resident to check out —</option>
                {activeAssignments.map(a=><option key={a.id} value={a.id}>{a.residents?.full_name} — Room {a.rooms?.room_number}</option>)}
              </select>
              {activeAssignments.length === 0 && <div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>No active check-ins.</div>}
            </div>
            <div className="g2">
              <div className="form-group"><label className="form-label">Check-Out Date</label><input className="form-input" type="date" value={coDate} onChange={e=>setCoDate(e.target.value)}/></div>
              <div className="form-group"><label className="form-label">Check-Out Time</label><input className="form-input" type="time" value={coTime} onChange={e=>setCoTime(e.target.value)}/></div>
            </div>
            <div className="form-group"><label className="form-label">Remarks / Room Condition</label><textarea className="form-input" rows={2} value={coNotes} onChange={e=>setCoNotes(e.target.value)} placeholder="Room condition notes, damage, etc."/></div>
            <div style={{fontSize:11,color:'var(--muted)',marginBottom:10,display:'flex',gap:6,alignItems:'center'}}>
              <SvgIcon d={ICONS.pin} size={11}/>
              GPS location will be captured at checkout
            </div>
            <button className="btn btn-danger" style={{width:'100%',justifyContent:'center'}} onClick={handleCheckOut} disabled={saving||!coAssignId}>
              {saving ? 'Processing…' : '⇤ Confirm Check-Out'}
            </button>
          </div>

          {selectedAssignment && (
            <div className="card">
              <div style={{fontWeight:700,marginBottom:12}}>Bill Summary</div>
              <div style={{background:'var(--surface2)',borderRadius:9,padding:14}}>
                <div style={{fontWeight:700,marginBottom:12}}>{selectedAssignment.residents?.full_name}</div>
                {[
                  ['Room', `${selectedAssignment.rooms?.room_number} — ${selectedAssignment.rooms?.type}`],
                  ['Check-In', new Date(selectedAssignment.check_in_date).toLocaleDateString('en-GB')],
                  ['Monthly Rent', `${cur}${(selectedAssignment.rooms?.monthly_rent||0).toLocaleString()}`],
                  ['Duration', `${Math.max(1,Math.ceil((new Date()-new Date(selectedAssignment.check_in_date))/(30*86400000)))} month(s)`],
                ].map(([l,v])=>(
                  <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:'1px solid rgba(30,45,69,.4)',fontSize:13}}>
                    <span style={{color:'var(--muted)'}}>{l}</span><span style={{fontWeight:600}}>{v}</span>
                  </div>
                ))}
                <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0 0',fontSize:15,fontWeight:700}}>
                  <span>Est. Outstanding</span>
                  <span style={{color:'var(--accent)'}}>{cur}{calcOutstanding(selectedAssignment).toLocaleString()}</span>
                </div>
                <div style={{fontSize:11,color:'var(--muted)',marginTop:4}}>Check Billing for accurate dues after payments.</div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'log' && (
        <div className="card">
          <div className="card-hdr"><div className="card-title">Full Check-In/Out History</div></div>
          {logs.length === 0
            ? <Empty icon="📋" title="No logs yet" sub="Check-ins and checkouts will appear here"/>
            : <div className="table-wrap">
                <table>
                  <thead><tr><th>Resident</th><th>Room</th><th>Floor</th><th>Check-In Date</th><th>In Time</th><th>Out Time</th><th>In GPS</th><th>Out GPS</th><th>Status</th></tr></thead>
                  <tbody>
                    {logs.map(l=>(
                      <tr key={l.id}>
                        <td style={{fontWeight:600}}>{l.residents?.full_name}</td>
                        <td>{l.rooms?.room_number}</td>
                        <td style={{color:'var(--muted)'}}>F{l.rooms?.floor}</td>
                        <td style={{fontSize:11.5}}>{new Date(l.check_in_date).toLocaleDateString('en-GB')}</td>
                        <td style={{color:'var(--green)',fontWeight:700}}>{l.in_time?.slice(0,5)||'—'}</td>
                        <td style={{color:l.out_time?'var(--red)':'var(--muted)'}}>{l.out_time?.slice(0,5)||'—'}</td>
                        <td style={{fontSize:10.5,color:'var(--muted)'}}>{l.in_lat?`${parseFloat(l.in_lat).toFixed(4)},${parseFloat(l.in_lng).toFixed(4)}`:'—'}</td>
                        <td style={{fontSize:10.5,color:'var(--muted)'}}>{l.out_lat?`${parseFloat(l.out_lat).toFixed(4)},${parseFloat(l.out_lng).toFixed(4)}`:'—'}</td>
                        <td><span className={`badge ${l.status==='active'?'badge-green':'badge-muted'}`}>{l.status==='active'?'Inside':'Out'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
          }
        </div>
      )}

      {tab === 'map' && (
        <div className="card">
          <MapMonitor logs={logs}/>
        </div>
      )}
    </div>
  )
}
