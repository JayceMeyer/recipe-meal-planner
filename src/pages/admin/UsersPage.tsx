import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useUserRole } from '@/hooks/useUserRole'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { AppRole } from '@/types/database'

interface UserRow {
  user_id: string
  role: AppRole
  created_at: string
  household_name: string | null
  recipe_count: number
  meal_plan_count: number
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const { isAdmin } = useUserRole()

  const fetchUsers = useCallback(async () => {
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('user_id, role, created_at')
      .order('created_at', { ascending: false })

    if (!roleData) {
      setLoading(false)
      return
    }

    const userIds = roleData.map((r) => r.user_id)

    const [membersRes, recipesRes, mealPlansRes] = await Promise.all([
      supabase
        .from('household_members')
        .select('user_id, households(name)')
        .in('user_id', userIds),
      supabase
        .from('recipes')
        .select('user_id')
        .in('user_id', userIds),
      supabase
        .from('meal_plans')
        .select('user_id')
        .in('user_id', userIds),
    ])

    const householdMap = new Map<string, string>()
    for (const m of membersRes.data ?? []) {
      const household = m.households as unknown as { name: string } | null
      if (household) householdMap.set(m.user_id, household.name)
    }

    const recipeCountMap = new Map<string, number>()
    for (const r of recipesRes.data ?? []) {
      recipeCountMap.set(r.user_id, (recipeCountMap.get(r.user_id) ?? 0) + 1)
    }

    const mealPlanCountMap = new Map<string, number>()
    for (const m of mealPlansRes.data ?? []) {
      mealPlanCountMap.set(m.user_id, (mealPlanCountMap.get(m.user_id) ?? 0) + 1)
    }

    const enrichedUsers: UserRow[] = roleData.map((r) => ({
      user_id: r.user_id,
      role: r.role,
      created_at: r.created_at,
      household_name: householdMap.get(r.user_id) ?? null,
      recipe_count: recipeCountMap.get(r.user_id) ?? 0,
      meal_plan_count: mealPlanCountMap.get(r.user_id) ?? 0,
    }))

    setUsers(enrichedUsers)
    setLoading(false)
  }, [])

  useEffect(() => {
    queueMicrotask(() => { fetchUsers() })
  }, [fetchUsers])

  const updateRole = async (userId: string, newRole: AppRole) => {
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq('user_id', userId)

    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.user_id === userId ? { ...u, role: newRole } : u))
      )
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users ({users.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          {users.map((user) => (
            <div key={user.user_id}>
              <button
                className="w-full flex items-center justify-between py-3 px-2 hover:bg-accent/50 rounded transition-colors text-left"
                onClick={() =>
                  setExpandedUser(
                    expandedUser === user.user_id ? null : user.user_id
                  )
                }
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.user_id.slice(0, 8)}...
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.household_name ?? 'No household'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      user.role === 'admin'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : user.role === 'moderator'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                    }`}
                  >
                    {user.role}
                  </span>
                  {expandedUser === user.user_id ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {expandedUser === user.user_id && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Joined</span>
                      <p className="font-medium">
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Household</span>
                      <p className="font-medium">
                        {user.household_name ?? 'None'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Recipes</span>
                      <p className="font-medium">{user.recipe_count}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Meal Plans</span>
                      <p className="font-medium">{user.meal_plan_count}</p>
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <span className="text-sm text-muted-foreground">
                        Change role:
                      </span>
                      {(['admin', 'moderator', 'user'] as AppRole[]).map(
                        (r) => (
                          <Button
                            key={r}
                            variant={user.role === r ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => updateRole(user.user_id, r)}
                            disabled={user.role === r}
                          >
                            {r}
                          </Button>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {users.length === 0 && (
            <p className="py-4 text-center text-muted-foreground">
              No users found
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
