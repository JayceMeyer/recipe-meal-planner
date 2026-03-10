import { useState, useRef } from 'react'
import { Camera, Loader2, Trash2, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useHousehold } from '@/contexts/HouseholdContext'
import { resizeImage } from '@/utils/imageResize'
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

type ScanMode = 'receipt' | 'shelf'

interface PantryScanModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  existingNames: Set<string>
  onImport: (items: { ingredient_name: string; quantity?: string; unit?: string; category?: string }[]) => Promise<void>
}

export function PantryScanModal({ open, onOpenChange, existingNames, onImport }: PantryScanModalProps) {
  const { household } = useHousehold()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [scanMode, setScanMode] = useState<ScanMode>('receipt')
  const [uploading, setUploading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [parsedItems, setParsedItems] = useState<ParsedItem[] | null>(null)
  const [importing, setImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)

  const normalizedExisting = new Set([...existingNames].map((n) => n.toLowerCase()))

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !household) return

    setError(null)
    setUploading(true)

    try {
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)

      const resized = await resizeImage(file)
      const fileName = `${household.id}/${crypto.randomUUID()}.webp`

      const { error: uploadError } = await supabase.storage
        .from('pantry-scans')
        .upload(fileName, resized, { contentType: 'image/webp' })

      if (uploadError) {
        setError(uploadError.message)
        setUploading(false)
        return
      }

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('pantry-scans')
        .createSignedUrl(fileName, 300)

      if (signedUrlError || !signedUrlData?.signedUrl) {
        setError(signedUrlError?.message || 'Failed to create signed URL')
        setUploading(false)
        return
      }

      setUploading(false)
      setScanning(true)

      const { data, error: invokeError } = await supabase.functions.invoke('scan-pantry-image', {
        body: {
          householdId: household.id,
          imageUrl: signedUrlData.signedUrl,
          mode: scanMode,
        },
      })

      setScanning(false)

      if (invokeError) {
        setError(invokeError.message)
        return
      }

      if (!data?.success) {
        setError(data?.error || 'Failed to scan image')
        return
      }

      setParsedItems(data.items as ParsedItem[])

      supabase.storage.from('pantry-scans').remove([fileName]).catch(() => {})
    } catch (err) {
      setError((err as Error).message)
      setUploading(false)
      setScanning(false)
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
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
    handleClose()
  }

  const handleClose = () => {
    onOpenChange(false)
    setParsedItems(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
    setError(null)
  }

  const newItemCount = parsedItems
    ? parsedItems.filter((item) => !normalizedExisting.has(item.name.toLowerCase())).length
    : 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="size-5" />
            Scan to Import
          </DialogTitle>
          <DialogDescription>
            Take a photo of a grocery receipt or your pantry shelf to import items.
          </DialogDescription>
        </DialogHeader>

        {!parsedItems ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={scanMode === 'receipt' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScanMode('receipt')}
                className="flex-1"
              >
                Scan Receipt
              </Button>
              <Button
                variant={scanMode === 'shelf' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScanMode('shelf')}
                className="flex-1"
              >
                Scan Shelf
                <span className="ml-1 text-[10px] rounded bg-muted px-1 py-0.5">Beta</span>
              </Button>
            </div>

            {preview && (
              <div className="rounded-lg overflow-hidden border">
                <img src={preview} alt="Scan preview" className="w-full max-h-48 object-cover" />
              </div>
            )}

            {(uploading || scanning) ? (
              <div className="flex flex-col items-center gap-2 py-8">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {uploading ? 'Uploading image...' : 'Scanning for items...'}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="h-24 border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Camera className="size-6 text-muted-foreground" />
                    <span className="text-sm">Take Photo</span>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.removeAttribute('capture')
                      fileInputRef.current.click()
                      fileInputRef.current.setAttribute('capture', 'environment')
                    }
                  }}
                >
                  <Upload className="size-4" />
                  Upload Image
                </Button>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>Cancel</Button>
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
              <Button variant="outline" onClick={() => { setParsedItems(null); setError(null); setPreview(null) }}>
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
