import Anthropic from '@anthropic-ai/sdk';

// Single source of truth for the Claude model used across all API routes.
// To upgrade: change this constant. All routes pick it up automatically.
export const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export async function callClaude(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string | null> {
  const anthropic = getAnthropicClient();
  if (!anthropic) return null;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: options?.maxTokens ?? 4096,
    temperature: options?.temperature ?? 0.7,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  return textBlock ? textBlock.text : null;
}

export async function callClaudeChat(
  systemPrompt: string,
  messages: Array<{ role: 'user' | 'assistant'; content: string }>,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string | null> {
  const anthropic = getAnthropicClient();
  if (!anthropic) return null;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: options?.maxTokens ?? 1024,
    temperature: options?.temperature ?? 0.8,
    system: systemPrompt,
    messages,
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  return textBlock ? textBlock.text : null;
}

// Calls Claude with a system + user message, extracts the first JSON object
// from the response, parses and returns it as T. Throws if no JSON found or
// if Claude is unavailable (returns null when no API key is configured).
export async function callClaudeJson<T>(
  systemPrompt: string,
  userMessage: string,
  options?: { maxTokens?: number }
): Promise<T | null> {
  const anthropic = getAnthropicClient();
  if (!anthropic) return null;

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: options?.maxTokens ?? 4000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const text =
    response.content[0]?.type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON object found in Claude response');
  return JSON.parse(jsonMatch[0]) as T;
}
