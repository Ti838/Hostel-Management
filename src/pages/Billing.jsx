import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { feesApi, residentsApi } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { downloadReceipt, printReceipt } from '../lib/receiptPdf'
import { SvgIcon, ICONS, Empty, Spinner, Modal, ModalFooter } from '../components/ui'

const FEE_TYPES = ['monthly_rent','readmission','security_deposit','utility','fine','other']
const PAY_METHODS = ['cash','bkash','nagad','rocket','bank','card']
const STATUS_BADGE = { paid:'badge-green', pending:'badge-yellow', overdue:'badge-red', partial:'badge-blue', waived:'badge-muted' }
const TYPE_BADGE   = { monthly_rent:'badge-blue', readmission:'badge-purple', security_deposit:'badge-green', utility:'badge-yellow', fine:'badge-red', other:'badge-muted' }

// On-screen receipt preview
function ReceiptPreview({ fee, resident, settings, onClose }) {
  const cur = settings?.currency_symbol || '৳'
  const rn  = fee.receipt_number || `RCP-${fee.id?.slice(0,8)?.toUpperCase()}`
  return (
    <div>
      <div className="receipt-preview">
        <div className="receipt-header">
          <div style={{fontSize:18,fontWeight:700,fontFamily:'Georgia,serif'}}>{settings?.hostel_name||'DormHQ Hostel'}</div>
          {settings?.address && <div style={{fontSize:11,opacity:.8,marginTop:3}}>{settings.address}</div>}
          {settings?.phone  && <div style={{fontSize:11,opacity:.8}}>{settings.phone}</div>}
          <div style={{fontSize:12,marginTop:8,opacity:.7,letterSpacing:1}}>PAYMENT RECEIPT</div>
        </div>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:12,fontSize:12,color:'#666'}}>
          <span>Receipt #: <strong style={{color:'#000'}}>{rn}</strong></span>
          <span>{fee.paid_date ? new Date(fee.paid_date).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}) : new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</span>
        </div>
        {[
          ['Resident', resident?.full_name||'—'],
          ['Phone', resident?.phone||'—'],
          ['Room', fee.room_number||'—'],
          ['Payment Method', (fee.payment_method||'Cash').toUpperCase()],
          ...(fee.transaction_ref ? [['Transaction Ref', fee.transaction_ref]] : []),
        ].map(([l,v])=>(
          <div key={l} className="receipt-row"><span style={{color:'#666'}}>{l}</span><span style={{fontWeight:600}}>{v}</span></div>
        ))}
        <div style={{margin:'12px 0 4px',fontSize:12,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:.5}}>Fee Details</div>
        <div className="receipt-row">
          <span style={{textTransform:'capitalize'}}>{fee.fee_type?.replace(/_/g,' ')}{fee.description?` — ${fee.description}`:''}</span>
          <span>{cur}{(fee.amount||0).toLocaleString()}</span>
        </div>
        {fee.note && <div style={{fontSize:11,color:'#888',marginTop:4}}>Note: {fee.note}</div>}
        <div className="receipt-total">
          <span>TOTAL PAID</span>
          <span>{cur}{(fee.paid_amount||fee.amount||0).toLocaleString()}</span>
        </div>
        <div style={{textAlign:'center',marginTop:14}}>
          <span className="receipt-stamp">✓ PAID</span>
        </div>
        <div style={{fontSize:10,color:'#aaa',textAlign:'center',marginTop:14}}>
          Computer-generated receipt · {settings?.hostel_name||'DormHQ'}
        </div>
      </div>
      <div style={{display:'flex',gap:10,justifyContent:'center',marginTop:14}}>
        <button className="btn btn-ghost btn-sm" onClick={()=>downloadReceipt(fee,resident,settings)}>
          <SvgIcon d={ICONS.download} size={13}/> Download PDF
        </button>
        <button className="btn btn-accent btn-sm" onClick={()=>printReceipt(fee,resident,settings)}>
          <SvgIcon d={ICONS.printer} size={13}/> Print
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}

export default function Billing() {
  const { settings, connected } = useApp()
  const cur = settings.currency_symbol || '৳'

  const [fees, setFees] = useState([])
  const [residents, setResidents] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')

  // Add fee modal
  const [showAdd, setShowAdd] = useState(false)
  const [addForm, setAddForm] = useState({ resident_id:'', fee_type:'monthly_rent', description:'', amount:'', due_date:new Date().toISOString().split('T')[0], note:'' })
  const [saving, setSaving] = useState(false)

  // Pay modal
  const [payFee, setPayFee] = useState(null)
  const [payForm, setPayForm] = useState({ method:'cash', ref:'', amount:'' })

  // Receipt modal
  const [receiptFee, setReceiptFee] = useState(null)
  const [receiptRes, setReceiptRes] = useState(null)

  const load = async () => {
    if (!connected) { setLoading(false); return }
    const [f, r] = await Promise.all([feesApi.getAll(), residentsApi.active()])
    setFees(f.data || [])
    setResidents(r.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [connected])

  const filtered = tab === 'all' ? fees : fees.filter(f => f.status === tab)
  const collected = fees.filter(f=>f.status==='paid').reduce((s,f)=>s+f.amount,0)
  const pending   = fees.filter(f=>f.status!=='paid'&&f.status!=='waived').reduce((s,f)=>s+f.amount,0)

  async function addFee(e) {
    e.preventDefault()
    setSaving(true)
    const { data, error } = await feesApi.create({
      ...addForm,
      amount: parseFloat(addForm.amount),
      status: 'pending',
    })
    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Fee added!')
    setFees(prev => [data, ...prev])
    setShowAdd(false)
    setAddForm({ resident_id:'', fee_type:'monthly_rent', description:'', amount:'', due_date:new Date().toISOString().split('T')[0], note:'' })
    setSaving(false)
  }

  async function markPaid() {
    if (!payFee) return
    const amount = parseFloat(payForm.amount) || payFee.amount
    setSaving(true)
    const { data, error } = await feesApi.markPaid(payFee.id, payForm.method, payForm.ref, amount)
    if (error) { toast.error(error.message); setSaving(false); return }
    toast.success('Payment recorded!')
    setFees(prev => prev.map(f => f.id===payFee.id ? data : f))
    // Show receipt immediately
    const res = residents.find(r=>r.id===payFee.resident_id) || payFee.residents
    setReceiptFee(data)
    setReceiptRes(res)
    setPayFee(null)
    setPayForm({ method:'cash', ref:'', amount:'' })
    setSaving(false)
  }

  function openReceipt(fee) {
    const res = residents.find(r=>r.id===fee.resident_id) || fee.residents
    setReceiptFee(fee)
    setReceiptRes(res)
  }

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:60}}><Spinner size={32}/></div>

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:18}}>
        <div className="shdr" style={{marginBottom:0}}>
          <h2>Billing & Fees</h2>
          <p>Monthly rent, readmission fees, utilities — with PDF receipts</p>
        </div>
        {connected && <button className="btn btn-accent" onClick={()=>setShowAdd(true)}><SvgIcon d={ICONS.plus} size={14}/> Add Fee</button>}
      </div>

      {/* Stats */}
      <div className="g-3 fu fu1" style={{marginBottom:16}}>
        <div className="stat-card sc2">
          <div className="stat-ico"><SvgIcon d={ICONS.check} size={16}/></div>
          <div className="stat-val">{cur}{(collected/1000).toFixed(1)}K</div>
          <div className="stat-lbl">Collected</div>
        </div>
        <div className="stat-card sc4">
          <div className="stat-ico"><SvgIcon d={ICONS.alert} size={16}/></div>
          <div className="stat-val">{cur}{(pending/1000).toFixed(1)}K</div>
          <div className="stat-lbl">Outstanding</div>
        </div>
        <div className="stat-card sc1">
          <div className="stat-ico"><SvgIcon d={ICONS.money} size={16}/></div>
          <div className="stat-val">{fees.length}</div>
          <div className="stat-lbl">Total Records</div>
        </div>
      </div>

      <div className="tabs">
        {[['all','All'],['pending','Pending'],['overdue','Overdue'],['paid','Paid'],['partial','Partial']].map(([k,l])=>(
          <button key={k} className={`tab ${tab===k?'on':''}`} onClick={()=>setTab(k)}>
            {l} <span style={{opacity:.6,marginLeft:3}}>({fees.filter(f=>k==='all'||f.status===k).length})</span>
          </button>
        ))}
      </div>

      <div className="card">
        {filtered.length === 0
          ? <Empty icon="💳" title={connected?'No fees found':'Not connected'} sub={connected?'Add fees using the button above':'Connect Supabase in Settings'}/>
          : <div className="table-wrap">
              <table>
                <thead><tr><th>Resident</th><th>Fee Type</th><th>Description</th><th>Amount</th><th>Due Date</th><th>Paid</th><th>Method</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {filtered.map(fee=>(
                    <tr key={fee.id}>
                      <td style={{fontWeight:600}}>{fee.residents?.full_name||'—'}</td>
                      <td><span className={`badge ${TYPE_BADGE[fee.fee_type]||'badge-muted'}`} style={{textTransform:'capitalize'}}>{fee.fee_type?.replace(/_/g,' ')}</span></td>
                      <td style={{fontSize:11.5,color:'var(--muted)'}}>{fee.description||fee.note||'—'}</td>
                      <td style={{fontWeight:700,color:fee.status==='paid'?'var(--green)':fee.status==='overdue'?'var(--red)':'var(--accent)'}}>{cur}{fee.amount?.toLocaleString()}</td>
                      <td style={{fontSize:11.5,color:'var(--muted)'}}>{new Date(fee.due_date).toLocaleDateString('en-GB')}</td>
                      <td style={{fontSize:11.5,color:'var(--muted)'}}>{fee.paid_date?new Date(fee.paid_date).toLocaleDateString('en-GB'):'—'}</td>
                      <td style={{fontSize:11.5,textTransform:'capitalize'}}>{fee.payment_method||'—'}</td>
                      <td><span className={`badge ${STATUS_BADGE[fee.status]||'badge-muted'}`}>{fee.status}</span></td>
                      <td>
                        <div style={{display:'flex',gap:5}}>
                          {fee.status!=='paid'&&fee.status!=='waived' && (
                            <button className="btn btn-success btn-xs" onClick={()=>{setPayFee(fee);setPayForm({method:'cash',ref:'',amount:String(fee.amount)})}}>Pay</button>
                          )}
                          {fee.status==='paid' && (
                            <button className="btn btn-blue btn-xs" onClick={()=>openReceipt(fee)}>
                              <SvgIcon d={ICONS.printer} size={11}/> Receipt
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        }
      </div>

      {/* Add Fee Modal */}
      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="Add Fee / Charge">
        <form onSubmit={addFee}>
          <div className="form-group">
            <label className="form-label">Resident *</label>
            <select className="form-input" value={addForm.resident_id} onChange={e=>setAddForm({...addForm,resident_id:e.target.value})} required>
              <option value="">— Select resident —</option>
              {residents.map(r=><option key={r.id} value={r.id}>{r.full_name} · {r.phone}</option>)}
            </select>
          </div>
          <div className="g2">
            <div className="form-group">
              <label className="form-label">Fee Type *</label>
              <select className="form-input" value={addForm.fee_type} onChange={e=>setAddForm({...addForm,fee_type:e.target.value})}>
                {FEE_TYPES.map(t=><option key={t} value={t} style={{textTransform:'capitalize'}}>{t.replace(/_/g,' ')}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Amount ({cur}) *</label>
              <input className="form-input" type="number" min="1" value={addForm.amount} onChange={e=>setAddForm({...addForm,amount:e.target.value})} placeholder={String(settings.base_monthly_rent||5000)} required/>
            </div>
          </div>
          <div className="g2">
            <div className="form-group"><label className="form-label">Due Date</label><input className="form-input" type="date" value={addForm.due_date} onChange={e=>setAddForm({...addForm,due_date:e.target.value})}/></div>
            <div className="form-group"><label className="form-label">Description</label><input className="form-input" value={addForm.description} onChange={e=>setAddForm({...addForm,description:e.target.value})} placeholder="e.g. March 2026"/></div>
          </div>
          <div className="form-group"><label className="form-label">Note</label><input className="form-input" value={addForm.note} onChange={e=>setAddForm({...addForm,note:e.target.value})} placeholder="Optional note"/></div>
          <ModalFooter>
            <button type="button" className="btn btn-ghost" onClick={()=>setShowAdd(false)}>Cancel</button>
            <button type="submit" className="btn btn-accent" disabled={saving}>{saving?'Saving…':'Add Fee'}</button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Pay Modal */}
      <Modal open={!!payFee} onClose={()=>setPayFee(null)} title="Record Payment" width={400}>
        {payFee && <>
          <div style={{background:'var(--surface2)',borderRadius:9,padding:14,marginBottom:14}}>
            <div style={{fontWeight:700,marginBottom:4}}>{payFee.residents?.full_name}</div>
            <div style={{fontSize:13,color:'var(--muted)',textTransform:'capitalize'}}>{payFee.fee_type?.replace(/_/g,' ')}</div>
            <div style={{fontFamily:'Fraunces,serif',fontSize:28,color:'var(--accent)',marginTop:8}}>{cur}{payFee.amount?.toLocaleString()}</div>
          </div>
          <div className="form-group">
            <label className="form-label">Amount Paid ({cur})</label>
            <input className="form-input" type="number" value={payForm.amount} onChange={e=>setPayForm({...payForm,amount:e.target.value})} placeholder={String(payFee.amount)}/>
          </div>
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <select className="form-input" value={payForm.method} onChange={e=>setPayForm({...payForm,method:e.target.value})}>
              {PAY_METHODS.map(m=><option key={m} value={m} style={{textTransform:'capitalize'}}>{m.charAt(0).toUpperCase()+m.slice(1)}</option>)}
            </select>
          </div>
          <div className="form-group"><label className="form-label">Transaction Reference</label><input className="form-input" value={payForm.ref} onChange={e=>setPayForm({...payForm,ref:e.target.value})} placeholder="e.g. TXN123456 (optional)"/></div>
          <ModalFooter>
            <button className="btn btn-ghost" onClick={()=>setPayFee(null)}>Cancel</button>
            <button className="btn btn-success" onClick={markPaid} disabled={saving}>{saving?'Saving…':'Confirm & Generate Receipt'}</button>
          </ModalFooter>
        </>}
      </Modal>

      {/* Receipt Modal */}
      <Modal open={!!receiptFee} onClose={()=>setReceiptFee(null)} title="Payment Receipt" width={480}>
        {receiptFee && <ReceiptPreview fee={receiptFee} resident={receiptRes} settings={settings} onClose={()=>setReceiptFee(null)}/>}
      </Modal>
    </div>
  )
}
