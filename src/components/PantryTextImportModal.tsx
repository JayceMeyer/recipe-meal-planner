import { useState } from 'react'
import { Loader2, Trash2, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useHousehold } from '@/contexts/HouseholdContext'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface ParsedItem {
  name: string
  quantity: string | null
  unit: string | null
  category: string | null
}

interface PantryTextImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingNames: Set<string>
  onImport: (items: { ingredient_name: string; quantity?: string; unit?: string; category?: string }[]) => Promise<void>
}

export function PantryTextImportModal({ open, onOpenChange, existingNames, onImport }: PantryTextImportModalProps) {
  const { household } = useHousehold()
  const [text, setText] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parsedItems, setParsedItems] = useState<ParsedItem[] | null>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const normalizedExisting = new Set([...existingNames].map((n) => n.toLowerCase()))

  const handleParse = async () => {
    if (!text.trim() || !household) return

    setParsing(true)
    setError(null)
    setParsedItems(null)

    const { data, error: invokeError } = await supabase.functions.invoke('parse-pantry-text', {
      body: { householdId: household.id, text: text.trim() },
    })

    setParsing(false)

    if (invokeError) {
      setError(invokeError.message)
      return
    }

    if (!data?.success) {
      setError(data?.error || 'Failed to parse text')
      return
    }

    setParsedItems(data.items as ParsedItem[])
  }

  const removeItem = (index: number) => {
    setParsedItems((prev) => prev ? prev.filter((_, i) => i !== index) : null)
  }

  const handleImport = async () => {
    if (!parsedItems || parsedItems.length === 0) return

    const newItems = parsedItems
      .filter((item) => !normalizedExisting.has(item.name.toLowerCase()))
      .map((item) => ({
        ingredient_name: item.name,
        quantity: item.quantity || undefined,
        unit: item.unit || undefined,
        category: item.category || undefined,
      }))

    if (newItems.length === 0) {
      setError('All items are already in your pantry')
      return
    }

    setImporting(true)
    await onImport(newItems)
    setImporting(false)
    onOpenChange(false)
    setText('')
    setParsedItems(null)
  }

  const newItemCount = parsedItems
    ? parsedItems.filter((item) => !normalizedExisting.has(item.name.toLowerCase())).length
    : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-5" />
            Import from Text
          </DialogTitle>
          <DialogDescription>
            Paste a grocery list, receipt text, or any list of ingredients and AI will extract them.
          </DialogDescription>
        </DialogHeader>

        {!parsedItems ? (
          <div className="space-y-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={"salt, pepper, olive oil, 2 lbs chicken\nrice, soy sauce, garlic\n1 dozen eggs, milk, butter"}
              rows={6}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleParse} disabled={parsing || !text.trim()}>
                {parsing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  'Parse Items'
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Found {parsedItems.length} items ({newItemCount} new)
            </p>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <div className="space-y-1 max-h-60 overflow-y-auto">
              {parsedItems.map((item, index) => {
                const isDuplicate = normalizedExisting.has(item.name.toLowerCase())
                return (
                  <div
                    key={index}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                      isDuplicate ? 'bg-muted text-muted-foreground line-through' : 'bg-card border'
                    }`}
                  >
                    <span className="flex-1 truncate">{item.name}</span>
                    {item.quantity && (
                      <span className="text-xs text-muted-foreground shrink-0">
                        {[item.quantity, item.unit].filter(Boolean).join(' ')}
                      </span>
                    )}
                    {item.category && (
                      <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
                        {item.category}
                      </span>
                    )}
                    {isDuplicate ? (
                      <span className="text-xs shrink-0">exists</span>
                    ) : (
                      <button
                        onClick={() => removeItem(index)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => { setParsedItems(null); setError(null) }}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={importing || newItemCount === 0}>
                {importing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  `Add ${newItemCount} Items`
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
