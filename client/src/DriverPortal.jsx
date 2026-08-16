import { useState } from 'react'
import { api } from './services/api'

export default function DriverPortal({ onNotice }) {
  const [checkedIn, setCheckedIn] = useState(false)
  const [dvir, setDvir] = useState(false)
  const [sos, setSos] = useState(false)
  const [message, setMessage] = useState('')
  const toggleShift = async () => {
    try { await (checkedIn ? api.driverCheckOut() : api.driverCheckIn()) } catch {}
    setCheckedIn(!checkedIn)
    const text = checkedIn ? 'Driver check-out recorded.' : 'Driver check-in recorded · TRUCK #245 is active.'
    setMessage(text); onNotice(text)
  }
  const submitDvir = async (event) => { event.preventDefault(); try { await api.dvir('vehicle-245') } catch {}; setDvir(false); setMessage('DVIR submitted to fleet operations.'); onNotice('Driver vehicle inspection report submitted.') }
  const sendSos = async () => { try { await api.sos('vehicle-245') } catch {}; setSos(false); setMessage('SOS sent. Fleet operations has been notified.'); onNotice('SOS dispatched to fleet operations.') }
  return <div className="driver"><div className="driverTop"><span>TRUCK #245</span><b>{checkedIn ? 'ON DUTY' : '08:42 AM'}</b></div><section className="driveralert"><span>IMMEDIATE RISK</span><h1>Engine electrical system needs attention</h1><p>Battery voltage unstable · Nearest garage: 4 km</p><button onClick={() => setMessage('Alert acknowledged. Continue safely to the nearest garage.')}>Acknowledge alert</button></section><div className="health"><p>VEHICLE HEALTH</p><h1>42<span>%</span></h1><div className="bar"><i/></div><p>Service recommended before next route.</p></div><div className="driverstats"><Stat n="91°C" l="Engine temp" d="Normal"/><Stat n="11.4V" l="Battery" d="Low" red/><Stat n="68%" l="Fuel" d="214 km range"/></div>{message && <p className="driver-message" role="status">{message}</p>}<div className="quick"><button onClick={toggleShift}><span>{checkedIn ? 'Check out' : 'Check in'}</span></button><button onClick={() => setDvir(true)}><span>Quick DVIR</span></button><button className="sos" onClick={() => setSos(true)}>SOS<span>Emergency</span></button></div>{dvir && <div className="driver-modal"><form onSubmit={submitDvir}><h2>Quick DVIR</h2><p>Is the vehicle safe to operate?</p><label><input required type="radio" name="safe" value="yes"/> Yes, with noted issue</label><label><input required type="radio" name="safe" value="no"/> No, remove from service</label><textarea placeholder="Optional inspection note"/><button className="primary">Submit DVIR</button><button type="button" onClick={() => setDvir(false)}>Cancel</button></form></div>}{sos && <div className="driver-modal"><section><h2>Send emergency SOS?</h2><p>This immediately alerts fleet operations with your vehicle location.</p><button className="danger" onClick={sendSos}>Send SOS now</button><button onClick={() => setSos(false)}>Cancel</button></section></div>}</div>
}

function Stat({ n, l, d, red }) { return <section className="metric"><div><span>{l}</span><h2 className={red ? 'redtext' : ''}>{n}</h2></div><small className={red ? 'redtext' : ''}>{d}</small></section> }
