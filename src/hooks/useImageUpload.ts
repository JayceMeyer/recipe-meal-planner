import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { resizeImage } from '@/utils/imageResize'

interface UseImageUploadResult {
  uploadImage: (recipeId: string, householdId: string, file: File) => Promise<string | null>
  isUploading: boolean
  error: string | null
}

export function useImageUpload(): UseImageUploadResult {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadImage = useCallback(
    async (recipeId: string, householdId: string, file: File): Promise<string | null> => {
      setIsUploading(true)
      setError(null)

      try {
        const blob = await resizeImage(file)
        const path = `${householdId}/${recipeId}.webp`

        const { error: uploadError } = await supabase.storage
          .from('recipe-images')
          .upload(path, blob, {
            contentType: 'image/webp',
            upsert: true,
          })

        if (uploadError) throw new Error(uploadError.message)

        const { data: urlData } = supabase.storage
          .from('recipe-images')
          .getPublicUrl(path)

        // Append cache-bust param so the browser fetches the new image
        const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

        const { error: updateError } = await supabase
          .from('recipes')
          .update({ image_url: publicUrl })
          .eq('id', recipeId)

        if (updateError) throw new Error(updateError.message)

        setIsUploading(false)
        return publicUrl
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to upload image')
        setIsUploading(false)
        return null
      }
    },
    [],
  )

  return { uploadImage, isUploading, error }
}
