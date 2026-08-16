const fallback = (context = {}) => ({
  mode: 'fallback',
  answer: `For ${context.fault || 'this repair'}, start with a visual inspection, verify wiring and ground continuity, then measure the relevant sensor values before replacing parts. For a battery-related fault, check terminal corrosion and confirm alternator output is roughly 13.8–14.7 V with the engine running.`,
})

const systemInstruction = `You are UTAP, a fleet technician repair assistant. Give concise, safe, practical troubleshooting guidance only for the active repair context. State checks in a sensible order, distinguish verification from replacement, and flag when a vehicle should remain out of service. Do not invent readings or claim work was completed.`

export async function answerRepairQuestion(context = {}) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return fallback(context)

  const prompt = `Active repair context\nVehicle: ${context.vehicle || 'Unknown'}\nFault: ${context.fault || 'Unknown'}\nLikely root cause: ${context.rootCause || 'Not yet confirmed'}\nTechnician question: ${context.question || 'What should I check first?'}\n\nProvide a short, actionable answer for the technician.`

  try {
    const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash'
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 450 },
      }),
    })

    if (!response.ok) return fallback(context)
    const data = await response.json()
    const answer = data.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim()
    return answer ? { mode: 'gemini', answer } : fallback(context)
  } catch {
    return fallback(context)
  }
}
