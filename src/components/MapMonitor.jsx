import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useApp } from '../context/AppContext'
import { SvgIcon, ICONS, Empty } from './ui'

// Fix for default Leaflet icon paths in builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom markers
const hostelIcon = L.divIcon({
  html: '<div class="map-marker hostel">🏠</div>',
  className: 'custom-div-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20]
});

const inIcon = L.divIcon({
  html: '<div class="map-marker in">🟢</div>',
  className: 'custom-div-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

const outIcon = L.divIcon({
  html: '<div class="map-marker out">🔴</div>',
  className: 'custom-div-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -12]
});

// Component to handle map centering and updating when coordinates change
function MapController({ center }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, map.getZoom())
  }, [center, map])
  return null
}

export default function MapMonitor({ logs = [] }) {
  const { settings, themeName } = useApp()
  const lat = parseFloat(settings.lat) || 23.8103
  const lng = parseFloat(settings.lng) || 90.4125
  const hostelName = settings.hostel_name || 'Hostel'
  
  const center = [lat, lng]

  const todayLogs = logs.filter(l => {
    const d = new Date(l.created_at)
    const today = new Date()
    return d.toDateString() === today.toDateString()
  })

  // Dark mode tile layer if needed, otherwise light
  // Using Jawg Maps or Jawg Dark requires API key, so we'll sticking to standard OSM
  // or use CartoDB Dark Matter which is free for low traffic.
  const isDark = themeName !== 'slate'
  const tileUrl = isDark 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

  const attribution = isDark
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors'

  return (
    <div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>📍 Hostel Location & Entry Log</div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          Powered by Leaflet & OpenStreetMap
        </div>
      </div>

      <div style={{ width: '100%', height: 380, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface2)' }}>
        <MapContainer center={center} zoom={16} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer attribution={attribution} url={tileUrl} />
          <MapController center={center} />
          
          {/* Hostel Marker */}
          <Marker position={center} icon={hostelIcon}>
            <Popup>
              <strong>{hostelName}</strong><br/>
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </Popup>
          </Marker>

          {/* Log Markers (last 20) */}
          {logs.slice(0, 20).map(log => (
            <div key={log.id}>
              {log.in_lat && log.in_lng && (
                <Marker position={[parseFloat(log.in_lat), parseFloat(log.in_lng)]} icon={inIcon}>
                  <Popup>
                    <strong>{log.residents?.full_name}</strong><br/>
                    Check In at {log.in_time?.slice(0, 5)}
                  </Popup>
                </Marker>
              )}
              {log.out_lat && log.out_lng && (
                <Marker position={[parseFloat(log.out_lat), parseFloat(log.out_lng)]} icon={outIcon}>
                  <Popup>
                    <strong>{log.residents?.full_name}</strong><br/>
                    Check Out at {log.out_time?.slice(0, 5)}
                  </Popup>
                </Marker>
              )}
            </div>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 12 }}>
        {[['🏠', 'Hostel'],['🟢', 'Check-in location'],['🔴', 'Check-out location']].map(([dot, label]) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)' }}>
            <span style={{ fontSize: 14 }}>{dot}</span>{label}
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
      
      <style>{`
        .custom-div-icon {
          background: transparent;
          border: none;
        }
        .map-marker {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
          transition: transform 0.2s;
        }
        .map-marker:hover {
          transform: scale(1.2);
        }
        .map-marker.hostel {
          font-size: 28px;
          background: rgba(240, 165, 0, 0.2);
          border-radius: 50%;
          width: 40px;
          height: 40px;
          border: 1px solid #f0a500;
        }
        .leaflet-popup-content-wrapper {
          background: var(--surface);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 8px;
        }
        .leaflet-popup-tip {
          background: var(--surface);
          border: 1px solid var(--border);
        }
      `}</style>
    </div>
  )
}
