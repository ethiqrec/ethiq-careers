// Email via Resend

let resendClient = null

async function getResend() {
  if (resendClient) return resendClient
  if (!process.env.EMAIL_PROVIDER_KEY) return null
  try {
    const { Resend } = await import('resend')
    resendClient = new Resend(process.env.EMAIL_PROVIDER_KEY)
    return resendClient
  } catch {
    return null
  }
}

// Resend SDK v6 returns { data, error } instead of throwing on failure.
// Re-throw so callers can log the real error.
async function send(payload) {
  const resend = await getResend()
  if (!resend) {
    console.warn('No email provider configured -- skipping email')
    return
  }
  const result = await resend.emails.send(payload)
  if (result?.error) {
    const e = result.error
    throw new Error(`Resend error: ${e.name || ''} ${e.message || JSON.stringify(e)}`)
  }
  return result?.data
}

export async function sendApplicationEmail({
  to,
  applicantName,
  applicantEmail,
  linkedinUrl,
  note,
  cvUrl,
  cvBuffer,
  cvFilename,
  roleTitle,
}) {
  const attachments = []
  if (cvBuffer && cvFilename) {
    attachments.push({
      filename: cvFilename,
      content: Buffer.isBuffer(cvBuffer) ? cvBuffer : Buffer.from(cvBuffer),
    })
  }

  // Only render a CV download link in the body if we have a real public URL
  // (Vercel Blob etc.). Skip /tmp/... paths and other non-public URLs.
  const cvLinkHtml =
    cvUrl && /^https?:\/\//i.test(cvUrl)
      ? `<p><strong>CV link:</strong> <a href="${cvUrl}">Download</a></p>`
      : ''

  const cvAttachedHtml =
    attachments.length > 0
      ? `<p><strong>CV:</strong> attached as ${cvFilename}</p>`
      : ''

  return send({
    from: 'Ethiq Careers <onboarding@resend.dev>',
    to,
    subject: `New application: ${roleTitle} -- ${applicantName}`,
    attachments: attachments.length > 0 ? attachments : undefined,
    html: `
      <h2>New application via ethiq-careers.vercel.app</h2>
      <p><strong>Role:</strong> ${roleTitle}</p>
      <p><strong>Name:</strong> ${applicantName}</p>
      <p><strong>Email:</strong> <a href="mailto:${applicantEmail}">${applicantEmail}</a></p>
      ${linkedinUrl ? `<p><strong>LinkedIn:</strong> <a href="${linkedinUrl}">${linkedinUrl}</a></p>` : ''}
      ${cvAttachedHtml}
      ${cvLinkHtml}
      ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
    `.trim(),
  })
}

export async function sendReferralEmail({
  referrerName,
  referrerEmail,
  referredName,
  referredLinkedin,
  referredCvUrl,
  referredCvBuffer,
  referredCvFilename,
  note,
  roleTitle,
  alreadyExists,
}) {
  const subject = alreadyExists
    ? `Referral (already in system): ${referredName || 'Unknown'} for ${roleTitle}`
    : `New referral: ${referredName || 'Unknown'} for ${roleTitle}`

  const attachments = []
  if (referredCvBuffer && referredCvFilename) {
    attachments.push({
      filename: referredCvFilename,
      content: Buffer.isBuffer(referredCvBuffer) ? referredCvBuffer : Buffer.from(referredCvBuffer),
    })
  }

  const cvLinkHtml =
    referredCvUrl && /^https?:\/\//i.test(referredCvUrl)
      ? `<p><strong>CV link:</strong> <a href="${referredCvUrl}">Download</a></p>`
      : ''

  const cvAttachedHtml =
    attachments.length > 0
      ? `<p><strong>CV:</strong> attached as ${referredCvFilename}</p>`
      : ''

  return send({
    from: 'Ethiq Careers <onboarding@resend.dev>',
    to: process.env.REFERRAL_EMAIL_TO || process.env.OWNER_EMAIL_FALLBACK || '',
    subject,
    attachments: attachments.length > 0 ? attachments : undefined,
    html: `
      <h2>${alreadyExists ? 'Duplicate referral' : 'New referral'} via ethiq-careers.vercel.app</h2>
      <p><strong>Role:</strong> ${roleTitle}</p>
      <h3>Referrer</h3>
      <p><strong>Name:</strong> ${referrerName}</p>
      <p><strong>Email:</strong> <a href="mailto:${referrerEmail}">${referrerEmail}</a></p>
      <h3>Referred candidate</h3>
      ${referredName ? `<p><strong>Name:</strong> ${referredName}</p>` : ''}
      ${referredLinkedin ? `<p><strong>LinkedIn:</strong> <a href="${referredLinkedin}">${referredLinkedin}</a></p>` : ''}
      ${cvAttachedHtml}
      ${cvLinkHtml}
      ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
      ${alreadyExists ? '<p><em>This person is already in the system. No reward applies.</em></p>' : ''}
    `.trim(),
  })
}
