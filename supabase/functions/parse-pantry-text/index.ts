import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import {
  OPENROUTER_BASE,
  getOpenRouterKeyAndMode,
  handleCreditDeduction,
  trackUsage,
} from '../_shared/credits.ts'

const SYSTEM_PROMPT = `You are a pantry item parser. Extract ingredient names from freeform text (grocery lists, receipt text, typed lists, etc.).

Return ONLY valid JSON with this exact shape:
{
  "items": [
    { "name": "Salt", "quantity": "1", "unit": "container", "category": "Spices & Seasonings" },
    { "name": "Olive Oil", "quantity": "1", "unit": "bottle", "category": "Oils & Vinegars" }
  ]
}

Rules:
1. name: Clean ingredient name, properly capitalized
2. quantity: Numeric quantity if mentioned, otherwise null
3. unit: Unit of measurement if mentioned (lb, oz, container, bottle, bag, can, etc.), otherwise null
4. category: Best-fit category from this list: Produce, Dairy, Eggs, Meat, Seafood, Bakery, Grains & Pasta, Spices & Seasonings, Oils & Vinegars, Condiments, Baking, Nuts & Seeds, Canned & Dried Goods, Frozen, Beverages, Other
5. Deduplicate items with the same ingredient
6. Split compound entries (e.g., "salt and pepper" → two items)
7. Ignore non-food items (paper towels, soap, etc.)
8. If the text contains no food items, return: {"items": [], "error": "No food items found"}`

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
      return jsonResponse({ success: false, items: [], error: 'Invalid request body' })
    }

    const { householdId, text } = body

    if (!householdId) {
      return jsonResponse({ success: false, items: [], error: 'Missing householdId' })
    }

    if (!text || text.trim().length === 0) {
      return jsonResponse({ success: false, items: [], error: 'Missing text input' })
    }

    const keyResult = await getOpenRouterKeyAndMode(supabase, householdId)
    if ('error' in keyResult) {
      return jsonResponse(
        { success: false, items: [], error: keyResult.error, balance: keyResult.balance },
        keyResult.status,
      )
    }

    const res = await fetch(OPENROUTER_BASE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${keyResult.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': Deno.env.get('SUPABASE_URL') || 'https://recipe-meal-planner.app',
        'X-Title': 'Recipe Meal Planner',
      },
      body: JSON.stringify({
        model: keyResult.model,
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
      return jsonResponse({ success: false, items: [], error: errorMessage })
    }

    const data = await res.json()
    const usage = data.usage || {}
    const totalTokens = usage.total_tokens || 0

    try {
      await trackUsage(supabase, householdId, totalTokens)
    } catch {
      // usage tracking is non-critical
    }

    let creditBalance: number | undefined
    if (keyResult.mode === 'credits') {
      const deductResult = await handleCreditDeduction(
        supabase,
        householdId,
        keyResult.model,
        usage,
      )

      if ('error' in deductResult) {
        return jsonResponse(
          { success: false, items: [], error: deductResult.error, balance: deductResult.balance },
          deductResult.status,
        )
      }

      creditBalance = deductResult.balance
    }

    const content = data.choices?.[0]?.message?.content
    if (!content) {
      return jsonResponse({ success: false, items: [], error: 'No response from AI' })
    }

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(content)
    } catch {
      return jsonResponse({ success: false, items: [], error: 'Failed to parse AI response' })
    }

    if (parsed.error && (!parsed.items || (parsed.items as unknown[]).length === 0)) {
      return jsonResponse({ success: false, items: [], error: parsed.error as string })
    }

    return jsonResponse({
      success: true,
      items: parsed.items || [],
      error: null,
      ...(creditBalance !== undefined && { credit_balance: creditBalance }),
    })
  } catch (err) {
    return jsonResponse({
      success: false,
      items: [],
      error: (err as Error).message || 'Internal error',
    })
  }
})
