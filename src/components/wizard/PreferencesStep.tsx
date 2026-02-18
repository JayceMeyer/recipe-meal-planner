import { useState, useEffect } from 'react'
import { UtensilsCrossed } from 'lucide-react'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { cn } from '@/lib/utils'

const CUISINE_OPTIONS = [
  'Italian', 'Mexican', 'Asian', 'Indian', 'Mediterranean',
  'American', 'Thai', 'Japanese', 'French', 'Greek',
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
  const [cuisines, setCuisines] = useState<string[]>([])
  const [dietary, setDietary] = useState<string[]>([])

  useEffect(() => {
    if (preferences) {
      setCuisines(preferences.cuisine_preferences)
      setDietary(preferences.dietary_restrictions)
    }
  }, [preferences])

  const toggleCuisine = (cuisine: string) => {
    const next = cuisines.includes(cuisine)
      ? cuisines.filter((c) => c !== cuisine)
      : [...cuisines, cuisine]
    setCuisines(next)
    updatePreferences(next, dietary)
  }

  const toggleDietary = (restriction: string) => {
    const next = dietary.includes(restriction)
      ? dietary.filter((d) => d !== restriction)
      : [...dietary, restriction]
    setDietary(next)
    updatePreferences(cuisines, next)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <UtensilsCrossed className="mx-auto size-10 text-primary mb-2" />
        <h2 className="text-xl font-semibold">What do you like to eat?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select your favorite cuisines and any dietary needs
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-3">Favorite cuisines</p>
          <div className="flex flex-wrap gap-2">
            {CUISINE_OPTIONS.map((cuisine) => (
              <button
                key={cuisine}
                type="button"
                onClick={() => toggleCuisine(cuisine)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                  cuisines.includes(cuisine)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
              >
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
