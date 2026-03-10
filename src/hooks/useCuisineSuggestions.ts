import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import type { CuisineIngredientMapping } from '@/types/database'

const DAIRY_INGREDIENTS = ['butter', 'cheese', 'cream', 'milk', 'yogurt', 'ghee', 'feta', 'parmesan', 'mozzarella', 'ricotta', 'mascarpone', 'brie', 'gouda', 'gruyere', 'stilton', 'clotted cream', 'sour cream', 'cream cheese', 'heavy cream', 'buttermilk', 'half and half']
const MEAT_INGREDIENTS = ['chicken', 'beef', 'pork', 'lamb', 'turkey', 'duck', 'veal', 'bacon', 'sausage', 'ham', 'chorizo', 'prosciutto', 'pancetta', 'salami', 'pepperoni']
const SEAFOOD_INGREDIENTS = ['fish', 'salmon', 'tuna', 'shrimp', 'crab', 'lobster', 'scallop', 'clam', 'mussel', 'oyster', 'anchovy', 'sardine', 'prawn', 'squid', 'octopus']
const GLUTEN_INGREDIENTS = ['flour', 'bread', 'pasta', 'noodle', 'spaghetti', 'penne', 'macaroni', 'couscous', 'barley', 'orzo', 'pita', 'naan', 'tortilla', 'cracker', 'breadcrumb', 'panko', 'croissant', 'bagel', 'baguette', 'phyllo', 'pumpernickel']
const NUT_INGREDIENTS = ['almond', 'walnut', 'pecan', 'cashew', 'peanut', 'pistachio', 'pine nut', 'peanut butter']

function containsWord(text: string, word: string): boolean {
  const regex = new RegExp(`(^|\\s|-)${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(s?)(\\s|-|$)`, 'i')
  return regex.test(text)
}

function matchesAny(text: string, words: string[]): boolean {
  return words.some((w) => containsWord(text, w))
}

function matchesDietaryFilter(ingredientName: string, restrictions: string[]): boolean {
  const lower = ingredientName.toLowerCase()
  for (const restriction of restrictions) {
    switch (restriction) {
      case 'Vegetarian':
        if (matchesAny(lower, MEAT_INGREDIENTS) || matchesAny(lower, SEAFOOD_INGREDIENTS)) return false
        break
      case 'Vegan':
        if (matchesAny(lower, MEAT_INGREDIENTS) || matchesAny(lower, SEAFOOD_INGREDIENTS) || matchesAny(lower, DAIRY_INGREDIENTS)) return false
        if (containsWord(lower, 'egg') || containsWord(lower, 'honey')) return false
        break
      case 'Dairy-Free':
        if (matchesAny(lower, DAIRY_INGREDIENTS)) return false
        break
      case 'Gluten-Free':
        if (matchesAny(lower, GLUTEN_INGREDIENTS)) return false
        break
      case 'Nut-Free':
        if (matchesAny(lower, NUT_INGREDIENTS)) return false
        break
    }
  }
  return true
}

interface UseCuisineSuggestionsResult {
  suggestions: CuisineIngredientMapping[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useCuisineSuggestions(): UseCuisineSuggestionsResult {
  const [suggestions, setSuggestions] = useState<CuisineIngredientMapping[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { preferences } = useUserPreferences()
  const isMounted = useRef(true)

  const cuisines = preferences?.cuisine_preferences ?? []
  const dietary = preferences?.dietary_restrictions ?? []

  const fetchSuggestions = useCallback(async () => {
    if (!user || cuisines.length === 0) {
      setSuggestions([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('cuisine_ingredient_mappings')
      .select('*')
      .in('cuisine', cuisines)
      .order('tier', { ascending: true })
      .order('cuisine')
      .order('ingredient_name')

    if (!isMounted.current) return

    if (fetchError) {
      setError(fetchError.message)
      setSuggestions([])
      setLoading(false)
      return
    }

    const filtered = (data ?? []).filter((item) =>
      matchesDietaryFilter(item.ingredient_name, dietary),
    )

    const seen = new Set<string>()
    const deduped = filtered.filter((item) => {
      const key = item.ingredient_name.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    setSuggestions(deduped)
    setLoading(false)
  }, [user, cuisines.join(','), dietary.join(',')])

  useEffect(() => {
    isMounted.current = true
    queueMicrotask(() => { fetchSuggestions() })
    return () => { isMounted.current = false }
  }, [fetchSuggestions])

  return { suggestions, loading, error, refresh: fetchSuggestions }
}
