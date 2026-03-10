import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse } from '../_shared/cors.ts'
import {
  OPENROUTER_BASE,
  getOpenRouterKeyAndMode,
  handleCreditDeduction,
  trackUsage,
} from '../_shared/credits.ts'

const SYSTEM_PROMPT = `You are a cookbook recipe extractor. Extract a structured recipe from this photo of a cookbook page.

Return ONLY valid JSON with this exact shape:
{
  "title": "Recipe Title",
  "ingredients": ["1 cup flour", "2 eggs", ...],
  "instructions": ["Step 1 text", "Step 2 text", ...],
  "yields": "4 servings" or null,
  "total_time": 30 or null
}

Rules:
1. title: Exact recipe title as printed in the cookbook
2. ingredients: Array of strings, each with quantity + unit + ingredient name exactly as printed
3. instructions: Array of strings, one per step. If instructions are in paragraph form, split into logical steps
4. yields: Serving size as a string (e.g. "4 servings", "Makes 2 loaves") or null if not shown
5. total_time: Total cook/prep time in minutes as a number, or null if not shown
6. Handle multi-column layouts — read columns left to right
7. If the page contains multiple recipes, extract only the most prominent/complete one
8. Preserve original measurements — do not convert units
9. Ignore headnotes, author commentary, and serving suggestions unless they are part of the instructions
10. If no recipe is found: {"error": "No recipe found in the image"}`

interface ParseRequest {
  householdId: string
  imageUrl: string
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

    const { householdId, imageUrl } = body

    if (!householdId) {
      return jsonResponse({ success: false, recipe: null, error: 'Missing householdId' })
    }

    if (!imageUrl) {
      return jsonResponse({ success: false, recipe: null, error: 'Missing imageUrl' })
    }

    const keyResult = await getOpenRouterKeyAndMode(supabase, householdId)
    if ('error' in keyResult) {
      return jsonResponse(
        { success: false, recipe: null, error: keyResult.error, balance: keyResult.balance },
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
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: imageUrl },
              },
              {
                type: 'text',
                text: 'Extract the recipe from this cookbook page.',
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
      return jsonResponse({ success: false, recipe: null, error: errorMessage })
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
          { success: false, recipe: null, error: deductResult.error, balance: deductResult.balance },
          deductResult.status,
        )
      }

      creditBalance = deductResult.balance
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
        host: 'cookbook-scan',
      },
      error: null,
      ...(creditBalance !== undefined && { credit_balance: creditBalance }),
    })
  } catch (err) {
    return jsonResponse({
      success: false,
      recipe: null,
      error: (err as Error).message || 'Internal error',
    })
  }
})
