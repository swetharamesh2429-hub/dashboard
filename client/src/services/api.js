const base = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

async function request(path, options = {}) {
  const token = JSON.parse(localStorage.getItem('utap-session') || 'null')?.token
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers },
  })
  const data = await response.json().catch(() => ({ message: 'Service returned an invalid response.' }))
  if (!response.ok) throw new Error(data.message || 'Request failed.')
  return data
}

export const api = {
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  register: (payload) => request('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  tickets: (params = {}) => request(`/tickets?${new URLSearchParams(params)}`),
  vehicles: (params = {}) => request(`/vehicles?${new URLSearchParams(params)}`),
  workers: () => request('/workers'),
  assign: (id, workerId, deadline) => request(`/tickets/${id}/assign`, { method: 'POST', body: JSON.stringify({ workerId, deadline }) }),
  setStatus: (id, status, notes = '') => request(`/tickets/${id}/status`, { method: 'POST', body: JSON.stringify({ status, notes }) }),
  simulate: (risk) => request('/telemetry/simulate', { method: 'POST', body: JSON.stringify({ risk }) }),
  repairAssistant: (context) => request('/ai/repair-assistant', { method: 'POST', body: JSON.stringify(typeof context === 'string' ? { fault: context } : context) }),
  arProcedure: (fault) => request(`/ar/procedures/${encodeURIComponent(fault)}`),
  proof: (id, imageUrl, notes) => request(`/tickets/${id}/proof`, { method: 'POST', body: JSON.stringify({ imageUrl, notes }) }),
  driverCheckIn: () => request('/driver/check-in', { method: 'POST', body: '{}' }),
  driverCheckOut: () => request('/driver/check-out', { method: 'POST', body: '{}' }),
  dvir: (vehicleId) => request('/driver/dvir', { method: 'POST', body: JSON.stringify({ vehicleId }) }),
  sos: (vehicleId) => request('/driver/sos', { method: 'POST', body: JSON.stringify({ vehicleId }) }),
  workerCheckIn: () => request('/worker/check-in', { method: 'POST', body: '{}' }),
  notifications: () => request('/notifications'),
  analytics: () => request('/analytics'),
  maintenance: () => request('/maintenance'),
  driverVehicle: () => request('/driver/vehicle'),
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token, password) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) }),
  logout: () => request('/auth/logout', { method: 'POST', body: '{}' }),
}
