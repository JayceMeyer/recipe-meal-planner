export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Ingredient {
  name: string
  amount: string
  unit?: string
}

export interface Step {
  order: number
  instruction: string
}

export interface Database {
  public: {
    Tables: {
      households: {
        Row: {
          id: string
          name: string
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'households_created_by_fkey'
            columns: ['created_by']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      household_members: {
        Row: {
          id: string
          household_id: string
          user_id: string
          role: 'owner' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          household_id: string
          user_id: string
          role: 'owner' | 'member'
          joined_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          user_id?: string
          role?: 'owner' | 'member'
          joined_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'household_members_household_id_fkey'
            columns: ['household_id']
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'household_members_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      household_invites: {
        Row: {
          id: string
          household_id: string
          invited_by: string | null
          email: string
          token: string
          status: 'pending' | 'accepted' | 'expired'
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          household_id: string
          invited_by?: string | null
          email: string
          token?: string
          status?: 'pending' | 'accepted' | 'expired'
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          invited_by?: string | null
          email?: string
          token?: string
          status?: 'pending' | 'accepted' | 'expired'
          created_at?: string
          expires_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'household_invites_household_id_fkey'
            columns: ['household_id']
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'household_invites_invited_by_fkey'
            columns: ['invited_by']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      recipes: {
        Row: {
          id: string
          user_id: string
          household_id: string
          title: string
          description: string | null
          image_url: string | null
          source_url: string | null
          servings: number | null
          prep_time: number | null
          cook_time: number | null
          ingredients: Ingredient[]
          steps: Step[]
          notes: string | null
          rating: number | null
          cuisine: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          household_id: string
          title: string
          description?: string | null
          image_url?: string | null
          source_url?: string | null
          servings?: number | null
          prep_time?: number | null
          cook_time?: number | null
          ingredients?: Ingredient[]
          steps?: Step[]
          notes?: string | null
          rating?: number | null
          cuisine?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          household_id?: string
          title?: string
          description?: string | null
          image_url?: string | null
          source_url?: string | null
          servings?: number | null
          prep_time?: number | null
          cook_time?: number | null
          ingredients?: Ingredient[]
          steps?: Step[]
          notes?: string | null
          rating?: number | null
          cuisine?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'recipes_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recipes_household_id_fkey'
            columns: ['household_id']
            referencedRelation: 'households'
            referencedColumns: ['id']
          }
        ]
      }
      recipe_groups: {
        Row: {
          id: string
          user_id: string
          household_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          household_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          household_id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'recipe_groups_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recipe_groups_household_id_fkey'
            columns: ['household_id']
            referencedRelation: 'households'
            referencedColumns: ['id']
          }
        ]
      }
      recipe_group_items: {
        Row: {
          group_id: string
          recipe_id: string
          added_at: string
        }
        Insert: {
          group_id: string
          recipe_id: string
          added_at?: string
        }
        Update: {
          group_id?: string
          recipe_id?: string
          added_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'recipe_group_items_group_id_fkey'
            columns: ['group_id']
            referencedRelation: 'recipe_groups'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'recipe_group_items_recipe_id_fkey'
            columns: ['recipe_id']
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          }
        ]
      }
      grocery_lists: {
        Row: {
          id: string
          user_id: string
          household_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          household_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          household_id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'grocery_lists_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'grocery_lists_household_id_fkey'
            columns: ['household_id']
            referencedRelation: 'households'
            referencedColumns: ['id']
          }
        ]
      }
      grocery_items: {
        Row: {
          id: string
          list_id: string
          ingredient_name: string
          quantity: string | null
          unit: string | null
          checked: boolean
          source_recipe_id: string | null
          category: string | null
          created_at: string
        }
        Insert: {
          id?: string
          list_id: string
          ingredient_name: string
          quantity?: string | null
          unit?: string | null
          checked?: boolean
          source_recipe_id?: string | null
          category?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          list_id?: string
          ingredient_name?: string
          quantity?: string | null
          unit?: string | null
          checked?: boolean
          source_recipe_id?: string | null
          category?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'grocery_items_list_id_fkey'
            columns: ['list_id']
            referencedRelation: 'grocery_lists'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'grocery_items_source_recipe_id_fkey'
            columns: ['source_recipe_id']
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          }
        ]
      }
      meal_plans: {
        Row: {
          id: string
          household_id: string
          user_id: string
          week_start: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          household_id: string
          user_id: string
          week_start: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          user_id?: string
          week_start?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'meal_plans_household_id_fkey'
            columns: ['household_id']
            referencedRelation: 'households'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'meal_plans_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      meal_plan_entries: {
        Row: {
          id: string
          plan_id: string
          recipe_id: string | null
          date: string
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          plan_id: string
          recipe_id?: string | null
          date: string
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          plan_id?: string
          recipe_id?: string | null
          date?: string
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'meal_plan_entries_plan_id_fkey'
            columns: ['plan_id']
            referencedRelation: 'meal_plans'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'meal_plan_entries_recipe_id_fkey'
            columns: ['recipe_id']
            referencedRelation: 'recipes'
            referencedColumns: ['id']
          }
        ]
      }
      pantry_items: {
        Row: {
          id: string
          user_id: string
          household_id: string
          ingredient_name: string
          quantity: string | null
          unit: string | null
          category: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          household_id: string
          ingredient_name: string
          quantity?: string | null
          unit?: string | null
          category?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          household_id?: string
          ingredient_name?: string
          quantity?: string | null
          unit?: string | null
          category?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'pantry_items_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'pantry_items_household_id_fkey'
            columns: ['household_id']
            referencedRelation: 'households'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type Recipe = Tables<'recipes'>
export type RecipeInsert = TablesInsert<'recipes'>
export type RecipeUpdate = TablesUpdate<'recipes'>

export type RecipeGroup = Tables<'recipe_groups'>
export type RecipeGroupInsert = TablesInsert<'recipe_groups'>
export type RecipeGroupUpdate = TablesUpdate<'recipe_groups'>

export type RecipeGroupItem = Tables<'recipe_group_items'>
export type RecipeGroupItemInsert = TablesInsert<'recipe_group_items'>

export type GroceryList = Tables<'grocery_lists'>
export type GroceryListInsert = TablesInsert<'grocery_lists'>
export type GroceryListUpdate = TablesUpdate<'grocery_lists'>

export type GroceryItem = Tables<'grocery_items'>
export type GroceryItemInsert = TablesInsert<'grocery_items'>
export type GroceryItemUpdate = TablesUpdate<'grocery_items'>

export type PantryItem = Tables<'pantry_items'>
export type PantryItemInsert = TablesInsert<'pantry_items'>
export type PantryItemUpdate = TablesUpdate<'pantry_items'>

export type Household = Tables<'households'>
export type HouseholdInsert = TablesInsert<'households'>
export type HouseholdUpdate = TablesUpdate<'households'>

export type HouseholdMember = Tables<'household_members'>
export type HouseholdMemberInsert = TablesInsert<'household_members'>

export type HouseholdInvite = Tables<'household_invites'>
export type HouseholdInviteInsert = TablesInsert<'household_invites'>

export type MealPlan = Tables<'meal_plans'>
export type MealPlanInsert = TablesInsert<'meal_plans'>
export type MealPlanUpdate = TablesUpdate<'meal_plans'>

export type MealPlanEntry = Tables<'meal_plan_entries'>
export type MealPlanEntryInsert = TablesInsert<'meal_plan_entries'>
export type MealPlanEntryUpdate = TablesUpdate<'meal_plan_entries'>

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
