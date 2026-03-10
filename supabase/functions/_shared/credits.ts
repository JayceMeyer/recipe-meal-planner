import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions'
export const DEFAULT_MODEL = 'anthropic/claude-sonnet-4-5'

export type AiMode = 'byok' | 'credits'

export interface OpenRouterKeyAndMode {
  apiKey: string
  model: string
  mode: AiMode
}

// Per-token prices in USD (per 1 token, not per 1M)
// Source: https://openrouter.ai/models
const MODEL_PRICES: Record<string, { input: number; output: number }> = {
  'anthropic/claude-sonnet-4-5': { input: 3e-6, output: 15e-6 },
  'anthropic/claude-haiku-3.5': { input: 0.8e-6, output: 4e-6 },
  'anthropic/claude-3.5-sonnet': { input: 3e-6, output: 15e-6 },
  'google/gemini-2.0-flash-001': { input: 0.1e-6, output: 0.4e-6 },
  'google/gemini-2.0-flash-lite-001': { input: 0.075e-6, output: 0.3e-6 },
  'openai/gpt-4o-mini': { input: 0.15e-6, output: 0.6e-6 },
  'openai/gpt-4o': { input: 2.5e-6, output: 10e-6 },
}

// Conservative fallback for unknown models
const FALLBACK_PRICE = { input: 3e-6, output: 15e-6 }

export async function getOpenRouterKeyAndMode(
  supabase: ReturnType<typeof createClient>,
  householdId: string,
): Promise<OpenRouterKeyAndMode | { error: string; status: number; balance?: number }> {
  // 1. Check for BYOK key
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('openrouter_api_key, openrouter_model')
    .eq('household_id', householdId)
    .not('openrouter_api_key', 'is', null)
    .limit(1)

  if (prefs && prefs.length > 0) {
    const row = prefs[0] as { openrouter_api_key: string; openrouter_model: string | null }
    return {
      apiKey: row.openrouter_api_key,
      model: row.openrouter_model || DEFAULT_MODEL,
      mode: 'byok',
    }
  }

  // 2. No BYOK — use global key with credits
  const globalKey = Deno.env.get('OPENROUTER_GLOBAL_API_KEY')
  if (!globalKey) {
    return {
      error: 'No OpenRouter API key configured. Add one in your Profile settings.',
      status: 400,
    }
  }

  // Get preferred model from any household member's prefs (even without BYOK key)
  const { data: modelPref } = await supabase
    .from('user_preferences')
    .select('openrouter_model')
    .eq('household_id', householdId)
    .not('openrouter_model', 'is', null)
    .limit(1)

  const model = (modelPref?.[0] as { openrouter_model: string } | undefined)?.openrouter_model || DEFAULT_MODEL

  // Verify household has credits
  const { data: credits } = await supabase
    .from('household_credits')
    .select('balance')
    .eq('household_id', householdId)
    .single()

  const balance = (credits as { balance: number } | null)?.balance ?? 0
  if (balance <= 0) {
    return {
      error: 'insufficient_credits',
      status: 402,
      balance,
    }
  }

  return {
    apiKey: globalKey,
    model,
    mode: 'credits',
  }
}

interface UsageInfo {
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
}

export function estimateCostCredits(
  model: string,
  usage: UsageInfo,
  markupPercent: number,
): number {
  const prices = MODEL_PRICES[model] || FALLBACK_PRICE
  const promptTokens = usage.prompt_tokens || 0
  const completionTokens = usage.completion_tokens || 0

  const rawCostUsd = promptTokens * prices.input + completionTokens * prices.output
  const markedUpCostUsd = rawCostUsd * (1 + markupPercent / 100)

  // Convert to credits (1 credit = $0.01), minimum 1 credit per request
  return Math.max(1, Math.ceil(markedUpCostUsd * 100))
}

export async function handleCreditDeduction(
  supabase: ReturnType<typeof createClient>,
  householdId: string,
  model: string,
  usage: UsageInfo,
): Promise<{ balance: number; creditsUsed: number } | { error: string; status: number; balance: number }> {
  // Read markup from app_settings
  const { data: settings } = await supabase
    .from('app_settings')
    .select('ai_markup_percent')
    .eq('id', 1)
    .single()

  const markupPercent = (settings as { ai_markup_percent: number } | null)?.ai_markup_percent ?? 18

  const creditsToDeduct = estimateCostCredits(model, usage, markupPercent)

  const { data: newBalance } = await supabase.rpc('deduct_credits', {
    p_household_id: householdId,
    p_amount: creditsToDeduct,
    p_description: `AI: ${model}`,
    p_metadata: {
      model,
      prompt_tokens: usage.prompt_tokens || 0,
      completion_tokens: usage.completion_tokens || 0,
      markup_percent: markupPercent,
    },
  })

  if (newBalance === -1) {
    // Insufficient credits — get current balance for error response
    const { data: credits } = await supabase
      .from('household_credits')
      .select('balance')
      .eq('household_id', householdId)
      .single()

    const balance = (credits as { balance: number } | null)?.balance ?? 0
    return {
      error: 'insufficient_credits',
      status: 402,
      balance,
    }
  }

  return { balance: newBalance as number, creditsUsed: creditsToDeduct }
}

export async function trackUsage(
  supabase: ReturnType<typeof createClient>,
  householdId: string,
  tokenCount: number,
) {
  const today = new Date().toISOString().split('T')[0]
  const { data: existing } = await supabase
    .from('openrouter_usage')
    .select('id, request_count, token_count')
    .eq('household_id', householdId)
    .eq('request_date', today)
    .single()

  if (existing) {
    await supabase
      .from('openrouter_usage')
      .update({
        request_count: (existing as { request_count: number }).request_count + 1,
        token_count: (existing as { token_count: number }).token_count + tokenCount,
      })
      .eq('id', (existing as { id: string }).id)
  } else {
    await supabase
      .from('openrouter_usage')
      .insert({
        household_id: householdId,
        request_date: today,
        request_count: 1,
        token_count: tokenCount,
      })
  }
}
