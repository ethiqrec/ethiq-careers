import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function CareersPage() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    fetch('/jobs.json')
      .then(res => res.json())
      .then(data => {
        setJobs(data.jobs || []);
        setFilteredJobs(data.jobs || []);
        setLastUpdated(data.lastUpdated);
      })
      .catch(error => {
        console.error('Error loading jobs:', error);
      });
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredJobs(jobs);
      return;
    }
    const term = searchTerm.toLowerCase();
    const filtered = jobs.filter(job =>
      (job.title || '').toLowerCase().includes(term) ||
      (job.location || '').toLowerCase().includes(term) ||
      (job.description || '').toLowerCase().includes(term) ||
      (job.companyMeta || '').toLowerCase().includes(term)
    );
    setFilteredJobs(filtered);
  }, [jobs, searchTerm]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil(Math.abs(now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const formatContractType = (type) => {
    if (!type) return null;
    const map = {
      full_time: 'Full-time', part_time: 'Part-time',
      contract: 'Contract', freelance: 'Freelance',
      internship: 'Internship', temporary: 'Temporary',
    non_exec: 'Non-Executive'
    };
    return map[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const formatWorkMode = (mode) => {
    if (!mode) return null;
    const map = { remote: 'Remote', hybrid: 'Hybrid', office: 'On-site', on_site: 'On-site' };
    return map[mode] || mode.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const openJob = (job) => {
    if (job.applyUrl) {
      window.open(job.applyUrl, '_blank');
    }
  };

  return (
    <>
      <Head>
        <title>Careers - Ethiq Recruitment</title>
        <meta name="description" content="Join the most ambitious teams shaping the future of finance, technology, and beyond." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header>
        <div className="container">
          <div className="header-content">
            <img src="/ethiq-logo.svg" alt="Ethiq Logo" className="logo" />
          </div>
        </div>
      </header>

      <section className="hero">
        <div className="container">
          <h1>Exceptional Careers</h1>
          <p>We connect extraordinary talent with transformational opportunities in technology, data, and digital.</p>
          <div className="stats">
            <div className="stat">
              <span className="stat-number">{jobs.length}</span>
              <span className="stat-label">Open Roles</span>
            </div>
            <div className="stat">
              <span className="stat-number">150+</span>
              <span className="stat-label">Companies</span>
            </div>
            <div className="stat">
              <span className="stat-number">95%</span>
              <span className="stat-label">Success Rate</span>
            </div>
          </div>
        </div>
      </section>

      <section className="jobs-section">
        <div className="container">
          <div className="section-header">
            <div className="section-header-left">
              <h2 className="jobs-count">{filteredJobs.length} Open Roles</h2>
              {lastUpdated && (
                <div className="last-updated">Updated {formatDate(lastUpdated)}</div>
              )}
            </div>
            <div className="section-header-right">
              <input
                type="text"
                className="search-input"
                placeholder="Search roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="view-toggle">
                <button
                  className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid view"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="0" y="0" width="7" height="7" rx="1" />
                    <rect x="9" y="0" width="7" height="7" rx="1" />
                    <rect x="0" y="9" width="7" height="7" rx="1" />
                    <rect x="9" y="9" width="7" height="7" rx="1" />
                  </svg>
                </button>
                <button
                  className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List view"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="0" y="1" width="16" height="3" rx="1" />
                    <rect x="0" y="6.5" width="16" height="3" rx="1" />
                    <rect x="0" y="12" width="16" height="3" rx="1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className={viewMode === 'grid' ? 'jobs-grid' : 'jobs-list'}>
            {filteredJobs.map((job, index) => (
              <div
                key={job.id}
                className={viewMode === 'grid' ? 'job-card' : 'job-card job-card-list'}
                style={{ animationDelay: `${Math.min(index * 0.05, 1)}s` }}
                onClick={() => openJob(job)}
              >
                {viewMode === 'grid' ? (
                  <>
                    <h3 className="job-title">{job.title}</h3>

                    {job.companyMeta && (
                      <p className="job-company-meta">{job.companyMeta}</p>
                    )}

                    <div className="job-tags">
                      {job.location && (
                        <span className="job-tag job-tag-location">{job.location}</span>
                      )}
                      {formatContractType(job.contractType) && (
                        <span className="job-tag">{formatContractType(job.contractType)}</span>
                      )}
                      {formatWorkMode(job.workMode) && (
                        <span className="job-tag">{formatWorkMode(job.workMode)}</span>
                      )}
                      {job.visaSupport === true && (
                        <span className="job-tag job-tag-visa">Visa Sponsorship</span>
                      )}
                    </div>

                    {job.salary && (
                      <p className="job-salary">{job.salary}</p>
                    )}

                    {job.description && (
                      <p className="job-summary">{job.description.length > 180 ? job.description.substring(0, 180) + '...' : job.description}</p>
                    )}

                    <div className="job-footer">
                      <span className="job-posted">
                        {job.createdAt ? formatDate(job.createdAt) : 'New'}
                      </span>
                      <a
                        href={job.applyUrl || '#'}
                        className="apply-btn"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Apply
                      </a>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="job-list-main">
                      <h3 className="job-title">{job.title}</h3>
                      <div className="job-list-tags">
                        {job.companyMeta && (
                          <span className="job-tag job-tag-company">{job.companyMeta}</span>
                        )}
                        {job.location && (
                          <span className="job-tag job-tag-location">{job.location}</span>
                        )}
                        {formatContractType(job.contractType) && (
                          <span className="job-tag">{formatContractType(job.contractType)}</span>
                        )}
                        {formatWorkMode(job.workMode) && (
                          <span className="job-tag">{formatWorkMode(job.workMode)}</span>
                        )}
                        {job.salary && (
                          <span className="job-tag job-tag-salary">{job.salary}</span>
                        )}
                        {job.visaSupport === true && (
                          <span className="job-tag job-tag-visa">Visa Sponsorship</span>
                        )}
                        {job.createdAt && (
                          <span className="job-posted">{formatDate(job.createdAt)}</span>
                        )}
                      </div>
                    </div>
                    <a
                      href={job.applyUrl || '#'}
                      className="apply-btn apply-btn-sm"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Apply
                    </a>
                  </>
                )}
              </div>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <div className="no-jobs">
              <h3>No roles match your search</h3>
              <p>Try a different search term or check back later for new opportunities.</p>
            </div>
          )}
        </div>
      </section>

      <footer>
        <div className="container">
          <div className="footer-content">
            <img src="/ethiq-logo.svg" alt="Ethiq Logo" style={{ height: '30px', width: 'auto', marginBottom: '1rem' }} />
            <p>Exceptional recruitment for exceptional talent</p>
          </div>
        </div>
      </footer>
    </>
  );
}
