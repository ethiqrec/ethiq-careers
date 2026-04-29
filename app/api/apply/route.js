// POST /api/apply -- handle job applications
// 1. Optionally upload CV to Vercel Blob (if BLOB_READ_WRITE_TOKEN is set)
// 2. Email the project owner with the CV attached directly
// 3. Create person in Atlas (best-effort)
// 4. Add as candidate to the project (best-effort)
// 5. Always return success to the applicant

import { NextResponse } from 'next/server'
import { createPerson, addCandidate } from '../../../lib/atlas.js'
import { sendApplicationEmail } from '../../../lib/email.js'

export const maxDuration = 30

export async function POST(request) {
  try {
    const fd = await request.formData()
    const roleId = fd.get('roleId')
    const roleTitle = fd.get('roleTitle') || 'Unknown role'
    const ownerEmail = fd.get('ownerEmail') || process.env.OWNER_EMAIL_FALLBACK || ''
    const ownerName = fd.get('ownerName') || 'James'
    const name = fd.get('name')
    const email = fd.get('email')
    const linkedin = fd.get('linkedin') || null
    const note = fd.get('note') || null
    const cvFile = fd.get('cv')

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // 1. Read CV into a buffer (used for both email attachment and optional Blob upload)
    let cvBuffer = null
    let cvFilename = null
    let cvUrl = null

    if (cvFile && cvFile.size > 0) {
      try {
        const bytes = await cvFile.arrayBuffer()
        cvBuffer = Buffer.from(bytes)
        cvFilename = cvFile.name || 'cv.pdf'
      } catch (err) {
        console.error('CV read failed:', err.message)
      }

      // Upload to Vercel Blob if configured (for permanent storage)
      if (cvBuffer && process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          const { put } = await import('@vercel/blob')
          const safeName = (name || 'unknown').replace(/[^a-z0-9]/gi, '-').toLowerCase()
          const ext = cvFilename.split('.').pop() || 'pdf'
          const blob = await put(`cvs/${safeName}-${Date.now()}.${ext}`, cvBuffer, { access: 'public' })
          cvUrl = blob.url
        } catch (err) {
          console.error('Blob upload failed:', err.message)
        }
      }
    }

    // 2. Send email with CV attached directly
    try {
      await sendApplicationEmail({
        to: ownerEmail,
        applicantName: name,
        applicantEmail: email,
        linkedinUrl: linkedin,
        note,
        cvUrl,
        cvBuffer,
        cvFilename,
        roleTitle,
      })
    } catch (err) {
      console.error('Email send failed:', err.message)
    }

    // 3. Create person in Atlas (best-effort)
    if (process.env.ATLAS_API_KEY) {
      try {
        const person = await createPerson({
          name,
          email,
          linkedinUrl: linkedin,
          addedByEmail: ownerEmail,
        })
        const personId = person?.data?.id || person?.id

        // 4. Add as candidate
        if (personId && roleId) {
          await addCandidate(roleId, personId)
        }
      } catch (err) {
        console.error('Atlas integration failed:', err.message)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Apply handler error:', err)
    return NextResponse.json({ ok: true })
  }
}
