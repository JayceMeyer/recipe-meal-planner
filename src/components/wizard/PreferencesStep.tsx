import { useState, useEffect, useRef } from 'react'
import { UtensilsCrossed, Plus, X } from 'lucide-react'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const CUISINE_OPTIONS = [
  'Italian', 'Mexican', 'Asian', 'Indian', 'Mediterranean',
  'American', 'Thai', 'Japanese', 'French', 'Greek',
  'Chinese', 'Korean', 'Vietnamese', 'Spanish', 'Middle Eastern',
  'Caribbean', 'African', 'Brazilian', 'British', 'German',
]

const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free',
  'Nut-Free', 'Keto', 'Paleo',
]

interface PreferencesStepProps {
  onSkip: () => void
}

export function PreferencesStep({ onSkip }: PreferencesStepProps) {
  const { preferences, updatePreferences } = useUserPreferences()
  const cuisines = preferences?.cuisine_preferences ?? []
  const dietary = preferences?.dietary_restrictions ?? []
  const [cuisineInput, setCuisineInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleCuisine = (cuisine: string) => {
    const next = cuisines.includes(cuisine)
      ? cuisines.filter((c) => c !== cuisine)
      : [...cuisines, cuisine]
    updatePreferences(next, dietary)
  }

  const addCustomCuisine = (name?: string) => {
    const value = (name || cuisineInput).trim()
    if (!value) return
    if (cuisines.some((c) => c.toLowerCase() === value.toLowerCase())) return

    const formatted = value.charAt(0).toUpperCase() + value.slice(1)
    const next = [...cuisines, formatted]
    updatePreferences(next, dietary)
    setCuisineInput('')
    setShowSuggestions(false)
  }

  const removeCuisine = (cuisine: string) => {
    const next = cuisines.filter((c) => c !== cuisine)
    updatePreferences(next, dietary)
  }

  const toggleDietary = (restriction: string) => {
    const next = dietary.includes(restriction)
      ? dietary.filter((d) => d !== restriction)
      : [...dietary, restriction]
    updatePreferences(cuisines, next)
  }

  const filteredSuggestions = CUISINE_OPTIONS.filter(
    (c) =>
      !cuisines.some((s) => s.toLowerCase() === c.toLowerCase()) &&
      c.toLowerCase().includes(cuisineInput.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="text-center">
        <UtensilsCrossed className="mx-auto size-10 text-primary mb-2" />
        <h2 className="text-xl font-semibold">What do you like to eat?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select your favorite cuisines and any dietary needs
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <p className="text-sm font-medium mb-3">Favorite cuisines</p>

          {cuisines.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {cuisines.map((cuisine) => (
                <span
                  key={cuisine}
                  className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium"
                >
                  {cuisine}
                  <button onClick={() => removeCuisine(cuisine)} className="hover:opacity-70">
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="relative" ref={suggestionsRef}>
            <Input
              placeholder="Type a cuisine (e.g. Korean, Ethiopian...)"
              value={cuisineInput}
              onChange={(e) => {
                setCuisineInput(e.target.value)
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  if (filteredSuggestions.length > 0 && cuisineInput) {
                    addCustomCuisine(filteredSuggestions[0])
                  } else {
                    addCustomCuisine()
                  }
                }
              }}
            />
            {showSuggestions && cuisineInput && filteredSuggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
                {filteredSuggestions.map((cuisine) => (
                  <button
                    key={cuisine}
                    type="button"
                    onClick={() => addCustomCuisine(cuisine)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            {CUISINE_OPTIONS.slice(0, 10)
              .filter((c) => !cuisines.some((s) => s.toLowerCase() === c.toLowerCase()))
              .map((cuisine) => (
                <button
                  key={cuisine}
                  type="button"
                  onClick={() => toggleCuisine(cuisine)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  <Plus className="inline size-3 mr-1" />
                  {cuisine}
                </button>
              ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-3">Dietary restrictions</p>
          <div className="flex flex-wrap gap-2">
            {DIETARY_OPTIONS.map((restriction) => (
              <button
                key={restriction}
                type="button"
                onClick={() => toggleDietary(restriction)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                  dietary.includes(restriction)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
              >
                {restriction}
              </button>
            ))}
          </div>
        </div>
      </div>

      {cuisines.length === 0 && dietary.length === 0 && (
        <button
          onClick={onSkip}
          className="block mx-auto text-sm text-muted-foreground hover:text-foreground"
        >
          Skip for now
        </button>
      )}
    </div>
  )
}
