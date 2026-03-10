import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { roomsApi } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { parseRoomsCSV, ROOMS_CSV_TEMPLATE } from '../lib/csvImport'
import { SvgIcon, ICONS, Empty, Spinner, Modal, ModalFooter } from '../components/ui'

const blank = { room_number: '', floor: 1, type: 'Single', capacity: 1, monthly_rent: 5000, status: 'available', amenities: [], description: '' }

export default function Rooms() {
  const { settings, connected } = useApp()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editRoom, setEditRoom] = useState(null)
  const [form, setForm] = useState(blank)
  const [saving, setSaving] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileRef = useRef()

  const load = async () => {
    if (!connected) { setLoading(false); return }
    const { data } = await roomsApi.getAll()
    setRooms(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [connected])

  const statusColor = { available: 'var(--green)', occupied: 'var(--red)', maintenance: 'var(--accent)', reserved: 'var(--blue)' }
  const counts = { all: rooms.length, available: rooms.filter(r => r.status === 'available').length, occupied: rooms.filter(r => r.status === 'occupied').length, maintenance: rooms.filter(r => r.status === 'maintenance').length, reserved: rooms.filter(r => r.status === 'reserved').length }
  const filtered = filter === 'all' ? rooms : rooms.filter(r => r.status === filter)
  const floors = [...new Set(rooms.map(r => r.floor))].sort()

  async function saveRoom(e) {
    e.preventDefault()
    setSaving(true)
    if (editRoom) {
      const { error } = await roomsApi.update(editRoom.id, form)
      if (error) { toast.error(error.message); setSaving(false); return }
      setRooms(prev => prev.map(r => r.id === editRoom.id ? { ...r, ...form } : r))
      toast.success('Room updated!')
    } else {
      const { data, error } = await roomsApi.create(form)
      if (error) { toast.error(error.message); setSaving(false); return }
      setRooms(prev => [...prev, data])
      toast.success(`Room ${form.room_number} created!`)
    }
    setShowForm(false); setEditRoom(null); setForm(blank); setSaving(false)
  }

  async function deleteRoom(id) {
    if (!confirm('Delete this room?')) return
    const { error } = await roomsApi.delete(id)
    if (error) { toast.error(error.message); return }
    setRooms(prev => prev.filter(r => r.id !== id))
    toast.success('Room deleted')
  }

  async function handleImport(e) {
    const file = e.target.files?.[0]; if (!file) return
    setImporting(true)
    const { rooms: parsed, errors } = await parseRoomsCSV(file)
    if (errors.length) { toast.error(errors[0]); setImporting(false); return }
    let ok = 0, fail = 0
    for (const r of parsed) {
      const { error } = await roomsApi.create(r)
      if (error) fail++; else ok++
    }
    setImportResult({ ok, fail, total: parsed.length })
    setImporting(false)
    load()
  }

  function downloadTemplate() {
    const blob = new Blob([ROOMS_CSV_TEMPLATE], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'rooms_template.csv'; a.click()
  }

  function openEdit(room) {
    setEditRoom(room)
    setForm({ room_number: room.room_number, floor: room.floor, type: room.type, capacity: room.capacity, monthly_rent: room.monthly_rent, status: room.status, amenities: room.amenities || [], description: room.description || '' })
    setShowForm(true)
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
        <div className="shdr" style={{ marginBottom: 0 }}>
          <h2>Room Management</h2>
          <p>Visual grid — click any room to edit status</p>
        </div>
        {connected && <div style={{ display: 'flex', gap: 9 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => setShowImport(true)}><SvgIcon d={ICONS.upload} size={13} /> Import CSV</button>
          <button className="btn btn-accent" onClick={() => { setEditRoom(null); setForm(blank); setShowForm(true) }}><SvgIcon d={ICONS.plus} size={14} /> Add Room</button>
        </div>}
      </div>

      {/* Filter tabs */}
      <div className="tabs">
        {[['all', 'All'], ['available', 'Available'], ['occupied', 'Occupied'], ['maintenance', 'Maintenance'], ['reserved', 'Reserved']].map(([k, l]) => (
          <button key={k} className={`tab ${filter === k ? 'on' : ''}`} onClick={() => setFilter(k)}>
            {l} <span style={{ opacity: .6, marginLeft: 3 }}>({counts[k]})</span>
          </button>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
        {Object.entries(statusColor).map(([s, c]) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--muted)' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: c }} />
            <span style={{ textTransform: 'capitalize' }}>{s}</span>
          </div>
        ))}
      </div>

      {rooms.length === 0 && !loading && (
        <div className="empty-state"><div className="ei">🏠</div><div className="et">No rooms yet</div><div className="es">Add rooms manually or import from CSV</div></div>
      )}

      {floors.map(fl => {
        const flRooms = filtered.filter(r => r.floor === fl)
        if (flRooms.length === 0) return null
        return (
          <div key={fl} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
              Floor {fl} — {flRooms.length} rooms
            </div>
            <div className="rooms-grid">
              {flRooms.map(room => (
                <div key={room.id} className={`room-cell ${room.status}`} onClick={() => openEdit(room)}>
                  <div className="r-num">{room.room_number}</div>
                  <div className="r-type">{room.type}</div>
                  <div className="r-dot" />
                  <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 3 }}>{settings.currency_symbol}{(room.monthly_rent / 1000).toFixed(1)}K</div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Add/Edit Modal */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditRoom(null); setForm(blank) }} title={editRoom ? `Edit Room ${editRoom.room_number}` : 'Add New Room'}>
        <form onSubmit={saveRoom}>
          <div className="g2">
            <div className="form-group"><label className="form-label">Room Number *</label><input className="form-input" value={form.room_number} onChange={e => setForm({ ...form, room_number: e.target.value })} placeholder="e.g. 101" required /></div>
            <div className="form-group"><label className="form-label">Floor *</label><input className="form-input" type="number" min="1" max={settings.total_floors || 20} value={form.floor} onChange={e => setForm({ ...form, floor: parseInt(e.target.value) })} /></div>
            <div className="form-group"><label className="form-label">Room Type</label><select className="form-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{['Single', 'Double', 'Triple', 'Dorm'].map(t => <option key={t}>{t}</option>)}</select></div>
            <div className="form-group"><label className="form-label">Capacity</label><input className="form-input" type="number" min="1" max="20" value={form.capacity} onChange={e => setForm({ ...form, capacity: parseInt(e.target.value) })} /></div>
            <div className="form-group"><label className="form-label">Monthly Rent ({settings.currency_symbol})</label><input className="form-input" type="number" min="0" value={form.monthly_rent} onChange={e => setForm({ ...form, monthly_rent: parseFloat(e.target.value) })} /></div>
            <div className="form-group"><label className="form-label">Status</label><select className="form-input" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{['available', 'occupied', 'maintenance', 'reserved'].map(s => <option key={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}</select></div>
          </div>
          <div className="form-group"><label className="form-label">Description / Notes</label><input className="form-input" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="AC, WiFi, Attached Bath…" /></div>
          <ModalFooter>
            {editRoom && <button type="button" className="btn btn-danger btn-sm" onClick={() => deleteRoom(editRoom.id)} style={{ marginRight: 'auto' }}>Delete</button>}
            <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setEditRoom(null); setForm(blank) }}>Cancel</button>
            <button type="submit" className="btn btn-accent" disabled={saving}>{saving ? 'Saving…' : editRoom ? 'Save Changes' : 'Add Room'}</button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Import Modal */}
      <Modal open={showImport} onClose={() => { setShowImport(false); setImportResult(null) }} title="Import Rooms from CSV" width={460}>
        <div style={{ marginBottom: 14 }}>
          <button className="btn btn-ghost btn-sm" onClick={downloadTemplate}><SvgIcon d={ICONS.download} size={13} /> Download Template CSV</button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 10 }}>
          CSV columns: <code style={{ background: 'var(--surface2)', padding: '1px 6px', borderRadius: 4 }}>room_number, floor, type, capacity, monthly_rent, status, amenities</code>
        </div>
        <div className="drop-zone" onClick={() => fileRef.current?.click()}>
          <SvgIcon d={ICONS.upload} size={24} />
          <div style={{ marginTop: 8, fontWeight: 600 }}>Click to upload CSV file</div>
          <div style={{ fontSize: 12, marginTop: 3 }}>or drag & drop</div>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
        </div>
        {importing && <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 10, color: 'var(--muted)', fontSize: 13 }}><Spinner size={16} /> Importing rooms…</div>}
        {importResult && (
          <div style={{ marginTop: 12, padding: 12, background: 'var(--surface2)', borderRadius: 8, fontSize: 13 }}>
            <div style={{ color: 'var(--green)', fontWeight: 700 }}>✓ {importResult.ok} rooms imported</div>
            {importResult.fail > 0 && <div style={{ color: 'var(--red)', marginTop: 4 }}>{importResult.fail} failed (duplicate room numbers)</div>}
          </div>
        )}
        <ModalFooter><button className="btn btn-ghost" onClick={() => { setShowImport(false); setImportResult(null) }}>Close</button></ModalFooter>
      </Modal>
    </div>
  )
}
