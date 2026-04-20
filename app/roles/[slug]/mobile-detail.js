'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

function stripHtml(s) {
  return (s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

// ââ Share handler ââ

async function handleShare(role) {
  var url = typeof window !== 'undefined' ? window.location.href : ''
  var shareData = {
    title: role.title + ' - Ethiq',
    text: (role.title + ' ' + (role.company?.industry || '')).trim(),
    url: url,
  }

  if (navigator.share && navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData)
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err)
    }
  } else {
    await navigator.clipboard.writeText(url)
    return true
  }
  return false
}

// ââ Toast ââ

function Toast({ message, onDone }) {
  useEffect(() => {
    var t = setTimeout(onDone, 2000)
    return () => clearTimeout(t)
  }, [onDone])

  return <div className="toast">{message}</div>
}

export default function MobileDetail({ role }) {
  const [activePanel, setActivePanel] = useState(null)
  const [toast, setToast] = useState(null)
  const referFormRef = useRef(null)

  var hasRewrite = role.rewrite && (
    role.rewrite.why_this_one ||
    role.rewrite.the_company ||
    role.rewrite.what_youll_do ||
    role.rewrite.what_they_want ||
    role.rewrite.how_they_hire
  )

  var togglePanel = (panel) => {
    setActivePanel((prev) => (prev === panel ? null : panel))
  }

  var onShare = async () => {
    var showToast = await handleShare(role)
    if (showToast) setToast('Link copied')
  }

  var onRefer = () => {
    togglePanel('refer')
    setTimeout(() => {
      if (referFormRef.current) {
        referFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        var firstInput = referFormRef.current.querySelector('input')
        if (firstInput) setTimeout(() => firstInput.focus(), 400)
      }
    }, 50)
  }

  return (
    <div className="container mobile-detail">
      <Link href="/" className="back-link">{'\u2190'} all roles</Link>

      <h2 className="detail-title">{role.title}</h2>

      {role.descriptor && (
        <p className="detail-descriptor">{role.descriptor}</p>
      )}

      {/* Stats grid */}
      <div className="stats-grid">
        <div className="stat-cell">
          <div className="stat-label">SALARY</div>
          <div className={'stat-value' + (role.salaryDisplay ? ' green' : '')}>
            {role.salaryDisplay || '-'}
          </div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">LOCATION</div>
          <div className="stat-value">{role.locationDisplay || '-'}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">WORK MODE</div>
          <div className="stat-value">{role.workModeLabel || '-'}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">SENIORITY</div>
          <div className="stat-value">{role.seniorityLabel || '-'}</div>
        </div>
      </div>

      {/* Why this one */}
      {hasRewrite && role.rewrite.why_this_one && (
        <div className="why-section">{role.rewrite.why_this_one}</div>
      )}

      {/* Tech stack */}
      {role.skills && role.skills.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="section-label">tech stack</div>
          <div className="tech-pills">
            {role.skills.map((s) => (
              <span key={s} className="tech-pill">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* The role */}
      <div className="section-label">the role</div>
      {hasRewrite ? (
        <>
          {role.rewrite.the_company && (
            <div className="role-section">
              <h4>The company</h4>
              <p>{role.rewrite.the_company}</p>
            </div>
          )}
          {role.rewrite.what_youll_do && (
            <div className="role-section">
              <h4>What you&rsquo;ll do</h4>
              <p>{role.rewrite.what_youll_do}</p>
            </div>
          )}
          {role.rewrite.what_they_want && (
            <div className="role-section">
              <h4>What they want</h4>
              <p>{role.rewrite.what_they_want}</p>
            </div>
          )}
          {role.rewrite.how_they_hire && (
            <div className="role-section">
              <h4>How they hire</h4>
              <p>{role.rewrite.how_they_hire}</p>
            </div>
          )}
        </>
      ) : (
        <div className="raw-jd" dangerouslySetInnerHTML={{ __html: role.jobDescription || '<p>No description available.</p>' }} />
      )}

      {/* Actions */}
      <div className="action-row">
        <a className="btn btn-primary" href={role.applyUrl || `https://my.recruitwithatlas.com/public/${role.id}`} target="_blank" rel="noopener noreferrer">
          Apply {'\u2192'}
        </a>
        <button className="btn btn-outline" onClick={onShare}>
          Share {'\u2197'}
        </button>
        <button className="btn btn-outline" onClick={onRefer}>
          Refer <span className="green-suffix">{'\u00A3'}1k</span> {'\u2197'}
        </button>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {activePanel === 'refer' && (
        <div ref={referFormRef}>
          <ReferForm role={role} />
        </div>
      )}
    </div>
  )
}

// Apply form
function ApplyForm({ role }) {
  const [state, setState] = useState('idle')
  const [form, setForm] = useState({ name: '', email: '', linkedin: '', note: '' })
  const fileRef = useRef(null)

  var handleSubmit = async (e) => {
    e.preventDefault()
    setState('submitting')
    var fd = new FormData()
    fd.append('roleId', role.id)
    fd.append('roleTitle', role.title)
    fd.append('ownerEmail', role.owner?.email || '')
    fd.append('ownerName', role.owner?.name || 'the team')
    fd.append('name', form.name)
    fd.append('email', form.email)
    if (form.linkedin) fd.append('linkedin', form.linkedin)
    if (form.note) fd.append('note', form.note)
    if (fileRef.current?.files?.[0]) fd.append('cv', fileRef.current.files[0])
    try { await fetch('/api/apply', { method: 'POST', body: fd }) } catch {}
    setState('done')
  }

  if (state === 'done') {
    return (
      <div className="form-panel">
        <div className="form-success">
          You&rsquo;re in. {role.owner?.name || 'The team'} will be in touch within three working days.
        </div>
      </div>
    )
  }

  return (
    <form className="form-panel" onSubmit={handleSubmit}>
      <div className="form-header">Apply for this role</div>
      <p className="form-subhead">
        Goes directly to {role.owner?.name || 'the team'} - the recruiter who owns this role.
        No ATS, no black hole. You&rsquo;ll hear back within three working days.
      </p>
      <div className="form-group">
        <label>Your name</label>
        <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Your email</label>
        <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>
      <div className="form-group">
        <label>LinkedIn URL (optional)</label>
        <input type="url" value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} />
      </div>
      <div className="form-group">
        <label>CV upload - PDF, DOCX, or DOC, max 10MB</label>
        <input type="file" accept=".pdf,.docx,.doc" ref={fileRef} />
      </div>
      <div className="form-group">
        <label>Anything we should know (optional)</label>
        <textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      </div>
      <button type="submit" className="btn btn-primary" disabled={state === 'submitting'}>
        {state === 'submitting' ? 'Sending...' : 'Send application \u2192'}
      </button>
      <p className="form-fine-print">
        By applying you&rsquo;re agreeing to share your details with the hiring company.
        We won&rsquo;t pass you around to anyone else. <a href="https://www.ethiqrec.com/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy policy {'\u2192'}</a>
      </p>
    </form>
  )
}

// Refer form
function ReferForm({ role }) {
  const [state, setState] = useState('idle')
  const [mode, setMode] = useState('linkedin')
  const [form, setForm] = useState({ linkedin: '', name: '', email: '', note: '' })
  const fileRef = useRef(null)

  var handleSubmit = async (e) => {
    e.preventDefault()
    setState('submitting')
    var fd = new FormData()
    fd.append('roleId', role.id)
    fd.append('roleTitle', role.title)
    fd.append('referrerName', form.name)
    fd.append('referrerEmail', form.email)
    if (mode === 'linkedin' && form.linkedin) fd.append('referredLinkedin', form.linkedin)
    if (mode === 'cv' && fileRef.current?.files?.[0]) fd.append('referredCv', fileRef.current.files[0])
    if (form.note) fd.append('note', form.note)
    try { await fetch('/api/refer', { method: 'POST', body: fd }) } catch {}
    setState('done')
  }

  if (state === 'done') {
    return (
      <div className="form-panel">
        <div className="form-success">
          Referral received. We&rsquo;ll let you know when we hear from them.
        </div>
      </div>
    )
  }

  return (
    <form className="form-panel" onSubmit={handleSubmit}>
      <div className="form-header">Refer someone</div>
      <p className="form-subhead">
        If they get hired, we pay you {'\u00A3'}1,000. No catch, no timer, no weird vesting.
        Drop their LinkedIn or their CV - whichever is easier.
      </p>
      <div className="form-toggle">
        <button type="button" className={mode === 'linkedin' ? 'active' : ''} onClick={() => setMode('linkedin')}>LinkedIn</button>
        <button type="button" className={mode === 'cv' ? 'active' : ''} onClick={() => setMode('cv')}>Upload CV</button>
      </div>
      {mode === 'linkedin' ? (
        <div className="form-group">
          <label>Their LinkedIn URL</label>
          <input type="url" value={form.linkedin} onChange={(e) => setForm({ ...form, linkedin: e.target.value })} placeholder="https://linkedin.com/in/..." />
        </div>
      ) : (
        <div className="form-group">
          <label>Their CV - PDF, DOCX, or DOC</label>
          <input type="file" accept=".pdf,.docx,.doc" ref={fileRef} />
        </div>
      )}
      <div className="form-group">
        <label>Your email (so we can pay you)</label>
        <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      </div>
      <div className="form-group">
        <label>Your name</label>
        <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </div>
      <div className="form-group">
        <label>A quick line on why they&rsquo;d fit (optional)</label>
        <textarea rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      </div>
      <button type="submit" className="btn btn-primary" disabled={state === 'submitting'}>
        {state === 'submitting' ? 'Sending...' : 'Send referral \u2192'}
      </button>
      <p className="form-fine-print">
        We&rsquo;ll only contact them with your permission. If they&rsquo;re already in our system,
        no reward - but we&rsquo;ll still say thanks. {'\u00A3'}1,000 is paid once the candidate has passed
        90 days in the role.
      </p>
    </form>
  )
}
