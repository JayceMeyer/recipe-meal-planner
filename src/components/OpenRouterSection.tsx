import { useState } from 'react'
import { Bot, Eye, EyeOff, Loader2, ExternalLink, Trash2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { OPENROUTER_MODELS, DEFAULT_MODEL } from '@/types/aiMealPlan'
import { cn } from '@/lib/utils'

function maskKey(key: string): string {
  if (key.length <= 8) return '****'
  return key.slice(0, 4) + '****' + key.slice(-4)
}

export function OpenRouterSection() {
  const { preferences, updateOpenRouterKey, updateOpenRouterModel } = useUserPreferences()
  const currentKey = preferences?.openrouter_api_key ?? null
  const currentModel = preferences?.openrouter_model ?? DEFAULT_MODEL

  const [inputValue, setInputValue] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSave = async () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await fetch('https://openrouter.ai/api/v1/models', {
        headers: { 'Authorization': `Bearer ${trimmed}` },
      })

      if (!res.ok) {
        setError(res.status === 401 || res.status === 403
          ? 'Invalid API key. Please check and try again.'
          : `API key validation failed (HTTP ${res.status})`)
        setSaving(false)
        return
      }
    } catch {
      setError('Could not validate API key. Check your connection and try again.')
      setSaving(false)
      return
    }

    const ok = await updateOpenRouterKey(trimmed)
    if (ok) {
      setInputValue('')
      setSuccess('API key saved successfully!')
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError('Failed to save API key.')
    }

    setSaving(false)
  }

  const handleRemove = async () => {
    setSaving(true)
    setError(null)
    setSuccess(null)

    const ok = await updateOpenRouterKey(null)
    if (ok) {
      setSuccess('API key removed.')
      setTimeout(() => setSuccess(null), 3000)
    } else {
      setError('Failed to remove API key.')
    }

    setSaving(false)
  }

  const handleModelChange = async (modelId: string) => {
    const ok = await updateOpenRouterModel(modelId)
    if (!ok) {
      setError('Failed to update model.')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="size-5" />
          AI Meal Planning (OpenRouter)
        </CardTitle>
        <CardDescription>
          Powers AI-generated meal plans. Get an API key at{' '}
          <a
            href="https://openrouter.ai/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline"
          >
            openrouter.ai
            <ExternalLink className="size-3" />
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentKey && (
          <div className="flex items-center gap-2">
            <div className="flex-1 font-mono text-sm bg-muted px-3 py-2 rounded-md">
              {showKey ? currentKey : maskKey(currentKey)}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={saving}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <Input
            type="text"
            placeholder={currentKey ? 'Enter new API key...' : 'Paste your OpenRouter API key...'}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="font-mono text-sm"
          />
          <Button
            onClick={handleSave}
            disabled={!inputValue.trim() || saving}
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : 'Save'}
          </Button>
        </div>

        {currentKey && (
          <div>
            <p className="text-sm font-medium mb-2">AI Model</p>
            <div className="flex flex-wrap gap-2">
              {OPENROUTER_MODELS.map((model) => (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => handleModelChange(model.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    currentModel === model.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                  title={model.description}
                >
                  {model.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-600">{success}</p>
        )}
      </CardContent>
    </Card>
  )
}
