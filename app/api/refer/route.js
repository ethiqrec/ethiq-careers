// POST /api/refer — handle referrals
// 1. Check if person already exists in Atlas
// 2. If new: create person + add as candidate
// 3. Email James with full context
// 4. Never email the referred person (GDPR)

import { NextResponse } from 'next/server'
import { lookupPeople, createPerson, addCandidate } from '../../../lib/atlas.js'
import { sendReferralEmail } from '../../../lib/email.js'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

export const maxDuration = 30

export async function POST(request) {
  try {
    const fd = await request.formData()
    const roleId = fd.get('roleId')
    const roleTitle = fd.get('roleTitle') || 'Unknown role'
    const referrerName = fd.get('referrerName')
    const referrerEmail = fd.get('referrerEmail')
    const referredLinkedin = fd.get('referredLinkedin') || null
    const referredCvFile = fd.get('referredCv') || null
    const note = fd.get('note') || null

    if (!referrerName || !referrerEmail) {
      return NextResponse.json({ error: 'Referrer name and email are required' }, { status: 400 })
    }

    // Save CV if provided
    let cvUrl = null
    if (referredCvFile && referredCvFile.size > 0) {
      cvUrl = await saveCv(referredCvFile, roleId)
    }

    let alreadyExists = false

    if (process.env.ATLAS_API_KEY) {
      try {
        // 1. Check if referred person already exists
        if (referredLinkedin) {
          const existing = await lookupPeople([{ linkedinUrl: referredLinkedin }])
          alreadyExists = existing.length > 0
        }

        if (!alreadyExists) {
          // 3. Create new person
          const person = await createPerson({
            name: 'Referred candidate',
            email: null,
            linkedinUrl: referredLinkedin,
            addedByEmail: process.env.OWNER_EMAIL_FALLBACK || '',
          })
          const personId = person?.data?.id || person?.id

          // 4. Add as candidate
          if (personId && roleId) {
            await addCandidate(roleId, personId)
          }
        }
      } catch (err) {
        console.error('Atlas referral integration failed:', err.message)
      }
    }

    // Email James
    try {
      await sendReferralEmail({
        referrerName,
        referrerEmail,
        referredName: null,
        referredLinkedin,
        referredCvUrl: cvUrl,
        note,
        roleTitle,
        alreadyExists,
      })
    } catch (err) {
      console.error('Referral email failed:', err.message)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Refer handler error:', err)
    return NextResponse.json({ ok: true }) // Always success
  }
}

async function saveCv(file, roleId) {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.name?.split('.').pop() || 'pdf'
  const filename = `referral-${Date.now()}.${ext}`

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = await import('@vercel/blob')
      const blob = await put(`referrals/${filename}`, buffer, { access: 'public' })
      return blob.url
    } catch (err) {
      console.error('Blob upload failed:', err.message)
    }
  }

  try {
    const dir = '/tmp/referrals'
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    const path = join(dir, filename)
    writeFileSync(path, buffer)
    return path
  } catch {
    return null
  }
}
