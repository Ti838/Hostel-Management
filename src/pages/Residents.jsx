import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { residentsApi } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { parseResidentsCSV, RESIDENTS_CSV_TEMPLATE } from '../lib/csvImport'
import { SvgIcon, ICONS, Empty, Spinner, Modal, ModalFooter } from '../components/ui'

const blank = { full_name:'', phone:'', email:'', nid:'', date_of_birth:'', gender:'Male', occupation:'', emergency_contact:'', emergency_phone:'', address:'' }
const COLORS = ['var(--accent)','var(--green)','var(--blue)','var(--purple)','var(--red)']
const init = n => n.split(' ').map(x=>x[0]).join('').toUpperCase().slice(0,2)

export default function Residents() {
  const { connected } = useApp()
  const [residents, setResidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('active')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState(blank)
  const [saving, setSaving] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileRef = useRef()

  const load = async () => {
    if (!connected) { setLoading(false); return }
    const { data } = await residentsApi.getAll()
    setResidents(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [connected])

  const counts = { active: residents.filter(r=>r.status==='active').length, pending: residents.filter(r=>r.status==='pending').length, checked_out: residents.filter(r=>r.status==='checked_out').length }
  const filtered = residents.filter(r => {
    const matchTab = tab === 'all' || r.status === tab
    const matchSearch = !search || r.full_name.toLowerCase().includes(search.toLowerCase()) || r.phone.includes(search) || (r.nid||'').includes(search)
    return matchTab && matchSearch
  })

  async function saveResident(e) {
    e.preventDefault()
    setSaving(true)
    if (detail) {
      const { error } = await residentsApi.update(detail.id, form)
      if (error) { toast.error(error.message); setSaving(false); return }
      setResidents(prev => prev.map(r => r.id===detail.id ? {...r,...form} : r))
      toast.success('Resident updated!')
    } else {
      const { data, error } = await residentsApi.create({ ...form, status:'active' })
      if (error) { toast.error(error.message); setSaving(false); return }
      setResidents(prev => [data, ...prev])
      toast.success(`${form.full_name} added!`)
    }
    setShowForm(false); setDetail(null); setForm(blank); setSaving(false)
  }

  function openEdit(r) {
    setDetail(r)
    setForm({ full_name:r.full_name, phone:r.phone, email:r.email||'', nid:r.nid||'', date_of_birth:r.date_of_birth||'', gender:r.gender||'Male', occupation:r.occupation||'', emergency_contact:r.emergency_contact||'', emergency_phone:r.emergency_phone||'', address:r.address||'' })
    setShowForm(true)
  }

  async function handleImport(e) {
    const file = e.target.files?.[0]; if (!file) return
    setImporting(true)
    const { residents: parsed, errors } = await parseResidentsCSV(file)
    if (errors.length) { toast.error(errors[0]); setImporting(false); return }
    let ok=0, fail=0
    for (const r of parsed) {
      const { error } = await residentsApi.create(r)
      if (error) fail++; else ok++
    }
    setImportResult({ ok, fail })
    setImporting(false)
    load()
  }

  function downloadTemplate() {
    const blob = new Blob([RESIDENTS_CSV_TEMPLATE], { type:'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download='residents_template.csv'; a.click()
  }

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:60}}><Spinner size={32}/></div>

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
        <div className="shdr" style={{marginBottom:0}}>
          <h2>Residents</h2>
          <p>{counts.active} active · {residents.length} total</p>
        </div>
        {connected && <div style={{display:'flex',gap:9}}>
          <button className="btn btn-ghost btn-sm" onClick={()=>setShowImport(true)}><SvgIcon d={ICONS.upload} size={13}/> Import CSV</button>
          <button className="btn btn-accent" onClick={()=>{setDetail(null);setForm(blank);setShowForm(true)}}><SvgIcon d={ICONS.plus} size={14}/> Add Resident</button>
        </div>}
      </div>

      <div className="tabs">
        {[['active','Active'],['pending','Pending'],['checked_out','Checked Out'],['all','All']].map(([k,l])=>(
          <button key={k} className={`tab ${tab===k?'on':''}`} onClick={()=>setTab(k)}>
            {l} <span style={{opacity:.6,marginLeft:3}}>({k==='all'?residents.length:counts[k]||0})</span>
          </button>
        ))}
      </div>

      <div className="search-bar">
        <SvgIcon d={ICONS.eye} size={13}/>
        <input placeholder="Search by name, phone, or NID…" value={search} onChange={e=>setSearch(e.target.value)}/>
        {search && <button style={{background:'none',border:'none',color:'var(--muted)',cursor:'pointer',fontSize:13}} onClick={()=>setSearch('')}>✕</button>}
      </div>

      <div className="card">
        {filtered.length === 0
          ? <Empty icon="👥" title={connected?'No residents found':'Not connected'} sub={connected?'Add or import residents':'Connect Supabase in Settings'}/>
          : <div className="table-wrap">
              <table>
                <thead><tr><th>Resident</th><th>Contact</th><th>Room</th><th>Check-In</th><th>In Time</th><th>Expected Out</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map((r,i)=>{
                    const assign = r.room_assignments?.find(a=>a.status==='active') || r.room_assignments?.[0]
                    return (
                      <tr key={r.id}>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:9}}>
                            <div style={{width:30,height:30,borderRadius:'50%',background:COLORS[i%COLORS.length],color:'#000',fontWeight:800,fontSize:11,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>{init(r.full_name)}</div>
                            <div>
                              <div style={{fontWeight:700,fontSize:13}}>{r.full_name}</div>
                              <div style={{fontSize:10.5,color:'var(--muted)'}}>{r.nid||r.occupation||'—'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{fontSize:11.5,color:'var(--muted)'}}>{r.phone}<br/><span style={{fontSize:10.5}}>{r.email||''}</span></td>
                        <td>{assign?.rooms?.room_number ? <div><div style={{fontWeight:700}}>{assign.rooms.room_number}</div><div style={{fontSize:10.5,color:'var(--muted)'}}>{assign.rooms.type}</div></div> : <span style={{color:'var(--muted)'}}>—</span>}</td>
                        <td style={{fontSize:11.5}}>{assign?.check_in_date ? new Date(assign.check_in_date).toLocaleDateString('en-GB') : '—'}</td>
                        <td style={{color:'var(--green)',fontWeight:700,fontSize:13}}>{assign?.in_time?.slice(0,5)||'—'}</td>
                        <td style={{fontSize:11.5,color:'var(--muted)'}}>{assign?.expected_checkout ? new Date(assign.expected_checkout).toLocaleDateString('en-GB') : '—'}</td>
                        <td><span className={`badge ${r.status==='active'?'badge-green':r.status==='pending'?'badge-yellow':'badge-muted'}`}>{r.status.replace('_',' ')}</span></td>
                        <td><div style={{display:'flex',gap:5}}><button className="btn btn-ghost btn-xs" onClick={()=>openEdit(r)}><SvgIcon d={ICONS.edit} size={11}/></button></div></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
        }
      </div>

      {/* Add/Edit Modal */}
      <Modal open={showForm} onClose={()=>{setShowForm(false);setDetail(null);setForm(blank)}} title={detail?`Edit — ${detail.full_name}`:'Add New Resident'}>
        <form onSubmit={saveResident}>
          <div className="g2">
            <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} placeholder="Full name" required/></div>
            <div className="form-group"><label className="form-label">Phone *</label><input className="form-input" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+880 1XXX-XXXXXX" required/></div>
            <div className="form-group"><label className="form-label">Email</label><input className="form-input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email@example.com"/></div>
            <div className="form-group"><label className="form-label">NID / Student ID</label><input className="form-input" value={form.nid} onChange={e=>setForm({...form,nid:e.target.value})} placeholder="ID number"/></div>
            <div className="form-group"><label className="form-label">Date of Birth</label><input className="form-input" type="date" value={form.date_of_birth} onChange={e=>setForm({...form,date_of_birth:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">Gender</label><select className="form-input" value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})}><option>Male</option><option>Female</option><option>Other</option></select></div>
            <div className="form-group"><label className="form-label">Occupation</label><input className="form-input" value={form.occupation} onChange={e=>setForm({...form,occupation:e.target.value})} placeholder="Student / Professional…"/></div>
            <div className="form-group"><label className="form-label">Emergency Contact</label><input className="form-input" value={form.emergency_contact} onChange={e=>setForm({...form,emergency_contact:e.target.value})} placeholder="Name"/></div>
            <div className="form-group"><label className="form-label">Emergency Phone</label><input className="form-input" value={form.emergency_phone} onChange={e=>setForm({...form,emergency_phone:e.target.value})} placeholder="+880 1XXX-XXXXXX"/></div>
          </div>
          <div className="form-group"><label className="form-label">Permanent Address</label><input className="form-input" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Full address"/></div>
          <ModalFooter>
            <button type="button" className="btn btn-ghost" onClick={()=>{setShowForm(false);setDetail(null);setForm(blank)}}>Cancel</button>
            <button type="submit" className="btn btn-accent" disabled={saving}>{saving?'Saving…':detail?'Save Changes':'Add Resident'}</button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Import Modal */}
      <Modal open={showImport} onClose={()=>{setShowImport(false);setImportResult(null)}} title="Import Residents from CSV" width={460}>
        <button className="btn btn-ghost btn-sm" style={{marginBottom:12}} onClick={downloadTemplate}><SvgIcon d={ICONS.download} size={13}/> Download Template</button>
        <div style={{fontSize:12,color:'var(--muted)',marginBottom:10}}>Columns: <code style={{background:'var(--surface2)',padding:'1px 6px',borderRadius:4,fontSize:11}}>full_name, phone, email, nid, gender, occupation, emergency_contact, emergency_phone, address</code></div>
        <div className="drop-zone" onClick={()=>fileRef.current?.click()}>
          <SvgIcon d={ICONS.upload} size={24}/>
          <div style={{marginTop:8,fontWeight:600}}>Click to upload CSV</div>
          <input ref={fileRef} type="file" accept=".csv" style={{display:'none'}} onChange={handleImport}/>
        </div>
        {importing && <div style={{display:'flex',gap:8,alignItems:'center',marginTop:10,fontSize:13,color:'var(--muted)'}}><Spinner size={16}/> Importing…</div>}
        {importResult && <div style={{marginTop:12,padding:12,background:'var(--surface2)',borderRadius:8,fontSize:13}}><div style={{color:'var(--green)',fontWeight:700}}>✓ {importResult.ok} residents imported</div>{importResult.fail>0&&<div style={{color:'var(--red)',marginTop:4}}>{importResult.fail} failed</div>}</div>}
        <ModalFooter><button className="btn btn-ghost" onClick={()=>{setShowImport(false);setImportResult(null)}}>Close</button></ModalFooter>
      </Modal>
    </div>
  )
}
