import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { useCredits } from '@/hooks/useCredits'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HouseholdSection } from '@/components/HouseholdSection'
import { ApiKeySection } from '@/components/ApiKeySection'
import { OpenRouterSection } from '@/components/OpenRouterSection'
import { ThemePicker } from '@/components/ThemePicker'
import { PurchaseCreditsDialog } from '@/components/PurchaseCreditsDialog'
import { Coins, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const CUISINE_OPTIONS = [
  'Italian', 'Mexican', 'Asian', 'Indian', 'Mediterranean',
  'American', 'Thai', 'Japanese', 'French', 'Greek',
]

const DIETARY_OPTIONS = [
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free',
  'Nut-Free', 'Keto', 'Paleo',
]

export function Profile() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { preferences, updatePreferences, resetSetup } = useUserPreferences()
  const { balance, isByok, refresh: refreshCredits } = useCredits()
  const [purchaseSuccess, setPurchaseSuccess] = useState(false)
  const purchaseHandled = useRef(false)
  const cuisines = preferences?.cuisine_preferences ?? []
  const dietary = preferences?.dietary_restrictions ?? []

  useEffect(() => {
    if (purchaseHandled.current) return
    const purchase = searchParams.get('purchase')
    if (purchase === 'success') {
      purchaseHandled.current = true
      queueMicrotask(() => {
        setPurchaseSuccess(true)
        refreshCredits()
        setSearchParams({}, { replace: true })
      })
      const timer = setTimeout(() => setPurchaseSuccess(false), 5000)
      return () => clearTimeout(timer)
    }
    if (purchase === 'cancel') {
      purchaseHandled.current = true
      queueMicrotask(() => { setSearchParams({}, { replace: true }) })
    }
  }, [searchParams, setSearchParams, refreshCredits])

  const toggleCuisine = (cuisine: string) => {
    const next = cuisines.includes(cuisine)
      ? cuisines.filter((c) => c !== cuisine)
      : [...cuisines, cuisine]
    updatePreferences(next, dietary)
  }

  const toggleDietary = (restriction: string) => {
    const next = dietary.includes(restriction)
      ? dietary.filter((d) => d !== restriction)
      : [...dietary, restriction]
    updatePreferences(cuisines, next)
  }

  const handleRerunWizard = async () => {
    await resetSetup()
    navigate('/')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="destructive" onClick={signOut}>
            Sign out
          </Button>
        </CardContent>
      </Card>

      <HouseholdSection />

      <ApiKeySection />

      <OpenRouterSection />

      {!isByok && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              AI Credits
            </CardTitle>
            <CardDescription>
              Credits are used for AI meal planning and recipe parsing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {purchaseSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                Credits purchased successfully!
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{balance ?? 0}</p>
                <p className="text-sm text-muted-foreground">credits remaining</p>
              </div>
              <PurchaseCreditsDialog />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Choose a color theme</CardDescription>
        </CardHeader>
        <CardContent>
          <ThemePicker />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Food Preferences</CardTitle>
          <CardDescription>Your cuisine and dietary preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium mb-3">Favorite cuisines</p>
            <div className="flex flex-wrap gap-2">
              {CUISINE_OPTIONS.map((cuisine) => (
                <button
                  key={cuisine}
                  type="button"
                  onClick={() => toggleCuisine(cuisine)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
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
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
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

          <div className="border-t pt-4">
            <Button variant="outline" onClick={handleRerunWizard}>
              Re-run Setup Wizard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
