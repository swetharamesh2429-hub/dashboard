import { useEffect, useRef, useState } from 'react'
import './ar.css'
import RepairXRScene from '../xr/RepairXRScene'

export default function ARRepairGuide({ fault, steps, onClose }) {
  const video = useRef(null)
  const [supported, setSupported] = useState(true)
  const [step, setStep] = useState(0)
  useEffect(() => { let stream; navigator.mediaDevices?.getUserMedia?.({ video: { facingMode: 'environment' }, audio: false }).then((value) => { stream = value; if (video.current) video.current.srcObject = stream }).catch(() => setSupported(false)); return () => stream?.getTracks().forEach((track) => track.stop()) }, [])
  return <section className="ar-guide"><header><div><p className="eyebrow">AR-GUIDED REPAIR</p><h2>{fault}</h2></div><button className="secondary" onClick={onClose}>Close guide</button></header>{supported ? <div className="ar-camera"><video ref={video} autoPlay muted playsInline/><div className="ar-overlay"><span>STEP {step + 1} / {steps.length}</span><b>{steps[step]}</b><small>Use the 3D model or start AR to inspect the repair area.</small></div></div> : <div className="ai"><b>Camera access is unavailable on this device.</b><p>The interactive 3D repair model and guide remain available.</p></div>}<RepairXRScene mode="ar" label={`${fault} repair area`}/><div className="ar-steps">{steps.map((item, index) => <button key={item} className={index === step ? 'active' : ''} onClick={() => setStep(index)}>{index + 1}. {item}</button>)}</div></section>
}
