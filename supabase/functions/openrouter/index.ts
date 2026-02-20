import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions'
const DEFAULT_MODEL = 'anthropic/claude-sonnet-4-5'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

interface OpenRouterConfig {
  apiKey: string
  model: string
}

async function getHouseholdOpenRouterConfig(
  supabase: ReturnType<typeof createClient>,
  householdId: string,
): Promise<OpenRouterConfig | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('openrouter_api_key, openrouter_model')
    .eq('household_id', householdId)
    .not('openrouter_api_key', 'is', null)
    .limit(1)

  if (error) {
    console.error('Failed to fetch OpenRouter config:', error.message)
    return null
  }

  if (!data || data.length === 0) return null

  const row = data[0] as { openrouter_api_key: string; openrouter_model: string | null }
  return {
    apiKey: row.openrouter_api_key,
    model: row.openrouter_model || DEFAULT_MODEL,
  }
}

async function trackUsage(
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
        request_count: existing.request_count + 1,
        token_count: existing.token_count + tokenCount,
      })
      .eq('id', existing.id)
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

interface ChatMessage {
  role: string
  content: string
  tool_calls?: ToolCall[]
  tool_call_id?: string
}

interface ToolCall {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

interface ChatRequest {
  householdId: string
  messages: ChatMessage[]
  tools?: ToolDefinition[]
  tool_results?: Array<{
    tool_call_id: string
    content: string
  }>
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    let body: ChatRequest
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ error: 'Invalid request body' })
    }

    const { householdId, messages, tools, tool_results } = body

    if (!householdId) {
      return jsonResponse({ error: 'Missing householdId' })
    }

    if (!messages || messages.length === 0) {
      return jsonResponse({ error: 'Missing messages' })
    }

    const config = await getHouseholdOpenRouterConfig(supabase, householdId)
    if (!config) {
      return jsonResponse({
        error: 'No OpenRouter API key configured. Add one in your Profile settings.',
      })
    }

    const chatMessages = [...messages]

    if (tool_results) {
      for (const result of tool_results) {
        chatMessages.push({
          role: 'tool',
          content: result.content,
          tool_call_id: result.tool_call_id,
        })
      }
    }

    const requestBody: Record<string, unknown> = {
      model: config.model,
      messages: chatMessages,
    }

    if (tools && tools.length > 0) {
      requestBody.tools = tools
    }

    const res = await fetch(OPENROUTER_BASE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('SUPABASE_URL') || 'https://recipe-meal-planner.app',
        'X-Title': 'Recipe Meal Planner',
      },
      body: JSON.stringify(requestBody),
    })

    if (!res.ok) {
      const errorText = await res.text()
      let errorMessage = `OpenRouter API error: ${res.status}`
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.error?.message || errorMessage
      } catch {
        // use default error message
      }
      return jsonResponse({ error: errorMessage })
    }

    const data = await res.json()

    const totalTokens = data.usage?.total_tokens || 0
    // Don't let usage tracking failure break the response
    try {
      await trackUsage(supabase, householdId, totalTokens)
    } catch {
      // usage tracking is non-critical
    }

    return jsonResponse(data)
  } catch (err) {
    return jsonResponse({ error: (err as Error).message || 'Internal error' })
  }
})
