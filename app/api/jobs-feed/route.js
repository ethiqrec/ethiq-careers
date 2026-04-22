import { getRoles } from '../../../lib/roles.js'

const BASE_URL = 'https://ethiq-careers.vercel.app'
const COMPANY = 'Ethiq'

function escapeXml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function stripHtml(html) {
  if (!html) return ''
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function formatDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0]
  try {
    return new Date(dateStr).toISOString().split('T')[0]
  } catch {
    return new Date().toISOString().split('T')[0]
  }
}

// Parse location into city and country
function parseLocation(role) {
  const loc = role.locationDisplay || role.location || ''
  // Common UK cities
  const ukCities = ['london', 'manchester', 'birmingham', 'leeds', 'bristol', 'edinburgh', 'glasgow', 'cambridge', 'oxford', 'brighton', 'nottingham', 'sheffield', 'liverpool', 'newcastle', 'cardiff', 'belfast', 'reading', 'bath']
  const lower = loc.toLowerCase()

  let city = loc
  let country = 'GB'

  // Check for known patterns
  if (lower.includes('switzerland') || lower.includes('zurich') || lower.includes('z\u00fcrich')) {
    country = 'CH'
    city = loc.replace(/[,\s]*(switzerland)/i, '').trim() || 'Zurich'
  } else if (lower.includes('remote')) {
    city = 'Remote'
    country = 'GB'
  } else if (lower.includes('uk') || lower.includes('united kingdom') || ukCities.some(c => lower.includes(c))) {
    country = 'GB'
    city = loc.replace(/[,\s]*(uk|united kingdom)/i, '').trim() || loc
  }

  return { city: city || 'United Kingdom', country }
}

export async function GET() {
  try {
    const roles = await getRoles()

    const jobItems = roles.map((role) => {
      const { city, country } = parseLocation(role)
      const description = stripHtml(role.description) || role.descriptor || role.title
      const url = `${BASE_URL}/roles/${role.slug}`
      const date = formatDate(role.createdAt)

      // Map contract type to Indeed format
      let jobType = ''
      if (role.contractType) {
        const ct = role.contractType.toLowerCase()
        if (ct === 'permanent' || ct === 'full-time') jobType = 'full-time'
        else if (ct === 'contract') jobType = 'contract'
        else if (ct === 'part-time') jobType = 'part-time'
      }

      // Build salary string if available
      let salary = ''
      if (role.salaryDisplay) {
        salary = role.salaryDisplay
      }

      return `  <job>
    <title><![CDATA[${role.title}]]></title>
    <date>${date}</date>
    <referencenumber>${role.id}</referencenumber>
    <url><![CDATA[${url}]]></url>
    <company><![CDATA[${COMPANY}]]></company>
    <city><![CDATA[${city}]]></city>
    <country>${country}</country>
    <description><![CDATA[${description}]]></description>${
      jobType ? `\n    <jobtype>${jobType}</jobtype>` : ''
    }${
      salary ? `\n    <salary><![CDATA[${salary}]]></salary>` : ''
    }
  </job>`
    })

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<source>
  <publisher>${COMPANY}</publisher>
  <publisherurl>${BASE_URL}</publisherurl>
  <lastBuildDate>${new Date().toISOString()}</lastBuildDate>
${jobItems.join('\n')}
</source>`

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
      },
    })
  } catch (err) {
    return new Response('<error>Failed to generate feed</error>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml' },
    })
  }
}
