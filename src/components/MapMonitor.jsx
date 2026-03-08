import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { SvgIcon, ICONS, Empty } from './ui'

// Loads Google Maps JS API dynamically
function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(window.google.maps); return }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.onload = () => resolve(window.google.maps)
    script.onerror = reject
    document.head.appendChild(script)
  })
}

// Static map fallback (no API key needed, using OpenStreetMap embed)
function StaticMap({ lat, lng, hostelName, logs }) {
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01}%2C${lat-0.01}%2C${lng+0.01}%2C${lat+0.01}&layer=mapnik&marker=${lat}%2C${lng}`
  return (
    <div style={{ position: 'relative' }}>
      <iframe
        src={mapUrl}
        style={{ width: '100%', height: 380, border: 'none', borderRadius: 10 }}
        title="Hostel Location"
        loading="lazy"
      />
      <div style={{
        position: 'absolute', bottom: 10, left: 10,
        background: 'rgba(0,0,0,.8)', color: '#fff', padding: '8px 12px',
        borderRadius: 8, fontSize: 12, backdropFilter: 'blur(4px)',
        border: '1px solid rgba(255,255,255,.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <SvgIcon d={ICONS.pin} size={12} />
          <span style={{ fontWeight: 700 }}>{hostelName}</span>
        </div>
        <div style={{ color: '#aaa', marginTop: 2 }}>{lat.toFixed(4)}, {lng.toFixed(4)}</div>
      </div>
      <div style={{
        position: 'absolute', top: 10, right: 10,
        background: 'rgba(240,165,0,.9)', color: '#000', padding: '4px 10px',
        borderRadius: 6, fontSize: 11, fontWeight: 700
      }}>
        OpenStreetMap · Add API key for full Google Maps
      </div>
    </div>
  )
}

// Google Maps component with markers
function GoogleMapView({ apiKey, lat, lng, hostelName, logs }) {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!apiKey) return
    loadGoogleMaps(apiKey)
      .then((maps) => {
        if (!mapRef.current) return
        const map = new maps.Map(mapRef.current, {
          center: { lat, lng },
          zoom: 16,
          styles: [
            { elementType: 'geometry', stylers: [{ color: '#0f1623' }] },
            { elementType: 'labels.text.stroke', stylers: [{ color: '#0f1623' }] },
            { elementType: 'labels.text.fill', stylers: [{ color: '#7a8fa6' }] },
            { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e2d45' }] },
            { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#020c18' }] },
            { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#172033' }] },
          ],
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
        })

        // Hostel marker
        new maps.Marker({
          position: { lat, lng },
          map,
          title: hostelName,
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: 14,
            fillColor: '#f0a500',
            fillOpacity: 1,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
          label: { text: '🏠', fontSize: '18px' },
        })

        // Check-in markers (last 20)
        logs.slice(0, 20).forEach(log => {
          if (log.in_lat && log.in_lng) {
            new maps.Marker({
              position: { lat: log.in_lat, lng: log.in_lng },
              map,
              title: `${log.residents?.full_name} — Check In`,
              icon: {
                path: maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#22c55e',
                fillOpacity: 0.9,
                strokeColor: '#fff',
                strokeWeight: 1.5,
              },
            })
          }
          if (log.out_lat && log.out_lng) {
            new maps.Marker({
              position: { lat: log.out_lat, lng: log.out_lng },
              map,
              title: `${log.residents?.full_name} — Check Out`,
              icon: {
                path: maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#ef4444',
                fillOpacity: 0.9,
                strokeColor: '#fff',
                strokeWeight: 1.5,
              },
            })
          }
        })

        mapInstance.current = map
        setLoaded(true)
      })
      .catch(() => setError('Failed to load Google Maps. Check your API key.'))
  }, [apiKey, lat, lng, hostelName, logs])

  if (error) return <div style={{ padding: 20, color: 'var(--red)', background: 'var(--surface2)', borderRadius: 10 }}>{error}</div>
  if (!apiKey) return <StaticMap lat={lat} lng={lng} hostelName={hostelName} logs={logs} />

  return (
    <div ref={mapRef} style={{ width: '100%', height: 380, borderRadius: 10, background: 'var(--surface2)' }}>
      {!loaded && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: 'var(--muted)' }}>
          <div style={{ width: 20, height: 20, border: '2px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin .6s linear infinite' }} />
          Loading map…
        </div>
      )}
    </div>
  )
}

// Main Map Monitoring Panel
export default function MapMonitor({ logs = [] }) {
  const { settings } = useApp()
  const lat = parseFloat(settings.lat) || 23.8103
  const lng = parseFloat(settings.lng) || 90.4125
  const apiKey = settings.google_maps_api_key || ''
  const hostelName = settings.hostel_name || 'Hostel'

  const todayLogs = logs.filter(l => {
    const d = new Date(l.created_at)
    const today = new Date()
    return d.toDateString() === today.toDateString()
  })

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>📍 Hostel Location & Entry Log</div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          {apiKey ? 'Google Maps active' : 'Using OpenStreetMap preview — add Google Maps API key in Settings for full features'}
        </div>
      </div>

      <GoogleMapView apiKey={apiKey} lat={lat} lng={lng} hostelName={hostelName} logs={logs} />

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 12 }}>
        {[['🟡', 'Hostel'],['🟢', 'Check-in location'],['🔴', 'Check-out location']].map(([dot, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)' }}>
            <span>{dot}</span>{label}
          </div>
        ))}
      </div>

      {/* Today's log table */}
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--muted)' }}>
          Today's Check-In / Check-Out Log ({todayLogs.length} events)
        </div>
        {todayLogs.length === 0 ? (
          <Empty icon="🗓️" title="No activity today" sub="Check-ins and check-outs will appear here" />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Resident</th>
                  <th>Room</th>
                  <th>Check-In Time</th>
                  <th>Check-Out Time</th>
                  <th>In Location</th>
                  <th>Out Location</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {todayLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontWeight: 600 }}>{log.residents?.full_name || '—'}</td>
                    <td>{log.rooms?.room_number || '—'}</td>
                    <td style={{ color: 'var(--green)', fontWeight: 600 }}>
                      {log.in_time ? log.in_time.slice(0, 5) : '—'}
                    </td>
                    <td style={{ color: log.out_time ? 'var(--red)' : 'var(--muted)' }}>
                      {log.out_time ? log.out_time.slice(0, 5) : '—'}
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {log.in_lat ? `${parseFloat(log.in_lat).toFixed(4)}, ${parseFloat(log.in_lng).toFixed(4)}` : '—'}
                    </td>
                    <td style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {log.out_lat ? `${parseFloat(log.out_lat).toFixed(4)}, ${parseFloat(log.out_lng).toFixed(4)}` : '—'}
                    </td>
                    <td>
                      <span className={`badge ${log.status === 'active' ? 'badge-green' : 'badge-muted'}`}>
                        {log.status === 'active' ? 'Inside' : 'Checked Out'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
