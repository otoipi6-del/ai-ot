import { AIResponse } from '../types'
import { supabase } from '../supabase'

// Клиентская версия API чата через Supabase Edge Function
export async function askQuestionClient(
  question: string,
  modelName?: string,
  useWebSearch: boolean = true
): Promise<AIResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('chat', {
      body: {
        message: question,
        model: modelName,
        useWebSearch,
      },
    })

    if (error) {
      console.error('Edge Function error:', error)
      return {
        content: `Ошибка сервера: ${error.message || 'Не удалось получить ответ'}.`,
        sources: [],
        model_used: modelName || 'Неизвестно',
        search_performed: false,
      }
    }

    if (!data) {
      return {
        content: 'Пустой ответ от сервера.',
        sources: [],
        model_used: modelName || 'Неизвестно',
        search_performed: false,
      }
    }

    return {
      content: data.content || data.answer || 'Пустой ответ',
      sources: data.sources || [],
      model_used: data.model_used || modelName || 'Неизвестно',
      search_performed: data.search_performed || false,
    }
  } catch (error) {
    console.error('Error in askQuestionClient:', error)
    return {
      content: `Произошла ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}.`,
      sources: [],
      model_used: modelName || 'Неизвестно',
      search_performed: false,
    }
  }
}

