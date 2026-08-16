export async function sendPasswordResetEmail({ email, token }) {
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`
  if (!process.env.EMAIL_WEBHOOK_URL) return { mode: 'fallback', resetUrl }
  try {
    const response = await fetch(process.env.EMAIL_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.EMAIL_WEBHOOK_TOKEN || ''}` }, body: JSON.stringify({ to: email, template: 'utap-password-reset', resetUrl }) })
    if (!response.ok) throw new Error('Email provider rejected the request.')
    return { mode: 'provider', resetUrl }
  } catch { return { mode: 'fallback', resetUrl } }
}
