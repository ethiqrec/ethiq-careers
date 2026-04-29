// POST /api/refer -- handle referrals
// 1. Check if person already exists in Atlas
// 2. If new: create person + add as candidate
// 3. Email James with full context (CV attached directly to email)
// 4. Never email the referred person (GDPR)

import { NextResponse } from 'next/server'
import { lookupPeople, createPerson, addCandidate } from '../../../lib/atlas.js'
import { sendReferralEmail } from '../../../lib/email.js'

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

    // Read CV into buffer (used for email attachment, optionally also Vercel Blob)
    let cvBuffer = null
    let cvFilename = null
    let cvUrl = null

    if (referredCvFile && referredCvFile.size > 0) {
      try {
        const bytes = await referredCvFile.arrayBuffer()
        cvBuffer = Buffer.from(bytes)
        cvFilename = referredCvFile.name || 'referral-cv.pdf'
      } catch (err) {
        console.error('Referral CV read failed:', err.message)
      }

      if (cvBuffer && process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          const { put } = await import('@vercel/blob')
          const ext = cvFilename.split('.').pop() || 'pdf'
          const blob = await put(`referrals/referral-${Date.now()}.${ext}`, cvBuffer, { access: 'public' })
          cvUrl = blob.url
        } catch (err) {
          console.error('Blob upload failed:', err.message)
        }
      }
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
          // 2. Create new person
          const person = await createPerson({
            name: 'Referred candidate',
            email: null,
            linkedinUrl: referredLinkedin,
            addedByEmail: process.env.OWNER_EMAIL_FALLBACK || '',
          })
          const personId = person?.data?.id || person?.id

          // 3. Add as candidate
          if (personId && roleId) {
            await addCandidate(roleId, personId)
          }
        }
      } catch (err) {
        console.error('Atlas referral integration failed:', err.message)
      }
    }

    // 4. Email James with CV attached directly
    try {
      await sendReferralEmail({
        referrerName,
        referrerEmail,
        referredName: null,
        referredLinkedin,
        referredCvUrl: cvUrl,
        referredCvBuffer: cvBuffer,
        referredCvFilename: cvFilename,
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
