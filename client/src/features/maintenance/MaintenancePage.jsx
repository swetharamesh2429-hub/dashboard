import { useEffect, useState } from 'react'
import { api } from '../../services/api'

export default function MaintenancePage() {
  const [state, setState] = useState({ loading: true, error: '', records: [] })
  useEffect(() => { api.maintenance().then((records) => setState({ loading: false, error: '', records })).catch(() => setState({ loading: false, error: 'Unable to load maintenance history.', records: [] })) }, [])
  if (state.loading) return <section className="owner-card"><h2>Maintenance history</h2><p>Loading completed repair records…</p></section>
  if (state.error) return <section className="owner-card"><h2>Maintenance history</h2><p className="redtext">{state.error}</p></section>
  if (!state.records.length) return <section className="owner-card"><h2>Maintenance history</h2><p>No completed repair records yet.</p></section>
  return <section className="owner-card"><h2>Maintenance history</h2><div className="maintenance-list">{state.records.map((record) => <article key={record.id}><div>{record.proofUrl ? <img src={record.proofUrl} alt={`Repair proof for ${record.vehicle}`}/> : <div className="proof-placeholder">No proof</div>}</div><div><b>{record.vehicle}</b><p>{record.notes || 'Repair completed and returned to service.'}</p><small>Technician: {record.workerName || record.workerId} · {new Date(record.createdAt).toLocaleString()}</small></div></article>)}</div></section>
}
