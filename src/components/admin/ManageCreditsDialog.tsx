import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { CreditTransaction } from '@/types/database'

interface ManageCreditsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  householdId: string
  householdName: string
  onCreditsChanged?: () => void
}

export function ManageCreditsDialog({
  open,
  onOpenChange,
  householdId,
  householdName,
  onCreditsChanged,
}: ManageCreditsDialogProps) {
  const [balance, setBalance] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    async function fetchData() {
      setLoading(true)
      const [creditsRes, txRes] = await Promise.all([
        supabase
          .from('household_credits')
          .select('balance')
          .eq('household_id', householdId)
          .single(),
        supabase
          .from('credit_transactions')
          .select('*')
          .eq('household_id', householdId)
          .order('created_at', { ascending: false })
          .limit(20),
      ])

      setBalance(creditsRes.data?.balance ?? 0)
      setTransactions(txRes.data ?? [])
      setLoading(false)
    }

    fetchData()
  }, [open, householdId])

  const handleSubmit = async (action: 'add' | 'deduct') => {
    const numAmount = parseInt(amount, 10)
    if (isNaN(numAmount) || numAmount <= 0) return

    setSaving(true)
    setError(null)
    const rpcName = action === 'add' ? 'add_credits' : 'deduct_credits'
    const txType = action === 'add' ? 'bonus' : 'refund'

    const { data, error: rpcError } = await supabase.rpc(rpcName, {
      p_household_id: householdId,
      p_amount: numAmount,
      p_description: description || `Admin ${action}: ${numAmount} credits`,
      p_metadata: { admin_action: true },
      p_type: txType,
    })

    if (rpcError) {
      setError(rpcError.message)
      setSaving(false)
      return
    }

    if (data != null) {
      const newBalance = data as number
      if (newBalance === -1) {
        setError('Insufficient balance for this deduction.')
        setSaving(false)
        return
      }
      setBalance(newBalance)
      setAmount('')
      setDescription('')

      const { data: txData } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('household_id', householdId)
        .order('created_at', { ascending: false })
        .limit(20)

      setTransactions(txData ?? [])
      onCreditsChanged?.()
    }
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Credits</DialogTitle>
          <DialogDescription>
            {householdName} — Current balance:{' '}
            <span className="font-semibold text-foreground">
              {loading ? '...' : balance}
            </span>{' '}
            credits
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="number"
              min="1"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-28"
            />
            <Input
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => handleSubmit('add')}
              disabled={saving || !amount}
            >
              {saving ? 'Saving...' : 'Add Credits'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSubmit('deduct')}
              disabled={saving || !amount}
            >
              Deduct Credits
            </Button>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="border-t pt-3">
            <h4 className="text-sm font-medium mb-2">Recent Transactions</h4>
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No transactions yet
              </p>
            ) : (
              <div className="max-h-48 overflow-y-auto space-y-1">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between text-sm py-1"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          tx.type === 'purchase'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : tx.type === 'usage'
                              ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                              : tx.type === 'bonus'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        }`}
                      >
                        {tx.type}
                      </span>
                      <span className="truncate text-muted-foreground">
                        {tx.description ?? '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span
                        className={
                          tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }
                      >
                        {tx.amount > 0 ? '+' : ''}
                        {tx.amount}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  )
}
