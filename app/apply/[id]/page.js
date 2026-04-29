'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const styles = {
  page: {
    minHeight: '100vh',
    padding: '3rem 1.25rem',
    background: '#0a0a0a',
    color: '#f5f5f5',
    display: 'flex',
    justifyContent: 'center',
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  card: {
    width: '100%',
    maxWidth: '560px',
    background: '#141414',
    border: '1px solid #262626',
    borderRadius: '12px',
    padding: '2rem',
  },
  back: {
    display: 'inline-block',
    color: '#a3a3a3',
    fontSize: '0.875rem',
    textDecoration: 'none',
    marginBottom: '1rem',
  },
  h1: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '1.75rem',
    fontWeight: 500,
    letterSpacing: '-0.01em',
    margin: '0 0 0.5rem',
  },
  sub: {
    color: '#a3a3a3',
    fontSize: '0.95rem',
    lineHeight: 1.55,
    margin: '0 0 1.5rem',
  },
  form: { display: 'grid', gap: '1.1rem' },
  label: { display: 'grid', gap: '0.4rem' },
  labelText: {
    fontSize: '0.85rem',
    color: '#a3a3a3',
    fontWeight: 500,
  },
  optional: {
    fontStyle: 'normal',
    color: '#6b6b6b',
  },
  input: {
    background: '#1c1c1c',
    border: '1px solid #262626',
    color: '#f5f5f5',
    padding: '0.7rem 0.9rem',
    borderRadius: '6px',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
  },
  fileInput: {
    fontSize: '0.85rem',
    color: '#a3a3a3',
  },
  submit: {
    background: '#d4af37',
    color: '#0a0a0a',
    border: 'none',
    padding: '0.85rem 1.4rem',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  submitDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  errorText: { color: '#ff6b6b', fontSize: '0.9rem', margin: '0.5rem 0 0' },
}

export default function ApplyPage() {
  const params = useParams()
  const roleId = params?.id

  const [role, setRole] = useState(null)
  const [state, setState] = useState('idle') // idle | submitting | done | error
  const [form, setForm] = useState({ name: '', email: '', linkedin: '', note: '' })
  const fileRef = useRef(null)

  useEffect(() => {
    if (!roleId) return
    fetch('/jobs.json', { cache: 'no-store' })
      .then((r) => r.json())
      .then((data) => {
        const found = (data.jobs || []).find((j) => String(j.id) === String(roleId))
        if (found) setRole(found)
        else setRole({ id: roleId, title: 'this role', owner: { name: 'James', email: '' } })
      })
      .catch(() => setRole({ id: roleId, title: 'this role', owner: { name: 'James', email: '' } }))
  }, [roleId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setState('submitting')

    const fd = new FormData()
    fd.append('roleId', role?.id || roleId || '')
    fd.append('roleTitle', role?.title || 'Unknown role')
    fd.append('ownerEmail', role?.owner?.email || '')
    fd.append('ownerName', role?.owner?.name || 'James')
    fd.append('name', form.name)
    fd.append('email', form.email)
    if (form.linkedin) fd.append('linkedin', form.linkedin)
    if (form.note) fd.append('note', form.note)
    if (fileRef.current?.files?.[0]) fd.append('cv', fileRef.current.files[0])

    try {
      const res = await fetch('/api/apply', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Submission failed')
      setState('done')
    } catch {
      setState('error')
    }
  }

  if (!role) {
    return (
      <main style={styles.page}>
        <div style={styles.card}><p>Loading…</p></div>
      </main>
    )
  }

  if (state === 'done') {
    return (
      <main style={styles.page}>
        <div style={styles.card}>
          <h1 style={styles.h1}>You&rsquo;re in.</h1>
          <p style={styles.sub}>{role.owner?.name || 'James'} will be in touch within three working days.</p>
          <Link href="/" style={styles.back}>&larr; All roles</Link>
        </div>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <Link href="/" style={styles.back}>&larr; All roles</Link>
        <h1 style={styles.h1}>Apply: {role.title}</h1>
        <p style={styles.sub}>
          Goes directly to {role.owner?.name || 'James'} &mdash; the recruiter who owns this role.
          No ATS, no black hole. You&rsquo;ll hear back within three working days.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            <span style={styles.labelText}>Your name</span>
            <input
              type="text"
              required
              autoComplete="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            <span style={styles.labelText}>Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            <span style={styles.labelText}>LinkedIn URL <em style={styles.optional}>(optional)</em></span>
            <input
              type="url"
              placeholder="https://linkedin.com/in/…"
              value={form.linkedin}
              onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
              style={styles.input}
            />
          </label>

          <label style={styles.label}>
            <span style={styles.labelText}>CV <em style={styles.optional}>(optional, PDF preferred)</em></span>
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={styles.fileInput} />
          </label>

          <label style={styles.label}>
            <span style={styles.labelText}>Anything you want to flag <em style={styles.optional}>(optional)</em></span>
            <textarea
              rows="4"
              placeholder="Notice period, salary expectations, anything else…"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              style={styles.input}
            />
          </label>

          <button
            type="submit"
            disabled={state === 'submitting'}
            style={{ ...styles.submit, ...(state === 'submitting' ? styles.submitDisabled : {}) }}
          >
            {state === 'submitting' ? 'Sending…' : 'Send application'}
          </button>

          {state === 'error' && (
            <p style={styles.errorText}>Something went wrong. Please try again, or email james@ethiqrec.com directly.</p>
          )}
        </form>
      </div>
    </main>
  )
}
