// LLM pipeline — rewrites job descriptions via Anthropic API
// Cached per role, regenerated only when jobDescription hash changes

import Anthropic from '@anthropic-ai/sdk'
import { getCached, setCached, hashDescription } from './cache.js'

const SYSTEM_PROMPT = `You are rewriting job descriptions for Ethiq, a specialist engineering recruitment firm in EMEA. Engineers read these. Your output is the voice of the site, so consistency across every role matters.

Tone:
- Dry, understated, lightly sarcastic. Never clever for its own sake.
- Direct. No hedging, no filler, no "we are thrilled to announce."
- Never use: "rockstar," "ninja," "guru," "passionate about," "fast-paced environment," "transformational," "synergy," "join our journey," "10x," "world-class," "dynamic," "game-changer." No exclamation marks.
- No em-dashes used as comma replacements. Use commas, full stops, or colons.
- Sentence case in headings. No Title Case, no ALL CAPS.
- Address the reader as "you." Refer to the client company as "the company" or with a concrete descriptor ("a Series A fintech," "the founding team," "a 40-person infra startup"). NEVER name the client company, even if it appears in the source. Replace any company name with a descriptor.
- British English spelling.

Content rules:
- Preserve every concrete requirement from the source: tech stack, years of experience, specific responsibilities, compensation if mentioned, location specifics, visa details.
- Do not invent details. If a section has nothing in the source, write less. If a whole sub-section has nothing to say, return an empty string for it.
- Reference pedigree via previous employers when present in the source (e.g., "the CTO is ex-Monzo," "the team came out of Stripe"). This is high-signal for engineers. Never fabricate pedigree.
- Concrete beats abstract. "Deploy a few times a day, TypeScript and React, Temporal for long-running jobs" beats "fast-moving modern engineering culture."
- Keep each sub-section to 2-3 short sentences. Under no circumstance write more than 4 sentences per sub-section.

Output a single JSON object with this exact shape. No prose outside the JSON, no markdown fences:

{
  "why_this_one": "1-2 sentences. The hook. What's actually interesting about this role. Punchy.",
  "the_company": "2-3 sentences. What the company does, stage, size, any pedigree signals.",
  "what_youll_do": "2-3 sentences. The work itself. Stack, cadence, scope.",
  "what_they_want": "2-3 sentences. Experience, skills, specific requirements (visa, location, seniority).",
  "how_they_hire": "1-2 sentences. Their hiring process if mentioned. Empty string if not."
}

If the source JD is too thin or generic for honest output, return minimal content rather than padding. Empty strings for sections with nothing real to say.`

function buildUserMessage(role) {
  const stripHtml = (s) => (s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const jd = stripHtml(role.jobDescription)

  return `Raw job description:
${jd}

Structured metadata:
- Title: ${role.title}
- Company industry: ${role.company?.industry || 'not specified'}
- Company size: ${role.company?.size || 'not specified'}
- Stage: ${role.stage || 'not specified'}
- Location: ${role.location?.formattedAddress || role.location?.name || 'not specified'}
- Work mode: ${role.workMode || 'not specified'}
- Seniority: ${role.seniority || 'not specified'}
- Salary: ${role.salary || 'not specified'} ${role.salaryCurrency || ''}
- Visa supported: ${role.visaSupport ?? 'not specified'}
- Skills: ${(role.skills || []).join(', ') || 'not specified'}`
}

const EMPTY_REWRITE = {
  why_this_one: '',
  the_company: '',
  what_youll_do: '',
  what_they_want: '',
  how_they_hire: '',
}

export async function rewriteRole(role) {
  const jdHash = hashDescription(role.jobDescription)

  // Check cache first
  const cached = await getCached(role.id, jdHash)
  if (cached) return cached

  // No API key? Return empty
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(`No ANTHROPIC_API_KEY — skipping LLM rewrite for ${role.id}`)
    return EMPTY_REWRITE
  }

  try {
    const client = new Anthropic()
    const model = 'claude-sonnet-4-6'

    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildUserMessage(role) }],
    })

    const text = response.content?.[0]?.text || ''
    const parsed = JSON.parse(text)

    // Validate shape
    const result = {
      why_this_one: typeof parsed.why_this_one === 'string' ? parsed.why_this_one : '',
      the_company: typeof parsed.the_company === 'string' ? parsed.the_company : '',
      what_youll_do: typeof parsed.what_youll_do === 'string' ? parsed.what_youll_do : '',
      what_they_want: typeof parsed.what_they_want === 'string' ? parsed.what_they_want : '',
      how_they_hire: typeof parsed.how_they_hire === 'string' ? parsed.how_they_hire : '',
    }

    // Cache it
    await setCached(role.id, jdHash, result)
    return result
  } catch (err) {
    console.error(`LLM rewrite failed for ${role.id}:`, err.message)
    return EMPTY_REWRITE
  }
}

// Batch rewrite all roles (used by /api/sync)
export async function rewriteAllRoles(roles) {
  const results = new Map()
  // Process in parallel, 5 at a time
  const BATCH = 5
  for (let i = 0; i < roles.length; i += BATCH) {
    const batch = roles.slice(i, i + BATCH)
    const rewrites = await Promise.all(batch.map((r) => rewriteRole(r)))
    batch.forEach((r, idx) => results.set(r.id, rewrites[idx]))
  }
  return results
}
