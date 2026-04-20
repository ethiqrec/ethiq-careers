import Image from 'next/image'
import Link from 'next/link'

export const metadata = {
  title: 'About \u2014 Ethiq',
  description: 'Ethiq is a tech recruitment firm specialising in AI, Data and Engineering talent across the UK and Europe.',
}

const TEAM = [
  {
    name: 'Fraser Tait',
    role: 'Co-founder',
    photo: '/team/fraser.png',
    linkedin: 'https://www.linkedin.com/in/ftait/',
  },
  {
    name: 'Anton Howell',
    role: 'Co-founder',
    photo: '/team/anton.png',
    linkedin: 'https://www.linkedin.com/in/antonhowell',
  },
  {
    name: 'James Wilson',
    role: 'Recruiter',
    photo: '/team/james.png',
    linkedin: 'https://www.linkedin.com/in/james-wilson-92170656',
  },
  {
    name: 'Mark Worsfold',
    role: 'Recruiter',
    photo: '/team/mark.png',
    linkedin: 'https://www.linkedin.com/in/markworsfold',
  },
]

function LinkedInIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ opacity: 0.6 }}
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

export default function AboutPage() {
  return (
    <>
      {/* Nav */}
      <nav className="nav">
        <div className="container nav-inner">
          <Link href="/" className="nav-logo"><Image src="/ethiq-logo-nav.png" alt="Ethiq" width={250} height={100} priority /></Link>
          <ul className="nav-links">
            <li><Link href="/">Roles</Link></li>
            <li><Link href="/about/" className="active">About</Link></li>
          </ul>
        </div>
      </nav>

      {/* Content */}
      <section className="about-section">
        <div className="container">
          <h1 className="about-heading">About</h1>
          <p className="about-intro">
            Ethiq is a tech recruitment firm specialising in AI, Data and Engineering
            talent across the UK and Europe. We work with companies of all sizes, from
            early-stage startups to scaling enterprises. Small team, deep domain
            knowledge, zero bureaucracy, direct process.
          </p>

          <div className="team-grid">
            {TEAM.map((person) => (
              <div key={person.name} className="team-card">
                <div className="team-photo-wrap">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={person.photo}
                    alt={person.name}
                    width={400}
                    height={400}
                    className="team-photo"
                    loading="lazy"
                  />
                </div>
                <div className="team-info">
                  <div className="team-name">{person.name}</div>
                  <div className="team-role">{person.role}</div>
                  <a
                    href={person.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="team-linkedin"
                    aria-label={person.name + ' on LinkedIn'}
                  >
                    <LinkedInIcon />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

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
