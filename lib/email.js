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

export async function sendApplicationEmail({ to, applicantName, applicantEmail, linkedinUrl, note, cvUrl, roleTitle }) {
  return send({
    from: 'Ethiq Careers <onboarding@resend.dev>',
    to,
    subject: `New application: ${roleTitle} -- ${applicantName}`,
    html: `
      <h2>New application via ethiq-careers.vercel.app</h2>
      <p><strong>Role:</strong> ${roleTitle}</p>
      <p><strong>Name:</strong> ${applicantName}</p>
      <p><strong>Email:</strong> <a href="mailto:${applicantEmail}">${applicantEmail}</a></p>
      ${linkedinUrl ? `<p><strong>LinkedIn:</strong> <a href="${linkedinUrl}">${linkedinUrl}</a></p>` : ''}
      ${cvUrl ? `<p><strong>CV:</strong> <a href="${cvUrl}">Download</a></p>` : ''}
      ${note ? `<p><strong>Note:</strong> ${note}` : ''}
    `.trim(),
  })
}

export async function sendReferralEmail({ referrerName, referrerEmail, referredName, referredLinkedin, referredCvUrl, note, roleTitle, alreadyExists }) {
  const subject = alreadyExists
    ? `Referral (already in system): ${referredName || 'Unknown'} for ${roleTitle}`
    : `New referral: ${referredName || 'Unknown'} for ${roleTitle}`

  return send({
    from: 'Ethiq Careers <onboarding@resend.dev>',
    to: process.env.REFERRAL_EMAIL_TO || process.env.OWNER_EMAIL_FALLBACK || '',
    subject,
    html: `
      <h2>${alreadyExists ? 'Duplicate referral' : 'New referral'} via ethiq-careers.vercel.app</h2>
      <p><strong>Role:</strong> ${roleTitle}</p>
      <h3>Referrer</h3>
      <p><strong>Name:</strong> ${referrerName}</p>
      <p><strong>Email:</strong> <a href="mailto:${referrerEmail}">${referrerEmail}</a></p>
      <h3>Referred candidate</h3>
      ${referredName ? `<p><strong>Name:</strong> ${referredName}</p>` : ''}
      ${referredLinkedin ? `<p><strong>LinkedIn:</strong> <a href="${referredLinkedin}">${referredLinkedin}</a></p>` : ''}
      ${referredCvUrl ? `<p><strong>CV:</strong> <a href="${referredCvUrl}">Download</a></p>` : ''}
      ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
      ${alreadyExists ? '<p><em>This person is already in the system. No reward applies.</em></p>' : ''}
    `.trim(),
  })
}
