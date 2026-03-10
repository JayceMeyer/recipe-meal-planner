import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import {
  OPENROUTER_BASE,
  getOpenRouterKeyAndMode,
  handleCreditDeduction,
  trackUsage,
} from '../_shared/credits.ts'

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

    const keyResult = await getOpenRouterKeyAndMode(supabase, householdId)
    if ('error' in keyResult) {
      return jsonResponse(
        { error: keyResult.error, balance: keyResult.balance },
        keyResult.status,
      )
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
      model: keyResult.model,
      messages: chatMessages,
    }

    if (tools && tools.length > 0) {
      requestBody.tools = tools
    }

    const res = await fetch(OPENROUTER_BASE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keyResult.apiKey}`,
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
    const usage = data.usage || {}
    const totalTokens = usage.total_tokens || 0

    try {
      await trackUsage(supabase, householdId, totalTokens)
    } catch {
      // usage tracking is non-critical
    }

    if (keyResult.mode === 'credits') {
      const deductResult = await handleCreditDeduction(
        supabase,
        householdId,
        keyResult.model,
        usage,
      )

      if ('error' in deductResult) {
        return jsonResponse(
          { error: deductResult.error, balance: deductResult.balance },
          deductResult.status,
        )
      }

      return jsonResponse({ ...data, credit_balance: deductResult.balance })
    }

    return jsonResponse(data)
  } catch (err) {
    return jsonResponse({ error: (err as Error).message || 'Internal error' })
  }
})
