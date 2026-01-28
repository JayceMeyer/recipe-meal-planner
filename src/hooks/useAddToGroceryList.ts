import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Ingredient, GroceryItem } from '@/types/database'
import {
  mergeIngredients,
  ingredientToGroceryIngredient,
  type GroceryIngredient,
} from '@/utils/ingredientMerge'

interface UseAddToGroceryListResult {
  adding: boolean
  error: string | null
  addIngredient: (
    listId: string,
    ingredient: Ingredient,
    recipeId: string
  ) => Promise<boolean>
  addAllIngredients: (
    listId: string,
    ingredients: Ingredient[],
    recipeId: string
  ) => Promise<boolean>
}

export function useAddToGroceryList(): UseAddToGroceryListResult {
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchExistingItems = async (listId: string): Promise<GroceryItem[]> => {
    const { data, error: fetchError } = await supabase
      .from('grocery_items')
      .select('*')
      .eq('list_id', listId)

    if (fetchError) {
      throw new Error(fetchError.message)
    }

    return data ?? []
  }

  const addIngredient = useCallback(
    async (listId: string, ingredient: Ingredient, recipeId: string): Promise<boolean> => {
      setAdding(true)
      setError(null)

      try {
        const existingItems = await fetchExistingItems(listId)
        const existingGroceryIngredients: GroceryIngredient[] = existingItems.map((item) => ({
          name: item.ingredient_name,
          quantity: item.quantity,
          unit: item.unit,
        }))

        const newIngredient = ingredientToGroceryIngredient(ingredient)
        const merged = mergeIngredients(existingGroceryIngredients, [newIngredient])

        const existingItem = existingItems.find(
          (item) => item.ingredient_name.toLowerCase() === ingredient.name.toLowerCase()
        )

        if (existingItem) {
          const mergedItem = merged.find(
            (m) => m.name.toLowerCase() === ingredient.name.toLowerCase()
          )
          const { error: updateError } = await supabase
            .from('grocery_items')
            .update({
              quantity: mergedItem?.quantity ?? existingItem.quantity,
              unit: mergedItem?.unit ?? existingItem.unit,
            })
            .eq('id', existingItem.id)

          if (updateError) {
            throw new Error(updateError.message)
          }
        } else {
          const { error: insertError } = await supabase.from('grocery_items').insert({
            list_id: listId,
            ingredient_name: ingredient.name,
            quantity: ingredient.amount || null,
            unit: ingredient.unit || null,
            source_recipe_id: recipeId,
          })

          if (insertError) {
            throw new Error(insertError.message)
          }
        }

        setAdding(false)
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add ingredient')
        setAdding(false)
        return false
      }
    },
    []
  )

  const addAllIngredients = useCallback(
    async (listId: string, ingredients: Ingredient[], recipeId: string): Promise<boolean> => {
      setAdding(true)
      setError(null)

      try {
        const existingItems = await fetchExistingItems(listId)
        const existingGroceryIngredients: GroceryIngredient[] = existingItems.map((item) => ({
          name: item.ingredient_name,
          quantity: item.quantity,
          unit: item.unit,
        }))

        const newGroceryIngredients = ingredients.map(ingredientToGroceryIngredient)
        const merged = mergeIngredients(existingGroceryIngredients, newGroceryIngredients)

        const updates: { id: string; quantity: string | null; unit: string | null }[] = []
        const inserts: {
          list_id: string
          ingredient_name: string
          quantity: string | null
          unit: string | null
          source_recipe_id: string
        }[] = []

        for (const mergedItem of merged) {
          const existingItem = existingItems.find(
            (item) => item.ingredient_name.toLowerCase() === mergedItem.name.toLowerCase()
          )

          if (existingItem) {
            if (
              existingItem.quantity !== mergedItem.quantity ||
              existingItem.unit !== mergedItem.unit
            ) {
              updates.push({
                id: existingItem.id,
                quantity: mergedItem.quantity,
                unit: mergedItem.unit,
              })
            }
          } else {
            inserts.push({
              list_id: listId,
              ingredient_name: mergedItem.name,
              quantity: mergedItem.quantity,
              unit: mergedItem.unit,
              source_recipe_id: recipeId,
            })
          }
        }

        for (const update of updates) {
          const { error: updateError } = await supabase
            .from('grocery_items')
            .update({ quantity: update.quantity, unit: update.unit })
            .eq('id', update.id)

          if (updateError) {
            throw new Error(updateError.message)
          }
        }

        if (inserts.length > 0) {
          const { error: insertError } = await supabase.from('grocery_items').insert(inserts)

          if (insertError) {
            throw new Error(insertError.message)
          }
        }

        setAdding(false)
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to add ingredients')
        setAdding(false)
        return false
      }
    },
    []
  )

  return {
    adding,
    error,
    addIngredient,
    addAllIngredients,
  }
}
