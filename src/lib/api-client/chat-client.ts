import { AIResponse, Source } from './types'
import { generateResponse, getDefaultModel, getModelByName } from './ai-providers'
import { searchDocuments, getDocumentChunks } from './supabase'
import { generateEmbedding } from './embedding'
import { searchWeb } from './web-search'
import { logSearch } from './supabase'

// Клиентская версия API чата (вместо server route)
export async function askQuestionClient(
  question: string,
  modelName?: string,
  useWebSearch: boolean = true
): Promise<AIResponse> {
  const startTime = Date.now()

  try {
    // 1. Генерируем эмбеддинг вопроса
    const queryEmbedding = await generateEmbedding(question)

    // 2. Ищем релевантные документы
    const searchResults = await searchDocuments(queryEmbedding, 0.6, 5)

    // 3. Формируем источники
    let sources: Source[] = []

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

    return response
  } catch (error) {
    console.error('Error in askQuestionClient:', error)

    return {
      content: `Произошла ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}. 

Проверьте настройки API ключей.`,
      sources: [],
      model_used: modelName || 'Неизвестно',
      search_performed: false,
    }
  }
}
