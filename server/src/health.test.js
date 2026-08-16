import { spawn } from 'node:child_process'
import { setTimeout as wait } from 'node:timers/promises'

const child = spawn(process.execPath, ['src/index.js'], { stdio: 'inherit', env: { ...process.env, PORT: '5051', JWT_SECRET: 'test-secret', MONGO_URI: '', NODE_ENV: 'test' } })
try {
  let health
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try { health = await fetch('http://localhost:5051/api/health').then(response => response.json()); break } catch { await wait(500) }
  }
  if (!health) throw new Error('API did not start in time')
  if (health.status !== 'ok') throw new Error('Health endpoint failed')
  const login = await fetch('http://localhost:5051/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'owner@utap.demo', password: 'Demo@123', portal: 'OWNER' }) }).then(response => response.json())
  if (!login.token || login.user.role !== 'OWNER') throw new Error('Role login failed')
  const mismatch = await fetch('http://localhost:5051/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'owner@utap.demo', password: 'Demo@123', portal: 'WORKER' }) })
  if (mismatch.status !== 403) throw new Error('Portal role mismatch was not rejected')
  const ownerHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${login.token}` }
  const workers = await fetch('http://localhost:5051/api/workers', { headers: ownerHeaders }).then(response => response.json())
  if (!workers.some(worker => worker.id === 'worker-1')) throw new Error('Worker availability endpoint failed')
  const created = await fetch('http://localhost:5051/api/telemetry/simulate', { method: 'POST', headers: ownerHeaders, body: JSON.stringify({ risk: 'IMMEDIATE' }) }).then(response => response.json())
  if (created.risk !== 'IMMEDIATE') throw new Error('Telemetry ticket creation failed')
  const deadline = '2026-08-20T12:00:00.000Z'
  const assigned = await fetch(`http://localhost:5051/api/tickets/${created.id}/assign`, { method: 'POST', headers: ownerHeaders, body: JSON.stringify({ workerId: 'worker-1', deadline }) }).then(response => response.json())
  if (assigned.workerId !== 'worker-1' || !String(assigned.deadline).startsWith('2026-08-20')) throw new Error('Ticket assignment failed')
  const worker = await fetch('http://localhost:5051/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'worker@utap.demo', password: 'Demo@123', portal: 'WORKER' }) }).then(response => response.json())
  const workerHeaders = { 'Content-Type': 'application/json', Authorization: `Bearer ${worker.token}` }
  const started = await fetch(`http://localhost:5051/api/tickets/${created.id}/status`, { method: 'POST', headers: workerHeaders, body: JSON.stringify({ status: 'IN_PROGRESS' }) }).then(response => response.json())
  const completed = await fetch(`http://localhost:5051/api/tickets/${created.id}/status`, { method: 'POST', headers: workerHeaders, body: JSON.stringify({ status: 'COMPLETED', notes: 'Automated verification repair note.' }) }).then(response => response.json())
  if (started.status !== 'IN_PROGRESS' || completed.status !== 'COMPLETED') throw new Error('Ticket lifecycle failed')
  console.log('UTAP closed-loop API smoke test passed')
} finally { child.kill() }
