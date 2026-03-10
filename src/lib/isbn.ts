export interface BookMetadata {
  title: string
  author: string | null
  coverImageUrl: string | null
  publisher: string | null
  isbn: string
}

interface OpenLibraryResponse {
  [key: string]: {
    title: string
    authors?: { name: string }[]
    publishers?: { name: string }[]
    cover?: { large?: string; medium?: string; small?: string }
  }
}

interface GoogleBooksResponse {
  totalItems: number
  items?: {
    volumeInfo: {
      title: string
      authors?: string[]
      publisher?: string
      imageLinks?: { thumbnail?: string; smallThumbnail?: string }
    }
  }[]
}

export async function lookupIsbn(isbn: string): Promise<BookMetadata | null> {
  const cleaned = isbn.replace(/[-\s]/g, '')

  const result = await lookupOpenLibrary(cleaned)
  if (result) return result

  return lookupGoogleBooks(cleaned)
}

async function lookupOpenLibrary(isbn: string): Promise<BookMetadata | null> {
  try {
    const response = await fetch(
      `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`,
    )
    if (!response.ok) return null

    const data: OpenLibraryResponse = await response.json()
    const book = data[`ISBN:${isbn}`]
    if (!book) return null

    return {
      title: book.title,
      author: book.authors?.[0]?.name ?? null,
      coverImageUrl: book.cover?.large ?? book.cover?.medium ?? null,
      publisher: book.publishers?.[0]?.name ?? null,
      isbn,
    }
  } catch {
    return null
  }
}

async function lookupGoogleBooks(isbn: string): Promise<BookMetadata | null> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}&maxResults=1`,
    )
    if (!response.ok) return null

    const data: GoogleBooksResponse = await response.json()
    const vol = data.items?.[0]?.volumeInfo
    if (!vol) return null

    return {
      title: vol.title,
      author: vol.authors?.[0] ?? null,
      coverImageUrl: vol.imageLinks?.thumbnail ?? null,
      publisher: vol.publisher ?? null,
      isbn,
    }
  } catch {
    return null
  }
}
