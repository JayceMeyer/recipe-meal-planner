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
