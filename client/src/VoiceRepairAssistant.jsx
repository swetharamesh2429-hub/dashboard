import { useState } from 'react'
import { api } from './services/api'

export default function VoiceRepairAssistant() {
  const [question, setQuestion] = useState('Why is this happening?')
  const [answer, setAnswer] = useState('')
  const [busy, setBusy] = useState(false)
  const [listening, setListening] = useState(false)

  const ask = async () => {
    if (!question.trim()) return
    setBusy(true)
    try {
      const response = await api.repairAssistant({
        vehicle: 'TRUCK #245',
        fault: 'Battery voltage instability',
        rootCause: 'Alternator regulator fluctuation',
        question,
      })
      setAnswer(response.answer)
    } catch {
      setAnswer('Check terminal corrosion, ground continuity, and alternator output before replacing components.')
    } finally {
      setBusy(false)
    }
  }

  const dictate = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Recognition) {
      setAnswer('Voice input is not supported in this browser. Type your repair question instead.')
      return
    }
    const recognition = new Recognition()
    recognition.lang = 'en-IN'
    recognition.interimResults = false
    setListening(true)
    recognition.onresult = (event) => setQuestion(event.results[0][0].transcript)
    recognition.onerror = () => setAnswer('Voice input was unavailable. Type your question instead.')
    recognition.onend = () => setListening(false)
    recognition.start()
  }

  return (
    <section className="voice-ai">
      <div><p className="eyebrow">AI REPAIR ASSISTANT</p><h2>Ask about the active repair</h2></div>
      <div className="voice-form">
        <input value={question} onChange={(event) => setQuestion(event.target.value)} aria-label="Repair question" placeholder="What should I check first?" />
        <button onClick={dictate} aria-label="Use voice input">{listening ? 'Listening...' : 'Voice'}</button>
        <button className="primary" disabled={busy} onClick={ask}>{busy ? 'Thinking...' : 'Ask AI'}</button>
      </div>
      {answer && <p className="voice-answer">{answer}</p>}
    </section>
  )
}
