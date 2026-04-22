'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

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

// Contract type filter
const TYPE_FILTERS = ['All', 'Permanent', 'Contract']

function matchesContractType(contractType, filter) {
  if (filter === 'All') return true
  if (filter === 'Permanent') return !contractType || contractType === 'full_time'
  // "Contract" matches anything that isn't full_time
  return contractType && contractType !== 'full_time'
}

// Discipline filter
const DISCIPLINE_FILTERS = ['All', 'Software Engineering', 'Data', 'Other']

function matchesDiscipline(discipline, filter) {
  if (filter === 'All') return true
  return (discipline || '').toLowerCase() === filter.toLowerCase()
}

// ── Share handler ──

async function handleShare(role) {
  const url = typeof window !== 'undefined' ? window.location.href : ''
  const shareData = {
    title: `${role.title} - Ethiq`,
    text: `${role.title} at a ${role.stage || ''} ${role.company?.industry || ''} company`.trim(),
    url,
  }

  if (navigator.share && navigator.canShare?.(shareData)) {
    try {
      await navigator.share(shareData)
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err)
    }
  } else {
    await navigator.clipboard.writeText(url)
    return true // signal to show toast
  }
  return false
}

// ── Toast component ──

function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2000)
    return () => clearTimeout(t)
  }, [onDone])

  return <div className="toast">{message}</div>
}

// ── Main component ──

export default function CareersClient({ roles }) {
  const searchParams = useSearchParams()
  const consultantParam = searchParams.get('consultant')

  const [selectedId, setSelectedId] = useState(roles[0]?.id || null)
  const [sortBy, setSortBy] = useState('newest') // newest | compensation
  const [activePanel, setActivePanel] = useState(null) // 'apply' | 'refer' | null
  const [typeFilter, setTypeFilter] = useState('All')
  const [disciplineFilter, setDisciplineFilter] = useState('All')

  // Sync countdown timer - ticks every minute, resets every 15 min
  const [syncMinutes, setSyncMinutes] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setSyncMinutes((prev) => (prev + 1) % 15)
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const selected = roles.find((r) => r.id === selectedId) || roles[0] || null

  // Filter by contract type and optional consultant param
  const filtered = roles.filter((r) => {
    if (!matchesContractType(r.contractType, typeFilter)) return false
    if (!matchesDiscipline(r.discipline, disciplineFilter)) return false
    if (consultantParam) {
      const ownerFirst = (r.owner?.name || '').split(' ')[0].toLowerCase()
      return ownerFirst === consultantParam.toLowerCase()
    }
    return true
  })

  // Sort
  const sorted = [...filtered].sort((a, b) => {
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
    setActivePanel(null)
  }, [])

  return (
    <>
      {/* Nav */}
      <nav className="nav">
        <div className="container nav-inner">
          <Link href="/" className="nav-logo"><Image src="/ethiq-logo-nav.png" alt="Ethiq" width={250} height={100} priority /></Link>
          
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <h1><span className="live-beacon" /> Ethiq live roles</h1>
          <p className="hero-sub">
            Every role we&rsquo;re actively working on, pulled live from our CRM.
          </p>
          <p className="hero-meta">
            <span className="roles-count">{roles.length} open roles</span> &middot; {syncMinutes === 0 ? `just updated` : `updated ${syncMinutes}m ago`} &middot; refreshes every 15 min
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

            {/* Consultant banner */}
            {consultantParam && (
              <div className="consultant-banner">
                <span>Showing roles for <strong>{consultantParam}</strong></span>
                <Link href="/" className="clear-filter">&times; clear</Link>
              </div>
            )}

            {/* Contract type filter */}
            <div className="stage-filter">
              {TYPE_FILTERS.map((type) => (
                <button
                  key={type}
                  className={`stage-pill ${typeFilter === type ? 'active' : ''}`}
                  onClick={() => setTypeFilter(type)}
                >
                  {type.toLowerCase()}
                </button>
              ))}
            </div>

            {/* Discipline filter */}
            <div className="stage-filter">
              {DISCIPLINE_FILTERS.map((disc) => (
                <button
                  key={disc}
                  className={`stage-pill ${disciplineFilter === disc ? 'active' : ''}`}
                  onClick={() => setDisciplineFilter(disc)}
                >
                  {disc.toLowerCase()}
                </button>
              ))}
            </div>

            {sorted.map((role) => (
              <div
                key={role.id}
                className={`rail-item ${role.id === selectedId ? 'selected' : ''}`}
                onClick={() => selectRole(role.id)}
              >
                <div className="rail-item-title">{role.title}</div>
                {role.locationDisplay && (
                  <div className="rail-item-desc">{role.locationDisplay}</div>
                )}
                <div className="rail-item-meta">
                  {role.salaryDisplay && (
                    <span className="salary">{role.salaryDisplay}</span>
                  )}
                  {role.workModeLabel && <span>{role.workModeLabel}</span>}
                  {role.discipline && <span>{role.discipline}</span>}
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

      {/* Mobile: contract type filter + list (visible <768px) */}
      <div className="container mobile-list">
        {consultantParam && (
          <div className="consultant-banner">
            <span>Showing roles for <strong>{consultantParam}</strong></span>
            <Link href="/" className="clear-filter">&times; clear</Link>
          </div>
        )}
        <div className="stage-filter">
          {TYPE_FILTERS.map((type) => (
            <button
              key={type}
              className={`stage-pill ${typeFilter === type ? 'active' : ''}`}
              onClick={() => setTypeFilter(type)}
            >
              {type.toLowerCase()}
            </button>
          ))}
        </div>

        {/* Discipline filter */}
        <div className="stage-filter">
          {DISCIPLINE_FILTERS.map((disc) => (
            <button
              key={disc}
              className={`stage-pill ${disciplineFilter === disc ? 'active' : ''}`}
              onClick={() => setDisciplineFilter(disc)}
            >
              {disc.toLowerCase()}
            </button>
          ))}
        </div>

        {sorted.map((role) => (
          <Link
            key={role.id}
            href={`/roles/${role.slug}/`}
            className="mobile-list-item"
            style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
          >
            <div className="rail-item-title">{role.title}</div>
            {role.locationDisplay && (
              <div className="rail-item-desc">{role.locationDisplay}</div>
            )}
            <div className="rail-item-meta">
              {role.salaryDisplay && <span className="salary">{role.salaryDisplay}</span>}
              {role.workModeLabel && <span>{role.workModeLabel}</span>}
              {role.discipline && <span>{role.discipline}</span>}
            </div>
          </Link>
        ))}
      </div>

      {/* Footer */}
      <footer className="site-footer">
        <div className="container footer-inner">
          <span className="footer-text">&copy; {new Date().getFullYear()} Ethiq Recruitment</span>
          <span className="footer-text">
            <a href="https://www.ethiqrec.com/privacy-policy" target="_blank" rel="noopener noreferrer">
              Privacy policy
            </a>
          </span>
        </div>
      </footer>
    </>
  )
}

// ── Role detail pane ──

function RoleDetail({ role, activePanel, setActivePanel }) {
  const [toast, setToast] = useState(null)
  const referFormRef = useRef(null)

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

  const onShare = async () => {
    const showToast = await handleShare(role)
    if (showToast) {
      setToast('Link copied')
    }
  }

  const onRefer = () => {
    togglePanel('refer')
    // After toggling, scroll to the form and focus first input
    setTimeout(() => {
      if (referFormRef.current) {
        referFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
        const firstInput = referFormRef.current.querySelector('input')
        if (firstInput) setTimeout(() => firstInput.focus(), 400)
      }
    }, 50)
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
      {role.locationDisplay && (
        <p className="detail-descriptor">{role.locationDisplay}</p>
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
          <div className="stat-label">CONTRACT</div>
          <div className="stat-value">{role.contractTypeLabel || '—'}</div>
        </div>
        <div className="stat-cell">
          <div className="stat-label">LIVE ROLES</div>
          <div className="stat-value">{role.liveRolesDisplay || '—'}</div>
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

      {/* The role - LLM rewritten or raw JD */}
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

      {/* Action row */}
      <div className="action-row">
        <a className="btn btn-primary" href={role.applyUrl || `https://my.recruitwithatlas.com/public/${role.id}`} target="_blank" rel="noopener noreferrer">
          Apply →
        </a>
        <button className="btn btn-outline" onClick={onShare}>
          Share ↗
        </button>
        <button className="btn btn-outline" onClick={onRefer}>
          Refer <span className="green-suffix">£1k</span> ↗
        </button>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}

      {/* Panels */}
      {activePanel === 'refer' && (
        <div ref={referFormRef}>
          <ReferForm role={role} />
        </div>
      )}
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
    fd.append('ownerEmail', role.owner?.email || '')
    fd.append('ownerName', role.owner?.name || 'the team')
    fd.append('name', form.name)
    fd.append('email', form.email)
    if (form.linkedin) fd.append('linkedin', form.linkedin)
    if (form.note) fd.append('note', form.note)
    if (fileRef.current?.files?.[0]) fd.append('cv', fileRef.current.files[0])

    try {
      await fetch('/api/apply', { method: 'POST', body: fd })
    } catch {
      // Still show success - brief says never fail-visible
    }
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
        <label>CV upload - PDF, DOCX, or DOC, max 10MB</label>
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
        <a href="https://www.ethiqrec.com/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy policy →</a>
      </p>
    </form>
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
        Drop their LinkedIn or their CV - whichever is easier.
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
          <label>Their CV - PDF, DOCX, or DOC</label>
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
        We&rsquo;ll only contact them with your permission. If they&rsquo;re already in our system,
        no reward - but we&rsquo;ll still say thanks. £1,000 is paid once the candidate has passed
        90 days in the role.
      </p>
    </form>
  )
}
