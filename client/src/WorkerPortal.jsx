import { lazy, Suspense, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from './services/api'
import { queueAction } from './services/offlineQueue'

const defaultSteps = ['Secure vehicle and isolate power', 'Inspect battery terminals and ground cable', 'Measure alternator output (13.8–14.7 V)', 'Replace the failed component and verify charging']
const ARRepairGuide = lazy(() => import('./features/ar/ARRepairGuide'))

export default function WorkerPortal({ tickets = [], onNotice, onTicketUpdated }) {
  const navigate = useNavigate()
  const [checked, setChecked] = useState(false)
  const [selectedId, setSelectedId] = useState('')
  const [ai, setAi] = useState('')
  const [ar, setAr] = useState(null)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const taskList = useMemo(() => tickets.filter((ticket) => ticket.status !== 'COMPLETED'), [tickets])
  const task = taskList.find((ticket) => ticket.id === selectedId) || taskList[0]

  const attend = async () => {
    try { await api.workerCheckIn() } catch {}
    setChecked(true)
    onNotice('Technician attendance check-in recorded.')
  }

  const transition = async () => {
    if (!task) return
    const next = task.status === 'ASSIGNED' ? 'IN_PROGRESS' : 'COMPLETED'
    setBusy(true)
    try {
      const updated = await api.setStatus(task.id, next, notes)
      onTicketUpdated(updated)
      onNotice(next === 'COMPLETED' ? `${task.vehicle} repair completed — owner notified.` : 'Repair started — task is now in progress.')
    } catch (error) {
      queueAction({ type: 'ticket-status', ticketId: task.id, status: next, notes })
      onTicketUpdated({ ...task, status: next })
      onNotice(error.message || 'Connection unavailable. The task action is queued for retry.')
    } finally { setBusy(false) }
  }

  const ask = async () => {
    if (!task) return
    setBusy(true)
    try {
      const result = await api.repairAssistant({ vehicle: task.vehicle, fault: task.fault || task.issue, rootCause: task.rootCause, prediction: task.risk, repairProcedure: defaultSteps, question: 'What should I check first and which tool do I need?' })
      setAi(result.answer)
    } catch { setAi('Inspect terminal corrosion, ground continuity, and alternator output before replacing components. Use a multimeter and isolate power before disconnecting wiring.') } finally { setBusy(false) }
  }

  const loadAr = async () => { if (!task) return; try { setAr(await api.arProcedure(task.fault || task.issue)) } catch { setAr({ mode: 'fallback', steps: defaultSteps }) } }

  const upload = (event) => {
    const file = event.target.files?.[0]
    if (!file || !task) return
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) return onNotice('Use a PNG, JPEG, or WebP proof image of 2 MB or less.')
    const reader = new FileReader()
    reader.onload = async () => {
      try { await api.proof(task.id, reader.result, notes); onNotice('Repair proof uploaded and linked to the task.') } catch { queueAction({ type: 'proof', ticketId: task.id, imageUrl: reader.result, notes }); onNotice('Proof upload is queued for retry when connected.') }
    }
    reader.readAsDataURL(file)
  }

  if (!checked) return <section className="checkin"><p className="eyebrow">ATTENDANCE CHECK-IN</p><h1>Ready to start your shift?</h1><p>Check in to receive and work on assigned repairs.</p><button className="primary wide" onClick={attend}>Check in now</button></section>
  if (!task) return <section className="worker-empty"><div className="worker-empty-card"><p className="eyebrow">TECHNICIAN WORKSPACE</p><h1>You are ready for the next repair.</h1><p>There are no active assignments for your account right now. When fleet operations assigns a ticket, it will appear here in real time with its risk level, deadline, repair guide, and safety checklist.</p><div className="worker-empty-grid"><div><b>Attendance</b><span>Checked in · available for dispatch</span></div><div><b>Safety readiness</b><span>PPE and diagnostic workflow ready</span></div><div><b>Live updates</b><span>Task notifications enabled</span></div></div></div></section>

  return <section className="taskwrap"><p className="eyebrow">MY TASKS</p><div className="worker-task-list">{taskList.map((item) => <button key={item.id} className={item.id === task.id ? 'selected' : ''} onClick={() => setSelectedId(item.id)}><b>{item.vehicle}</b><span>{item.fault || item.issue} · {item.risk}</span></button>)}</div><div className="taskhero"><div><span className={`risk ${task.risk === 'IMMEDIATE' ? 'critical' : 'warning'}`}>{task.risk}</span><h1>{task.vehicle}</h1><h2>{task.fault || task.issue}</h2><p>Central Garage · Due {task.deadline ? new Date(task.deadline).toLocaleString() : 'today'}</p></div><span className={`status ${task.status.toLowerCase()}`}>{task.status.replace('_', ' ')}</span></div><div className="taskgrid"><section className="panel procedure"><h2>Diagnosis & repair plan</h2><div className="cause"><b>Predicted root cause</b><p>{task.rootCause || 'Verify the fault with the recommended diagnostic checks.'}</p></div><h3>Recommended checklist</h3>{defaultSteps.map((step, index) => <label key={step}><input type="checkbox" disabled={task.status === 'COMPLETED'} /> <span>{index + 1}</span>{step}</label>)}<div className="taskactions"><button className="secondary" disabled={busy} onClick={ask}>Ask AI</button><button className="secondary" onClick={loadAr}>Launch AR guide</button><button className="primary" disabled={busy || task.status === 'COMPLETED'} onClick={transition}>{task.status === 'ASSIGNED' ? 'Start repair' : 'Complete repair'}</button></div>{ai && <div className="ai"><b>UTAP Gemini repair assistant</b><p>{ai}</p></div>}</section><section className="panel tools"><h2>Tools required</h2>{['Digital multimeter', 'Battery terminal brush', '10 mm socket', 'Safety gloves'].map((tool) => <p className="tool" key={tool}>• {tool}</p>)}<hr/><h3>Repair completion notes</h3><textarea className="worker-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Work performed, readings, and verification notes"/><h3>Repair proof</h3><label className="upload">+ Add repair photo<input hidden accept="image/png,image/jpeg,image/webp" type="file" onChange={upload}/></label><p className="muted">PNG, JPEG, or WebP · 2 MB maximum</p><hr/><h3>VR training sandbox</h3><button className="secondary" onClick={() => navigate('/worker/training')}>Launch battery training</button></section></div>{ar && <Suspense fallback={<div className="lazyload">Loading camera repair guide…</div>}><ARRepairGuide fault={task.fault || task.issue} steps={ar.steps || defaultSteps} onClose={() => setAr(null)}/></Suspense>}</section>
}
