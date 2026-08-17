import { useEffect, useMemo, useState } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { api } from '../../services/api'

const fallback = ['245', '118', '302', '091', '411', '633', '277', '510', '709', '830', '904', '125'].map((number, index) => ({ id: `vehicle-${number}`, vehicleId: `TRUCK #${number}`, health: index === 0 ? 42 : index === 2 ? 38 : 68 + index * 2, status: index === 0 ? 'IN_GARAGE' : index === 2 ? 'REPAIRING' : 'ON_ROAD', location: { lat: 13.055 + index * 0.009, lng: 80.205 + (index % 4) * 0.018 } }))
const colour = (health) => health < 60 ? '#ef4444' : health < 80 ? '#f59e0b' : '#22c55e'

function FleetViewport({ points }) {
  const map = useMap()
  useEffect(() => {
    const resize = () => map.invalidateSize()
    const frame = requestAnimationFrame(() => { resize(); if (points.length) map.fitBounds(points.map((point) => [point.lat, point.lng]), { padding: [42, 42], maxZoom: 13 }) })
    window.addEventListener('resize', resize)
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize) }
  }, [map, points])
  return null
}

export default function FleetMap() {
  const [vehicles, setVehicles] = useState(fallback)
  const [mapError, setMapError] = useState(false)
  useEffect(() => { api.vehicles({ limit: 50 }).then((result) => setVehicles(result.items?.length ? result.items : fallback)).catch(() => setMapError(true)) }, [])
  const points = useMemo(() => vehicles.map((vehicle, index) => ({ ...vehicle, ...(vehicle.location?.lat && vehicle.location?.lng ? vehicle.location : fallback[index % fallback.length].location) })), [vehicles])
  if (mapError) return <section className="fleet-map-fallback"><b>Fleet map is temporarily unavailable.</b><p>12 fleet vehicles are still available in the Vehicles workspace.</p></section>
  return <section className="fleet-map-card"><header><div><p className="eyebrow">LIVE FLEET MAP</p><h2>Chennai operations zone</h2><span>{points.length} vehicles reporting · refreshes from telemetry</span></div><div className="map-legend"><i className="healthy"/> Healthy <i className="attention"/> Attention <i className="critical"/> Critical</div></header><div className="fleet-map-canvas"><MapContainer center={[13.0827, 80.2707]} zoom={12} scrollWheelZoom style={{ height: '100%', width: '100%' }}><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><FleetViewport points={points}/>{points.map((vehicle) => { const risk = vehicle.health < 60 ? 'IMMEDIATE' : vehicle.health < 80 ? 'SHORT-TERM' : 'HEALTHY'; return <CircleMarker key={vehicle.id} center={[vehicle.lat, vehicle.lng]} radius={10} pathOptions={{ color: colour(vehicle.health), fillColor: colour(vehicle.health), fillOpacity: .95, weight: 3 }}><Tooltip direction="top" offset={[0, -9]} opacity={.95}>{vehicle.vehicleId}</Tooltip><Popup><strong>{vehicle.vehicleId}</strong><br/>Driver: Assigned driver<br/>Destination: Central Garage<br/>ETA: {vehicle.status === 'IN_GARAGE' ? 'Arrived' : '25 min'}<br/>Health: {vehicle.health}% · {risk}<br/>Status: {vehicle.status.replace('_', ' ')}</Popup></CircleMarker> })}</MapContainer></div></section>
}
