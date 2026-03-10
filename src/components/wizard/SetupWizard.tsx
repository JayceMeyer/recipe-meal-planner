import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { PreferencesStep } from './PreferencesStep'
import { SmartSuggestionsStep } from './SmartSuggestionsStep'
import { KitSelectionStep } from './KitSelectionStep'
import { BulkAddStep } from './BulkAddStep'
import { AIImportStep } from './AIImportStep'
import { ApiKeyStep } from './ApiKeyStep'
import { RecipeSuggestionsStep } from './RecipeSuggestionsStep'
import { useUserPreferences } from '@/hooks/useUserPreferences'

interface SetupWizardProps {
  onComplete: () => void
  initialHasApiKey: boolean
}

export function SetupWizard({ onComplete, initialHasApiKey }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const { preferences, updateApiKey, markSetupComplete } = useUserPreferences()
  const hasApiKey = !!preferences?.spoonacular_api_key
  const showApiKeyStep = !initialHasApiKey

  const steps = [
    { key: 'preferences', label: 'Preferences', description: 'Cuisine & diet' },
    { key: 'suggestions', label: 'Suggestions', description: 'Smart picks' },
    { key: 'kits', label: 'Kits', description: 'Starter kits' },
    { key: 'bulk', label: 'Browse', description: 'Add items' },
    { key: 'import', label: 'Import', description: 'AI import' },
    ...(showApiKeyStep
      ? [{ key: 'apikey', label: 'API Key', description: 'Recipe discovery' }]
      : []),
    { key: 'recipes', label: 'Recipes', description: 'Find recipes' },
  ]

  const currentKey = steps[currentStep]?.key

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1)
    }
  }, [currentStep, steps.length])

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

      <nav className="flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto px-2">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center gap-1 sm:gap-2 shrink-0">
            <div className="flex items-center gap-1 sm:gap-2">
              <div
                className={cn(
                  'flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-xs sm:text-sm font-medium transition-colors',
                  index < currentStep && 'bg-primary text-primary-foreground',
                  index === currentStep && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
                  index > currentStep && 'bg-muted text-muted-foreground',
                )}
              >
                {index < currentStep ? <Check className="size-3.5 sm:size-4" /> : index + 1}
              </div>
              <div className="hidden lg:block">
                <p className={cn(
                  'text-sm font-medium',
                  index > currentStep && 'text-muted-foreground',
                )}>
                  {step.label}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={cn(
                'h-px w-4 sm:w-6 lg:w-8',
                index < currentStep ? 'bg-primary' : 'bg-muted',
              )} />
            )}
          </div>
        ))}
      </nav>

      <div className="min-h-[400px]">
        {currentKey === 'preferences' && <PreferencesStep onSkip={handleNext} />}
        {currentKey === 'suggestions' && <SmartSuggestionsStep onSkip={handleNext} />}
        {currentKey === 'kits' && <KitSelectionStep onSkip={handleNext} />}
        {currentKey === 'bulk' && <BulkAddStep onSkip={handleNext} />}
        {currentKey === 'import' && <AIImportStep onSkip={handleNext} />}
        {currentKey === 'apikey' && <ApiKeyStep hasApiKey={hasApiKey} updateApiKey={updateApiKey} onSkip={handleNext} />}
        {currentKey === 'recipes' && (hasApiKey ? <RecipeSuggestionsStep /> : <RecipeSuggestionsGated />)}
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
          {currentStep < steps.length - 1 ? (
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
