import { Check } from 'lucide-react'
import { useTheme, themes } from '@/contexts/ThemeContext'
import type { ColorTheme } from '@/types/database'
import { cn } from '@/lib/utils'

const swatchColors: Record<ColorTheme, { bg: string; primary: string; accent: string }> = {
  kitchen: { bg: '#f5f0e8', primary: '#b84233', accent: '#d4dfc8' },
  midnight: { bg: '#2a231d', primary: '#d4704a', accent: '#3a4a33' },
  creamsicle: { bg: '#f5e6c8', primary: '#d48a2e', accent: '#f0e4a8' },
  coffee: { bg: '#36291e', primary: '#c4a668', accent: '#4a3828' },
  tiki: { bg: '#1a1528', primary: '#e84590', accent: '#40c8b0' },
  'herb-garden': { bg: '#e0ebd0', primary: '#5a8a50', accent: '#e8dcc0' },
  berry: { bg: '#2a1838', primary: '#d84888', accent: '#9878c0' },
  ocean: { bg: '#1a2840', primary: '#d87858', accent: '#58b8a0' },
}

export function ThemePicker() {
  const { theme: activeTheme, setTheme } = useTheme()

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {themes.map((t) => {
        const colors = swatchColors[t.id]
        const isActive = activeTheme === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => setTheme(t.id)}
            className={cn(
              'relative rounded-lg p-3 text-left transition-all',
              'ring-2 ring-offset-2 ring-offset-background',
              isActive ? 'ring-primary' : 'ring-transparent hover:ring-border',
            )}
            style={{ backgroundColor: colors.bg }}
          >
            <div className="flex gap-1.5 mb-2">
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: colors.primary }} />
              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: colors.accent }} />
            </div>
            <p
              className="text-xs font-medium truncate"
              style={{ color: t.isDark ? '#e8e0d8' : '#2a231d' }}
            >
              {t.label}
            </p>
            {isActive && (
              <div className="absolute top-1.5 right-1.5">
                <Check className="size-4" style={{ color: colors.primary }} />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
