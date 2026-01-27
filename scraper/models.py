from pydantic import BaseModel, HttpUrl


class ScrapeRequest(BaseModel):
    url: HttpUrl


class ScrapedRecipe(BaseModel):
    title: str
    image: str | None = None
    ingredients: list[str]
    instructions: list[str]
    yields: str | None = None
    total_time: int | None = None
    host: str


class ScrapeResponse(BaseModel):
    success: bool
    recipe: ScrapedRecipe | None = None
    error: str | None = None
