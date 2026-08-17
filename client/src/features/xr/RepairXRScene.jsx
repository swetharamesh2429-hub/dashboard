import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'

function buildScene(canvas) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#07101d')
  const camera = new THREE.PerspectiveCamera(52, canvas.clientWidth / canvas.clientHeight, 0.1, 100)
  camera.position.set(0, 1.4, 4)
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(canvas.clientWidth, canvas.clientHeight, false)
  renderer.xr.enabled = true
  scene.add(new THREE.HemisphereLight('#d9f8ff', '#07101d', 2.2))
  const keyLight = new THREE.DirectionalLight('#22d3ee', 2)
  keyLight.position.set(3, 4, 4)
  scene.add(keyLight)
  const bay = new THREE.Mesh(new THREE.BoxGeometry(2.8, 1.5, 0.7), new THREE.MeshStandardMaterial({ color: '#172b3c', metalness: 0.45, roughness: 0.55 }))
  bay.position.y = 1
  scene.add(bay)
  const battery = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.8, 0.75), new THREE.MeshStandardMaterial({ color: '#102b3d', emissive: '#073447', metalness: 0.25, roughness: 0.35 }))
  battery.position.set(0, 1.15, 0.5)
  scene.add(battery)
  const terminalMaterial = new THREE.MeshStandardMaterial({ color: '#f59e0b', emissive: '#8a4300', emissiveIntensity: 0.9 })
  ;[-0.45, 0.45].forEach((position) => { const terminal = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.2, 24), terminalMaterial); terminal.position.set(position, 1.62, 0.5); scene.add(terminal) })
  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.025, 12, 64), new THREE.MeshBasicMaterial({ color: '#22d3ee', transparent: true, opacity: 0.8 }))
  halo.position.set(0, 1.15, 0.88)
  scene.add(halo)
  const clock = new THREE.Clock()
  renderer.setAnimationLoop(() => { halo.rotation.z += clock.getDelta() * 0.8; renderer.render(scene, camera) })
  const resize = () => { renderer.setSize(canvas.clientWidth, canvas.clientHeight, false); camera.aspect = canvas.clientWidth / canvas.clientHeight; camera.updateProjectionMatrix() }
  window.addEventListener('resize', resize)
  return { renderer, dispose: () => { window.removeEventListener('resize', resize); renderer.setAnimationLoop(null); renderer.dispose(); scene.traverse((item) => { item.geometry?.dispose(); item.material?.dispose?.() }) } }
}

export default function RepairXRScene({ mode = 'ar', label = 'Battery diagnostic model' }) {
  const canvas = useRef(null)
  const scene = useRef(null)
  const [xrAvailable, setXrAvailable] = useState(false)
  const [xrActive, setXrActive] = useState(false)
  useEffect(() => {
    scene.current = buildScene(canvas.current)
    const xr = navigator.xr
    if (!xr?.isSessionSupported) setXrAvailable(false)
    else xr.isSessionSupported(mode === 'ar' ? 'immersive-ar' : 'immersive-vr').then(setXrAvailable).catch(() => setXrAvailable(false))
    return () => scene.current?.dispose()
  }, [mode])
  const enterXr = async () => { try { const session = await navigator.xr.requestSession(mode === 'ar' ? 'immersive-ar' : 'immersive-vr', { requiredFeatures: mode === 'ar' ? ['local'] : [] }); await scene.current.renderer.xr.setSession(session); setXrActive(true); session.addEventListener('end', () => setXrActive(false), { once: true }) } catch { setXrActive(false) } }
  return <div className="xr-scene"><canvas ref={canvas} aria-label={label}/><div className="xr-caption"><span>{xrActive ? 'IMMERSIVE SESSION ACTIVE' : 'INTERACTIVE 3D MODEL'}</span><b>{label}</b>{xrAvailable && !xrActive && <button className="secondary" onClick={enterXr}>Enter {mode.toUpperCase()}</button>}{!xrAvailable && <small>WebXR is unavailable here. The 3D fallback remains usable.</small>}</div></div>
}
