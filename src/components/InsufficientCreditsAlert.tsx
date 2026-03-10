import { Link } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'

export function InsufficientCreditsAlert() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm">
      <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
      <div>
        <p className="font-medium text-destructive">Insufficient AI credits</p>
        <p className="text-muted-foreground mt-1">
          You don't have enough credits for this action.{' '}
          <Link to="/profile" className="font-medium text-primary underline underline-offset-4 hover:text-primary/80">
            Purchase more credits
          </Link>{' '}
          or add your own OpenRouter API key in settings.
        </p>
      </div>
    </div>
  )
}
