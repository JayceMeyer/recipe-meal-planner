import { ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function InstacartExport() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ShoppingBag className="size-4" />
          Instacart
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send to Instacart</DialogTitle>
          <DialogDescription>
            Instacart integration is coming soon. This feature will allow you to send your grocery
            list directly to Instacart for easy ordering and delivery.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-3 text-sm text-muted-foreground">
          <p>Planned features:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>One-click export to Instacart cart</li>
            <li>Automatic ingredient matching</li>
            <li>Store selection based on location</li>
            <li>Price comparison</li>
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  )
}
