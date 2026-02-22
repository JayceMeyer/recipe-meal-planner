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

const SYSTEM_PROMPT = `You are a recipe parser. Extract structured recipe data from freeform text (Instagram captions, blog posts, messages, etc.).

Return ONLY valid JSON with this exact shape:
{
  "title": "Recipe Title",
  "ingredients": ["1 cup flour", "2 eggs", ...],
  "instructions": ["Step 1 text", "Step 2 text", ...],
  "yields": "4 servings" or null,
  "total_time": 30 or null
}

Rules:
1. title: Infer a clear recipe title from the text
2. ingredients: Array of strings, each with quantity + unit + ingredient name when available
3. instructions: Array of strings, one per step. Split run-on instructions into separate steps
4. yields: Serving size as a string (e.g. "4 servings", "12 cookies") or null if not mentioned
5. total_time: Total cook/prep time in minutes as a number, or null if not mentioned
6. If the text doesn't contain a recipe, return: {"error": "No recipe found in the provided text"}
7. Clean up formatting artifacts (emojis in ingredient lists, bullet points, numbering prefixes)
8. Preserve original measurements — do not convert units`

interface ParseRequest {
  householdId: string
  text: string
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

    let body: ParseRequest
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ success: false, recipe: null, error: 'Invalid request body' })
    }

    const { householdId, text } = body

    if (!householdId) {
      return jsonResponse({ success: false, recipe: null, error: 'Missing householdId' })
    }

    if (!text || text.trim().length === 0) {
      return jsonResponse({ success: false, recipe: null, error: 'Missing recipe text' })
    }

    const config = await getHouseholdOpenRouterConfig(supabase, householdId)
    if (!config) {
      return jsonResponse({
        success: false,
        recipe: null,
        error: 'No OpenRouter API key configured. Add one in your Profile settings.',
      })
    }

    const res = await fetch(OPENROUTER_BASE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('SUPABASE_URL') || 'https://recipe-meal-planner.app',
        'X-Title': 'Recipe Meal Planner',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
        response_format: { type: 'json_object' },
      }),
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
      return jsonResponse({ success: false, recipe: null, error: errorMessage })
    }

    const data = await res.json()

    try {
      await trackUsage(supabase, householdId, data.usage?.total_tokens || 0)
    } catch {
      // usage tracking is non-critical
    }

    const content = data.choices?.[0]?.message?.content
    if (!content) {
      return jsonResponse({ success: false, recipe: null, error: 'No response from AI' })
    }

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(content)
    } catch {
      return jsonResponse({ success: false, recipe: null, error: 'Failed to parse AI response' })
    }

    if (parsed.error) {
      return jsonResponse({ success: false, recipe: null, error: parsed.error as string })
    }

    return jsonResponse({
      success: true,
      recipe: {
        title: parsed.title || 'Untitled Recipe',
        image: null,
        ingredients: parsed.ingredients || [],
        instructions: parsed.instructions || [],
        yields: parsed.yields || null,
        total_time: parsed.total_time || null,
        host: 'text-import',
      },
      error: null,
    })
  } catch (err) {
    return jsonResponse({
      success: false,
      recipe: null,
      error: (err as Error).message || 'Internal error',
    })
  }
})
