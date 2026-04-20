import './globals.css'

export const metadata = {
  title: 'Roles \u2014 Ethiq',
  description:
    'Tech recruitment across the UK and Europe. AI, Data and Engineering roles, no fluff.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
