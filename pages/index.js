import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

// ââ Helpers ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

function formatDate(dateString) {
  if (!dateString) return null;
  const d = new Date(dateString);
  const now = new Date();
  const diff = Math.floor((now - d) / 86400000);
  if (diff < 1) return 'today';
  if (diff === 1) return '1d ago';
  if (diff < 7) return `${diff}d ago`;
  if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
  if (diff < 365) return `${Math.floor(diff / 30)}mo ago`;
  return `${Math.floor(diff / 365)}y ago`;
}

function formatContractType(t) {
  const map = {
    full_time: 'Full-time', part_time: 'Part-time',
    contract: 'Contract', freelance: 'Freelance',
    internship: 'Internship', temporary: 'Temporary',
    non_exec: 'Non-Executive',
  };
  return map[t] || t || null;
}

function formatWorkMode(m) {
  const map = { remote: 'Remote', hybrid: 'Hybrid', office: 'On-site' };
  return map[m] || m || null;
}

/** Derive a role category from the job title for filtering */
function categoriseRole(title) {
  if (!title) return 'Other';
  const t = title.toLowerCase();
  if (/\b(frontend|front-end|react|vue|angular|ui)\b/.test(t)) return 'Frontend';
  if (/\b(backend|back-end|node|java|python|ruby|golang|go|rust|c\+\+|\.net|dynamics)\b/.test(t)) return 'Backend';
  if (/\b(full[- ]?stack)\b/.test(t)) return 'Full-stack';
  if (/\b(devops|sre|platform|infra|cloud)\b/.test(t)) return 'Platform / Infra';
  if (/\b(data|analytics|databricks|snowflake|etl|dbt)\b/.test(t)) return 'Data';
  if (/\b(ml|machine learning|ai|artificial intelligence)\b/.test(t)) return 'AI / ML';
  if (/\b(product)\b/.test(t) && !/engineer/i.test(t)) return 'Product';
  if (/\b(design|ux|ui)\b/.test(t)) return 'Design';
  if (/\b(lead|staff|principal|head|director|vp|manager|strategy)\b/.test(t)) return 'Leadership';
  if (/\b(sap)\b/.test(t)) return 'SAP';
  if (/\b(qa|test|quality)\b/.test(t)) return 'QA';
  if (/\b(architect)\b/.test(t)) return 'Architecture';
  if (/\b(sales|pre-sales|business dev)\b/.test(t)) return 'Sales';
  if (/\b(engineer|developer|software)\b/.test(t)) return 'Engineering';
  return 'Other';
}

function parseArrayParam(val) {
  if (!val) return [];
  return (Array.isArray(val) ? val : val.split(',')).filter(Boolean);
}

// ââ SVG Icons (inline, tiny) âââââââââââââââââââââââââââââââââââââââââ

const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
);
const IconFilter = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
);
const IconX = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
);
const IconCheck = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M20 6 9 17l-5-5"/></svg>
);
const IconArrow = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>
);
const IconBriefcase = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect width="20" height="14" x="2" y="7" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
);

// ââ Filter Pill + Dropdown ââââââââââââââââââââââââââââââââââââââââââââ

function FilterPill({ label, options, selected, onToggle, counts }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o => o.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="filter-dropdown-anchor" ref={ref}>
      <button
        className={`filter-pill ${selected.length > 0 ? 'active' : ''}`}
        onClick={() => { setOpen(!open); setSearch(''); }}
      >
        <IconFilter />
        {label}
        {selected.length > 0 && <span className="badge">{selected.length}</span>}
      </button>
      {open && (
        <div className="filter-dropdown">
          {options.length > 5 && (
            <input
              className="filter-dropdown-search"
              placeholder={`Filter ${label.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          )}
          {filtered.map(opt => {
            const active = selected.includes(opt);
            return (
              <button
                key={opt}
                className={`filter-option ${active ? 'selected' : ''}`}
                onClick={() => onToggle(opt)}
              >
                <span className="filter-checkbox">{active && <IconCheck />}</span>
                {opt}
                {counts && counts[opt] != null && (
                  <span className="filter-option-count">{counts[opt]}</span>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ padding: '12px 10px', color: 'var(--text-3)', fontSize: '0.78rem' }}>No options match.</div>
          )}
        </div>
      )}
    </div>
  );
}

// ââ Command Palette âââââââââââââââââââââââââââââââââââââââââââââââââââ

function CommandPalette({ open, onClose, jobs, onSelectJob, onSetFilter }) {
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) { setQuery(''); setHighlighted(0); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  const q = query.toLowerCase().trim();

  const matchedJobs = useMemo(() => {
    if (!q) return jobs.slice(0, 8);
    return jobs.filter(j =>
      j.title.toLowerCase().includes(q) ||
      (j.location?.name || '').toLowerCase().includes(q)
    ).slice(0, 8);
  }, [q, jobs]);

  const quickActions = useMemo(() => {
    const actions = [
      { id: 'filter-remote', label: 'Show Remote roles', action: () => onSetFilter('workMode', 'Remote') },
      { id: 'filter-contract', label: 'Show Contract roles', action: () => onSetFilter('type', 'Contract') },
      { id: 'filter-fulltime', label: 'Show Full-time roles', action: () => onSetFilter('type', 'Full-time') },
      { id: 'clear', label: 'Clear all filters', action: () => onSetFilter('clear', null) },
    ];
    if (!q) return actions;
    return actions.filter(a => a.label.toLowerCase().includes(q));
  }, [q, onSetFilter]);

  const allItems = [...quickActions.map((a, i) => ({ type: 'action', ...a, idx: i })), ...matchedJobs.map((j, i) => ({ type: 'job', ...j, idx: quickActions.length + i }))];

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, allItems.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)); }
    if (e.key === 'Enter' && allItems[highlighted]) {
      e.preventDefault();
      const item = allItems[highlighted];
      if (item.type === 'action') { item.action(); onClose(); }
      else { onSelectJob(item); onClose(); }
    }
    if (e.key === 'Escape') onClose();
  };

  if (!open) return null;

  return (
    <div className="cmdk-overlay" onClick={onClose}>
      <div className="cmdk-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="cmdk-input-wrap">
          <IconSearch />
          <input
            ref={inputRef}
            className="cmdk-input"
            placeholder="Search roles, filter, jump to..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setHighlighted(0); }}
            onKeyDown={handleKey}
          />
        </div>
        <div className="cmdk-list">
          {quickActions.length > 0 && (
            <>
              <div className="cmdk-group-label">Quick actions</div>
              {quickActions.map((a, i) => (
                <button
                  key={a.id}
                  className={`cmdk-item ${highlighted === i ? 'highlighted' : ''}`}
                  onClick={() => { a.action(); onClose(); }}
                  onMouseEnter={() => setHighlighted(i)}
                >
                  <IconFilter />
                  {a.label}
                </button>
              ))}
            </>
          )}
          {matchedJobs.length > 0 && (
            <>
              <div className="cmdk-group-label">Roles</div>
              {matchedJobs.map((j, i) => {
                const idx = quickActions.length + i;
                return (
                  <button
                    key={j.id}
                    className={`cmdk-item ${highlighted === idx ? 'highlighted' : ''}`}
                    onClick={() => { onSelectJob(j); onClose(); }}
                    onMouseEnter={() => setHighlighted(idx)}
                  >
                    <IconBriefcase />
                    <span>{j.title}</span>
                    <span className="cmdk-item-meta">{formatDate(j.createdAt)}</span>
                  </button>
                );
              })}
            </>
          )}
          {allItems.length === 0 && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.82rem' }}>
              Nothing here. Try a different search.
            </div>
          )}
        </div>
        <div className="cmdk-footer">
          <span><kbd>ââ</kbd> navigate</span>
          <span><kbd>âµ</kbd> select</span>
          <span><kbd>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}

// ââ Main Page âââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

export default function CareersPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [lastUpdated, setLastUpdated] = useState('');
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Filter state from URL
  const [filters, setFilters] = useState({
    location: [],
    type: [],
    role: [],
    recruiter: '',
  });

  // Sync URL â filter state on mount / route change
  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query;
    setFilters({
      location: parseArrayParam(q.location),
      type: parseArrayParam(q.type),
      role: parseArrayParam(q.role),
      recruiter: (typeof q.recruiter === 'string' ? q.recruiter : '') || '',
    });
  }, [router.isReady, router.query]);

  // Load jobs
  useEffect(() => {
    fetch('/jobs.json')
      .then(r => r.json())
      .then(data => {
        setJobs(data.jobs || []);
        setLastUpdated(data.lastUpdated);
      })
      .catch(() => {});
  }, []);

  // Cmd+K listener
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(v => !v);
      }
      if (e.key === 'Escape') setPaletteOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ââ Derived data ââ

  const enrichedJobs = useMemo(() => jobs.map(j => ({
    ...j,
    _contractLabel: formatContractType(j.contractType),
    _workModeLabel: formatWorkMode(j.workMode),
    _roleCategory: categoriseRole(j.title),
    _locationDisplay: (j.location?.name && j.location.name !== 'Location TBD') ? j.location.name : null,
    _hasRealSummary: j.summary && j.summary !== 'Exciting opportunity to join our client.',
  })), [jobs]);

  // Build filter option lists (with counts) from ALL jobs
  const filterOptions = useMemo(() => {
    const locs = {}, types = {}, roles = {};
    enrichedJobs.forEach(j => {
      if (j._workModeLabel) locs[j._workModeLabel] = (locs[j._workModeLabel] || 0) + 1;
      if (j._locationDisplay) locs[j._locationDisplay] = (locs[j._locationDisplay] || 0) + 1;
      if (j._contractLabel) types[j._contractLabel] = (types[j._contractLabel] || 0) + 1;
      if (j._roleCategory) roles[j._roleCategory] = (roles[j._roleCategory] || 0) + 1;
    });
    return {
      location: { options: Object.keys(locs).sort(), counts: locs },
      type: { options: Object.keys(types).sort(), counts: types },
      role: { options: Object.keys(roles).sort(), counts: roles },
    };
  }, [enrichedJobs]);

  // Apply filters
  const filteredJobs = useMemo(() => {
    return enrichedJobs.filter(j => {
      if (filters.location.length > 0) {
        const match = filters.location.some(f =>
          f === j._workModeLabel || f === j._locationDisplay
        );
        if (!match) return false;
      }
      if (filters.type.length > 0 && !filters.type.includes(j._contractLabel)) return false;
      if (filters.role.length > 0 && !filters.role.includes(j._roleCategory)) return false;
      // Recruiter filter â placeholder: when recruiter data exists in jobs, filter here
      return true;
    });
  }, [enrichedJobs, filters]);

  // ââ URL sync ââ

  const pushFiltersToUrl = useCallback((newFilters) => {
    const params = {};
    if (newFilters.location.length) params.location = newFilters.location.join(',');
    if (newFilters.type.length) params.type = newFilters.type.join(',');
    if (newFilters.role.length) params.role = newFilters.role.join(',');
    if (newFilters.recruiter) params.recruiter = newFilters.recruiter;
    router.push({ pathname: '/', query: params }, undefined, { shallow: true });
  }, [router]);

  const toggleFilter = useCallback((key, value) => {
    setFilters(prev => {
      const arr = prev[key] || [];
      const next = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
      const updated = { ...prev, [key]: next };
      pushFiltersToUrl(updated);
      return updated;
    });
  }, [pushFiltersToUrl]);

  const clearFilters = useCallback(() => {
    const empty = { location: [], type: [], role: [], recruiter: '' };
    setFilters(empty);
    pushFiltersToUrl(empty);
  }, [pushFiltersToUrl]);

  const hasActiveFilters = filters.location.length > 0 || filters.type.length > 0 || filters.role.length > 0 || filters.recruiter !== '';

  // For Cmd+K quick actions
  const handleSetFilter = useCallback((key, value) => {
    if (key === 'clear') { clearFilters(); return; }
    if (key === 'workMode') {
      const updated = { ...filters, location: filters.location.includes(value) ? filters.location : [...filters.location, value] };
      setFilters(updated);
      pushFiltersToUrl(updated);
    } else if (key === 'type') {
      const updated = { ...filters, type: filters.type.includes(value) ? filters.type : [...filters.type, value] };
      setFilters(updated);
      pushFiltersToUrl(updated);
    }
  }, [filters, clearFilters, pushFiltersToUrl]);

  const openJob = (job) => {
    if (job.applyUrl && job.applyUrl !== '#') {
      window.open(job.applyUrl, '_blank');
    } else {
      window.location.href = `mailto:james@ethiqrec.com?subject=Application: ${encodeURIComponent(job.title)}`;
    }
  };

  // ââ Render ââ

  return (
    <>
      <Head>
        <title>Roles â Ethiq</title>
        <meta name="description" content="We place engineers at startups across EMEA. Live roles, no fluff." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* ââ Header ââ */}
      <header className="site-header">
        <div className="page-container header-inner">
          <div className="header-left">
            <img src="/ethiq-logo.svg" alt="Ethiq" className="logo-mark" />
            <nav className="header-nav">
              <button className="header-nav-item active">Roles</button>
            </nav>
          </div>
          <div className="header-right">
            <button className="cmdk-trigger" onClick={() => setPaletteOpen(true)}>
              <span>Search roles...</span>
              <kbd>âK</kbd>
            </button>
          </div>
        </div>
      </header>

      {/* ââ Hero ââ */}
      <section className="hero">
        <div className="page-container">
          <h1 className="hero-headline">We place engineers at startups.<br/>That&rsquo;s the whole thing.</h1>
          <p className="hero-sub">
            EMEA-focused tech recruitment. No &ldquo;transformational opportunities.&rdquo;
            Just real roles at companies we&rsquo;ve actually vetted.
          </p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-value">{jobs.length}</span>
              <span className="hero-stat-label">live roles</span>
            </div>
            {lastUpdated && (
              <div className="hero-stat">
                <span className="hero-stat-value">{formatDate(lastUpdated)}</span>
                <span className="hero-stat-label">last sync</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ââ Toolbar ââ */}
      <div className="toolbar">
        <div className="page-container toolbar-inner">
          <div className="toolbar-left">
            <FilterPill
              label="Location"
              options={filterOptions.location.options}
              selected={filters.location}
              onToggle={(v) => toggleFilter('location', v)}
              counts={filterOptions.location.counts}
            />
            <FilterPill
              label="Type"
              options={filterOptions.type.options}
              selected={filters.type}
              onToggle={(v) => toggleFilter('type', v)}
              counts={filterOptions.type.counts}
            />
            <FilterPill
              label="Role"
              options={filterOptions.role.options}
              selected={filters.role}
              onToggle={(v) => toggleFilter('role', v)}
              counts={filterOptions.role.counts}
            />
            {hasActiveFilters && (
              <button className="clear-filters-btn" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>
          <div className="toolbar-right">
            <span className="role-count">
              <strong>{filteredJobs.length}</strong> {filteredJobs.length === 1 ? 'role' : 'roles'}
            </span>
          </div>
        </div>
      </div>

      {/* ââ Jobs ââ */}
      <main className="jobs-container page-container">
        {filteredJobs.length > 0 ? (
          filteredJobs.map(job => (
            <div key={job.id} className="job-row" onClick={() => openJob(job)}>
              <div className="job-main">
                <div className="job-title-text">{job.title}</div>
                <div className="job-meta-row">
                  {job._locationDisplay && (
                    <><span>{job._locationDisplay}</span><span className="job-meta-sep">Â·</span></>
                  )}
                  {job._workModeLabel && (
                    <><span>{job._workModeLabel}</span><span className="job-meta-sep">Â·</span></>
                  )}
                  {job._contractLabel && <span>{job._contractLabel}</span>}
                  {job.createdAt && (
                    <><span className="job-meta-sep">Â·</span><span>{formatDate(job.createdAt)}</span></>
                  )}
                </div>
              </div>
              <div className="job-tags">
                {job._roleCategory && job._roleCategory !== 'Other' && (
                  <span className="job-tag">{job._roleCategory}</span>
                )}
                {job.salary && <span className="job-tag job-tag-accent">{job.salary}</span>}
              </div>
              <button
                className="job-apply"
                onClick={(e) => { e.stopPropagation(); openJob(job); }}
              >
                Apply <IconArrow />
              </button>
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-state-title">Nothing matches those filters.</div>
            <div className="empty-state-sub">Try fewer, or check back next week.</div>
          </div>
        )}
      </main>

      {/* ââ Footer ââ */}
      <footer className="site-footer">
        <div className="page-container footer-inner">
          <span className="footer-text">&copy; {new Date().getFullYear()} Ethiq Recruitment</span>
          <span className="footer-text">
            <a href="mailto:james@ethiqrec.com">james@ethiqrec.com</a>
          </span>
        </div>
      </footer>

      {/* ââ Command Palette ââ */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        jobs={enrichedJobs}
        onSelectJob={openJob}
        onSetFilter={handleSetFilter}
      />
    </>
  );
}
