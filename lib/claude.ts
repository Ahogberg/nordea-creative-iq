import Anthropic from '@anthropic-ai/sdk';
import { NORDEA_SYSTEM_PROMPT, NORDEA_COMPLIANCE, CHANNEL_SPECS, CAMPAIGN_OBJECTIVES } from './nordea-brand-guidelines';

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
export { NORDEA_SYSTEM_PROMPT };
export const NORDEA_BRAND_CONTEXT = NORDEA_SYSTEM_PROMPT;

export function getChannelContext(channel: string): string {
  const spec = CHANNEL_SPECS[channel as keyof typeof CHANNEL_SPECS];
  if (!spec) return '';

  return `
KANAL: ${spec.name}
- Rubrik: ${spec.headline.min}-${spec.headline.max} tecken (idealt ${spec.headline.ideal})
- Brödtext: ${spec.body.min}-${spec.body.max} tecken (idealt ${spec.body.ideal})
- Föreslagna CTAs: ${spec.cta.join(', ')}
- Tips: ${spec.tips.join('. ')}
`;
}

export function getObjectiveContext(objective: string): string {
  const obj = CAMPAIGN_OBJECTIVES[objective as keyof typeof CAMPAIGN_OBJECTIVES];
  if (!obj) return '';

  return `
MÅL: ${obj.name}
${obj.description}
Tonjustering: ${obj.toneAdjustment}
`;
}

export function getComplianceContext(productType: string): string {
  if (productType === 'loans' || productType === 'mortgage') {
    return `
COMPLIANCE (LÅN):
${NORDEA_COMPLIANCE.loans.required.join('\n')}
Obligatorisk disclaimer: "${NORDEA_COMPLIANCE.disclaimerExamples.loans}"
`;
  }

  if (productType === 'savings' || productType === 'investments') {
    return `
COMPLIANCE (SPARANDE/FONDER):
${NORDEA_COMPLIANCE.investments.required.join('\n')}
Obligatorisk disclaimer: "${NORDEA_COMPLIANCE.disclaimerExamples.funds}"
`;
  }

  return '';
}

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
