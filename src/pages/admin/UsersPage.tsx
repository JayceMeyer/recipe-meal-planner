import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useUserRole } from '@/hooks/useUserRole'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Key } from 'lucide-react'
import { ManageCreditsDialog } from '@/components/admin/ManageCreditsDialog'
import type { AppRole } from '@/types/database'

interface UserRow {
  user_id: string
  email: string | null
  role: AppRole
  created_at: string
  household_name: string | null
  household_id: string | null
  recipe_count: number
  meal_plan_count: number
  credit_balance: number | null
  ingredient_count: number
  has_byok: boolean
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const [creditDialog, setCreditDialog] = useState<{
    userId: string
    householdId: string
    householdName: string
  } | null>(null)
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

    const [membersRes, recipesRes, mealPlansRes, pantryRes, prefsRes, emailsRes] =
      await Promise.all([
        supabase
          .from('household_members')
          .select('user_id, household_id, households(name)')
          .in('user_id', userIds),
        supabase
          .from('recipes')
          .select('user_id')
          .in('user_id', userIds),
        supabase
          .from('meal_plans')
          .select('user_id')
          .in('user_id', userIds),
        supabase
          .from('pantry_items')
          .select('user_id')
          .in('user_id', userIds),
        supabase
          .from('user_preferences')
          .select('user_id, openrouter_api_key')
          .in('user_id', userIds),
        supabase.rpc('get_user_emails', { p_user_ids: userIds }),
      ])

    const householdMap = new Map<string, { name: string; id: string }>()
    for (const m of membersRes.data ?? []) {
      const household = m.households as unknown as { name: string } | null
      if (household) {
        householdMap.set(m.user_id, {
          name: household.name,
          id: m.household_id,
        })
      }
    }

    // Collect all household IDs and fetch credit balances
    const householdIds = [
      ...new Set(
        (membersRes.data ?? [])
          .map((m) => m.household_id)
          .filter(Boolean)
      ),
    ]

    const creditMap = new Map<string, number>()
    if (householdIds.length > 0) {
      const { data: creditsData } = await supabase
        .from('household_credits')
        .select('household_id, balance')
        .in('household_id', householdIds)

      for (const c of creditsData ?? []) {
        creditMap.set(c.household_id, c.balance)
      }
    }

    const emailMap = new Map<string, string>()
    for (const e of emailsRes.data ?? []) {
      emailMap.set(e.user_id, e.email)
    }

    const recipeCountMap = new Map<string, number>()
    for (const r of recipesRes.data ?? []) {
      recipeCountMap.set(r.user_id, (recipeCountMap.get(r.user_id) ?? 0) + 1)
    }

    const mealPlanCountMap = new Map<string, number>()
    for (const m of mealPlansRes.data ?? []) {
      mealPlanCountMap.set(
        m.user_id,
        (mealPlanCountMap.get(m.user_id) ?? 0) + 1
      )
    }

    const pantryCountMap = new Map<string, number>()
    for (const p of pantryRes.data ?? []) {
      pantryCountMap.set(
        p.user_id,
        (pantryCountMap.get(p.user_id) ?? 0) + 1
      )
    }

    const byokSet = new Set<string>()
    for (const pref of prefsRes.data ?? []) {
      if (pref.openrouter_api_key != null) {
        byokSet.add(pref.user_id)
      }
    }

    const enrichedUsers: UserRow[] = roleData.map((r) => {
      const hh = householdMap.get(r.user_id)
      return {
        user_id: r.user_id,
        email: emailMap.get(r.user_id) ?? null,
        role: r.role,
        created_at: r.created_at,
        household_name: hh?.name ?? null,
        household_id: hh?.id ?? null,
        recipe_count: recipeCountMap.get(r.user_id) ?? 0,
        meal_plan_count: mealPlanCountMap.get(r.user_id) ?? 0,
        credit_balance: hh?.id ? (creditMap.get(hh.id) ?? null) : null,
        ingredient_count: pantryCountMap.get(r.user_id) ?? 0,
        has_byok: byokSet.has(r.user_id),
      }
    })

    setUsers(enrichedUsers)
    setLoading(false)
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      fetchUsers()
    })
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
                      {user.email ?? user.user_id.slice(0, 8) + '...'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user.household_name ?? 'No household'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {user.credit_balance != null && (
                    <span className="text-xs text-muted-foreground">
                      {user.credit_balance} credits
                    </span>
                  )}
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
                  {user.has_byok && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <Key className="h-3 w-3" />
                      BYOK
                    </span>
                  )}
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
                    <div>
                      <span className="text-muted-foreground">
                        Credit Balance
                      </span>
                      <p className="font-medium">
                        {user.credit_balance != null
                          ? user.credit_balance
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Ingredients</span>
                      <p className="font-medium">{user.ingredient_count}</p>
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
                      {user.household_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-auto"
                          onClick={() =>
                            setCreditDialog({
                              userId: user.user_id,
                              householdId: user.household_id!,
                              householdName: user.household_name ?? 'Unknown',
                            })
                          }
                        >
                          Manage Credits
                        </Button>
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
      {creditDialog && (
        <ManageCreditsDialog
          open={!!creditDialog}
          onOpenChange={(open) => {
            if (!open) setCreditDialog(null)
          }}
          householdId={creditDialog.householdId}
          householdName={creditDialog.householdName}
          onCreditsChanged={fetchUsers}
        />
      )}
    </Card>
  )
}
