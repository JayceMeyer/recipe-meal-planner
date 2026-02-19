import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PantrySetupStep } from './PantrySetupStep'
import { PreferencesStep } from './PreferencesStep'
import { ApiKeyStep } from './ApiKeyStep'
import { RecipeSuggestionsStep } from './RecipeSuggestionsStep'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { useHouseholdApiKeys } from '@/hooks/useHouseholdApiKeys'

const STEPS = [
  { label: 'Pantry Setup', description: 'Add your ingredients' },
  { label: 'Preferences', description: 'Cuisine & diet' },
  { label: 'API Key', description: 'Recipe discovery' },
  { label: 'Recipes', description: 'Find recipes' },
] as const

interface SetupWizardProps {
  onComplete: () => void
}

export function SetupWizard({ onComplete }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const { markSetupComplete } = useUserPreferences()
  const { hasKey, refresh: refreshKeys } = useHouseholdApiKeys()

  const handleNext = useCallback(() => {
    if (currentStep === 2) refreshKeys()
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1)
    }
  }, [currentStep, refreshKeys])

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1)
    }
  }, [currentStep])

  const handleComplete = useCallback(async () => {
    await markSetupComplete()
    onComplete()
  }, [markSetupComplete, onComplete])

  const handleSkipSetup = useCallback(async () => {
    await markSetupComplete()
    onComplete()
  }, [markSetupComplete, onComplete])

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Welcome to your kitchen!</h1>
        <p className="mt-2 text-muted-foreground">
          Let's get you set up in a few quick steps
        </p>
      </div>

      <nav className="flex items-center justify-center gap-2">
        {STEPS.map((step, index) => (
          <div key={step.label} className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors',
                  index < currentStep && 'bg-primary text-primary-foreground',
                  index === currentStep && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
                  index > currentStep && 'bg-muted text-muted-foreground',
                )}
              >
                {index < currentStep ? <Check className="size-4" /> : index + 1}
              </div>
              <div className="hidden sm:block">
                <p className={cn(
                  'text-sm font-medium',
                  index > currentStep && 'text-muted-foreground',
                )}>
                  {step.label}
                </p>
              </div>
            </div>
            {index < STEPS.length - 1 && (
              <div className={cn(
                'h-px w-8 sm:w-12',
                index < currentStep ? 'bg-primary' : 'bg-muted',
              )} />
            )}
          </div>
        ))}
      </nav>

      <div className="min-h-[400px]">
        {currentStep === 0 && <PantrySetupStep onSkip={handleNext} />}
        {currentStep === 1 && <PreferencesStep onSkip={handleNext} />}
        {currentStep === 2 && <ApiKeyStep onSkip={handleNext} />}
        {currentStep === 3 && (hasKey ? <RecipeSuggestionsStep /> : <RecipeSuggestionsGated />)}
      </div>

      <div className="flex items-center justify-between">
        <div>
          {currentStep > 0 ? (
            <Button variant="ghost" onClick={handleBack}>Back</Button>
          ) : (
            <Button variant="ghost" onClick={handleSkipSetup}>
              Skip setup
            </Button>
          )}
        </div>
        <div>
          {currentStep < STEPS.length - 1 ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <Button onClick={handleComplete}>Get started</Button>
          )}
        </div>
      </div>
    </div>
  )
}

function RecipeSuggestionsGated() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
      <p className="text-muted-foreground">
        Recipe discovery requires a Spoonacular API key.
      </p>
      <p className="text-sm text-muted-foreground">
        You can add one later in your Profile settings, or go back to the previous step.
      </p>
    </div>
  )
}
