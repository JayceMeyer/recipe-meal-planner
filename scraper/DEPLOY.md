# Deploying Recipe Scraper to Azure App Service

## Prerequisites

- Azure CLI installed and authenticated (`az login`)
- An Azure subscription

## Deployment Steps

### 1. Create Resource Group (if needed)

```bash
az group create --name recipe-scraper-rg --location eastus
```

### 2. Create App Service Plan (Free tier)

```bash
az appservice plan create \
  --name recipe-scraper-plan \
  --resource-group recipe-scraper-rg \
  --sku F1 \
  --is-linux
```

### 3. Create Web App

```bash
az webapp create \
  --name recipe-scraper-api \
  --resource-group recipe-scraper-rg \
  --plan recipe-scraper-plan \
  --runtime "PYTHON:3.12"
```

### 4. Configure Startup Command

```bash
az webapp config set \
  --name recipe-scraper-api \
  --resource-group recipe-scraper-rg \
  --startup-file "startup.sh"
```

### 5. Set Environment Variables

```bash
az webapp config appsettings set \
  --name recipe-scraper-api \
  --resource-group recipe-scraper-rg \
  --settings CORS_ORIGINS="https://your-frontend-domain.com"
```

### 6. Deploy Code

From the `scraper` directory:

```bash
az webapp up \
  --name recipe-scraper-api \
  --resource-group recipe-scraper-rg \
  --runtime "PYTHON:3.12"
```

Or using zip deployment:

```bash
zip -r deploy.zip . -x ".venv/*" -x "__pycache__/*" -x ".pytest_cache/*" -x "tests/*"
az webapp deployment source config-zip \
  --name recipe-scraper-api \
  --resource-group recipe-scraper-rg \
  --src deploy.zip
```

## Verification

### Health Check

```bash
curl https://recipe-scraper-api.azurewebsites.net/health
```

Expected response:
```json
{"status": "healthy"}
```

### Test Scraping

```bash
curl -X POST https://recipe-scraper-api.azurewebsites.net/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.allrecipes.com/recipe/10813/best-chocolate-chip-cookies/"}'
```

### Test CORS

```bash
curl -I -X OPTIONS https://recipe-scraper-api.azurewebsites.net/scrape \
  -H "Origin: https://your-frontend-domain.com" \
  -H "Access-Control-Request-Method: POST"
```

Should include `access-control-allow-origin` header.

## Alternative: Docker Deployment

If you prefer container deployment:

```bash
# Build image
docker build -t recipe-scraper .

# Run locally
docker run -p 8000:8000 -e CORS_ORIGINS="*" recipe-scraper

# Push to Azure Container Registry and deploy
az acr create --name recipescraperregistry --resource-group recipe-scraper-rg --sku Basic
az acr build --registry recipescraperregistry --image recipe-scraper:latest .
az webapp create \
  --name recipe-scraper-api \
  --resource-group recipe-scraper-rg \
  --plan recipe-scraper-plan \
  --deployment-container-image-name recipescraperregistry.azurecr.io/recipe-scraper:latest
```

## Troubleshooting

### View Logs

```bash
az webapp log tail --name recipe-scraper-api --resource-group recipe-scraper-rg
```

### Check App Status

```bash
az webapp show --name recipe-scraper-api --resource-group recipe-scraper-rg --query state
```

## Cost

- **F1 (Free) tier**: 60 CPU minutes/day, 1 GB memory
- Suitable for personal use; upgrade to B1 (~$13/month) for production
