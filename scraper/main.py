import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from recipe_scrapers import scrape_html
import httpx

from models import ScrapeRequest, ScrapeResponse, ScrapedRecipe

app = FastAPI(title="Recipe Scraper API")

cors_origins_env = os.getenv("CORS_ORIGINS", "*")
cors_origins = [origin.strip() for origin in cors_origins_env.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def fetch_html(url: str) -> str:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            url,
            headers={"User-Agent": "Mozilla/5.0 (compatible; RecipeScraper/1.0)"},
            follow_redirects=True,
            timeout=30.0,
        )
        response.raise_for_status()
        return response.text


def parse_recipe(html: str, url: str) -> ScrapedRecipe:
    scraper = scrape_html(html, org_url=url, supported_only=False)

    instructions_text = scraper.instructions()
    if isinstance(instructions_text, str):
        instructions = [step.strip() for step in instructions_text.split("\n") if step.strip()]
    else:
        instructions = instructions_text

    return ScrapedRecipe(
        title=scraper.title(),
        image=scraper.image(),
        ingredients=scraper.ingredients(),
        instructions=instructions,
        yields=scraper.yields(),
        total_time=scraper.total_time(),
        host=scraper.host(),
    )


@app.post("/scrape", response_model=ScrapeResponse)
async def scrape_recipe(request: ScrapeRequest) -> ScrapeResponse:
    url = str(request.url)

    try:
        html = await fetch_html(url)
        recipe = parse_recipe(html, url)
        return ScrapeResponse(success=True, recipe=recipe)
    except httpx.HTTPStatusError as e:
        return ScrapeResponse(
            success=False,
            error=f"Failed to fetch URL: HTTP {e.response.status_code}",
        )
    except httpx.RequestError as e:
        return ScrapeResponse(
            success=False,
            error=f"Failed to fetch URL: {type(e).__name__}",
        )
    except Exception as e:
        error_type = type(e).__name__
        if "not supported" in str(e).lower() or error_type == "WebsiteNotImplementedError":
            return ScrapeResponse(
                success=False,
                error="This website is not supported for recipe scraping",
            )
        return ScrapeResponse(
            success=False,
            error=f"Failed to parse recipe: {error_type}",
        )


@app.get("/health")
async def health_check() -> dict[str, str]:
    return {"status": "healthy"}
