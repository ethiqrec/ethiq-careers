import './globals.css'
import PostHogProvider from './posthog-provider'
import PostHogPageView from './posthog-pageview'

export const metadata = {
  title: 'Roles — Ethiq',
  description:
    'Tech recruitment across the UK and Europe. AI, Data and Engineering roles, no fluff.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PostHogProvider>
          <PostHogPageView />
          {children}
        </PostHogProvider>
      </body>
    </html>
  )
}
