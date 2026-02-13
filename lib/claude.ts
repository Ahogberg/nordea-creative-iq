import Anthropic from '@anthropic-ai/sdk';
import { NORDEA_SYSTEM_PROMPT, NORDEA_COMPLIANCE } from './nordea-brand-guidelines';

// Server-side only — singleton client
let client: Anthropic | null = null;

export function getClaudeClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

/**
 * Direct reference to Anthropic SDK instance (for routes that need full control).
 * Returns null if no API key is configured.
 */
export const claude = {
  get messages() {
    const c = getClaudeClient();
    if (!c) throw new Error('ANTHROPIC_API_KEY is not configured');
    return c.messages;
  },
};

// Re-export brand context for use in API routes
export const NORDEA_BRAND_CONTEXT = NORDEA_SYSTEM_PROMPT;

export const COMPLIANCE_RULES = `
COMPLIANCE-REGLER FÖR FINANSIELL MARKNADSFÖRING (OFFICIELLA):

GENERELLT:
${NORDEA_COMPLIANCE.general.map((r) => `- ${r}`).join('\n')}

LÅN (Bolån, Privatlån, Billån):
${NORDEA_COMPLIANCE.loans.required.map((r) => `- ${r}`).join('\n')}
Exempel: ${NORDEA_COMPLIANCE.loans.example}

SPARANDE & FONDER:
${NORDEA_COMPLIANCE.investments.required.map((r) => `- ${r}`).join('\n')}

FÖRSÄKRING:
${NORDEA_COMPLIANCE.insurance.required.map((r) => `- ${r}`).join('\n')}

STANDARD DISCLAIMERS:
- Fonder: "${NORDEA_COMPLIANCE.disclaimerExamples.funds}"
- Lån: "${NORDEA_COMPLIANCE.disclaimerExamples.loans}"
- Sparande: "${NORDEA_COMPLIANCE.disclaimerExamples.savings}"
`;
