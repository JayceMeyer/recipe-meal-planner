import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useHousehold } from '@/contexts/HouseholdContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowDownCircle, ArrowUpCircle, History } from 'lucide-react'
import type { CreditTransaction } from '@/types/database'

type FilterType = 'all' | 'purchase' | 'usage'

export function TransactionHistory() {
  const { household } = useHousehold()
  const [transactions, setTransactions] = useState<CreditTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const isMounted = useRef(true)

  const fetchTransactions = useCallback(async () => {
    if (!household) {
      setTransactions([])
      setLoading(false)
      return
    }

    setLoading(true)

    let query = supabase
      .from('credit_transactions')
      .select('*')
      .eq('household_id', household.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (filter !== 'all') {
      query = query.eq('type', filter)
    }

    const { data } = await query

    if (!isMounted.current) return

    setTransactions((data ?? []) as CreditTransaction[])
    setLoading(false)
  }, [household, filter])

  useEffect(() => {
    isMounted.current = true
    queueMicrotask(() => { fetchTransactions() })
    return () => { isMounted.current = false }
  }, [fetchTransactions])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Transaction History
        </CardTitle>
        <CardDescription>Recent credit purchases and usage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {(['all', 'purchase', 'usage'] as const).map((type) => (
            <Button
              key={type}
              variant={filter === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(type)}
            >
              {type === 'all' ? 'All' : type === 'purchase' ? 'Purchases' : 'Usage'}
            </Button>
          ))}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Loading...</p>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No transactions yet</p>
        ) : (
          <div className="divide-y">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  {tx.amount > 0 ? (
                    <ArrowDownCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <ArrowUpCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{tx.description || tx.type}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(tx.created_at)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${tx.amount > 0 ? 'text-green-600' : ''}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </p>
                  <p className="text-xs text-muted-foreground">{tx.balance_after} bal</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
