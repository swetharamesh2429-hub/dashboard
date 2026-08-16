import { lazy, Suspense, useEffect, useState } from 'react'
import './App.css'
import './auth.css'
import './map.css'
import './analytics.css'
import './driver.css'
import './owner.css'
import './overrides.css'
import './notifications.css'
import './voice.css'
import './proof.css'
import './premium.css'
import { api } from './services/api'
import { connectRealtime } from './services/socket'
import { flushOfflineQueue } from './services/offlineQueue'
import AuthPortal from './AuthPortal'
import OwnerPortal from './OwnerPortal'
import DriverPortal from './DriverPortal'
import WorkerPortal from './WorkerPortal'
import NotificationCenter from './NotificationCenter'

const FleetMap = lazy(() => import('./FleetMap'))
const AnalyticsPanel = lazy(() => import('./AnalyticsPanel'))
const fallbackTickets = [
  { id: 'UT-2048', vehicle: 'TRUCK #245', issue: 'Battery Voltage Instability', fault: 'Battery Voltage Instability', risk: 'IMMEDIATE', rootCause: 'Alternator regulator fluctuation', status: 'ASSIGNED', deadline: '2026-08-15T15:00:00Z' },
  { id: 'UT-2047', vehicle: 'TRUCK #302', issue: 'Wiring Fault', fault: 'Wiring Fault', risk: 'IMMEDIATE', rootCause: 'Damaged harness insulation', status: 'IN_PROGRESS', deadline: '2026-08-15T13:30:00Z' },
  { id: 'UT-2043', vehicle: 'TRUCK #118', issue: 'Brake Pad Wear', fault: 'Brake Pad Wear', risk: 'SHORT-TERM', rootCause: 'Pad thickness below threshold', status: 'ASSIGNED', deadline: '2026-08-16T10:00:00Z' },
]
const fallbackWorkers = [{ id: 'worker-1', name: 'Asha Nair', status: 'AVAILABLE', attendance: 'CHECKED_IN' }, { id: 'worker-2', name: 'Maria Silva', status: 'BUSY', attendance: 'CHECKED_IN' }, { id: 'worker-3', name: 'Dev Kumar', status: 'AVAILABLE', attendance: 'CHECKED_IN' }]
const fallbackVehicles = ['245', '118', '302', '091', '411', '633', '277', '510', '709', '830', '904', '125'].map((number, index) => ({ id: `vehicle-${number}`, vehicleId: `TRUCK #${number}`, health: index === 0 ? 42 : index === 2 ? 38 : 68 + index * 2, status: index === 0 ? 'IN_GARAGE' : index === 2 ? 'REPAIRING' : 'ON_ROAD' }))

export default function App() {
  const [auth, setAuth] = useState(() => JSON.parse(localStorage.getItem('utap-session') || 'null'))
  const [tickets, setTickets] = useState(fallbackTickets)
  const [workers, setWorkers] = useState(fallbackWorkers)
  const [vehicles, setVehicles] = useState(fallbackVehicles)
  const [notice, setNotice] = useState('Live telemetry connected · demo fleet reporting')
  const [selected, setSelected] = useState(null)
  const [online, setOnline] = useState(navigator.onLine)
  const role = auth?.role?.toLowerCase()

  useEffect(() => {
    if (!auth) return
    const expected = `/${role}/dashboard`
    if (!window.location.pathname.startsWith(`/${role}/`)) window.history.replaceState({}, '', expected)
  }, [auth, role])

  useEffect(() => {
    if (!auth?.token) return
    api.tickets({ limit: 50 }).then((result) => setTickets(result.items || [])).catch(() => setNotice('Using retained demo task data while the API reconnects.'))
    api.vehicles({ limit: 50 }).then((result) => setVehicles(result.items || [])).catch(() => {})
    if (auth.role === 'OWNER') api.workers().then(setWorkers).catch(() => {})
    return connectRealtime(auth.organizationId || 'abc-logistics', {
      'ticket:created': (ticket) => { setTickets((items) => [ticket, ...items]); setNotice(`New ${ticket.risk} risk detected for ${ticket.vehicle}.`) },
      'ticket:updated': (ticket) => { setTickets((items) => items.map((item) => item.id === ticket.id ? { ...item, ...ticket } : item)); setNotice(`${ticket.vehicle} repair workflow updated.`) },
      'notification:new': (notification) => setNotice(notification.message),
    })
  }, [auth])

  useEffect(() => {
    const up = async () => { setOnline(true); const flushed = await flushOfflineQueue(api); setNotice(flushed ? `${flushed} queued repair action(s) synced.` : 'Connection restored · live updates reconnected.') }
    const down = () => { setOnline(false); setNotice('You are offline. Current task data remains available.') }
    window.addEventListener('online', up); window.addEventListener('offline', down)
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down) }
  }, [])

  const login = (session) => {
    const normalized = { ...session, organizationId: session.organizationId || 'abc-logistics' }
    localStorage.setItem('utap-session', JSON.stringify(normalized))
    window.history.replaceState({}, '', `/${normalized.role.toLowerCase()}/dashboard`)
    setAuth(normalized)
  }
  const logout = () => { api.logout().catch(() => {}); localStorage.removeItem('utap-session'); window.history.replaceState({}, '', '/login'); setAuth(null) }
  const updateTicket = (updated) => setTickets((items) => items.map((item) => item.id === updated.id ? { ...item, ...updated } : item))
  const simulate = async (risk) => {
    try { const ticket = await api.simulate(risk); setTickets((items) => [ticket, ...items]); setNotice(`New ${ticket.risk} predictive ticket created for ${ticket.vehicle}.`) } catch { setNotice('Telemetry simulator is offline; demo state remains available.') }
  }
  const assign = async (workerId, deadline) => {
    if (!selected || !workerId) return
    const worker = workers.find((item) => item.id === workerId)
    try { const ticket = await api.assign(selected.id, workerId, deadline); updateTicket({ ...ticket, worker: worker?.name }); setNotice(`Task assigned to ${worker?.name || 'technician'} · worker notified.`) } catch { updateTicket({ ...selected, workerId, worker: worker?.name, deadline }); setNotice('Assignment retained locally until the API reconnects.') }
    setSelected(null)
  }

  if (!auth) return <AuthPortal onLogin={login} />
  const active = tickets.filter((ticket) => ticket.status !== 'COMPLETED').length
  return <main>{!online && <div className="offline" role="status">You are offline. Current work remains available and retry can continue after reconnection.</div>}<header className="top"><div className="brand"><div className="mark">U</div><div><b>UTAP</b><small>UNIFIED TELEMETRY-TO-ACTION</small></div></div><div className="live"><span></span>{notice}</div><NotificationCenter latest={notice}/><button className="profile" onClick={logout} title="Log out">{auth.name?.split(' ').map((part) => part[0]).join('')}<small>Logout</small></button></header>{role === 'owner' && <OwnerPortal tickets={tickets} vehicles={vehicles} workers={workers} active={active} simulate={simulate} select={setSelected} map={<Suspense fallback={<div className="lazyload">Loading fleet map...</div>}><FleetMap/></Suspense>} analytics={<Suspense fallback={<div className="lazyload">Loading analytics...</div>}><AnalyticsPanel/></Suspense>}/>} {role === 'driver' && <DriverPortal onNotice={setNotice}/>} {role === 'worker' && <WorkerPortal tickets={tickets} onNotice={setNotice} onTicketUpdated={updateTicket}/>} {selected && <AssignmentModal ticket={selected} workers={workers} onClose={() => setSelected(null)} onAssign={assign}/>}</main>
}

function AssignmentModal({ ticket, workers, onClose, onAssign }) {
  const [workerId, setWorkerId] = useState('')
  const [deadline, setDeadline] = useState(ticket.deadline ? new Date(ticket.deadline).toISOString().slice(0, 16) : '')
  const [error, setError] = useState('')
  const submit = (event) => { event.preventDefault(); if (!workerId || !deadline) return setError('Select an available technician and repair deadline.'); onAssign(workerId, deadline) }
  return <div className="modalback" role="dialog" aria-modal="true"><form className="modal" onSubmit={submit}><button type="button" className="close" onClick={onClose}>×</button><p className="eyebrow">ASSIGN REPAIR TASK</p><h2>{ticket.vehicle}</h2><p>{ticket.fault || ticket.issue}</p><label>Available technician<select required value={workerId} onChange={(event) => setWorkerId(event.target.value)}><option value="">Select a worker</option>{workers.filter((worker) => worker.status === 'AVAILABLE').map((worker) => <option key={worker.id} value={worker.id}>{worker.name} · {worker.attendance}</option>)}</select></label><label>Repair deadline<input required type="datetime-local" value={deadline} onChange={(event) => setDeadline(event.target.value)}/></label>{error && <p className="formerror">{error}</p>}<button className="primary wide">Assign & notify worker</button></form></div>
}
