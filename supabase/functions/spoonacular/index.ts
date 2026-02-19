import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SPOONACULAR_BASE = 'https://api.spoonacular.com/recipes'

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

function hashKey(params: Record<string, unknown>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&')
  let hash = 0
  for (let i = 0; i < sorted.length; i++) {
    hash = ((hash << 5) - hash + sorted.charCodeAt(i)) | 0
  }
  return String(Math.abs(hash))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const apiKey = Deno.env.get('SPOONACULAR_API_KEY')
  if (!apiKey) {
    return jsonResponse({ error: 'Spoonacular API key not configured' }, 500)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400)
  }

  const { action, householdId, ...params } = body as {
    action: string
    householdId?: string
    [key: string]: unknown
  }

  if (!action) {
    return jsonResponse({ error: 'Missing action parameter' }, 400)
  }

  // Check daily usage if household provided
  if (householdId) {
    const { data: usage } = await supabase
      .from('spoonacular_usage')
      .select('request_count')
      .eq('household_id', householdId)
      .eq('request_date', new Date().toISOString().split('T')[0])
      .single()

    if (usage && usage.request_count >= 100) {
      return jsonResponse({ error: 'Daily API limit reached. Try again tomorrow.' }, 429)
    }
  }

  try {
    switch (action) {
      case 'search':
        return await handleSearch(supabase, apiKey, params, householdId)
      case 'searchByIngredients':
        return await handleSearchByIngredients(supabase, apiKey, params, householdId)
      case 'detail':
        return await handleDetail(supabase, apiKey, params)
      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400)
    }
  } catch (err) {
    return jsonResponse({ error: (err as Error).message || 'Internal error' }, 500)
  }
})

async function checkCache(supabase: ReturnType<typeof createClient>, key: string) {
  const { data } = await supabase
    .from('spoonacular_cache')
    .select('response')
    .eq('cache_key', key)
    .gt('expires_at', new Date().toISOString())
    .single()
  return data?.response ?? null
}

async function setCache(
  supabase: ReturnType<typeof createClient>,
  key: string,
  response: unknown,
) {
  const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString()
  await supabase.from('spoonacular_cache').upsert(
    { cache_key: key, response, expires_at: expiresAt },
    { onConflict: 'cache_key' },
  )
}

async function trackUsage(
  supabase: ReturnType<typeof createClient>,
  householdId?: string,
) {
  if (!householdId) return
  const today = new Date().toISOString().split('T')[0]
  const { data: existing } = await supabase
    .from('spoonacular_usage')
    .select('id, request_count')
    .eq('household_id', householdId)
    .eq('request_date', today)
    .single()

  if (existing) {
    await supabase
      .from('spoonacular_usage')
      .update({ request_count: existing.request_count + 1 })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('spoonacular_usage')
      .insert({ household_id: householdId, request_date: today, request_count: 1 })
  }
}

async function fetchSpoonacular(
  url: string,
  supabase: ReturnType<typeof createClient>,
  cacheKey: string,
  householdId?: string,
) {
  const cached = await checkCache(supabase, cacheKey)
  if (cached) return jsonResponse(cached)

  const res = await fetch(url)

  if (res.status === 402) {
    const fallback = await checkCache(supabase, cacheKey)
    if (fallback) return jsonResponse(fallback)
    return jsonResponse({ error: 'Spoonacular daily limit reached. Try again tomorrow.' }, 429)
  }

  if (!res.ok) {
    return jsonResponse({ error: `Spoonacular API error: ${res.status}` }, res.status)
  }

  const data = await res.json()
  await setCache(supabase, cacheKey, data)
  await trackUsage(supabase, householdId)
  return jsonResponse(data)
}

async function handleSearch(
  supabase: ReturnType<typeof createClient>,
  apiKey: string,
  params: Record<string, unknown>,
  householdId?: string,
) {
  const query = String(params.query || '')
  const cuisine = String(params.cuisine || '')
  const diet = String(params.diet || '')
  const includeIngredients = String(params.includeIngredients || '')
  const offset = Number(params.offset || 0)
  const number = Math.min(Number(params.number || 12), 24)

  const searchParams = new URLSearchParams({
    apiKey,
    query,
    number: String(number),
    offset: String(offset),
    addRecipeInformation: 'true',
  })
  if (cuisine) searchParams.set('cuisine', cuisine)
  if (diet) searchParams.set('diet', diet)
  if (includeIngredients) searchParams.set('includeIngredients', includeIngredients)

  const cacheKey = `search:${hashKey({ query, cuisine, diet, includeIngredients, offset, number })}`
  const url = `${SPOONACULAR_BASE}/complexSearch?${searchParams}`

  return fetchSpoonacular(url, supabase, cacheKey, householdId)
}

async function handleSearchByIngredients(
  supabase: ReturnType<typeof createClient>,
  apiKey: string,
  params: Record<string, unknown>,
  householdId?: string,
) {
  const ingredients = String(params.ingredients || '')
  const number = Math.min(Number(params.number || 12), 24)

  const searchParams = new URLSearchParams({
    apiKey,
    ingredients,
    number: String(number),
    ranking: '1',
    ignorePantry: 'true',
  })

  const cacheKey = `ingredients:${hashKey({ ingredients, number })}`
  const url = `${SPOONACULAR_BASE}/findByIngredients?${searchParams}`

  return fetchSpoonacular(url, supabase, cacheKey, householdId)
}

async function handleDetail(
  supabase: ReturnType<typeof createClient>,
  apiKey: string,
  params: Record<string, unknown>,
) {
  const id = Number(params.id)
  if (!id) return jsonResponse({ error: 'Missing recipe id' }, 400)

  const searchParams = new URLSearchParams({ apiKey })
  const cacheKey = `detail:${id}`
  const url = `${SPOONACULAR_BASE}/${id}/information?${searchParams}`

  return fetchSpoonacular(url, supabase, cacheKey)
}
