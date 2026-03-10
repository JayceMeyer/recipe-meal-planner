import { useState, useMemo } from 'react'
import { Camera, ChevronDown, ChevronRight, FileText, Loader2, Pin, Plus, Package, Search, Save } from 'lucide-react'
import { usePantryItems } from '@/hooks/usePantryItems'
import { usePantrySuggestions } from '@/hooks/usePantrySuggestions'
import { usePantryKits } from '@/hooks/usePantryKits'
import { useCuisineSuggestions } from '@/hooks/useCuisineSuggestions'
import { PantryItem } from '@/components/PantryItem'
import { PantryKitSelector } from '@/components/PantryKitSelector'
import { SmartSuggestions } from '@/components/SmartSuggestions'
import { PantryTextImportModal } from '@/components/PantryTextImportModal'
import { PantryScanModal } from '@/components/PantryScanModal'
import { RecipeSuggestions } from '@/components/RecipeSuggestions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { categorizeIngredient, getCategoryOrder, CATEGORIES } from '@/utils/ingredientCategories'
import type { PantryItem as PantryItemType } from '@/types/database'

interface GroupedItems {
  category: string
  items: PantryItemType[]
}

export function Pantry() {
  const { items, loading, error, addItem, addItems, updateItem, deleteItem, refresh } = usePantryItems()
  const { canMake, almostMakeable, loading: suggestionsLoading } = usePantrySuggestions()
  const { kits, loading: kitsLoading, applyKit, saveAsKit } = usePantryKits()
  const { suggestions, loading: cuisineSuggestionsLoading } = useCuisineSuggestions()

  const [newItemName, setNewItemName] = useState('')
  const [newItemCategory, setNewItemCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [showStaplesOnly, setShowStaplesOnly] = useState(false)
  const [showKits, setShowKits] = useState(false)
  const [showTextImport, setShowTextImport] = useState(false)
  const [showScanImport, setShowScanImport] = useState(false)
  const [showSaveKit, setShowSaveKit] = useState(false)
  const [saveKitName, setSaveKitName] = useState('')
  const [saveKitDesc, setSaveKitDesc] = useState('')
  const [savingKit, setSavingKit] = useState(false)

  const existingNames = useMemo(
    () => new Set(items.map((i) => i.ingredient_name.toLowerCase())),
    [items],
  )

  const groups = useMemo(() => {
    const categoryMap = new Map<string, PantryItemType[]>()

    for (const item of items) {
      const category = (!item.category || item.category === 'Pantry')
        ? categorizeIngredient(item.ingredient_name)
        : item.category
      const existing = categoryMap.get(category) || []
      categoryMap.set(category, [...existing, item])
    }

    const result: GroupedItems[] = []
    for (const category of CATEGORIES) {
      const categoryItems = categoryMap.get(category)
      if (categoryItems && categoryItems.length > 0) {
        result.push({ category, items: categoryItems })
      }
    }

    const otherItems = categoryMap.get('Other')
    if (otherItems && otherItems.length > 0 && !result.some((g) => g.category === 'Other')) {
      result.push({ category: 'Other', items: otherItems })
    }

    result.sort((a, b) => getCategoryOrder(a.category) - getCategoryOrder(b.category))

    return result
  }, [items])

  const stapleCount = useMemo(() => items.filter((i) => i.is_staple).length, [items])

  const filteredGroups = useMemo(() => {
    let filtered = groups
    if (showStaplesOnly) {
      filtered = filtered
        .map((group) => ({
          ...group,
          items: group.items.filter((item) => item.is_staple),
        }))
        .filter((group) => group.items.length > 0)
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered
        .map((group) => ({
          ...group,
          items: group.items.filter((item) =>
            item.ingredient_name.toLowerCase().includes(query),
          ),
        }))
        .filter((group) => group.items.length > 0)
    }
    return filtered
  }, [groups, searchQuery, showStaplesOnly])

  const autoCategory = newItemName.trim() ? categorizeIngredient(newItemName.trim()) : ''
  const selectedCategory = newItemCategory || autoCategory

  const handleAddItem = async () => {
    if (!newItemName.trim()) return

    setAdding(true)
    await addItem(newItemName.trim(), undefined, undefined, newItemCategory || undefined)
    setAdding(false)
    setNewItemName('')
    setNewItemCategory('')
  }

  const handleApplyKit = async (kitId: string) => {
    const result = await applyKit(kitId, existingNames)
    if (result && result.added > 0) {
      await refresh()
    }
    return result
  }

  const handleBulkAdd = async (names: string[]) => {
    await addItems(names.map((name) => ({ ingredient_name: name })))
  }

  const handleSaveAsKit = async () => {
    if (!saveKitName.trim() || items.length === 0) return
    setSavingKit(true)
    const kitItems = items.map((item) => ({
      ingredient_name: item.ingredient_name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
    }))
    await saveAsKit(saveKitName.trim(), saveKitDesc.trim(), kitItems)
    setSavingKit(false)
    setShowSaveKit(false)
    setSaveKitName('')
    setSaveKitDesc('')
  }

  const toggleCategory = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="pb-8">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="container py-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold">My Pantry</h1>
              <p className="text-sm text-muted-foreground">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </p>
            </div>
            <div className="flex gap-2">
              {stapleCount > 0 && (
                <Button
                  variant={showStaplesOnly ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowStaplesOnly((v) => !v)}
                >
                  <Pin className="size-4" />
                  <span className="hidden sm:inline">Staples</span>
                  <span className="text-xs">({stapleCount})</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowKits((v) => !v)}
              >
                <Package className="size-4" />
                <span className="hidden sm:inline">Kits</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTextImport(true)}
              >
                <FileText className="size-4" />
                <span className="hidden sm:inline">Import</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowScanImport(true)}
              >
                <Camera className="size-4" />
                <span className="hidden sm:inline">Scan</span>
              </Button>
              {items.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveKit(true)}
                >
                  <Save className="size-4" />
                  <span className="hidden sm:inline">Save as Kit</span>
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Add an item..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddItem()
                }
              }}
              disabled={adding}
            />
            <Button onClick={handleAddItem} disabled={adding || !newItemName.trim()}>
              {adding ? <Loader2 className="animate-spin" /> : <Plus className="size-4" />}
            </Button>
          </div>

          {newItemName.trim() && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground shrink-0">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setNewItemCategory(e.target.value)}
                className="flex-1 h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          {items.length > 0 && (
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search pantry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
        </div>
      </div>

      <div className="container mt-4">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md mb-4">
            {error}
          </div>
        )}

        {showKits && (
          <div className="mb-6">
            <PantryKitSelector
              kits={kits}
              loading={kitsLoading}
              existingNames={existingNames}
              onApply={handleApplyKit}
            />
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="mb-6">
            <SmartSuggestions
              suggestions={suggestions}
              loading={cuisineSuggestionsLoading}
              existingNames={existingNames}
              onAdd={handleBulkAdd}
            />
          </div>
        )}

        {items.length > 0 && (
          <RecipeSuggestions
            canMake={canMake}
            almostReady={almostMakeable}
            loading={suggestionsLoading}
          />
        )}

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="size-16 text-muted-foreground/40 mb-4" />
            <h2 className="text-xl font-medium mb-2">Your pantry is empty</h2>
            <p className="text-muted-foreground mb-4">
              Add items above or use a starter kit to get going quickly.
            </p>
            {!showKits && (
              <Button variant="outline" onClick={() => setShowKits(true)}>
                <Package className="size-4" />
                Browse Starter Kits
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredGroups.map((group) => (
              <div key={group.category}>
                <button
                  onClick={() => toggleCategory(group.category)}
                  className="flex items-center gap-2 w-full text-left py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {collapsedCategories.has(group.category) ? (
                    <ChevronRight className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                  {group.category}
                  <span className="text-xs">({group.items.length})</span>
                </button>

                {!collapsedCategories.has(group.category) && (
                  <div className="border rounded-lg overflow-hidden">
                    {group.items.map((item) => (
                      <PantryItem
                        key={item.id}
                        item={item}
                        onDelete={() => deleteItem(item.id)}
                        onUpdate={(updates) => updateItem(item.id, updates)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showSaveKit} onOpenChange={setShowSaveKit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Pantry as Kit</DialogTitle>
            <DialogDescription>
              Save your current {items.length} pantry items as a reusable kit.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Kit Name</label>
              <Input
                placeholder="e.g. My Kitchen Essentials"
                value={saveKitName}
                onChange={(e) => setSaveKitName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                placeholder="What this kit is for..."
                value={saveKitDesc}
                onChange={(e) => setSaveKitDesc(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveKit(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveAsKit}
              disabled={!saveKitName.trim() || savingKit}
            >
              {savingKit ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Kit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PantryTextImportModal
        open={showTextImport}
        onOpenChange={setShowTextImport}
        existingNames={existingNames}
        onImport={async (importItems) => {
          await addItems(importItems.map((item) => ({
            ingredient_name: item.ingredient_name,
            quantity: item.quantity,
            unit: item.unit,
          })))
        }}
      />

      <PantryScanModal
        open={showScanImport}
        onOpenChange={setShowScanImport}
        existingNames={existingNames}
        onImport={async (importItems) => {
          await addItems(importItems.map((item) => ({
            ingredient_name: item.ingredient_name,
            quantity: item.quantity,
            unit: item.unit,
          })))
        }}
      />
    </div>
  )
}
