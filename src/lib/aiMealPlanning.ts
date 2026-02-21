import type { PantryItem, Recipe, UserPreferences, MealType } from '@/types/database'
import type {
  AIMealPlanConfig,
  PantryContext,
  PantryItemContext,
  SavedRecipeContext,
  UserPreferencesContext,
  PlannedMeal,
} from '@/types/aiMealPlan'
import { getPerishabilityTier, sortByPerishability } from '@/utils/perishability'

export function buildSystemPrompt(config: AIMealPlanConfig): string {
  const daysList = config.days.join(', ')
  const mealTypesList = config.mealTypes.join(', ')

  let preserveSection = ''
  if (config.preserveExisting && config.existingMeals.length > 0) {
    const occupiedList = config.existingMeals
      .map((m) => `- ${m.date} ${m.meal_type}: ${m.title}`)
      .join('\n')

    const occupiedKeys = new Set(
      config.existingMeals.map((m) => `${m.date}|${m.meal_type}`)
    )
    const emptySlots = config.days
      .flatMap((day) =>
        config.mealTypes
          .filter((mt) => !occupiedKeys.has(`${day}|${mt}`))
          .map((mt) => `- ${day} ${mt}`)
      )

    preserveSection = `

## IMPORTANT: Existing Meals (DO NOT REPLACE)

The following slots already have meals. Do NOT plan meals for these slots:
${occupiedList}

ONLY plan meals for these empty slots:
${emptySlots.length > 0 ? emptySlots.join('\n') : '(No empty slots — do not plan any meals)'}
`
  }

  return `You are a meal planning assistant. Your job is to create a weekly meal plan that prioritizes using perishable pantry items.

## Instructions

1. First, call get_pantry_items to see what ingredients are available.
2. Then call get_saved_recipes to see the user's recipe collection.
3. Then call get_user_preferences to understand dietary restrictions and cuisine preferences.
4. Plan meals for these dates: ${daysList}
5. Plan these meal types for each day: ${mealTypesList}${preserveSection}

## Perishability Rules (CRITICAL)

You MUST prioritize ingredients by perishability:

**HIGH perishability (use first and most often):**
Produce, Dairy, Eggs, Meat, Seafood, Bakery items.
These items spoil quickly. Incorporate them into as many meals as possible, especially earlier in the week.

**MEDIUM perishability (use as secondary):**
Frozen items, Beverages.
Use these to supplement meals or for later in the week.

**LOW perishability (use as staples):**
Spices, Oils, Condiments, Baking supplies, Canned goods, Grains, Nuts & Seeds.
Use these freely as supporting ingredients but don't build meals around them when perishables are available.

## Meal Planning Rules

- NEVER suggest meals that violate the user's dietary restrictions
- Vary cuisines across the week based on user preferences
- Avoid repeating the same main protein or primary ingredient in consecutive meals
- Prefer saved recipes that use pantry items over generating new recipes
- When generating new recipes, ensure they primarily use available pantry items
- Breakfast should be lighter/quicker; dinner can be more elaborate
- Consider prep time — weekday meals should generally be faster
- Each generated recipe must include complete ingredients with amounts and full step-by-step instructions

## Output

For each meal slot, call the plan_meal tool with the complete recipe details.
After planning all meals, provide a brief summary of your reasoning, especially how you prioritized perishable items.`
}

export function buildSingleSlotPrompt(
  date: string,
  mealType: MealType,
  existingMeals: PlannedMeal[]
): string {
  const existingList = existingMeals
    .map((m) => `- ${m.date} ${m.meal_type}: ${m.recipe_title}`)
    .join('\n')

  return `You are a meal planning assistant. Suggest a single replacement meal.

## Task
Suggest a ${mealType} for ${date}.

## Already Planned Meals This Week
${existingList || 'None'}

## Rules
- Call get_pantry_items, get_saved_recipes, and get_user_preferences first
- Prioritize HIGH perishability pantry items (Produce, Dairy, Eggs, Meat, Seafood, Bakery)
- Do NOT duplicate any meal already planned this week
- Respect dietary restrictions absolutely
- Prefer saved recipes that match pantry items
- Call plan_meal with the complete recipe details`
}

export function buildPantryContext(items: PantryItem[]): PantryContext {
  const sorted = sortByPerishability(items)

  const toContext = (item: PantryItem): PantryItemContext => ({
    ingredient_name: item.ingredient_name,
    quantity: item.quantity,
    unit: item.unit,
    category: item.category,
  })

  return {
    high_perishability: sorted.filter((i) => getPerishabilityTier(i.category) === 'HIGH').map(toContext),
    medium_perishability: sorted.filter((i) => getPerishabilityTier(i.category) === 'MEDIUM').map(toContext),
    low_perishability: sorted.filter((i) => getPerishabilityTier(i.category) === 'LOW').map(toContext),
  }
}

export function buildSavedRecipesContext(recipes: Recipe[]): SavedRecipeContext[] {
  return recipes.map((r) => ({
    id: r.id,
    title: r.title,
    ingredients: r.ingredients || [],
    cuisine: r.cuisine || [],
    servings: r.servings,
    prep_time: r.prep_time,
    cook_time: r.cook_time,
  }))
}

export function buildUserPreferencesContext(prefs: UserPreferences): UserPreferencesContext {
  return {
    dietary_restrictions: prefs.dietary_restrictions || [],
    cuisine_preferences: prefs.cuisine_preferences || [],
  }
}

export const TOOL_DEFINITIONS = [
  {
    type: 'function' as const,
    function: {
      name: 'get_pantry_items',
      description:
        'Get the user\'s pantry items grouped by perishability tier. HIGH perishability items should be used first and most often.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_saved_recipes',
      description:
        'Get the user\'s saved recipe collection. Prefer using these over generating new recipes when they match available pantry items.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_user_preferences',
      description:
        'Get the user\'s dietary restrictions and cuisine preferences. Dietary restrictions must NEVER be violated.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'plan_meal',
      description:
        'Plan a single meal for a specific date and meal type. Call this once for each meal slot. If using a saved recipe, include the saved_recipe_id.',
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: 'The date for this meal in YYYY-MM-DD format',
          },
          meal_type: {
            type: 'string',
            enum: ['breakfast', 'lunch', 'dinner', 'snack'],
            description: 'The meal type',
          },
          recipe_title: {
            type: 'string',
            description: 'Name of the recipe',
          },
          description: {
            type: 'string',
            description: 'Brief description of the dish',
          },
          ingredients: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                amount: { type: 'string' },
                unit: { type: 'string' },
              },
              required: ['name', 'amount'],
            },
            description: 'Complete ingredient list with amounts',
          },
          steps: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                order: { type: 'number' },
                instruction: { type: 'string' },
              },
              required: ['order', 'instruction'],
            },
            description: 'Step-by-step cooking instructions',
          },
          servings: {
            type: 'number',
            description: 'Number of servings',
          },
          prep_time: {
            type: 'number',
            description: 'Prep time in minutes',
          },
          cook_time: {
            type: 'number',
            description: 'Cook time in minutes',
          },
          cuisine: {
            type: 'array',
            items: { type: 'string' },
            description: 'Cuisine tags (e.g., Italian, Mexican)',
          },
          source: {
            type: 'string',
            enum: ['saved', 'generated'],
            description: 'Whether this is from saved recipes or AI-generated',
          },
          saved_recipe_id: {
            type: 'string',
            description: 'The ID of the saved recipe, if source is "saved"',
          },
        },
        required: [
          'date',
          'meal_type',
          'recipe_title',
          'description',
          'ingredients',
          'steps',
          'servings',
          'prep_time',
          'cook_time',
          'cuisine',
          'source',
        ],
      },
    },
  },
]

export function handleToolCall(
  toolName: string,
  pantryContext: PantryContext,
  recipesContext: SavedRecipeContext[],
  preferencesContext: UserPreferencesContext
): string {
  switch (toolName) {
    case 'get_pantry_items':
      return JSON.stringify(pantryContext)
    case 'get_saved_recipes':
      return JSON.stringify(recipesContext)
    case 'get_user_preferences':
      return JSON.stringify(preferencesContext)
    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` })
  }
}

export function parsePlanMealCalls(
  toolCalls: Array<{ function: { name: string; arguments: string } }>
): PlannedMeal[] {
  return toolCalls
    .filter((tc) => tc.function.name === 'plan_meal')
    .map((tc) => {
      const args = JSON.parse(tc.function.arguments)
      return {
        date: args.date,
        meal_type: args.meal_type,
        recipe_title: args.recipe_title,
        description: args.description || '',
        ingredients: args.ingredients || [],
        steps: args.steps || [],
        servings: args.servings || 4,
        prep_time: args.prep_time || 0,
        cook_time: args.cook_time || 0,
        cuisine: args.cuisine || [],
        source: args.source || 'generated',
        saved_recipe_id: args.saved_recipe_id,
      } as PlannedMeal
    })
}
