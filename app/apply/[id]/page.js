'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const wrapStyle = {
  minHeight: '100vh',
  padding: '48px 20px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  background: 'var(--bg-page)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-sans)',
}

const cardStyle = { width: '100%', maxWidth: '560px' }

const breadcrumbStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: '12px',
  color: 'var(--text-mono)',
  textDecoration: 'none',
  marginBottom: '16px',
  display: 'inline-block',
  textTransform: 'lowercase',
  letterSpacing: '0.02em',
}

const titleStyle = {
  fontSize: '22px',
  fontWeight: 500,
  letterSpacing: '-0.01em',
  margin: '0 0 6px',
}

const greenSubmitStyle = {
  background: 'var(--green)',
  color: 'var(--bg-page)',
  borderColor: 'var(--green)',
  fontWeight: 600,
  padding: '10px 18px',
  fontSize: '14px',
  marginTop: '8px',
}

const dropZoneBase = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  padding: '20px 12px',
  border: '1px dashed var(--border-input)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--bg-page)',
  color: 'var(--text-dim)',
  fontSize: '13px',
  textAlign: 'center',
  cursor: 'pointer',
  transition: 'border-color 120ms ease, background 120ms ease',
}

export default function ApplyPage() {
  const params = useParams()
  const roleId = params?.id

  const [role, setRole] = useState(null)
  const [state, setState] = useState('idle') // idle | submitting | done | error
  const [form, setForm] = useState({ name: '', email: '', linkedin: '', note: '' })
  const [cvFile, setCvFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (!roleId) return
    fetch('/jobs.json', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        const found = (data.jobs || []).find((j) => String(j.id) === String(roleId))
        if (found) setRole(found)
        else setRole({ id: roleId, title: 'this role' })
      })
      .catch(() => setRole({ id: roleId, title: 'this role' }))
  }, [roleId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setState('submitting')

    const fd = new FormData()
    fd.append('roleId', role?.id || roleId || '')
    fd.append('roleTitle', role?.title || 'Unknown role')
    // Don't pass ownerEmail - let the server use OWNER_EMAIL_FALLBACK
    // so notifications go to a single inbox regardless of role owner.
    fd.append('name', form.name)
    fd.append('email', form.email)
    if (form.linkedin) fd.append('linkedin', form.linkedin)
    if (form.note) fd.append('note', form.note)
    if (cvFile) fd.append('cv', cvFile)

    try {
      const res = await fetch('/api/apply', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Submission failed')
      setState('done')
    } catch {
      setState('error')
    }
  }

  const onDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }
  const onDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }
  const onDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const files = e.dataTransfer?.files
    if (files && files[0]) setCvFile(files[0])
  }

  if (!role) {
    return (
      <main style={wrapStyle}>
        <div style={cardStyle}>
          <div className="form-panel">Loading…</div>
        </div>
      </main>
    )
  }

  if (state === 'done') {
    return (
      <main style={wrapStyle}>
        <div style={cardStyle}>
          <Link href="/" style={breadcrumbStyle}>← all roles</Link>
          <div className="form-panel">
            <div className="form-success">
              You&rsquo;re in. We&rsquo;ll be in touch within three working days.
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main style={wrapStyle}>
      <div style={cardStyle}>
        <Link href="/" style={breadcrumbStyle}>← all roles</Link>
        <h1 style={titleStyle}>Apply: {role.title}</h1>

        <form className="form-panel" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="apply-name">Your name</label>
            <input
              id="apply-name"
              type="text"
              required
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="apply-email">Email</label>
            <input
              id="apply-email"
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label htmlFor="apply-linkedin">LinkedIn URL <span style={{ color: 'var(--text-mono)' }}>(optional)</span></label>
            <input
              id="apply-linkedin"
              type="url"
              placeholder="https://linkedin.com/in/…"
              value={form.linkedin}
              onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>CV <span style={{ color: 'var(--text-mono)' }}>(optional, PDF preferred)</span></label>
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileRef.current?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click() }}
              onDragOver={onDragOver}
              onDragEnter={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              style={{
                ...dropZoneBase,
                ...(dragActive ? { borderColor: 'var(--green)', background: 'var(--bg-surface)' } : {}),
                ...(cvFile ? { borderStyle: 'solid', color: 'var(--text-primary)' } : {}),
              }}
            >
              {cvFile ? (
                <>
                  <span style={{ fontWeight: 500 }}>{cvFile.name}</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>
                    {(cvFile.size / 1024).toFixed(0)} KB · click or drop another to replace
                  </span>
                </>
              ) : (
                <>
                  <span>Drop a file here or <span style={{ color: 'var(--green)' }}>browse</span></span>
                  <span style={{ color: 'var(--text-mono)', fontSize: '12px' }}>PDF, DOC, DOCX</span>
                </>
              )}
              <input
                ref={fileRef}
                id="apply-cv"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => { if (e.target.files?.[0]) setCvFile(e.target.files[0]) }}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="apply-note">Anything you want to flag <span style={{ color: 'var(--text-mono)' }}>(optional)</span></label>
            <textarea
              id="apply-note"
              rows={4}
              placeholder="Notice period, salary expectations, anything else…"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={state === 'submitting'}
            className="btn"
            style={{
              ...greenSubmitStyle,
              ...(state === 'submitting' ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
            }}
          >
            {state === 'submitting' ? 'Sending…' : 'Send application'}
          </button>

          {state === 'error' && (
            <p style={{ color: '#ff6b6b', fontSize: '13px', margin: '12px 0 0' }}>
              Something went wrong. Please try again, or email james@ethiqrec.com directly.
            </p>
          )}
        </form>
      </div>
    </main>
  )
}
