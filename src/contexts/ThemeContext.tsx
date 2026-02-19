import { createContext, useContext, useEffect, useCallback, useSyncExternalStore, type ReactNode } from 'react'
import type { ColorTheme } from '@/types/database'
import { useUserPreferences } from '@/hooks/useUserPreferences'

export interface ThemeInfo {
  id: ColorTheme
  label: string
  description: string
  isDark: boolean
}

export const themes: ThemeInfo[] = [
  { id: 'kitchen', label: 'Kitchen', description: 'Warm cream with tomato red', isDark: false },
  { id: 'midnight', label: 'Midnight Kitchen', description: 'Dark espresso with bright tomato', isDark: true },
  { id: 'creamsicle', label: 'Creamsicle', description: 'Tangerine orange with lemon accents', isDark: false },
  { id: 'coffee', label: 'Coffee', description: 'Matte brown with caramel gold', isDark: true },
  { id: 'tiki', label: 'Tiki Bar', description: 'Black with hot pink and neon teal', isDark: true },
  { id: 'herb-garden', label: 'Herb Garden', description: 'Sage and olive with earthy tones', isDark: false },
  { id: 'berry', label: 'Berry', description: 'Deep plum with pink and lavender', isDark: true },
  { id: 'ocean', label: 'Ocean', description: 'Deep navy with coral and seafoam', isDark: true },
]

interface ThemeContextValue {
  theme: ColorTheme
  setTheme: (theme: ColorTheme) => void
  themes: ThemeInfo[]
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const STORAGE_KEY = 'color-theme'

function applyTheme(theme: ColorTheme) {
  const root = document.documentElement
  themes.forEach((t) => root.classList.remove(`theme-${t.id}`))
  root.classList.add(`theme-${theme}`)
}

const themeListeners = new Set<() => void>()

function subscribeTheme(callback: () => void) {
  themeListeners.add(callback)
  return () => themeListeners.delete(callback)
}

function getThemeSnapshot(): ColorTheme {
  return (localStorage.getItem(STORAGE_KEY) as ColorTheme) || 'kitchen'
}

function setStoredTheme(theme: ColorTheme) {
  localStorage.setItem(STORAGE_KEY, theme)
  themeListeners.forEach((cb) => cb())
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { preferences, updateTheme } = useUserPreferences()
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot)

  useEffect(() => {
    if (preferences?.color_theme && preferences.color_theme !== theme) {
      setStoredTheme(preferences.color_theme as ColorTheme)
    }
  }, [preferences?.color_theme, theme])

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const setTheme = useCallback(
    (newTheme: ColorTheme) => {
      setStoredTheme(newTheme)
      updateTheme(newTheme)
    },
    [updateTheme],
  )

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
