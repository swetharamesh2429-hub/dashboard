import './kanban.css'

const columns = [{ key: 'ASSIGNED', label: 'Assigned', tone: 'assigned' }, { key: 'IN_PROGRESS', label: 'In Progress', tone: 'progress' }, { key: 'COMPLETED', label: 'Completed', tone: 'completed' }]

export default function KanbanBoard({ tickets, onSelect }) {
  return <section className="kanban" aria-label="Repair ticket Kanban board">{columns.map((column) => { const items = tickets.filter((ticket) => ticket.status === column.key); return <div className={`kanban-column ${column.tone}`} key={column.key}><header><div><span className="kanban-dot"/><b>{column.label}</b></div><em>{items.length}</em></header><div className="kanban-cards">{items.length ? items.map((ticket) => <button className="kanban-card" key={ticket.id} onClick={() => onSelect(ticket)}><div className="kanban-card-top"><b>{ticket.vehicle}</b><span className={`kanban-risk ${ticket.risk?.toLowerCase()}`}>{ticket.risk}</span></div><p>{ticket.fault || ticket.issue}</p><dl><div><dt>Deadline</dt><dd>{ticket.deadline ? new Date(ticket.deadline).toLocaleDateString() : 'Not set'}</dd></div><div><dt>Worker</dt><dd>{ticket.worker || ticket.workerId || 'Unassigned'}</dd></div></dl><footer>{ticket.rootCause || 'Open task details'}</footer></button>) : <div className="kanban-empty">No tickets in this stage.</div>}</div></div> })}</section>
}
