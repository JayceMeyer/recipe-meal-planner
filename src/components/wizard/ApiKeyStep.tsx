import { useState } from 'react'
import { Key, ExternalLink, Loader2, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUserPreferences } from '@/hooks/useUserPreferences'

interface ApiKeyStepProps {
  onSkip: () => void
}

export function ApiKeyStep({ onSkip }: ApiKeyStepProps) {
  const { preferences, updateApiKey } = useUserPreferences()
  const hasKey = !!preferences?.spoonacular_api_key

  const [inputValue, setInputValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(hasKey)

  const handleSave = async () => {
    const trimmed = inputValue.trim()
    if (!trimmed) return

    setSaving(true)
    setError(null)

    try {
      const res = await fetch(
        `https://api.spoonacular.com/recipes/complexSearch?apiKey=${trimmed}&query=test&number=1`,
      )

      if (!res.ok) {
        setError(res.status === 401 || res.status === 403
          ? 'Invalid API key. Please check and try again.'
          : `Validation failed (HTTP ${res.status})`)
        setSaving(false)
        return
      }
    } catch {
      setError('Could not validate key. Check your connection.')
      setSaving(false)
      return
    }

    const ok = await updateApiKey(trimmed)
    if (ok) {
      setInputValue('')
      setSaved(true)
    } else {
      setError('Failed to save API key.')
    }

    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Key className="mx-auto size-10 text-primary mb-2" />
        <h2 className="text-xl font-semibold">Recipe Discovery</h2>
        <p className="text-sm text-muted-foreground mt-1">
          To discover new recipes, you'll need a free Spoonacular API key
        </p>
      </div>

      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
        <p className="text-sm font-medium">How to get your free API key:</p>
        <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
          <li>
            Visit{' '}
            <a
              href="https://spoonacular.com/food-api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              spoonacular.com/food-api
              <ExternalLink className="size-3" />
            </a>
          </li>
          <li>Create a free account</li>
          <li>Copy your API key from the dashboard</li>
          <li>Paste it below</li>
        </ol>
      </div>

      {saved ? (
        <div className="flex items-center gap-2 p-3 rounded-md bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
          <Check className="size-4" />
          <span className="text-sm font-medium">API key saved! Recipe discovery is ready.</span>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Paste your API key..."
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

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <button
            type="button"
            onClick={onSkip}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Skip for now — you can add it later in Profile
          </button>
        </div>
      )}
    </div>
  )
}
