import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Recipe, RecipeInsert, Ingredient, Step } from '@/types/database'

export interface RecipeFormData {
  title: string
  description: string
  image_url: string
  source_url: string
  servings: string
  prep_time: string
  cook_time: string
  ingredients: Ingredient[]
  steps: Step[]
  notes: string
}

interface UseRecipeFormResult {
  formData: RecipeFormData
  setFormData: React.Dispatch<React.SetStateAction<RecipeFormData>>
  updateField: <K extends keyof RecipeFormData>(field: K, value: RecipeFormData[K]) => void
  addIngredient: () => void
  updateIngredient: (index: number, ingredient: Ingredient) => void
  removeIngredient: (index: number) => void
  moveIngredient: (fromIndex: number, toIndex: number) => void
  addStep: () => void
  updateStep: (index: number, instruction: string) => void
  removeStep: (index: number) => void
  moveStep: (fromIndex: number, toIndex: number) => void
  save: () => Promise<string | null>
  saving: boolean
  error: string | null
  isValid: boolean
}

const emptyFormData: RecipeFormData = {
  title: '',
  description: '',
  image_url: '',
  source_url: '',
  servings: '',
  prep_time: '',
  cook_time: '',
  ingredients: [{ name: '', amount: '', unit: '' }],
  steps: [{ order: 1, instruction: '' }],
  notes: '',
}

function recipeToFormData(recipe: Recipe): RecipeFormData {
  return {
    title: recipe.title,
    description: recipe.description ?? '',
    image_url: recipe.image_url ?? '',
    source_url: recipe.source_url ?? '',
    servings: recipe.servings?.toString() ?? '',
    prep_time: recipe.prep_time?.toString() ?? '',
    cook_time: recipe.cook_time?.toString() ?? '',
    ingredients: recipe.ingredients.length > 0 ? recipe.ingredients : [{ name: '', amount: '', unit: '' }],
    steps: recipe.steps.length > 0 ? recipe.steps : [{ order: 1, instruction: '' }],
    notes: recipe.notes ?? '',
  }
}

export function useRecipeForm(existingRecipe?: Recipe): UseRecipeFormResult {
  const { user } = useAuth()
  const [formData, setFormData] = useState<RecipeFormData>(
    existingRecipe ? recipeToFormData(existingRecipe) : emptyFormData
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateField = useCallback(<K extends keyof RecipeFormData>(field: K, value: RecipeFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  const addIngredient = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', amount: '', unit: '' }],
    }))
  }, [])

  const updateIngredient = useCallback((index: number, ingredient: Ingredient) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) => (i === index ? ingredient : ing)),
    }))
  }, [])

  const removeIngredient = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }))
  }, [])

  const moveIngredient = useCallback((fromIndex: number, toIndex: number) => {
    setFormData((prev) => {
      const ingredients = [...prev.ingredients]
      const [removed] = ingredients.splice(fromIndex, 1)
      ingredients.splice(toIndex, 0, removed)
      return { ...prev, ingredients }
    })
  }, [])

  const addStep = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      steps: [...prev.steps, { order: prev.steps.length + 1, instruction: '' }],
    }))
  }, [])

  const updateStep = useCallback((index: number, instruction: string) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.map((step, i) => (i === index ? { ...step, instruction } : step)),
    }))
  }, [])

  const removeStep = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps
        .filter((_, i) => i !== index)
        .map((step, i) => ({ ...step, order: i + 1 })),
    }))
  }, [])

  const moveStep = useCallback((fromIndex: number, toIndex: number) => {
    setFormData((prev) => {
      const steps = [...prev.steps]
      const [removed] = steps.splice(fromIndex, 1)
      steps.splice(toIndex, 0, removed)
      return {
        ...prev,
        steps: steps.map((step, i) => ({ ...step, order: i + 1 })),
      }
    })
  }, [])

  const isValid = formData.title.trim().length > 0

  const save = useCallback(async (): Promise<string | null> => {
    if (!user) {
      setError('You must be logged in to save a recipe')
      return null
    }

    if (!isValid) {
      setError('Title is required')
      return null
    }

    setSaving(true)
    setError(null)

    const filteredIngredients = formData.ingredients.filter((ing) => ing.name.trim() !== '')
    const filteredSteps = formData.steps
      .filter((step) => step.instruction.trim() !== '')
      .map((step, i) => ({ ...step, order: i + 1 }))

    const recipeData: RecipeInsert = {
      user_id: user.id,
      title: formData.title.trim(),
      description: formData.description.trim() || null,
      image_url: formData.image_url.trim() || null,
      source_url: formData.source_url.trim() || null,
      servings: formData.servings ? parseInt(formData.servings, 10) : null,
      prep_time: formData.prep_time ? parseInt(formData.prep_time, 10) : null,
      cook_time: formData.cook_time ? parseInt(formData.cook_time, 10) : null,
      ingredients: filteredIngredients,
      steps: filteredSteps,
      notes: formData.notes.trim() || null,
    }

    if (existingRecipe) {
      const { error: updateError } = await supabase
        .from('recipes')
        .update(recipeData)
        .eq('id', existingRecipe.id)

      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return null
      }

      setSaving(false)
      return existingRecipe.id
    } else {
      const { data, error: insertError } = await supabase
        .from('recipes')
        .insert(recipeData)
        .select('id')
        .single()

      if (insertError) {
        setError(insertError.message)
        setSaving(false)
        return null
      }

      setSaving(false)
      return data.id
    }
  }, [user, formData, existingRecipe, isValid])

  return {
    formData,
    setFormData,
    updateField,
    addIngredient,
    updateIngredient,
    removeIngredient,
    moveIngredient,
    addStep,
    updateStep,
    removeStep,
    moveStep,
    save,
    saving,
    error,
    isValid,
  }
}
