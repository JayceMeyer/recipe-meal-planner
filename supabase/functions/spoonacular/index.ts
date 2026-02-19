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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

async function getHouseholdApiKeys(
  supabase: ReturnType<typeof createClient>,
  householdId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from('user_preferences')
    .select('spoonacular_api_key')
    .eq('household_id', householdId)
    .not('spoonacular_api_key', 'is', null)

  if (!data) return []
  return shuffle(data.map((row: { spoonacular_api_key: string }) => row.spoonacular_api_key))
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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

  const apiKeys: string[] = []
  if (householdId) {
    const householdKeys = await getHouseholdApiKeys(supabase, householdId)
    apiKeys.push(...householdKeys)
  }

  if (apiKeys.length === 0) {
    return jsonResponse({ error: 'No Spoonacular API key configured. Add one in your Profile settings.' }, 400)
  }

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
        return await handleSearch(supabase, apiKeys, params, householdId)
      case 'searchByIngredients':
        return await handleSearchByIngredients(supabase, apiKeys, params, householdId)
      case 'detail':
        return await handleDetail(supabase, apiKeys, params)
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

async function fetchWithKeyRotation(
  baseUrl: string,
  apiKeys: string[],
  supabase: ReturnType<typeof createClient>,
  cacheKey: string,
  householdId?: string,
) {
  const cached = await checkCache(supabase, cacheKey)
  if (cached) return jsonResponse(cached)

  for (const key of apiKeys) {
    const url = new URL(baseUrl)
    url.searchParams.set('apiKey', key)

    const res = await fetch(url.toString())

    if (res.status === 402) continue

    if (!res.ok) {
      return jsonResponse({ error: `Spoonacular API error: ${res.status}` }, res.status)
    }

    const data = await res.json()
    await setCache(supabase, cacheKey, data)
    await trackUsage(supabase, householdId)
    return jsonResponse(data)
  }

  const fallback = await checkCache(supabase, cacheKey)
  if (fallback) return jsonResponse(fallback)
  return jsonResponse({ error: 'All API keys exhausted. Try again tomorrow.' }, 429)
}

async function handleSearch(
  supabase: ReturnType<typeof createClient>,
  apiKeys: string[],
  params: Record<string, unknown>,
  householdId?: string,
) {
  const query = String(params.query || '')
  const cuisine = String(params.cuisine || '')
  const diet = String(params.diet || '')
  const includeIngredients = String(params.includeIngredients || '')
  const offset = Number(params.offset || 0)
  const number = Math.min(Number(params.number || 12), 24)

  const url = new URL(`${SPOONACULAR_BASE}/complexSearch`)
  url.searchParams.set('query', query)
  url.searchParams.set('number', String(number))
  url.searchParams.set('offset', String(offset))
  url.searchParams.set('addRecipeInformation', 'true')
  if (cuisine) url.searchParams.set('cuisine', cuisine)
  if (diet) url.searchParams.set('diet', diet)
  if (includeIngredients) url.searchParams.set('includeIngredients', includeIngredients)

  const cacheKey = `search:${hashKey({ query, cuisine, diet, includeIngredients, offset, number })}`

  return fetchWithKeyRotation(url.toString(), apiKeys, supabase, cacheKey, householdId)
}

async function handleSearchByIngredients(
  supabase: ReturnType<typeof createClient>,
  apiKeys: string[],
  params: Record<string, unknown>,
  householdId?: string,
) {
  const ingredients = String(params.ingredients || '')
  const number = Math.min(Number(params.number || 12), 24)

  const url = new URL(`${SPOONACULAR_BASE}/findByIngredients`)
  url.searchParams.set('ingredients', ingredients)
  url.searchParams.set('number', String(number))
  url.searchParams.set('ranking', '1')
  url.searchParams.set('ignorePantry', 'true')

  const cacheKey = `ingredients:${hashKey({ ingredients, number })}`

  return fetchWithKeyRotation(url.toString(), apiKeys, supabase, cacheKey, householdId)
}

async function handleDetail(
  supabase: ReturnType<typeof createClient>,
  apiKeys: string[],
  params: Record<string, unknown>,
) {
  const id = Number(params.id)
  if (!id) return jsonResponse({ error: 'Missing recipe id' }, 400)

  const url = new URL(`${SPOONACULAR_BASE}/${id}/information`)
  const cacheKey = `detail:${id}`

  return fetchWithKeyRotation(url.toString(), apiKeys, supabase, cacheKey)
}
