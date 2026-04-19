// POST /api/apply -- handle job applications
// 1. Save CV to Vercel Blob (or filesystem fallback)
// 2. Email the project owner
// 3. Create person in Atlas
// 4. Add as candidate to the project
// 5. Always return success to the applicant

import { NextResponse } from 'next/server'
import { createPerson, addCandidate } from '../../../lib/atlas.js'
import { sendApplicationEmail } from '../../../lib/email.js'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

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

    // 1. Save CV
    let cvUrl = null
    if (cvFile && cvFile.size > 0) {
      cvUrl = await saveCv(cvFile, roleId, name)
    }

    // 2. Send email (non-blocking)
    try {
      await sendApplicationEmail({
        to: ownerEmail,
        applicantName: name,
        applicantEmail: email,
        linkedinUrl: linkedin,
        note,
        cvUrl,
        roleTitle,
      })
    } catch (err) {
      console.error('Email send failed:', err.message)
    }

    // 3. Create person in Atlas
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

async function saveCv(file, roleId, name) {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)
  const ext = file.name?.split('.').pop() || 'pdf'
  const safeName = (name || 'unknown').replace(/[^a-z0-9]/gi, '-').toLowerCase()
  const filename = `${safeName}-${Date.now()}.${ext}`

  // Try Vercel Blob first
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = await import('@vercel/blob')
      const blob = await put(`cvs/${filename}`, buffer, { access: 'public' })
      return blob.url
    } catch (err) {
      console.error('Blob upload failed:', err.message)
    }
  }

  // Fallback: save to /tmp
  try {
    const dir = '/tmp/cvs'
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
    const path = join(dir, filename)
    writeFileSync(path, buffer)
    return path
  } catch (err) {
    console.error('File save failed:', err.message)
    return null
  }
}
