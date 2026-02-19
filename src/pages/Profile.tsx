import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HouseholdSection } from '@/components/HouseholdSection'
import { ApiKeySection } from '@/components/ApiKeySection'
import { ThemePicker } from '@/components/ThemePicker'
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
  const { preferences, updatePreferences, resetSetup } = useUserPreferences()
  const cuisines = preferences?.cuisine_preferences ?? []
  const dietary = preferences?.dietary_restrictions ?? []

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
