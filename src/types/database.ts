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
      recipes: {
        Row: {
          id: string
          user_id: string
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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
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
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
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
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'recipes_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      recipe_groups: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
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
