import { generateEmbedding } from './embedding'
import { searchDocuments, logSearch } from './supabase'
import { generateResponse, getDefaultModel, getModelByName } from './ai-providers'
import { searchWeb } from './web-search'

// Разбить текст на чанки
export function splitIntoChunks(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = []
  let start = 0
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    let chunkEnd = end
    
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end)
      const lastNewline = text.lastIndexOf('\n', end)
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

// Основная функция RAG-поиска и ответа
export async function askQuestion(
  question: string,
  modelName?: string,
  useWebSearch: boolean = true
): Promise<{ content: string; sources: any[]; model_used: string; search_performed: boolean }> {
  const startTime = Date.now()
  
  try {
    // 1. Генерируем эмбеддинг вопроса
    const queryEmbedding = await generateEmbedding(question)
    
    // 2. Ищем релевантные документы в Supabase
    const searchResults = await searchDocuments(queryEmbedding, 0.6, 5)
    
    // 3. Формируем источники
    let sources: any[] = []
    
    if (searchResults.length > 0) {
      sources = searchResults.map((result: any) => ({
        title: `Документ ${result.document_id}`,
        content: result.chunk_text,
        similarity: result.similarity,
        authority: 'База знаний',
      }))
    }
    
    // 4. Если мало результатов — ищем в интернете
    if (sources.length < 2 && useWebSearch) {
      const webSources = await searchWeb(question)
      sources = [...sources, ...webSources]
    }
    
    // 5. Выбираем модель
    const modelConfig = modelName ? getModelByName(modelName) || getDefaultModel() : getDefaultModel()
    
    // 6. Генерируем ответ
    const response = await generateResponse(question, sources, modelConfig)
    
    // 7. Логируем
    const responseTime = Date.now() - startTime
    await logSearch(question, response.content, sources, response.model_used, responseTime)
    
    return {
      content: response.content,
      sources,
      model_used: response.model_used,
      search_performed: sources.length > 0,
    }
  } catch (error) {
    console.error('Error in askQuestion:', error)
    
    return {
      content: `Произошла ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}. 
      
Проверьте настройки API.`,
      sources: [],
      model_used: modelName || 'Неизвестно',
      search_performed: false,
    }
  }
}

// Прямой поиск по ключевым словам (без векторов)
export async function keywordSearch(query: string): Promise<any[]> {
  try {
    const { supabase } = await import('./supabase')
    
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
      .limit(5)
    
    if (error) {
      console.error('Keyword search error:', error)
      return []
    }
    
    return (data || []).map((doc: any) => ({
      title: doc.title,
      content: doc.content.substring(0, 500),
      similarity: 0.8,
      authority: doc.authority || 'База знаний',
      document_type: doc.document_type,
    }))
  } catch (error) {
    console.error('Keyword search error:', error)
    return []
  }
}