import { useState } from 'react'
import { Coins, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useCredits, CREDIT_PACKS } from '@/hooks/useCredits'

function formatPrice(credits: number, markupPercent: number): string {
  const price = (credits / 100) * (1 + markupPercent / 100)
  return `$${price.toFixed(2)}`
}

interface PurchaseCreditsDialogProps {
  markupPercent?: number
}

export function PurchaseCreditsDialog({ markupPercent = 18 }: PurchaseCreditsDialogProps) {
  const { balance, purchaseCredits, error } = useCredits()
  const [purchasing, setPurchasing] = useState<string | null>(null)

  const handlePurchase = async (packId: string) => {
    setPurchasing(packId)
    await purchaseCredits(packId)
    setPurchasing(null)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Coins className="h-4 w-4 mr-2" />
          Buy credits
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Purchase AI Credits</DialogTitle>
          <DialogDescription>
            Credits are used for AI-powered features like meal planning and recipe parsing.
            {balance !== null && (
              <span className="block mt-1 font-medium text-foreground">
                Current balance: {balance} credits
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          {CREDIT_PACKS.map((pack) => (
            <button
              key={pack.id}
              disabled={purchasing !== null}
              onClick={() => handlePurchase(pack.id)}
              className="flex items-center justify-between rounded-lg border p-4 text-left hover:bg-accent transition-colors disabled:opacity-50"
            >
              <div>
                <div className="font-medium">{pack.label}</div>
                <div className="text-sm text-muted-foreground">
                  {formatPrice(pack.credits, markupPercent)}
                </div>
              </div>
              {purchasing === pack.id ? (
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              ) : (
                <Coins className="h-5 w-5 text-primary" />
              )}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
