import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import {
  OPENROUTER_BASE,
  getOpenRouterKeyAndMode,
  handleCreditDeduction,
  trackUsage,
} from '../_shared/credits.ts'

const RECEIPT_PROMPT = `You are a grocery receipt parser. Extract food items from this receipt image.

Return ONLY valid JSON with this exact shape:
{
  "items": [
    { "name": "Salt", "quantity": "1", "unit": "container", "category": "Spices & Seasonings" },
    { "name": "Olive Oil", "quantity": "1", "unit": "bottle", "category": "Oils & Vinegars" }
  ]
}

Rules:
1. name: Clean ingredient/food name, properly capitalized. Remove brand names and product codes.
2. quantity: Numeric quantity if visible, otherwise null
3. unit: Unit if visible (lb, oz, etc.), otherwise null
4. category: Best-fit from: Produce, Dairy, Eggs, Meat, Seafood, Bakery, Grains & Pasta, Spices & Seasonings, Oils & Vinegars, Condiments, Baking, Nuts & Seeds, Canned & Dried Goods, Frozen, Beverages, Other
5. Ignore non-food items (bags, tax, totals, discounts, store info)
6. If no food items found: {"items": [], "error": "No food items found on receipt"}`

const SHELF_PROMPT = `You are a kitchen inventory scanner. Identify food products visible in this photo of a kitchen shelf, pantry, spice rack, or refrigerator.

Return ONLY valid JSON with this exact shape:
{
  "items": [
    { "name": "Salt", "quantity": null, "unit": null, "category": "Spices & Seasonings" },
    { "name": "Olive Oil", "quantity": null, "unit": null, "category": "Oils & Vinegars" }
  ]
}

Rules:
1. name: Generic ingredient name (not brand), properly capitalized
2. quantity: null (hard to determine from shelf photos)
3. unit: null
4. category: Best-fit from: Produce, Dairy, Eggs, Meat, Seafood, Bakery, Grains & Pasta, Spices & Seasonings, Oils & Vinegars, Condiments, Baking, Nuts & Seeds, Canned & Dried Goods, Frozen, Beverages, Other
5. Only include items you can clearly identify
6. If nothing identifiable: {"items": [], "error": "Could not identify any food items"}`

interface ScanRequest {
  householdId: string
  imageUrl: string
  mode: 'receipt' | 'shelf'
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

    let body: ScanRequest
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ success: false, items: [], error: 'Invalid request body' })
    }

    const { householdId, imageUrl, mode = 'receipt' } = body

    if (!householdId) {
      return jsonResponse({ success: false, items: [], error: 'Missing householdId' })
    }

    if (!imageUrl) {
      return jsonResponse({ success: false, items: [], error: 'Missing imageUrl' })
    }

    const keyResult = await getOpenRouterKeyAndMode(supabase, householdId)
    if ('error' in keyResult) {
      return jsonResponse(
        { success: false, items: [], error: keyResult.error, balance: keyResult.balance },
        keyResult.status,
      )
    }

    const systemPrompt = mode === 'shelf' ? SHELF_PROMPT : RECEIPT_PROMPT

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
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
              {
                type: 'text',
                text: mode === 'shelf'
                  ? 'Identify all food items visible in this photo.'
                  : 'Extract all food items from this receipt.',
              },
            ],
          },
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
        // use default
      }
      return jsonResponse({ success: false, items: [], error: errorMessage })
    }

    const data = await res.json()
    const usage = data.usage || {}
    const totalTokens = usage.total_tokens || 0

    try {
      await trackUsage(supabase, householdId, totalTokens)
    } catch {
      // non-critical
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
