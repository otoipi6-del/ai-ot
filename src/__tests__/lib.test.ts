import { describe, it, expect } from 'vitest'
import { splitIntoChunks } from '@/lib/document-processor'

describe('Document Processor', () => {
  it('splits text into chunks', () => {
    const text = 'Первое предложение. Второе предложение. Третье предложение.'
    const chunks = splitIntoChunks(text, 30, 5)
    expect(chunks.length).toBeGreaterThan(0)
    expect(chunks[0].length).toBeGreaterThan(0)
  })

  it('handles empty text', () => {
    const chunks = splitIntoChunks('', 100, 10)
    expect(chunks).toEqual([])
  })
})
