import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Privacy policy — Ethiq',
  description: 'How Ethiq handles your personal data.',
}

const styles = `
  .pv-wrap {
    max-width: 760px;
    margin: 0 auto;
    padding: 48px 24px 80px;
  }
  .pv-wrap > p {
    font-size: 15px;
    color: var(--text-muted);
    line-height: 1.7;
    margin: 0 0 18px;
  }
  .pv-wrap p strong, .pv-wrap li strong {
    color: var(--text-primary);
    font-weight: 500;
  }
  .pv-wrap h2 {
    font-size: 17px;
    color: var(--text-primary);
    font-weight: 500;
    letter-spacing: -0.2px;
    margin: 44px 0 14px;
    padding-top: 28px;
    border-top: 0.5px solid var(--border);
    display: flex;
    align-items: baseline;
    gap: 12px;
  }
  .pv-wrap h2 .num {
    font-family: var(--font-mono);
    font-size: 12px;
    font-weight: 400;
    color: var(--text-mono);
    letter-spacing: 0.4px;
  }
  .pv-wrap ul {
    list-style: disc;
    padding-left: 22px;
    margin: 0 0 18px;
  }
  .pv-wrap li {
    font-size: 15px;
    color: var(--text-muted);
    line-height: 1.7;
    margin: 0 0 6px;
  }
  .pv-wrap a {
    color: var(--accent-blue);
  }
  .pv-wrap a:hover {
    text-decoration: underline;
  }
  .pv-lede {
    color: var(--text-primary) !important;
  }
  .pv-meta {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-mono);
    letter-spacing: 0.3px;
    margin-bottom: 8px;
  }
  @media (max-width: 480px) {
    .pv-wrap { padding: 32px 16px 64px; }
    .pv-wrap h2 { font-size: 16px; }
  }
`

export default function PrivacyPolicyPage() {
  return (
    <>
      <style>{styles}</style>

      {/* Nav */}
      <nav className="nav">
        <div className="container nav-inner">
          <Link href="/" className="nav-logo">
            <Image src="/ethiq-logo-nav.png" alt="Ethiq" width={300} height={120} priority />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <h1>Privacy policy</h1>
          <p className="hero-sub">How we handle your personal data.</p>
          <p className="hero-meta">Last updated: 6 December 2024</p>
        </div>
      </section>

      {/* Body */}
      <section className="container">
        <article className="pv-wrap">
          <p className="pv-lede">
            This privacy policy sets out how ALSA Consulting, trading as Ethiq (&ldquo;Ethiq&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), collects, uses, and protects your personal information when you use our services or engage with us. It also outlines your rights under data protection laws.
          </p>
          <p>
            By using our services, visiting our website, or sharing personal information with us, you agree to the practices described in this policy.
          </p>

          <h2><span className="num">01</span> Definitions</h2>
          <ul>
            <li><strong>Account.</strong> A unique profile created to access parts of our service.</li>
            <li><strong>Company.</strong> ALSA Consulting Ltd, trading as Ethiq. Registered office: The Retreat, 406 Roding Lane South, Woodford Green, Essex, England, IG8 8EY.</li>
            <li><strong>Cookies.</strong> Small data files stored on your device to improve your online experience.</li>
            <li><strong>Country.</strong> United Kingdom.</li>
            <li><strong>Device.</strong> Any tool used to access our services, such as a mobile phone, tablet, or computer.</li>
            <li><strong>Personal Data.</strong> Information that identifies you as an individual.</li>
            <li><strong>Service.</strong> The website, communication tools, and recruitment services offered by Ethiq.</li>
            <li><strong>Service Providers.</strong> Third parties that support our services (e.g., marketing tools, job boards, analytics platforms).</li>
            <li><strong>Usage Data.</strong> Data collected automatically through your interaction with our website or services.</li>
            <li><strong>You / Your.</strong> The individual or entity using our services or interacting with us.</li>
          </ul>

          <h2><span className="num">02</span> What personal data we collect</h2>
          <p>When you engage with us, we may collect the following personal information:</p>
          <ul>
            <li>Name and contact details (email, phone number)</li>
            <li>CV and employment history</li>
            <li>Date of birth (if shared)</li>
            <li>Address details</li>
            <li>Salary expectations or current package</li>
            <li>Social media links (e.g. LinkedIn)</li>
            <li>Notes on your career preferences and aspirations</li>
            <li>Technical data like IP address, browser type, and usage patterns</li>
          </ul>

          <h2><span className="num">03</span> How we use your personal data</h2>
          <p>We use your data to:</p>
          <ul>
            <li>Deliver and improve our recruitment and consulting services</li>
            <li>Match you with relevant job opportunities</li>
            <li>Share your CV with potential employers (only with your consent)</li>
            <li>Contact you about roles, updates, or insights relevant to your field</li>
            <li>Maintain business and compliance records</li>
            <li>Send marketing emails and newsletters (you can unsubscribe at any time)</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2><span className="num">04</span> Cookies and tracking technologies</h2>
          <p>We use cookies and similar technologies (like beacons and scripts) to:</p>
          <ul>
            <li>Analyse website traffic and performance</li>
            <li>Remember your preferences</li>
            <li>Improve user experience</li>
          </ul>
          <p>You can manage or disable cookies through your browser settings. Some parts of our website may not function properly without them.</p>

          <h2><span className="num">05</span> Sharing your data</h2>
          <p>We may share your personal data:</p>
          <ul>
            <li>With potential employers (only with your permission)</li>
            <li>With service providers (e.g. Mailchimp, analytics tools) who help us run our business</li>
            <li>During a business sale, merger, or restructuring</li>
            <li>If required by law or for legal reasons</li>
          </ul>
          <p>We will never sell your data or share it without your consent.</p>

          <h2><span className="num">06</span> Data retention</h2>
          <p>We only keep your data for as long as needed for the purposes outlined in this policy or to comply with legal obligations.</p>
          <p>You can request deletion of your data at any time by emailing <a href="mailto:privacy@ethiq.uk">privacy@ethiq.uk</a>.</p>

          <h2><span className="num">07</span> International data transfers</h2>
          <p>Your data may be stored or processed outside the UK. We take steps to ensure your information remains protected, regardless of location, in line with UK data protection laws.</p>

          <h2><span className="num">08</span> Data security</h2>
          <p>We take your privacy seriously. While no system is 100% secure, we follow industry best practices to safeguard your data. This includes using secure servers, password protection, and limiting access to authorised personnel only.</p>

          <h2><span className="num">09</span> Your rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access or update your personal data</li>
            <li>Request that we delete your data</li>
            <li>Withdraw consent for marketing</li>
            <li>Make a complaint to the UK Information Commissioner&rsquo;s Office (<a href="https://www.ico.org.uk" target="_blank" rel="noopener noreferrer">www.ico.org.uk</a>)</li>
          </ul>
          <p>Before contacting the ICO, we&rsquo;d appreciate the opportunity to resolve your concerns directly &mdash; please contact us first.</p>

          <h2><span className="num">10</span> Changes to this policy</h2>
          <p>We may update this policy from time to time. We&rsquo;ll notify you of any material changes and update the &ldquo;Last updated&rdquo; date at the top of the page. We encourage you to review this page periodically.</p>

          <h2><span className="num">11</span> Contact us</h2>
          <p>If you have any questions about this policy or wish to exercise your rights, contact <a href="mailto:privacy@ethiqrec.com">privacy@ethiqrec.com</a>.</p>
        </article>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="container footer-inner">
          <span className="footer-text">&copy; {new Date().getFullYear()} Ethiq Recruitment</span>
          <span className="footer-text">
            <Link href="/privacy-policy">Privacy policy</Link>
            <a
              href="https://www.linkedin.com/company/ethiqrec/posts/?feedView=all"
              target="_blank"
              rel="noopener noreferrer"
              className="linkedin-link"
              aria-label="Ethiq on LinkedIn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
          </span>
        </div>
      </footer>
    </>
  )
}
