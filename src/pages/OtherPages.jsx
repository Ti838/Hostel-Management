// ── MEALS PAGE ───────────────────────────────────────────
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { mealsApi } from '../lib/supabase'
import { useApp, THEMES } from '../context/AppContext'
import { SvgIcon, ICONS, Empty, Spinner, Modal, ModalFooter } from '../components/ui'
import { format, addDays, startOfWeek } from 'date-fns'

const MEAL_CFG = {
  breakfast: { icon:'☀️', color:'var(--accent)',  border:'rgba(240,165,0,.3)',  bg:'rgba(240,165,0,.05)' },
  lunch:     { icon:'🌤️', color:'var(--blue)',    border:'rgba(59,130,246,.3)', bg:'rgba(59,130,246,.05)' },
  dinner:    { icon:'🌙', color:'var(--purple)', border:'rgba(167,139,250,.3)',bg:'rgba(167,139,250,.05)' },
}

export function Meals() {
  const { connected } = useApp()
  const [meals, setMeals] = useState([])
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(),{weekStartsOn:0}))
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState(null)
  const [menuInput, setMenuInput] = useState('')
  const [isSpecial, setIsSpecial] = useState(false)
  const [saving, setSaving] = useState(false)

  const days = Array.from({length:7},(_,i)=>addDays(weekStart,i))
  const weekEnd = addDays(weekStart,6)

  const load = async () => {
    if (!connected) { setLoading(false); return }
    const { data } = await mealsApi.getWeek(format(weekStart,'yyyy-MM-dd'), format(weekEnd,'yyyy-MM-dd'))
    setMeals(data||[])
    setLoading(false)
  }
  useEffect(()=>{load()},[connected,weekStart.toISOString()])

  const getMeal = (date, type) => meals.find(m=>m.meal_date===format(date,'yyyy-MM-dd')&&m.meal_type===type)

  async function saveMeal() {
    const items = menuInput.split(',').map(s=>s.trim()).filter(Boolean)
    if (!items.length) { toast.error('Enter at least one item'); return }
    setSaving(true)
    const { error } = await mealsApi.upsert([{ meal_date:format(editTarget.date,'yyyy-MM-dd'), meal_type:editTarget.type, menu_items:items, is_special:isSpecial }])
    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Meal saved!')
    setEditTarget(null); setSaving(false); load()
  }

  async function removeMeal(date, type) {
    const meal = getMeal(date, type)
    if (!meal) return
    await mealsApi.delete(meal.id)
    setMeals(prev=>prev.filter(m=>m.id!==meal.id))
    toast.success('Meal removed')
  }

  const isToday = d => format(d,'yyyy-MM-dd')===format(new Date(),'yyyy-MM-dd')

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:60}}><Spinner size={32}/></div>

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
        <div className="shdr" style={{marginBottom:0}}><h2>Meal Planner</h2><p>Weekly breakfast, lunch & dinner schedule</p></div>
        <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button className="btn btn-ghost btn-sm" onClick={()=>setWeekStart(d=>addDays(d,-7))}>← Prev</button>
          <span style={{fontSize:12,color:'var(--muted)',minWidth:150,textAlign:'center'}}>{format(weekStart,'MMM d')} – {format(weekEnd,'MMM d, yyyy')}</span>
          <button className="btn btn-ghost btn-sm" onClick={()=>setWeekStart(d=>addDays(d,7))}>Next →</button>
          <button className="btn btn-accent btn-sm" onClick={()=>setWeekStart(startOfWeek(new Date(),{weekStartsOn:0}))}>Today</button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:9}}>
        {days.map(day=>(
          <div key={day.toISOString()} className={`meal-day${isToday(day)?' today':''}`}>
            <div className="meal-day-hdr">
              <div style={{fontSize:9,fontWeight:700,color:'var(--muted)',textTransform:'uppercase',letterSpacing:'.8px'}}>{format(day,'EEE')}</div>
              <div style={{fontFamily:'Fraunces,serif',fontSize:16,color:isToday(day)?'var(--accent)':'var(--text)'}}>{format(day,'d')}</div>
              {isToday(day)&&<div style={{fontSize:8,color:'var(--accent)',fontWeight:700}}>TODAY</div>}
            </div>
            {['breakfast','lunch','dinner'].map(type=>{
              const meal = getMeal(day,type)
              const cfg = MEAL_CFG[type]
              return (
                <div key={type} className="meal-slot" style={{background:meal?cfg.bg:undefined}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4,alignItems:'center'}}>
                    <div className="meal-slot-type" style={{color:cfg.color}}>{cfg.icon} {type}</div>
                    <div style={{display:'flex',gap:3}}>
                      <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:11,padding:'1px 3px'}} onClick={()=>{setEditTarget({date:day,type});setMenuInput(meal?.menu_items?.join(', ')||'');setIsSpecial(meal?.is_special||false)}}>{meal?'✎':'+'}</button>
                      {meal&&<button style={{background:'none',border:'none',cursor:'pointer',color:'var(--red)',fontSize:11,padding:'1px 3px'}} onClick={()=>removeMeal(day,type)}>✕</button>}
                    </div>
                  </div>
                  {meal ? (
                    <div>
                      <div className="meal-chips">{meal.menu_items.map((item,i)=><span key={i} className="chip" style={{borderColor:cfg.border}}>{item}</span>)}</div>
                      {meal.is_special&&<div style={{fontSize:8,color:'var(--accent)',marginTop:4,fontWeight:700}}>★ SPECIAL</div>}
                    </div>
                  ) : <div style={{fontSize:10,color:'var(--muted)',fontStyle:'italic'}}>Not set</div>}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      <Modal open={!!editTarget} onClose={()=>setEditTarget(null)} title={editTarget?`${MEAL_CFG[editTarget.type]?.icon} ${editTarget.type} — ${format(editTarget.date,'EEE, MMM d')}`:'Edit Meal'} width={420}>
        <div className="form-group">
          <label className="form-label">Menu Items (comma-separated)</label>
          <input className="form-input" value={menuInput} onChange={e=>setMenuInput(e.target.value)} placeholder="e.g. Rice, Dal, Chicken Curry, Salad"/>
        </div>
        {menuInput && <div style={{display:'flex',flexWrap:'wrap',gap:4,marginBottom:12}}>{menuInput.split(',').map(s=>s.trim()).filter(Boolean).map((item,i)=><span key={i} className="chip">{item}</span>)}</div>}
        <div style={{display:'flex',alignItems:'center',gap:9,marginBottom:4}}>
          <input type="checkbox" id="sp" checked={isSpecial} onChange={e=>setIsSpecial(e.target.checked)} style={{accentColor:'var(--accent)',width:15,height:15}}/>
          <label htmlFor="sp" style={{fontSize:13,cursor:'pointer'}}>Mark as Special Meal ★</label>
        </div>
        <ModalFooter>
          <button className="btn btn-ghost" onClick={()=>setEditTarget(null)}>Cancel</button>
          <button className="btn btn-accent" onClick={saveMeal} disabled={saving}>{saving?'Saving…':'Save'}</button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

// ── COMPLAINTS PAGE ──────────────────────────────────────
import { complaintsApi, residentsApi as resApi, roomsApi } from '../lib/supabase'

const P_BADGE = { low:'badge-green', medium:'badge-yellow', high:'badge-red', urgent:'badge-red' }
const S_BADGE = { open:'badge-yellow', in_progress:'badge-blue', resolved:'badge-green', closed:'badge-muted' }
const CAT_ICON = { maintenance:'🔧', food:'🍽️', noise:'🔊', cleanliness:'🧹', security:'🔒', electrical:'⚡', plumbing:'🚿', other:'📋' }

export function Complaints() {
  const { connected } = useApp()
  const [complaints, setComplaints] = useState([])
  const [residents, setResidents] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ resident_id:'', title:'', description:'', category:'maintenance', priority:'medium', room_id:'' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!connected) { setLoading(false); return }
    const [c,r,rm] = await Promise.all([complaintsApi.getAll(), resApi.active(), roomsApi.getAll()])
    setComplaints(c.data||[]); setResidents(r.data||[]); setRooms(rm.data||[])
    setLoading(false)
  }
  useEffect(()=>{load()},[connected])

  const filtered = tab==='all'?complaints:complaints.filter(c=>c.status===tab)

  async function addComplaint(e) {
    e.preventDefault(); setSaving(true)
    const { data, error } = await complaintsApi.create({ ...form, status:'open' })
    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Complaint submitted!')
    setShowAdd(false); setSaving(false); load()
  }

  async function updateStatus(id, status) {
    const updates = { status }
    if (status==='resolved') updates.resolved_at = new Date().toISOString()
    await complaintsApi.update(id, updates)
    setComplaints(prev=>prev.map(c=>c.id===id?{...c,...updates}:c))
    toast.success(`Marked as ${status}`)
  }

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:60}}><Spinner size={32}/></div>

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
        <div className="shdr" style={{marginBottom:0}}><h2>Complaints</h2><p>Resident issues and maintenance requests</p></div>
        {connected && <button className="btn btn-accent" onClick={()=>setShowAdd(true)}><SvgIcon d={ICONS.plus} size={14}/> New Complaint</button>}
      </div>
      <div className="g-4" style={{marginBottom:16}}>
        {[['Open',complaints.filter(c=>c.status==='open').length,'var(--red)'],['In Progress',complaints.filter(c=>c.status==='in_progress').length,'var(--blue)'],['Resolved',complaints.filter(c=>c.status==='resolved').length,'var(--green)'],['Total',complaints.length,'var(--accent)']].map(([l,v,c])=>(
          <div key={l} className="card" style={{textAlign:'center',padding:'14px'}}>
            <div style={{fontFamily:'Fraunces,serif',fontSize:28,color:c}}>{v}</div>
            <div style={{fontSize:11,color:'var(--muted)',marginTop:3}}>{l}</div>
          </div>
        ))}
      </div>
      <div className="tabs">
        {[['all','All'],['open','Open'],['in_progress','In Progress'],['resolved','Resolved'],['closed','Closed']].map(([k,l])=>(
          <button key={k} className={`tab ${tab===k?'on':''}`} onClick={()=>setTab(k)}>{l} <span style={{opacity:.6,marginLeft:3}}>({complaints.filter(c=>k==='all'||c.status===k).length})</span></button>
        ))}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {filtered.length===0 ? <Empty icon="📋" title="No complaints" sub="Complaints will appear here"/> : filtered.map(c=>(
          <div key={c.id} className="card" style={{padding:'14px 18px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5,flexWrap:'wrap'}}>
                  <span style={{fontSize:16}}>{CAT_ICON[c.category]||'📋'}</span>
                  <span style={{fontWeight:700,fontSize:13}}>{c.title}</span>
                  <span className={`badge ${P_BADGE[c.priority]}`}>{c.priority}</span>
                  <span className={`badge ${S_BADGE[c.status]}`} style={{textTransform:'capitalize'}}>{c.status.replace('_',' ')}</span>
                </div>
                <div style={{fontSize:12,color:'var(--muted)',marginBottom:7}}>{c.description}</div>
                <div style={{display:'flex',gap:14,fontSize:10.5,color:'var(--muted)',flexWrap:'wrap'}}>
                  <span>👤 {c.residents?.full_name||'Anonymous'}</span>
                  {c.rooms&&<span>🚪 Room {c.rooms.room_number}</span>}
                  <span>📅 {new Date(c.created_at).toLocaleDateString('en-GB')}</span>
                  {c.resolved_at&&<span style={{color:'var(--green)'}}>✓ Resolved {new Date(c.resolved_at).toLocaleDateString('en-GB')}</span>}
                </div>
              </div>
              <div style={{display:'flex',gap:7,flexShrink:0}}>
                {c.status==='open'&&<button className="btn btn-blue btn-xs" onClick={()=>updateStatus(c.id,'in_progress')}>Assign</button>}
                {(c.status==='open'||c.status==='in_progress')&&<button className="btn btn-success btn-xs" onClick={()=>updateStatus(c.id,'resolved')}>Resolve</button>}
                {c.status==='resolved'&&<button className="btn btn-ghost btn-xs" onClick={()=>updateStatus(c.id,'closed')}>Close</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Submit Complaint">
        <form onSubmit={addComplaint}>
          <div className="form-group"><label className="form-label">Resident</label><select className="form-input" value={form.resident_id} onChange={e=>setForm({...form,resident_id:e.target.value})}><option value="">Anonymous</option>{residents.map(r=><option key={r.id} value={r.id}>{r.full_name}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Title *</label><input className="form-input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required placeholder="Brief title"/></div>
          <div className="g2">
            <div className="form-group"><label className="form-label">Category</label><select className="form-input" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{Object.keys(CAT_ICON).map(c=><option key={c} value={c} style={{textTransform:'capitalize'}}>{c}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Priority</label><select className="form-input" value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}>{['low','medium','high','urgent'].map(p=><option key={p} value={p} style={{textTransform:'capitalize'}}>{p}</option>)}</select></div>
          </div>
          <div className="form-group"><label className="form-label">Room</label><select className="form-input" value={form.room_id} onChange={e=>setForm({...form,room_id:e.target.value})}><option value="">—</option>{rooms.map(r=><option key={r.id} value={r.id}>Room {r.room_number}</option>)}</select></div>
          <div className="form-group"><label className="form-label">Description *</label><textarea className="form-input" rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} required placeholder="Detailed description…"/></div>
          <ModalFooter><button type="button" className="btn btn-ghost" onClick={()=>setShowAdd(false)}>Cancel</button><button type="submit" className="btn btn-accent" disabled={saving}>{saving?'Saving…':'Submit'}</button></ModalFooter>
        </form>
      </Modal>
    </div>
  )
}

// ── NOTIFICATIONS PAGE ────────────────────────────────────
import { notificationsApi } from '../lib/supabase'
import { formatDistanceToNow } from 'date-fns'

const N_CFG = {
  info:    { icon:'ℹ️', bg:'rgba(59,130,246,.12)',  color:'var(--blue)' },
  warning: { icon:'⚠️', bg:'rgba(240,165,0,.12)',   color:'var(--accent)' },
  alert:   { icon:'🚨', bg:'rgba(239,68,68,.12)',   color:'var(--red)' },
  success: { icon:'✅', bg:'rgba(34,197,94,.12)',   color:'var(--green)' },
  payment: { icon:'💳', bg:'rgba(167,139,250,.12)', color:'var(--purple)' },
}

export function Notifications({ notifications: notifs, setNotifications }) {
  const { connected } = useApp()
  const [tab, setTab] = useState('all')
  const [showSend, setShowSend] = useState(false)
  const [form, setForm] = useState({ title:'', body:'', type:'info', target:'all' })
  const [saving, setSaving] = useState(false)

  const filtered = tab==='all'?notifs : tab==='unread'?notifs.filter(n=>!n.is_read):notifs.filter(n=>n.type===tab)
  const unread = notifs.filter(n=>!n.is_read).length

  async function markRead(id) {
    if (!connected) return
    await notificationsApi.markRead(id)
    setNotifications(prev=>prev.map(n=>n.id===id?{...n,is_read:true}:n))
  }
  async function markAll() {
    if (!connected) return
    await notificationsApi.markAllRead()
    setNotifications(prev=>prev.map(n=>({...n,is_read:true})))
    toast.success('All marked as read')
  }
  async function del(id) {
    if (!connected) return
    await notificationsApi.delete(id)
    setNotifications(prev=>prev.filter(n=>n.id!==id))
  }
  async function send(e) {
    e.preventDefault(); setSaving(true)
    const { data, error } = await notificationsApi.create(form)
    if (error) { toast.error(error.message); setSaving(false); return }
    setNotifications(prev=>[data,...prev])
    toast.success('Notification sent!')
    setShowSend(false); setSaving(false)
    setForm({ title:'', body:'', type:'info', target:'all' })
  }

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
        <div className="shdr" style={{marginBottom:0}}><h2>Notifications</h2><p>{unread} unread · {notifs.length} total</p></div>
        <div style={{display:'flex',gap:9}}>{unread>0&&<button className="btn btn-ghost btn-sm" onClick={markAll}>Mark All Read</button>}<button className="btn btn-accent btn-sm" onClick={()=>setShowSend(true)}>+ Send Notice</button></div>
      </div>
      <div className="tabs">
        {[['all','All'],['unread','Unread'],['info','Info'],['warning','Warning'],['alert','Alert'],['payment','Payment']].map(([k,l])=>(
          <button key={k} className={`tab ${tab===k?'on':''}`} onClick={()=>setTab(k)}>{l}{k==='unread'&&unread>0&&<span style={{marginLeft:4,background:'var(--red)',color:'#fff',borderRadius:'50%',width:15,height:15,display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:9,fontWeight:700}}>{unread}</span>}</button>
        ))}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:9}}>
        {filtered.length===0?<Empty icon="🔔" title="No notifications" sub="Send a notice to get started"/>:filtered.map(n=>{
          const cfg=N_CFG[n.type]||N_CFG.info
          return (
            <div key={n.id} className={`notif-item ${!n.is_read?'unread':''}`} style={{borderLeft:!n.is_read?`3px solid ${cfg.color}`:undefined}} onClick={()=>markRead(n.id)}>
              <div className="notif-ico" style={{background:cfg.bg}}><span style={{fontSize:15}}>{cfg.icon}</span></div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:13,color:!n.is_read?'var(--text)':'var(--muted)'}}>{n.title}</div>
                <div style={{fontSize:12,color:'var(--muted)',marginTop:2}}>{n.body}</div>
                <div style={{display:'flex',gap:10,marginTop:5}}>
                  <span style={{fontSize:9,padding:'2px 8px',background:cfg.bg,color:cfg.color,borderRadius:20,fontWeight:700}}>{n.type}</span>
                  <span style={{fontSize:10,color:'var(--muted)'}}>{formatDistanceToNow(new Date(n.created_at),{addSuffix:true})}</span>
                  {!n.is_read&&<span style={{fontSize:10,color:'var(--accent)',fontWeight:700}}>● New</span>}
                </div>
              </div>
              <button style={{background:'none',border:'none',cursor:'pointer',color:'var(--muted)',fontSize:14,opacity:.6}} onClick={e=>{e.stopPropagation();del(n.id)}}>✕</button>
            </div>
          )
        })}
      </div>
      <Modal open={showSend} onClose={()=>setShowSend(false)} title="Send Notification" width={440}>
        <form onSubmit={send}>
          <div className="form-group"><label className="form-label">Title *</label><input className="form-input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required/></div>
          <div className="form-group"><label className="form-label">Message *</label><textarea className="form-input" rows={3} value={form.body} onChange={e=>setForm({...form,body:e.target.value})} required style={{resize:'vertical'}}/></div>
          <div className="g2">
            <div className="form-group"><label className="form-label">Type</label><select className="form-input" value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{Object.entries(N_CFG).map(([k,v])=><option key={k} value={k}>{v.icon} {k}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Target</label><select className="form-input" value={form.target} onChange={e=>setForm({...form,target:e.target.value})}><option value="all">All</option><option value="admin">Admin</option><option value="resident">Resident</option></select></div>
          </div>
          <ModalFooter><button type="button" className="btn btn-ghost" onClick={()=>setShowSend(false)}>Cancel</button><button type="submit" className="btn btn-accent" disabled={saving}>{saving?'Sending…':'Send Now'}</button></ModalFooter>
        </form>
      </Modal>
    </div>
  )
}

// ── READMISSION PAGE ──────────────────────────────────────
import { readmissionsApi } from '../lib/supabase'

export function Readmission() {
  const { settings, connected } = useApp()
  const [admissions, setAdmissions] = useState([])
  const [residents, setResidents] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ resident_id:'', previous_room_id:'', new_room_id:'', readmission_date:new Date().toISOString().split('T')[0], readmission_fee:settings.readmission_fee||500, reason:'' })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!connected) { setLoading(false); return }
    const [a,r,rm] = await Promise.all([readmissionsApi.getAll(), resApi.getAll(), roomsApi.available()])
    setAdmissions(a.data||[]); setResidents(r.data||[]); setRooms(rm.data||[])
    setLoading(false)
  }
  useEffect(()=>{load()},[connected])

  async function submit(e) {
    e.preventDefault(); setSaving(true)
    const { error } = await readmissionsApi.create({ ...form, status:'pending' })
    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Readmission submitted!'); setShowForm(false); setSaving(false); load()
  }

  async function updateStatus(id, status) {
    await readmissionsApi.update(id, { status })
    setAdmissions(prev=>prev.map(a=>a.id===id?{...a,status}:a))
    toast.success(`Readmission ${status}`)
  }

  const SC = { pending:'badge-yellow', approved:'badge-green', rejected:'badge-red' }

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:60}}><Spinner size={32}/></div>

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
        <div className="shdr" style={{marginBottom:0}}><h2>Readmission</h2><p>Re-entry requests · Fee: {settings.currency_symbol}{settings.readmission_fee||500}</p></div>
        {connected&&<button className="btn btn-accent" onClick={()=>setShowForm(true)}><SvgIcon d={ICONS.plus} size={14}/> New Request</button>}
      </div>
      <div className="g-3" style={{marginBottom:16}}>
        {[['Pending',admissions.filter(a=>a.status==='pending').length,'var(--accent)'],['Approved',admissions.filter(a=>a.status==='approved').length,'var(--green)'],['Rejected',admissions.filter(a=>a.status==='rejected').length,'var(--red)']].map(([l,v,c])=>(
          <div key={l} className="card" style={{textAlign:'center'}}><div style={{fontFamily:'Fraunces,serif',fontSize:30,color:c}}>{v}</div><div style={{fontSize:11,color:'var(--muted)',marginTop:3}}>{l}</div></div>
        ))}
      </div>
      <div className="card">
        {admissions.length===0?<Empty icon="🔄" title="No readmission requests"/>:
        <div className="table-wrap"><table>
          <thead><tr><th>Resident</th><th>Phone</th><th>Prev Room</th><th>New Room</th><th>Return Date</th><th>Fee</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>{admissions.map(a=>(
            <tr key={a.id}>
              <td style={{fontWeight:600}}>{a.residents?.full_name}</td>
              <td style={{fontSize:11.5,color:'var(--muted)'}}>{a.residents?.phone}</td>
              <td>{a.previous_room?.room_number||'—'}</td>
              <td style={{color:'var(--green)',fontWeight:600}}>{a.new_room?.room_number||'TBD'}</td>
              <td style={{fontSize:11.5}}>{new Date(a.readmission_date).toLocaleDateString('en-GB')}</td>
              <td style={{color:'var(--accent)',fontWeight:700}}>{settings.currency_symbol}{a.readmission_fee}</td>
              <td style={{fontSize:11.5,color:'var(--muted)',maxWidth:130,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{a.reason||'—'}</td>
              <td><span className={`badge ${SC[a.status]}`}>{a.status}</span></td>
              <td>{a.status==='pending'&&<div style={{display:'flex',gap:5}}><button className="btn btn-success btn-xs" onClick={()=>updateStatus(a.id,'approved')}>Approve</button><button className="btn btn-danger btn-xs" onClick={()=>updateStatus(a.id,'rejected')}>Reject</button></div>}</td>
            </tr>
          ))}</tbody>
        </table></div>}
      </div>
      <Modal open={showForm} onClose={()=>setShowForm(false)} title="New Readmission Request">
        <form onSubmit={submit}>
          <div className="form-group"><label className="form-label">Resident *</label><select className="form-input" value={form.resident_id} onChange={e=>setForm({...form,resident_id:e.target.value})} required><option value="">— Select —</option>{residents.map(r=><option key={r.id} value={r.id}>{r.full_name}</option>)}</select></div>
          <div className="g2">
            <div className="form-group"><label className="form-label">Previous Room</label><select className="form-input" value={form.previous_room_id} onChange={e=>setForm({...form,previous_room_id:e.target.value})}><option value="">N/A</option>{residents.flatMap(r=>r.room_assignments||[]).map(a=>a.rooms).filter(Boolean).map((r,i)=><option key={i} value={r.id}>Room {r.room_number}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Requested Room</label><select className="form-input" value={form.new_room_id} onChange={e=>setForm({...form,new_room_id:e.target.value})}><option value="">Any available</option>{rooms.map(r=><option key={r.id} value={r.id}>Room {r.room_number} — {r.type}</option>)}</select></div>
          </div>
          <div className="g2">
            <div className="form-group"><label className="form-label">Return Date *</label><input className="form-input" type="date" value={form.readmission_date} onChange={e=>setForm({...form,readmission_date:e.target.value})} required/></div>
            <div className="form-group"><label className="form-label">Fee ({settings.currency_symbol})</label><input className="form-input" type="number" value={form.readmission_fee} onChange={e=>setForm({...form,readmission_fee:parseFloat(e.target.value)})}/></div>
          </div>
          <div className="form-group"><label className="form-label">Reason</label><textarea className="form-input" rows={2} value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} placeholder="Reason for return…" style={{resize:'vertical'}}/></div>
          <ModalFooter><button type="button" className="btn btn-ghost" onClick={()=>setShowForm(false)}>Cancel</button><button type="submit" className="btn btn-accent" disabled={saving}>{saving?'Saving…':'Submit'}</button></ModalFooter>
        </form>
      </Modal>
    </div>
  )
}

// ── REPORTS PAGE ──────────────────────────────────────────
export function Reports() {
  const { settings, connected } = useApp()
  const cur = settings.currency_symbol||'৳'
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    if (!connected) { setLoading(false); return }
    Promise.all([roomsApi.getAll(), resApi.getAll(), feesApi.getAll(), complaintsApi.getAll()]).then(([r,res,f,c])=>{
      const rooms=r.data||[], residents=res.data||[], fees=f.data||[], complaints=c.data||[]
      const collected=fees.filter(x=>x.status==='paid').reduce((s,x)=>s+x.amount,0)
      const total=fees.reduce((s,x)=>s+x.amount,0)
      setData({ rooms, residents, fees, complaints, collected, total,
        occupied: rooms.filter(x=>x.status==='occupied').length,
        resolved: complaints.filter(x=>x.status==='resolved').length,
        floors: [1,2,3,4].map(fl=>{ const fr=rooms.filter(x=>x.floor===fl); const occ=fr.filter(x=>x.status==='occupied').length; return {fl,total:fr.length,occ,pct:fr.length?Math.round(occ/fr.length*100):0,rev:occ*(settings.base_monthly_rent||5000)} })
      })
      setLoading(false)
    })
  },[connected])

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:60}}><Spinner size={32}/></div>
  if (!connected) return <Empty icon="📊" title="Not connected" sub="Connect Supabase to see reports"/>
  if (!data) return null

  const occPct = data.rooms.length ? Math.round(data.occupied/data.rooms.length*100) : 0
  const colPct = data.total ? Math.round(data.collected/data.total*100) : 0
  const resPct = data.complaints.length ? Math.round(data.resolved/data.complaints.length*100) : 0

  return (
    <div>
      <div className="shdr"><h2>Reports & Analytics</h2><p>Live data from your Supabase database</p></div>
      <div className="g-3 fu fu1" style={{marginBottom:16}}>
        {[[`${occPct}%`,'Occupancy Rate',data.occupied,data.rooms.length,'room(s) occupied','var(--accent)'],
          [`${colPct}%`,'Collection Rate',`${cur}${(data.collected/1000).toFixed(1)}K`,`${cur}${(data.total/1000).toFixed(1)}K`,'collected vs billed','var(--green)'],
          [`${resPct}%`,'Complaint Resolution',data.resolved,data.complaints.length,'resolved','var(--blue)']
        ].map(([pct,lbl,a,b,sub,c])=>(
          <div key={lbl} className="card">
            <div style={{fontFamily:'Fraunces,serif',fontSize:36,color:c,marginBottom:6}}>{pct}</div>
            <div style={{fontWeight:700,fontSize:13,marginBottom:4}}>{lbl}</div>
            <div style={{fontSize:12,color:'var(--muted)',marginBottom:8}}>{a} of {b} {sub}</div>
            <div className="prog"><div className="prog-fill" style={{width:pct,background:c}}/></div>
          </div>
        ))}
      </div>
      <div className="card fu fu2">
        <div className="card-hdr"><div className="card-title">Floor-wise Performance</div></div>
        <div className="table-wrap"><table>
          <thead><tr><th>Floor</th><th>Total Rooms</th><th>Occupied</th><th>Occupancy</th><th>Est. Revenue/mo</th><th>Status</th></tr></thead>
          <tbody>{data.floors.map(f=>(
            <tr key={f.fl}>
              <td style={{fontWeight:700}}>Floor {f.fl}</td>
              <td>{f.total}</td>
              <td style={{color:'var(--red)',fontWeight:600}}>{f.occ}</td>
              <td>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div className="prog" style={{flex:1,height:5}}><div className="prog-fill" style={{width:`${f.pct}%`,background:f.pct>80?'var(--green)':f.pct>50?'var(--accent)':'var(--red)'}}/></div>
                  <span style={{fontSize:12,fontWeight:700,minWidth:32}}>{f.pct}%</span>
                </div>
              </td>
              <td style={{color:'var(--accent)',fontWeight:700}}>{cur}{f.rev.toLocaleString()}</td>
              <td><span className={`badge ${f.pct>80?'badge-green':f.pct>50?'badge-yellow':'badge-red'}`}>{f.pct>80?'Excellent':f.pct>50?'Good':'Low'}</span></td>
            </tr>
          ))}</tbody>
        </table></div>
      </div>
    </div>
  )
}

// ── AUTH PAGE ───────────────────────────────────────────────────
export function Auth() {
  const { user, signIn, signUp, signOut, loading, t } = useApp()
  const [mode, setMode] = useState('signin') // 'signin' or 'signup'
  const [form, setForm] = useState({ email: '', password: '', fullName: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      // Redirect to dashboard if already logged in
      window.location.href = '#dashboard'
    }
  }, [user])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
  if (user) return null // Will redirect

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      if (mode === 'signin') {
        await signIn(form.email, form.password)
        toast.success('Welcome back!')
      } else {
        await signUp(form.email, form.password, form.fullName)
        toast.success('Account created! Please check your email to verify.')
        setMode('signin')
      }
    } catch (error) {
      toast.error(error.message)
    }
    setSubmitting(false)
  }

  return (
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 20 }}>
      <div className="card">
        <div className="card-hdr">
          <div className="card-title">{mode === 'signin' ? t('sign_in') : t('sign_up')}</div>
          <div className="card-sub">{t('auth')}</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('email')}</label>
            <input
              className="form-input"
              type="email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          {mode === 'signup' && (
            <div className="form-group">
              <label className="form-label">{t('full_name')}</label>
              <input
                className="form-input"
                type="text"
                value={form.fullName}
                onChange={e => setForm({ ...form, fullName: e.target.value })}
                required
              />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">{t('password')}</label>
            <input
              className="form-input"
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-accent" style={{ width: '100%', marginBottom: 16 }} disabled={submitting}>
            {submitting ? t('loading') : (mode === 'signin' ? t('sign_in') : t('sign_up'))}
          </button>
        </form>
        <div style={{ textAlign: 'center' }}>
          {mode === 'signin' ? (
            <p>{t('dont_have_account')} <button className="link" onClick={() => setMode('signup')}>{t('sign_up')}</button></p>
          ) : (
            <p>{t('already_have_account')} <button className="link" onClick={() => setMode('signin')}>{t('sign_in')}</button></p>
          )}
        </div>
      </div>
    </div>
  )
}
import { settingsApi } from '../lib/supabase'

export function Settings() {
  const { theme, themeName, setThemeName, settings, setSettings, connected, t } = useApp()
  const [form, setForm] = useState({ ...settings })
  const [saving, setSaving] = useState(false)

  useEffect(()=>{ setForm({...settings}) },[settings])

  async function save(e) {
    e.preventDefault(); setSaving(true)
    if (connected && settings.id) {
      const { data, error } = await settingsApi.update(settings.id, form)
      if (error) { toast.error(error.message); setSaving(false); return }
      setSettings(data)
    }
    toast.success('Settings saved!'); setSaving(false)
  }

  const themeColors = { midnight:['#080c14','#0f1623','#f0a500'], slate:['#f1f5f9','#fff','#0f766e'], ocean:['#020b18','#041525','#06b6d4'], forest:['#030f07','#061409','#4ade80'], crimson:['#0f0508','#1a0810','#f43f5e'] }

  return (
    <div style={{maxWidth:780}}>
      <div className="shdr"><h2>{t('settings')}</h2><p>{t('hostel_info')}, {t('fee_defaults')}, {t('customization')}</p></div>

      <div className="card" style={{marginBottom:14}}>
        <div className="card-hdr"><div className="card-title">🎨 Theme</div></div>
        <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
          {Object.entries(THEMES).map(([key,t])=>{
            const [bg,sf,ac]=themeColors[key]||['#000','#111','#f0a500']
            return (
              <div key={key} style={{textAlign:'center',cursor:'pointer'}} onClick={()=>setThemeName(key)}>
                <div style={{width:46,height:46,borderRadius:12,background:`linear-gradient(135deg,${bg},${sf})`,border:`2px solid ${themeName===key?ac:'transparent'}`,position:'relative',overflow:'hidden',transform:themeName===key?'scale(1.1)':'none',transition:'all .15s',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <div style={{position:'absolute',bottom:5,right:5,width:12,height:12,borderRadius:'50%',background:ac}}/>
                </div>
                <div style={{fontSize:10,color:themeName===key?'var(--accent)':'var(--muted)',marginTop:5,fontWeight:themeName===key?700:400}}>{t.name}</div>
              </div>
            )
          })}
        </div>
      </div>

      <form onSubmit={save}>
        <div className="card" style={{marginBottom:14}}>
          <div className="card-hdr"><div className="card-title">🏠 {t('hostel_info')}</div></div>
          <div className="g2">
            <div className="form-group"><label className="form-label">{t('hostel_name')}</label><input className="form-input" value={form.hostel_name||''} onChange={e=>setForm({...form,hostel_name:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">{t('warden_name')}</label><input className="form-input" value={form.warden_name||''} onChange={e=>setForm({...form,warden_name:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">{t('phone')}</label><input className="form-input" value={form.phone||''} onChange={e=>setForm({...form,phone:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">{t('email')}</label><input className="form-input" value={form.email||''} onChange={e=>setForm({...form,email:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">{t('currency_symbol')}</label><input className="form-input" value={form.currency_symbol||'৳'} onChange={e=>setForm({...form,currency_symbol:e.target.value})}/></div>
          </div>
          <div className="form-group"><label className="form-label">{t('address')}</label><input className="form-input" value={form.address||''} onChange={e=>setForm({...form,address:e.target.value})}/></div>
        </div>

        <div className="card" style={{marginBottom:14}}>
          <div className="card-hdr"><div className="card-title">💰 {t('fee_defaults')}</div></div>
          <div className="g2">
            <div className="form-group"><label className="form-label">{t('base_monthly_rent')}</label><input className="form-input" type="number" value={form.base_monthly_rent||5000} onChange={e=>setForm({...form,base_monthly_rent:parseFloat(e.target.value)})}/></div>
            <div className="form-group"><label className="form-label">{t('readmission_fee')}</label><input className="form-input" type="number" value={form.readmission_fee||500} onChange={e=>setForm({...form,readmission_fee:parseFloat(e.target.value)})}/></div>
            <div className="form-group"><label className="form-label">{t('security_deposit')}</label><input className="form-input" type="number" value={form.security_deposit||2000} onChange={e=>setForm({...form,security_deposit:parseFloat(e.target.value)})}/></div>
            <div className="form-group"><label className="form-label">{t('late_fee_per_day')}</label><input className="form-input" type="number" value={form.late_fee_per_day||200} onChange={e=>setForm({...form,late_fee_per_day:parseFloat(e.target.value)})}/></div>
            <div className="form-group"><label className="form-label">{t('due_day')}</label><input className="form-input" type="number" min="1" max="28" value={form.due_day||10} onChange={e=>setForm({...form,due_day:parseInt(e.target.value)})}/></div>
          </div>
        </div>

        <div className="card" style={{marginBottom:14}}>
        <div className="card-hdr"><div className="card-title">🎨 {t('customization')}</div></div>
        <div className="g2">
          <div className="form-group"><label className="form-label">{t('logo_url')}</label><input className="form-input" value={form.logo_url||''} onChange={e=>setForm({...form,logo_url:e.target.value})} placeholder="https://example.com/logo.svg"/></div>
          <div className="form-group"><label className="form-label">{t('welcome_message')}</label><input className="form-input" value={form.welcome_message||''} onChange={e=>setForm({...form,welcome_message:e.target.value})}/></div>            <div className="form-group"><label className="form-label">Primary Color</label><input className="form-input" type="color" value={form.primary_color||'#f0a500'} onChange={e=>setForm({...form,primary_color:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">Secondary Color</label><input className="form-input" type="color" value={form.secondary_color||'#0f1623'} onChange={e=>setForm({...form,secondary_color:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">Accent Color</label><input className="form-input" type="color" value={form.accent_color||'#22c55e'} onChange={e=>setForm({...form,accent_color:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">Font Family</label><select className="form-input" value={form.font_family||'Syne, sans-serif'} onChange={e=>setForm({...form,font_family:e.target.value})}>
              <option value="Syne, sans-serif">Syne</option>
              <option value="Inter, sans-serif">Inter</option>
              <option value="Roboto, sans-serif">Roboto</option>
              <option value="Open Sans, sans-serif">Open Sans</option>
              <option value="Poppins, sans-serif">Poppins</option>
              <option value="Noto Sans Bengali, sans-serif">Noto Sans Bengali</option>
            </select></div>        </div>
        <div style={{display:'flex',flexWrap:'wrap',gap:14,marginTop:14}}>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
            <input type="checkbox" checked={form.enable_meals!==false} onChange={e=>setForm({...form,enable_meals:e.target.checked})}/>
            {t('enable_meals')}
          </label>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
            <input type="checkbox" checked={form.enable_complaints!==false} onChange={e=>setForm({...form,enable_complaints:e.target.checked})}/>
            {t('enable_complaints')}
          </label>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
            <input type="checkbox" checked={form.enable_readmission!==false} onChange={e=>setForm({...form,enable_readmission:e.target.checked})}/>
            {t('enable_readmission')}
          </label>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
            <input type="checkbox" checked={form.enable_notifications!==false} onChange={e=>setForm({...form,enable_notifications:e.target.checked})}/>
            {t('enable_notifications')}
          </label>
          <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
            <input type="checkbox" checked={form.enable_reports!==false} onChange={e=>setForm({...form,enable_reports:e.target.checked})}/>
            {t('enable_reports')}
          </div>
        </div>

        <div className="card" style={{marginBottom:14}}>
          <div className="card-hdr"><div className="card-title">⚙️ System Preferences</div></div>
          <div className="g2">
            <div className="form-group"><label className="form-label">Date Format</label><select className="form-input" value={form.date_format||'DD/MM/YYYY'} onChange={e=>setForm({...form,date_format:e.target.value})}>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="DD-MM-YYYY">DD-MM-YYYY</option>
            </select></div>
            <div className="form-group"><label className="form-label">Time Zone</label><select className="form-input" value={form.time_zone||'Asia/Dhaka'} onChange={e=>setForm({...form,time_zone:e.target.value})}>
              <option value="Asia/Dhaka">Asia/Dhaka (GMT+6)</option>
              <option value="Asia/Kolkata">Asia/Kolkata (GMT+5:30)</option>
              <option value="UTC">UTC</option>
              <option value="America/New_York">America/New_York (EST)</option>
            </select></div>
            <div className="form-group"><label className="form-label">Working Hours Start</label><input className="form-input" type="time" value={form.working_hours_start||'09:00'} onChange={e=>setForm({...form,working_hours_start:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">Working Hours End</label><input className="form-input" type="time" value={form.working_hours_end||'18:00'} onChange={e=>setForm({...form,working_hours_end:e.target.value})}/></div>
          </div>
          <div style={{display:'flex',flexWrap:'wrap',gap:14,marginTop:14}}>
            <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
              <input type="checkbox" checked={form.enable_weekends||false} onChange={e=>setForm({...form,enable_weekends:e.target.checked})}/>
              Enable Weekend Operations
            </label>
            <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
              <input type="checkbox" checked={form.notification_email||false} onChange={e=>setForm({...form,notification_email:e.target.checked})}/>
              Email Notifications
            </label>
            <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
              <input type="checkbox" checked={form.notification_sms||false} onChange={e=>setForm({...form,notification_sms:e.target.checked})}/>
              SMS Notifications
            </label>
            <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer'}}>
              <input type="checkbox" checked={form.notification_push||false} onChange={e=>setForm({...form,notification_push:e.target.checked})}/>
              Push Notifications
            </label>
          </div>
        </div>

        <div className="card" style={{marginBottom:14}}>
          <div className="card-hdr"><div className="card-title">📧 Email Templates</div></div>
          <div className="form-group">
            <label className="form-label">Welcome Email Template</label>
            <textarea className="form-input" rows="3" value={form.email_template_welcome||''} onChange={e=>setForm({...form,email_template_welcome:e.target.value})} placeholder="Use {hostel_name}, {room_number}, etc."></textarea>
          </div>
          <div className="form-group">
            <label className="form-label">Payment Received Template</label>
            <textarea className="form-input" rows="3" value={form.email_template_payment||''} onChange={e=>setForm({...form,email_template_payment:e.target.value})} placeholder="Use {amount}, {resident_name}, etc."></textarea>
          </div>
          <div className="form-group">
            <label className="form-label">Overdue Payment Template</label>
            <textarea className="form-input" rows="3" value={form.email_template_overdue||''} onChange={e=>setForm({...form,email_template_overdue:e.target.value})} placeholder="Use {amount}, {due_date}, etc."></textarea>
          </div>
        </div>

        <div className="card" style={{marginBottom:14}}>
          <div className="card-hdr"><div className="card-title">🗄️ Supabase Setup</div></div>
          <div style={{background:'rgba(59,130,246,.06)',border:'1px solid rgba(59,130,246,.2)',borderRadius:9,padding:'13px 15px',fontSize:13,lineHeight:1.85,marginBottom:14}}>
            <div style={{fontWeight:700,color:'var(--blue)',marginBottom:7}}>Quick Setup Guide</div>
            <div style={{color:'var(--muted)'}}>
              1. Create project at <a href="https://supabase.com" target="_blank" rel="noreferrer" style={{color:'var(--accent)'}}>supabase.com</a><br/>
              2. SQL Editor → paste <code style={{background:'var(--surface2)',padding:'1px 5px',borderRadius:3,fontSize:11}}>supabase_schema.sql</code> → Run<br/>
              3. Settings → API → copy Project URL + Anon Key<br/>
              4. Create <code style={{background:'var(--surface2)',padding:'1px 5px',borderRadius:3,fontSize:11}}>.env</code> file:<br/>
              <code style={{display:'block',background:'var(--surface2)',padding:'8px 12px',borderRadius:6,marginTop:6,fontSize:11}}>
                VITE_SUPABASE_URL=https://xxx.supabase.co<br/>
                VITE_SUPABASE_ANON_KEY=your-key
              </code>
              5. Restart dev server → all features activate!
            </div>
          </div>
        </div>

        <div className="card" style={{marginBottom:14,background:'rgba(34,197,94,.03)',borderColor:'rgba(34,197,94,.2)'}}>
          <div className="card-hdr"><div className="card-title">🚀 Deploy to Vercel</div></div>
          <div style={{fontSize:13,color:'var(--muted)',lineHeight:1.8}}>
            1. Push to GitHub<br/>
            2. Import at <a href="https://vercel.com" target="_blank" rel="noreferrer" style={{color:'var(--accent)'}}>vercel.com</a><br/>
            3. Add env vars: <code style={{background:'var(--surface2)',padding:'1px 5px',borderRadius:3,fontSize:11}}>VITE_SUPABASE_URL</code> + <code style={{background:'var(--surface2)',padding:'1px 5px',borderRadius:3,fontSize:11}}>VITE_SUPABASE_ANON_KEY</code><br/>
            4. Deploy 🎉
          </div>
        </div>

        <button type="submit" className="btn btn-accent" style={{padding:'10px 28px'}} disabled={saving}>{saving?'Saving…':'Save All Settings'}</button>
      </form>
    </div>
  )
}
