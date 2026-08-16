import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'

const typeExtensions = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }

export async function saveRepairProof(dataUrl, ticketId) {
  if (!dataUrl) return null
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl)
  if (!match) throw Object.assign(new Error('Repair proof must be PNG, JPEG, or WebP.'), { statusCode: 400 })
  const buffer = Buffer.from(match[2], 'base64')
  if (buffer.byteLength > 2 * 1024 * 1024) throw Object.assign(new Error('Repair proof image is too large.'), { statusCode: 413 })
  const directory = process.env.REPAIR_STORAGE_PATH || path.resolve('uploads')
  await mkdir(directory, { recursive: true })
  const filename = `${ticketId}-${crypto.randomUUID()}.${typeExtensions[match[1]]}`
  await writeFile(path.join(directory, filename), buffer)
  return `/uploads/${filename}`
}
