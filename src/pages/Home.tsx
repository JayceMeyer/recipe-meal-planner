import { useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useHousehold } from '@/contexts/HouseholdContext'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { SetupWizard } from '@/components/wizard/SetupWizard'
import { PantryQuickTool } from '@/components/dashboard/PantryQuickTool'
import { QuickAccessCards } from '@/components/dashboard/QuickAccessCards'
import { TodaysMeals } from '@/components/TodaysMeals'

export function Home() {
  const { user } = useAuth()
  const { household, loading: householdLoading } = useHousehold()
  const { preferences, loading: prefsLoading } = useUserPreferences()
  const [wizardJustCompleted, setWizardJustCompleted] = useState(false)

  const handleWizardComplete = useCallback(() => {
    setWizardJustCompleted(true)
  }, [])

  if (householdLoading || prefsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!household) {
    return null
  }

  if (!wizardJustCompleted && (!preferences || !preferences.setup_completed)) {
    return (
      <div className="py-8">
        <SetupWizard onComplete={handleWizardComplete} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back{user?.email ? `, ${user.email.split('@')[0]}` : ''}!
        </h1>
        <p className="text-muted-foreground">What would you like to cook today?</p>
      </div>

      <QuickAccessCards />
      <PantryQuickTool />
      <TodaysMeals />
    </div>
  )
}
