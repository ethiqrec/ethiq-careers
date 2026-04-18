'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Link from 'next/link'

// ── Helpers ──

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  return `${weeks}w ago`
}

function stripHtml(s) {
  return (s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

// ── Main component ──

export default function CareersClient({ roles }) {
  const [selectedId, setSelectedId] = useState(roles[0]?.id || null)
  const [sortBy, setSortBy] = useState('newest') // newest | compensation
  const [activePanel, setActivePanel] = useState(null) // 'apply' | 'share' | 'refer' | null

  const selected = roles.find((r) => r.id === selectedId) || roles[0] || null

  // Sort
  const sorted = [...roles].sort((a, b) => {
    if (sortBy === 'compensation') {
      const aVal = a.salary ? parseFloat(String(a.salary).replace(/[^0-9.]/g, '')) : 0
      const bVal = b.salary ? parseFloat(String(b.salary).replace(/[^0-9.]/g, '')) : 0
      return bVal - aVal
    }
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  const toggleSort = () => setSortBy((s) => (s === 'newest' ? 'compensation' : 'newest'))

  const selectRole = useCallback((id) => {
    setSelectedId(id)
    setActivePanel(null) // close any open form
  }, [])

  return (
    <>
      {/* Nav */}
      <nav className="nav">
        <div className="container nav-inner">
          <span className="nav-logo">ETHIQ</span>
          <ul className="nav-links">
            <li><a href="/" className="active">Roles</a></li>
            <li><a href="mailto:james@ethiqrec.com">About</a></li>
          </ul>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <h1>We place engineers at startups.<br />That&rsquo;s the whole thing.</h1>
          <p className="hero-sub">
            EMEA-focused tech recruitment. No &ldquo;transformational opportunities.&rdquo;
            Just real roles at companies we&rsquo;ve actually vetted.
          </p>
          <p className="hero-meta">
            {roles.length} open roles &middot; synced {timeAgo(roles[0]?.createdAt)}
          </p>
        </div>
      </section>

      {/* Desktop: split view */}
      <div className="container">
        <div className="split-view">
          {/* Left rail */}
          <div className="role-rail">
            <div className="rail-header">
              <span className="rail-count">{sorted.length} roles</span>
              <button className="sort-toggle" onClick={toggleSort}>
                {sortBy === 'newest' ? 'newest' : 'comp'} ↕
              </button>
            </div>
            {sorted.map((role) => (
              <div
                key={role.id}
                className={`rail-item ${role.id === selectedId ? 'selected' : ''}`}
                onClick={() => selectRole(role.id)}
              >
                <div className="rail-item-title">{role.title}</div>
                {role.descriptor && (
                  <div className="rail-item-desc">{role.descriptor}</div>
                )}
                <div className="rail-item-meta">
                  {role.salaryDisplay && (
                    <span className="salary">{role.salaryDisplay}</span>
                  )}
                  {role.workModeLabel && <span>{role.workModeLabel}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Right detail pane */}
          <div className="detail-pane">
            {selected ? (
              <RoleDetail
                role={selected}
                activePanel={activePanel}
                setActivePanel={setActivePanel}
              />
            ) : (
              <div className="detail-empty">Select a role to see details.</div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile: list (visible <768px) */}
      <div className="container mobile-list">
        {sorted.map((role) => (
          <Link
            key={role.id}
            href={`/roles/${role.slug}/`}
            className="mobile-list-item"
            style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
          >
            <div className="rail-item-title">{role.title}</div>
            {role.descriptor && (
              <div className="rail-item-desc">{role.descriptor}</div>
            )}
            <div className="rail-item-meta">
              {role.salaryDisplay && <span className="salary">{role.salaryDisplay}</span>}
              {role.workModeLabel && <span>{role.workModeLabel}</span>}
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <footer className="site-footer">
        <div className="container footer-inner">
          <span className="footer-text">&copy; {new Date().getFullYear()} Ethiq Recruitment</span>
          <span className="footer-text">
            <a href="mailto:james@ethiqrec.com">james@ethiqrec.com</a>
          </span>
        </div>
      </footer>
    </>
  )
}

// ── Role detail pane ──

function RoleDetail({ role, activePanel, setActivePanel }) {
  const hasRewrite = role.rewrite && (
    role.rewrite.why_this_one ||
    role.rewrite.the_company ||
    role.rewrite.what_youll_do ||
    role.rewrite.what_they_want ||
    role.rewrite.how_they_hire
  )

  const togglePanel = (panel) => {
    setActivePanel((prev) => (prev === panel ? null : panel))
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="detail-breadcrumb">
        roles / {role.title.toLowerCase()}
      </div>

      {/* Title */}
      <h2 className="detail-title">{role.title}</h2>

      {/* Descriptor */}
      {role.descriptor && (
        <p className="detail-descriptor">{role.descriptor}</p>
      )}

      {/* Stats grid */}
      <div className="stats-grid">
        <div className="stat-cell">
          <div className="stat-label">SALARY</div>
          <div className={`stat-value ${role.salaryDisplay ? 'green' : ''}`}>
            {role.salaryDisplay || '—'}
          </div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">LOCATION</div>
          <div className="stat-value">{role.locationDisplay || '—'}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">WORK MODE</div>
          <div className="stat-value">{role.workModeLabel || '—'}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">SENIORITY</div>
          <div className="stat-value">{role.seniorityLabel || '—'}</div>
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

      {/* The role — LLM rewritten or raw JD */}
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
        <div className="raw-jd">
          {stripHtml(role.jobDescription) || 'No description available.'}
        </div>
      )}

      {/* Action row */}
      <div className="action-row">
        <button className="btn btn-primary" onClick={() => togglePanel('apply')}>
          Apply →
        </button>
        <div style={{ position: 'relative' }}>
          <button className="btn btn-outline" onClick={() => togglePanel('share')}>
            Share ↗
          </button>
          {activePanel === 'share' && (
            <SharePopover role={role} onClose={() => setActivePanel(null)} />
          )}
        </div>
        <button className="btn btn-outline" onClick={() => togglePanel('refer')}>
          Refer <span className="green-suffix">£1k</span> ↗
        </button>
      </div>

      {/* Panels */}
      {activePanel === 'apply' && <ApplyForm role={role} />}
      {activePanel === 'refer' && <ReferForm role={role} />}
    </div>
  )
}

// ── Apply form ──

function ApplyForm({ role }) {
  const [state, setState] = useState('idle') // idle | submitting | done
  const [form, setForm] = useState({ name: '', email: '', linkedin: '', note: '' })
  const fileRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setState('submitting')

    const fd = new FormData()
    fd.append('roleId', role.id)
    fd.append('roleTitle', role.title)
    fd.append('ownerEmail', role.owner?.email || 'james@ethiqrec.com')
    fd.append('ownerName', role.owner?.name || 'James')
    fd.append('name', form.name)
    fd.append('email', form.email)
    if (form.linkedin) fd.append('linkedin', form.linkedin)
    if (form.note) fd.append('note', form.note)
    if (fileRef.current?.files?.[0]) fd.append('cv', fileRef.current.files[0])

    try {
      await fetch('/api/apply', { method: 'POST', body: fd })
    } catch {
      // Still show success — brief says never fail-visible
    }
    setState('done')
  }

  if (state === 'done') {
    return (
      <div className="form-panel">
        <div className="form-success">
          You&rsquo;re in. {role.owner?.name || 'James'} will be in touch within three working days.
        </div>
      </div>
    )
  }

  return (
    <form className="form-panel" onSubmit={handleSubmit}>
      <div className="form-header">Apply for this role</div>
      <p className="form-subhead">
        Goes directly to {role.owner?.name || 'James'} — the consultant who owns this role.
        No ATS, no black hole. You&rsquo;ll hear back within three working days.
      </p>

      <div className="form-group">
        <label>Your name</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Your email</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>LinkedIn URL (optional)</label>
        <input
          type="url"
          value={form.linkedin}
          onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>CV upload — PDF, DOCX, or DOC, max 10MB</label>
        <input type="file" accept=".pdf,.docx,.doc" ref={fileRef} />
      </div>
      <div className="form-group">
        <label>Anything we should know (optional)</label>
        <textarea
          rows={2}
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={state === 'submitting'}>
        {state === 'submitting' ? 'Sending...' : 'Send application →'}
      </button>

      <p className="form-fine-print">
        By applying you&rsquo;re agreeing to share your details with the hiring company.
        We won&rsquo;t pass you around to anyone else.{' '}
        <a href="/privacy/">Privacy policy →</a>
      </p>
    </form>
  )
}

// ── Share popover ──

function SharePopover({ role, onClose }) {
  const [copied, setCopied] = useState(false)
  const ref = useRef(null)

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/roles/${role.slug}/`
    : ''
  const title = `${role.title} — Ethiq`

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  const copyLink = (channel) => {
    const shareUrl = channel ? `${url}?ref=share_${channel}` : url
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="share-popover" ref={ref}>
      <button className="share-option" onClick={() => copyLink()}>
        {copied ? 'Copied ✓' : 'Copy link'}
      </button>
      <button className="share-option" onClick={() => copyLink('slack')}>
        Slack
      </button>
      <button className="share-option" onClick={() => copyLink('discord')}>
        Discord
      </button>
      <a
        className="share-option"
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url + '?ref=share_linkedin')}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
      >
        LinkedIn
      </a>
      <a
        className="share-option"
        href={`https://wa.me/?text=${encodeURIComponent(title + ' ' + url + '?ref=share_whatsapp')}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
      >
        WhatsApp
      </a>
      <a
        className="share-option"
        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url + '?ref=share_x')}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
      >
        X
      </a>
    </div>
  )
}

// ── Refer form ──

function ReferForm({ role }) {
  const [state, setState] = useState('idle')
  const [mode, setMode] = useState('linkedin') // linkedin | cv
  const [form, setForm] = useState({ linkedin: '', name: '', email: '', note: '' })
  const fileRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setState('submitting')

    const fd = new FormData()
    fd.append('roleId', role.id)
    fd.append('roleTitle', role.title)
    fd.append('referrerName', form.name)
    fd.append('referrerEmail', form.email)
    if (mode === 'linkedin' && form.linkedin) fd.append('referredLinkedin', form.linkedin)
    if (mode === 'cv' && fileRef.current?.files?.[0]) fd.append('referredCv', fileRef.current.files[0])
    if (form.note) fd.append('note', form.note)

    try {
      await fetch('/api/refer', { method: 'POST', body: fd })
    } catch {
      // Still show success
    }
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
        If they get hired, we pay you £1,000. No catch, no timer, no weird vesting.
        Drop their LinkedIn or their CV — whichever is easier.
      </p>

      <div className="form-toggle">
        <button
          type="button"
          className={mode === 'linkedin' ? 'active' : ''}
          onClick={() => setMode('linkedin')}
        >
          LinkedIn
        </button>
        <button
          type="button"
          className={mode === 'cv' ? 'active' : ''}
          onClick={() => setMode('cv')}
        >
          Upload CV
        </button>
      </div>

      {mode === 'linkedin' ? (
        <div className="form-group">
          <label>Their LinkedIn URL</label>
          <input
            type="url"
            value={form.linkedin}
            onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
            placeholder="https://linkedin.com/in/..."
          />
        </div>
      ) : (
        <div className="form-group">
          <label>Their CV — PDF, DOCX, or DOC</label>
          <input type="file" accept=".pdf,.docx,.doc" ref={fileRef} />
        </div>
      )}

      <div className="form-group">
        <label>Your email (so we can pay you)</label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>Your name</label>
        <input
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
      </div>
      <div className="form-group">
        <label>A quick line on why they&rsquo;d fit (optional)</label>
        <textarea
          rows={2}
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />
      </div>

      <button type="submit" className="btn btn-primary" disabled={state === 'submitting'}>
        {state === 'submitting' ? 'Sending...' : 'Send referral →'}
      </button>

      <p className="form-fine-print">
        We&rsquo;ll only contact them with your permission. And the candidate must pass
        probation in the role.
      </p>
    </form>
  )
}
