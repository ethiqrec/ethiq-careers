import { NextResponse } from 'next/server'
import { getRoles } from '../../../../lib/roles.js'
import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer, Image, Link } from '@react-pdf/renderer'
import path from 'path'
import fs from 'fs'

const GREEN = '#79C088'
const LOGO_URL = 'https://ethiq-careers.vercel.app/ethiq-logo-nav.png'
const LINKEDIN_URL = 'https://www.linkedin.com/company/ethiqrec/posts/?feedView=all'

// Strip HTML tags and return array of {type, text} blocks
function parseHtmlToBlocks(html) {
  if (!html) return []
  const blocks = []
  const cleaned = html.replace(/<div[^>]*>/gi, '').replace(/<\/div>/gi, '')
  const parts = cleaned.split(/(<(?:h[1-6]|p|li|ul|ol)[^>]*>)/gi)
  let currentType = 'p'
  for (const part of parts) {
    const tagMatch = part.match(/^<(h[1-6]|p|li|ul|ol)/i)
    if (tagMatch) {
      currentType = tagMatch[1].toLowerCase()
      continue
    }
    const text = part.replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&rsquo;/g, "'").replace(/&lsquo;/g, "'").replace(/&rdquo;/g, '"').replace(/&ldquo;/g, '"').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").trim()
    if (text) {
      blocks.push({ type: currentType, text })
      currentType = 'p'
    }
  }
  return blocks
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#0E0E10',
    padding: 40,
    fontFamily: 'Helvetica',
    color: '#C8C8CC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2E',
    paddingBottom: 14,
    marginBottom: 24,
  },
  logo: {
    width: 100,
    height: 40,
    objectFit: 'contain',
  },
  linkedinLink: {
    fontSize: 9,
    color: '#6E6E73',
  },
  title: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#F5F5F7',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 4,
  },
  greenBar: {
    width: 30,
    height: 3,
    backgroundColor: GREEN,
    marginBottom: 16,
    marginTop: 8,
    borderRadius: 2,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 20,
    gap: 0,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1A1A1E',
    padding: 10,
    borderWidth: 0.5,
    borderColor: '#2A2A2E',
  },
  statLabel: {
    fontSize: 7,
    color: GREEN,
    letterSpacing: 1.5,
    fontFamily: 'Courier',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 10,
    color: '#F5F5F7',
  },
  sectionLabel: {
    fontSize: 8,
    color: GREEN,
    letterSpacing: 1.5,
    fontFamily: 'Courier',
    marginBottom: 10,
    marginTop: 8,
  },
  heading: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#F5F5F7',
    marginTop: 14,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#C8C8CC',
    marginBottom: 6,
  },
  listItem: {
    fontSize: 10,
    lineHeight: 1.6,
    color: '#C8C8CC',
    marginBottom: 3,
    paddingLeft: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#2A2A2E',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#6E6E73',
  },
  footerGreen: {
    fontSize: 8,
    color: GREEN,
  },
})

function RolePDF({ role }) {
  const blocks = parseHtmlToBlocks(role.description || role.jobDescription || '')

  return React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: styles.page },
      // Header with logo and LinkedIn
      React.createElement(View, { style: styles.header },
        React.createElement(Image, { src: LOGO_URL, style: styles.logo }),
        React.createElement(Link, { src: LINKEDIN_URL, style: styles.linkedinLink }, 'linkedin.com/company/ethiqrec')
      ),
      // Green accent bar
      React.createElement(View, { style: styles.greenBar }),
      // Title block
      React.createElement(Text, { style: styles.title }, role.title),
      React.createElement(Text, { style: styles.subtitle }, role.locationDisplay || role.location || ''),
      role.owner?.name ? React.createElement(Text, { style: styles.subtitle }, 'Recruiter: ' + role.owner.name) : null,
      // Stats row
      React.createElement(View, { style: styles.statsRow },
        React.createElement(View, { style: styles.statBox },
          React.createElement(Text, { style: styles.statLabel }, 'SALARY'),
          React.createElement(Text, { style: styles.statValue }, role.salaryDisplay || '-')
        ),
        React.createElement(View, { style: styles.statBox },
          React.createElement(Text, { style: styles.statLabel }, 'LOCATION'),
          React.createElement(Text, { style: styles.statValue }, role.locationDisplay || '-')
        ),
        React.createElement(View, { style: styles.statBox },
          React.createElement(Text, { style: styles.statLabel }, 'CONTRACT'),
          React.createElement(Text, { style: styles.statValue }, role.contractTypeLabel || '-')
        ),
      ),
      // Description
      React.createElement(Text, { style: styles.sectionLabel }, 'THE ROLE'),
      ...blocks.map((block, i) => {
        if (block.type.startsWith('h')) {
          return React.createElement(Text, { key: 'b' + i, style: styles.heading }, block.text)
        }
        if (block.type === 'li') {
          return React.createElement(Text, { key: 'b' + i, style: styles.listItem }, '\u2022  ' + block.text)
        }
        return React.createElement(Text, { key: 'b' + i, style: styles.paragraph }, block.text)
      }),
      // Footer
      React.createElement(View, { style: styles.footer, fixed: true },
        React.createElement(Text, { style: styles.footerText }, 'ethiq-careers.vercel.app'),
        React.createElement(Text, { style: styles.footerGreen }, 'ethiq'),
        React.createElement(Text, { style: styles.footerText }, new Date().toLocaleDateString('en-GB'))
      )
    )
  )
}

export async function GET(request, { params }) {
  try {
    const { slug } = await params
    const roles = await getRoles()
    const role = roles.find((r) => r.slug === slug)

    if (!role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    const buffer = await renderToBuffer(
      React.createElement(RolePDF, { role })
    )

    const filename = (role.title || 'role').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-ethiq.pdf'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="' + filename + '"',
        'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
      },
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 })
  }
}
