import { Link } from 'react-router-dom'
import { Coins } from 'lucide-react'
import { useCredits } from '@/hooks/useCredits'

export function CreditBadge() {
  const { balance, loading, isByok } = useCredits()

  if (isByok || loading || balance === null) return null

  return (
    <Link
      to="/profile"
      className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
    >
      <Coins className="h-4 w-4" />
      <span>{balance}</span>
    </Link>
  )
}
