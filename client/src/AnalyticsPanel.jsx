import { useEffect, useState } from 'react'
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from './services/api'

const trend = [{ name: 'Mon', health: 82 }, { name: 'Tue', health: 78 }, { name: 'Wed', health: 84 }, { name: 'Thu', health: 76 }, { name: 'Fri', health: 81 }, { name: 'Sat', health: 88 }, { name: 'Sun', health: 86 }]
const fallback = { fleetHealth: 78, firstTimeFixRate: 92, downtimeHours: 18, riskDistribution: { immediate: 2, shortTerm: 3, longTerm: 2 } }

export default function AnalyticsPanel() {
  const [metrics, setMetrics] = useState(fallback)
  useEffect(() => { api.analytics().then(setMetrics).catch(() => {}) }, [])
  return <section className="analytics-panel"><div><p className="eyebrow">ANALYTICS</p><h2>Fleet health trend</h2><p>Average predictive health and risk distribution</p></div><div className="analytics-kpis"><span><b>{metrics.fleetHealth}%</b>Fleet health</span><span><b>{metrics.firstTimeFixRate}%</b>First-time fix rate</span><span><b>{metrics.downtimeHours}h</b>Downtime this week</span><span><b>{metrics.riskDistribution?.immediate || 0}</b>Immediate risks</span></div><div className="chart"><ResponsiveContainer width="100%" height={220}><BarChart data={trend}><XAxis dataKey="name" stroke="#94a3b8" fontSize={11}/><YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11}/><Tooltip contentStyle={{ background: '#172033', border: '1px solid #334155', borderRadius: 6 }}/><Bar dataKey="health" fill="#22d3ee" radius={[4, 4, 0, 0]}/></BarChart></ResponsiveContainer></div></section>
}
