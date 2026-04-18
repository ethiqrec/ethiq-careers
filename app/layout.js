import './globals.css'

export const metadata = {
  title: 'Roles — Ethiq',
  description:
    'We place engineers at startups across EMEA. Live roles, no fluff.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
