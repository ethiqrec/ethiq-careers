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

export async function sendApplicationEmail({ to, applicantName, applicantEmail, linkedinUrl, note, cvUrl, roleTitle }) {
  const resend = await getResend()
  if (!resend) {
    console.warn('No email provider configured — skipping application email')
    return
  }

  await resend.emails.send({
    from: 'Ethiq Careers <careers@ethiqrec.com>',
    to,
    subject: `New application: ${roleTitle} — ${applicantName}`,
    html: `
      <h2>New application via ethiq-careers.vercel.app</h2>
      <p><strong>Role:</strong> ${roleTitle}</p>
      <p><strong>Name:</strong> ${applicantName}</p>
      <p><strong>Email:</strong> <a href="mailto:${applicantEmail}">${applicantEmail}</a></p>
      ${linkedinUrl ? `<p><strong>LinkedIn:</strong> <a href="${linkedinUrl}">${linkedinUrl}</a></p>` : ''}
      ${cvUrl ? `<p><strong>CV:</strong> <a href="${cvUrl}">Download</a></p>` : ''}
      ${note ? `<p><strong>Note:</strong> ${note}</p>` : ''}
    `.trim(),
  })
}

export async function sendReferralEmail({ referrerName, referrerEmail, referredName, referredLinkedin, referredCvUrl, note, roleTitle, alreadyExists }) {
  const resend = await getResend()
  if (!resend) {
    console.warn('No email provider configured — skipping referral email')
    return
  }

  const subject = alreadyExists
    ? `Referral (already in system): ${referredName || 'Unknown'} for ${roleTitle}`
    : `New referral: ${referredName || 'Unknown'} for ${roleTitle}`

  await resend.emails.send({
    from: 'Ethiq Careers <careers@ethiqrec.com>',
    to: 'james@ethiqrec.com',
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

