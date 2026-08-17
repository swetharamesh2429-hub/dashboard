import { useState } from 'react'
import './training.css'
import RepairXRScene from '../xr/RepairXRScene'

const sequence = ['Isolate vehicle power and wear PPE', 'Inspect battery terminals and harness insulation', 'Measure battery voltage and alternator output', 'Confirm the repair and return the vehicle to service']
export default function TrainingPage() { const [index, setIndex] = useState(0); return <section className="training-page"><p className="eyebrow">VR TRAINING SANDBOX</p><h1>Battery diagnostics simulation</h1><p>Practice the repair sequence safely before working on a live fleet vehicle.</p><div className="training-scene"><RepairXRScene mode="vr" label="Truck #245 battery bay training model"/><div><small>TRAINING STEP {index + 1} OF {sequence.length}</small><h2>{sequence[index]}</h2><button className="primary" onClick={() => setIndex((index + 1) % sequence.length)}>Next training step</button><p className="muted">Use a WebXR headset for immersive VR, or complete the same interactive 3D training on any supported browser.</p></div></div></section> }
