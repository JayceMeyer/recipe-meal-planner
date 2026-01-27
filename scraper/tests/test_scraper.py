from unittest.mock import patch, AsyncMock
import pytest
import httpx

MOCK_RECIPE_HTML = """
<!DOCTYPE html>
<html>
<head>
    <script type="application/ld+json">
    {
        "@context": "https://schema.org",
        "@type": "Recipe",
        "name": "Test Recipe",
        "image": "https://example.com/image.jpg",
        "recipeIngredient": ["1 cup flour", "2 eggs"],
        "recipeInstructions": [
            {"@type": "HowToStep", "text": "Mix ingredients"},
            {"@type": "HowToStep", "text": "Bake at 350F"}
        ],
        "recipeYield": "4 servings",
        "totalTime": "PT30M"
    }
    </script>
</head>
<body></body>
</html>
"""


class TestHealthEndpoint:
    def test_health_check(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}


class TestScrapeEndpoint:
    def test_scrape_invalid_url(self, client):
        response = client.post("/scrape", json={"url": "not-a-url"})
        assert response.status_code == 422

    @patch("main.fetch_html", new_callable=AsyncMock)
    def test_scrape_success(self, mock_fetch, client):
        mock_fetch.return_value = MOCK_RECIPE_HTML

        response = client.post(
            "/scrape",
            json={"url": "https://example.com/recipe"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["recipe"]["title"] == "Test Recipe"
        assert data["recipe"]["ingredients"] == ["1 cup flour", "2 eggs"]
        assert len(data["recipe"]["instructions"]) == 2
        assert data["recipe"]["yields"] == "4 servings"
        assert data["recipe"]["total_time"] == 30

    @patch("main.fetch_html", new_callable=AsyncMock)
    def test_scrape_http_error(self, mock_fetch, client):
        mock_response = httpx.Response(404, request=httpx.Request("GET", "https://example.com"))
        mock_fetch.side_effect = httpx.HTTPStatusError(
            "Not Found",
            request=mock_response.request,
            response=mock_response,
        )

        response = client.post(
            "/scrape",
            json={"url": "https://example.com/not-found"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "HTTP 404" in data["error"]

    @patch("main.fetch_html", new_callable=AsyncMock)
    def test_scrape_connection_error(self, mock_fetch, client):
        mock_fetch.side_effect = httpx.ConnectError("Connection failed")

        response = client.post(
            "/scrape",
            json={"url": "https://example.com/recipe"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "ConnectError" in data["error"]

    @patch("main.fetch_html", new_callable=AsyncMock)
    @patch("main.scrape_html")
    def test_scrape_unsupported_site(self, mock_scrape_html, mock_fetch, client):
        mock_fetch.return_value = "<html></html>"

        class WebsiteNotImplementedError(Exception):
            pass

        mock_scrape_html.side_effect = WebsiteNotImplementedError("Website not supported")
        mock_scrape_html.side_effect.__class__.__name__ = "WebsiteNotImplementedError"

        response = client.post(
            "/scrape",
            json={"url": "https://unsupported-site.com/recipe"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is False
        assert "not supported" in data["error"]


class TestCORS:
    def test_cors_headers(self, client):
        response = client.options(
            "/scrape",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
            },
        )
        assert "access-control-allow-origin" in response.headers
