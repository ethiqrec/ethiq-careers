import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
      <h2 className="detail-title">Not found</h2>
      <p style={{ color: 'var(--text-dim)', marginTop: 8 }}>
        This role may have been filled or removed.
      </p>
      <Link
        href="/"
        style={{
          display: 'inline-block',
          marginTop: 24,
          color: 'var(--accent-blue)',
          fontFamily: 'var(--font-mono)',
          fontSize: 13,
        }}
      >
        ← all roles
      </Link>
    </div>
  )
}
