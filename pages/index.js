import { useState, useEffect } from 'react';
import Head from 'next/head';

export default function CareersPage() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [filters, setFilters] = useState({
    location: '',
    function: '',
    seniority: '', 
    workMode: ''
  });
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    // Load jobs data
    fetch('/jobs.json')
      .then(res => res.json())
      .then(data => {
        setJobs(data.jobs || []);
        setFilteredJobs(data.jobs || []);
        setLastUpdated(data.lastUpdated);
      })
      .catch(error => {
        console.error('Error loading jobs:', error);
        // Fallback to mock data for development
        const mockJobs = [
          {
            id: "mock-1",
            title: "Head of Engineering", 
            company: "Confidential - Global Fintech",
            contractType: "full_time",
            workMode: "hybrid",
            seniority: "director",
            function: "Engineering",
            salary: "£150k - £200k",
            location: { name: "London, UK" },
            summary: "Lead a world-class engineering team building next-generation financial infrastructure. Drive technical vision and scale our platform to serve millions of users globally.",
            createdAt: "2024-01-15T00:00:00Z",
            applyUrl: "#"
          }
        ];
        setJobs(mockJobs);
        setFilteredJobs(mockJobs);
      });
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = jobs.filter(job => {
      return (!filters.location || job.location?.name.toLowerCase().includes(filters.location.toLowerCase())) &&
             (!filters.function || job.function?.toLowerCase() === filters.function) &&
             (!filters.seniority || job.seniority === filters.seniority) &&
             (!filters.workMode || job.workMode === filters.workMode);
    });
    
    setFilteredJobs(filtered);
  }, [jobs, filters]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getWorkModeIcon = (workMode) => {
    switch(workMode) {
      case 'remote': return '🌐';
      case 'hybrid': return '🏢';
      case 'office': return '🏢';
      default: return '📍';
    }
  };

  const openJob = (job) => {
    if (job.applyUrl && job.applyUrl !== '#') {
      window.open(job.applyUrl, '_blank');
    } else {
      // Fallback - construct Atlas URL
      window.open(`https://api.recruitwithatlas.com/jobs/${job.id}`, '_blank');
    }
  };

  return (
    <>
      <Head>
        <title>Careers - Ethiq Recruitment</title>
        <meta name="description" content="Join the most ambitious teams shaping the future of finance, technology, and beyond. We connect extraordinary talent with transformational opportunities." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Inter:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>

      <div className="grain-overlay"></div>
      
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
          <p>Join the most ambitious teams shaping the future of finance, technology, and beyond. We connect extraordinary talent with transformational opportunities.</p>
          
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
      
      <section className="filters">
        <div className="container">
          <div className="filters-grid">
            <div className="filter-group">
              <label htmlFor="location">Location</label>
              <select 
                id="location" 
                className="filter-select"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              >
                <option value="">All Locations</option>
                <option value="london">London</option>
                <option value="new york">New York</option>
                <option value="singapore">Singapore</option>
                <option value="remote">Remote</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="function">Function</label>
              <select 
                id="function" 
                className="filter-select"
                value={filters.function}
                onChange={(e) => handleFilterChange('function', e.target.value)}
              >
                <option value="">All Functions</option>
                <option value="engineering">Engineering</option>
                <option value="finance">Finance</option>
                <option value="marketing">Marketing</option>
                <option value="operations">Operations</option>
                <option value="sales">Sales</option>
                <option value="product">Product</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="seniority">Seniority</label>
              <select 
                id="seniority" 
                className="filter-select"
                value={filters.seniority}
                onChange={(e) => handleFilterChange('seniority', e.target.value)}
              >
                <option value="">All Levels</option>
                <option value="senior">Senior</option>
                <option value="manager">Manager</option>
                <option value="director">Director</option>
                <option value="vp">VP</option>
                <option value="cxo">C-Level</option>
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="work-mode">Work Mode</label>
              <select 
                id="work-mode" 
                className="filter-select"
                value={filters.workMode}
                onChange={(e) => handleFilterChange('workMode', e.target.value)}
              >
                <option value="">All Modes</option>
                <option value="office">Office</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </select>
            </div>
          </div>
        </div>
      </section>
      
      <section className="jobs-section">
        <div className="container">
          <div className="section-header">
            <h2 className="jobs-count">{filteredJobs.length} Open Roles</h2>
            {lastUpdated && (
              <div className="last-updated">
                Updated {formatDate(lastUpdated)}
              </div>
            )}
          </div>
          
          <div className="jobs-grid">
            {filteredJobs.map((job, index) => (
              <div 
                key={job.id} 
                className="job-card"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => openJob(job)}
              >
                <div className="job-header">
                  <div>
                    <h3 className="job-title">{job.title}</h3>
                    <div className="job-company">{job.company}</div>
                  </div>
                  <div className="job-type">
                    {job.contractType?.replace('_', ' ') || 'Full Time'}
                  </div>
                </div>
                
                <div className="job-details">
                  <div className="job-detail">
                    <span className="job-detail-icon">📍</span>
                    <span>{job.location?.name || 'Location TBD'}</span>
                  </div>
                  <div className="job-detail">
                    <span className="job-detail-icon">{getWorkModeIcon(job.workMode)}</span>
                    <span>{job.workMode || 'Hybrid'}</span>
                  </div>
                  <div className="job-detail">
                    <span className="job-detail-icon">📊</span>
                    <span>{job.seniority || 'Mid-Senior'}</span>
                  </div>
                  <div className="job-detail">
                    <span className="job-detail-icon">🏷️</span>
                    <span>{job.function || 'Various'}</span>
                  </div>
                </div>
                
                {job.salary && <div className="job-salary">{job.salary}</div>}
                
                <p className="job-summary">{job.summary || 'Exciting opportunity to join a growing team.'}</p>
                
                <div className="job-footer">
                  <span className="job-posted">
                    {job.createdAt ? formatDate(job.createdAt) : 'Recently posted'}
                  </span>
                  <a 
                    href="#" 
                    className="apply-btn" 
                    onClick={(e) => {
                      e.stopPropagation(); 
                      openJob(job);
                    }}
                  >
                    Apply
                    <span>→</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
          
          {filteredJobs.length === 0 && (
            <div className="no-jobs">
              <h3>No jobs match your filters</h3>
              <p>Try adjusting your search criteria or check back later for new opportunities.</p>
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

      <style jsx global>{`
        :root {
          --primary-bg: #0a0a0a;
          --secondary-bg: #1a1a1a;
          --card-bg: #262626;
          --accent: #e8ff47;
          --accent-hover: #d4f033;
          --text-primary: #ffffff;
          --text-secondary: #a3a3a3;
          --border: #404040;
          --border-hover: #525252;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', sans-serif;
          background: var(--primary-bg);
          color: var(--text-primary);
          line-height: 1.6;
          overflow-x: hidden;
        }
        
        .grain-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          pointer-events: none;
          opacity: 0.02;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          z-index: 1000;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
        }
        
        header {
          padding: 2rem 0;
          border-bottom: 1px solid var(--border);
          position: relative;
          background: linear-gradient(135deg, var(--primary-bg) 0%, var(--secondary-bg) 100%);
        }
        
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .logo {
          height: 40px;
          width: auto;
        }
        
        .hero {
          padding: 4rem 0 6rem;
          text-align: center;
          background: radial-gradient(circle at 50% 50%, rgba(232, 255, 71, 0.03) 0%, transparent 50%);
        }
        
        .hero h1 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(3rem, 8vw, 6rem);
          font-weight: 600;
          margin-bottom: 1.5rem;
          letter-spacing: -0.04em;
          background: linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .hero p {
          font-size: 1.25rem;
          color: var(--text-secondary);
          max-width: 600px;
          margin: 0 auto 3rem;
          font-weight: 300;
        }
        
        .stats {
          display: flex;
          justify-content: center;
          gap: 4rem;
          margin-bottom: 3rem;
        }
        
        .stat {
          text-align: center;
        }
        
        .stat-number {
          font-family: 'Playfair Display', serif;
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--accent);
          display: block;
        }
        
        .stat-label {
          font-size: 0.9rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        
        .filters {
          padding: 3rem 0;
          border-bottom: 1px solid var(--border);
          background: var(--secondary-bg);
        }
        
        .filters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }
        
        .filter-group label {
          display: block;
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .filter-select {
          width: 100%;
          background: var(--card-bg);
          border: 1px solid var(--border);
          color: var(--text-primary);
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: all 0.3s ease;
        }
        
        .filter-select:focus {
          outline: none;
          border-color: var(--accent);
          box-shadow: 0 0 0 2px rgba(232, 255, 71, 0.1);
        }
        
        .jobs-section {
          padding: 4rem 0;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 3rem;
        }
        
        .jobs-count {
          font-family: 'Playfair Display', serif;
          font-size: 2rem;
          font-weight: 600;
          color: var(--text-primary);
        }
        
        .last-updated {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }
        
        .jobs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 2rem;
        }
        
        .job-card {
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 2rem;
          transition: all 0.4s ease;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          transform: translateY(0);
          opacity: 0;
          animation: fadeInUp 0.6s ease forwards;
        }
        
        .job-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(232, 255, 71, 0.05), transparent);
          transition: left 0.6s ease;
        }
        
        .job-card:hover {
          border-color: var(--border-hover);
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        }
        
        .job-card:hover::before {
          left: 100%;
        }
        
        .job-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }
        
        .job-title {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
          line-height: 1.3;
        }
        
        .job-company {
          font-size: 0.9rem;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 500;
        }
        
        .job-type {
          background: rgba(232, 255, 71, 0.1);
          color: var(--accent);
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .job-details {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        
        .job-detail {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }
        
        .job-detail-icon {
          width: 16px;
          height: 16px;
          opacity: 0.6;
        }
        
        .job-salary {
          font-family: 'Playfair Display', serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }
        
        .job-summary {
          color: var(--text-secondary);
          font-size: 0.95rem;
          line-height: 1.5;
          margin-bottom: 1.5rem;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .job-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .job-posted {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        
        .apply-btn {
          background: var(--accent);
          color: var(--primary-bg);
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .apply-btn:hover {
          background: var(--accent-hover);
          transform: translateX(4px);
        }
        
        .no-jobs {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--text-secondary);
        }
        
        .no-jobs h3 {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }
        
        footer {
          background: var(--secondary-bg);
          padding: 3rem 0;
          text-align: center;
          border-top: 1px solid var(--border);
          margin-top: 4rem;
        }
        
        .footer-content {
          color: var(--text-secondary);
        }
        
        .footer-logo {
          font-family: 'Playfair Display', serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @media (max-width: 768px) {
          .container {
            padding: 0 1rem;
          }
          
          .jobs-grid {
            grid-template-columns: 1fr;
          }
          
          .stats {
            gap: 2rem;
          }
          
          .filters-grid {
            grid-template-columns: 1fr;
          }
          
          .section-header {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }
        }
      `}</style>
    </>
  );
}
