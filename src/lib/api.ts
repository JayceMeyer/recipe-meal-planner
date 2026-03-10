const SCRAPER_API_URL = import.meta.env.VITE_SCRAPER_API_URL || 'http://localhost:8000'

export interface ScrapedRecipe {
  title: string
  image: string | null
  ingredients: string[]
  instructions: string[]
  yields: string | null
  total_time: number | null
  host: string
}

export interface ScrapeResponse {
  success: boolean
  recipe: ScrapedRecipe | null
  error: string | null
}

export async function scrapeRecipe(url: string): Promise<ScrapeResponse> {
  const response = await fetch(`${SCRAPER_API_URL}/scrape`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  })

  if (!response.ok) {
    return {
      success: false,
      recipe: null,
      error: `Server error: ${response.status}`,
    }
  }

  return response.json()
}

export async function parseRecipeText(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: { functions: { invoke: (name: string, options: { body: Record<string, string> }) => Promise<{ data: any; error: Error | null; response?: Response }> } },
  householdId: string,
  text: string,
): Promise<ScrapeResponse> {
  const { data, error, response } = await supabase.functions.invoke('parse-recipe-text', {
    body: { householdId, text },
  })

  if (error) {
    if (response) {
      try {
        const body = await response.json()
        if (body?.error) return { success: false, recipe: null, error: body.error }
      } catch {
        // ignore parse errors
      }
    }
    return { success: false, recipe: null, error: error.message }
  }

  if (!data) {
    return { success: false, recipe: null, error: 'No response from server' }
  }

  return data
}
