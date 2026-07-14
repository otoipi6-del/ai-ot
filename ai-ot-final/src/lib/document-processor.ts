import { supabase } from './supabase'
import { generateEmbedding } from './embedding'

// Разбить текст на чанки
export function splitIntoChunks(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    let chunkEnd = end

    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end)
      const lastNewline = text.lastIndexOf('
', end)
      const lastSpace = text.lastIndexOf(' ', end)

      if (lastPeriod > start && lastPeriod > end - 100) {
        chunkEnd = lastPeriod + 1
      } else if (lastNewline > start && lastNewline > end - 100) {
        chunkEnd = lastNewline + 1
      } else if (lastSpace > start) {
        chunkEnd = lastSpace
      }
    }

    chunks.push(text.slice(start, chunkEnd).trim())
    start = chunkEnd - overlap

    if (start >= chunkEnd) {
      start = chunkEnd
    }
  }

  return chunks.filter(chunk => chunk.length > 50)
}

// Обработка текстового документа
export async function processTextDocument(
  title: string,
  content: string,
  metadata: {
    source_url?: string
    document_type?: string
    authority?: string
    effective_date?: string
  } = {}
): Promise<string | null> {
  try {
    // 1. Сохраняем документ
    const { data: docData, error: docError } = await supabase
      .from('documents')
      .insert([{
        title,
        content,
        source_url: metadata.source_url,
        document_type: metadata.document_type || 'other',
        authority: metadata.authority,
        effective_date: metadata.effective_date,
      }])
      .select()
      .single()

    if (docError) {
      console.error('Error saving document:', docError)
      return null
    }

    const documentId = docData.id

    // 2. Разбиваем на чанки
    const chunks = splitIntoChunks(content, 1000, 200)

    // 3. Сохраняем чанки с эмбеддингами
    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i]
      const embedding = await generateEmbedding(chunkText)

      const { error: chunkError } = await supabase
        .from('document_chunks')
        .insert([{
          document_id: documentId,
          content: chunkText,
          embedding,
          metadata: {
            position: i,
            total_chunks: chunks.length,
          },
        }])

      if (chunkError) {
        console.error(`Error saving chunk ${i}:`, chunkError)
      }
    }

    return documentId
  } catch (error) {
    console.error('Error processing document:', error)
    return null
  }
}

// Удаление документа
export async function deleteDocument(documentId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (error) {
      console.error('Error deleting document:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error deleting document:', error)
    return false
  }
}
