import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useUserRole } from '@/hooks/useUserRole'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { AppSettings } from '@/types/database'

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [markup, setMarkup] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const { user } = useAuth()
  const { isAdmin } = useUserRole()

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase
        .from('app_settings')
        .select('*')
        .eq('id', 1)
        .single()

      if (data) {
        setSettings(data)
        setMarkup(String(data.ai_markup_percent))
      }
      setLoading(false)
    }

    fetchSettings()
  }, [])

  const handleSave = async () => {
    const value = parseFloat(markup)
    if (isNaN(value) || value < 0 || value > 100) return

    setSaving(true)
    const { data, error } = await supabase
      .from('app_settings')
      .update({
        ai_markup_percent: value,
        updated_by: user?.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)
      .select()
      .single()

    if (!error && data) {
      setSettings(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!settings) return null

  const hasChanged = markup !== String(settings.ai_markup_percent)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Cost Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium" htmlFor="markup">
              AI Markup Percentage
            </label>
            <p className="text-xs text-muted-foreground mb-2">
              Overhead percentage added to AI API costs for operational expenses.
            </p>
            <div className="flex items-center gap-3 max-w-xs">
              <Input
                id="markup"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={markup}
                onChange={(e) => setMarkup(e.target.value)}
                disabled={!isAdmin}
              />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSave}
                disabled={saving || !hasChanged}
              >
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
              </Button>
            </div>
          )}

          {!isAdmin && (
            <p className="text-sm text-muted-foreground italic">
              Only admins can edit settings.
            </p>
          )}

          {settings.updated_at && (
            <p className="text-xs text-muted-foreground">
              Last updated: {new Date(settings.updated_at).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
