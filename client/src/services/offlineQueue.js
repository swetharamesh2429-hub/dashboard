const key = 'utap-offline-actions'

const read = () => JSON.parse(localStorage.getItem(key) || '[]')
const write = (items) => localStorage.setItem(key, JSON.stringify(items))

export function queueAction(action) {
  write([...read(), { ...action, id: `${Date.now()}-${Math.random()}`, createdAt: new Date().toISOString() }].slice(-20))
}

export async function flushOfflineQueue(api) {
  const pending = read()
  const remaining = []
  for (const action of pending) {
    try {
      if (action.type === 'ticket-status') await api.setStatus(action.ticketId, action.status, action.notes)
      if (action.type === 'proof') await api.proof(action.ticketId, action.imageUrl, action.notes)
    } catch { remaining.push(action) }
  }
  write(remaining)
  return pending.length - remaining.length
}
