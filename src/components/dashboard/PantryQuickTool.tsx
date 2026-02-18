import { useState } from 'react'
import { ChevronDown, ChevronUp, Plus, X, Loader2, Package } from 'lucide-react'
import { usePantryItems } from '@/hooks/usePantryItems'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function PantryQuickTool() {
  const { items, addItem, deleteItem } = usePantryItems()
  const [expanded, setExpanded] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    const name = inputValue.trim()
    if (!name) return

    setAdding(true)
    await addItem(name)
    setAdding(false)
    setInputValue('')
  }

  const recentItems = items.slice(-5).reverse()

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="size-5 text-primary" />
            <CardTitle className="text-base">Update Your Pantry</CardTitle>
            <span className="text-sm text-muted-foreground">
              ({items.length} {items.length === 1 ? 'item' : 'items'})
            </span>
          </div>
          {expanded ? (
            <ChevronUp className="size-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="size-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add an item..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAdd()
                }
              }}
              disabled={adding}
            />
            <Button size="sm" onClick={handleAdd} disabled={adding || !inputValue.trim()}>
              {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            </Button>
          </div>

          {recentItems.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Recent items</p>
              <div className="flex flex-wrap gap-2">
                {recentItems.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
                  >
                    {item.ingredient_name}
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
