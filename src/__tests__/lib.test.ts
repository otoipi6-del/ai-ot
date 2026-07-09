import { describe, it, expect } from 'vitest';
import { chunkText, detectDocumentMetadata } from '@/lib/document-processor';
import { formatDate, truncate, generateId } from '@/lib/utils';

describe('Document Processor', () => {
  describe('chunkText', () => {
    it('should split text into chunks', () => {
      const text = 'This is a test. '.repeat(100);
      const chunks = chunkText(text, 100, 20);
      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].length).toBeLessThanOrEqual(100);
    });

    it('should handle empty text', () => {
      const chunks = chunkText('', 100, 20);
      expect(chunks).toEqual([]);
    });

    it('should handle text shorter than chunk size', () => {
      const text = 'Short text.';
      const chunks = chunkText(text, 1000, 200);
      expect(chunks).toEqual([text]);
    });
  });

  describe('detectDocumentMetadata', () => {
    it('should detect law document type', () => {
      const result = detectDocumentMetadata('Закон о труде', 'Текст закона...');
      expect(result.documentType).toBe('law');
    });

    it('should detect regulation document type', () => {
      const result = detectDocumentMetadata('Постановление №123', 'Текст постановления...');
      expect(result.documentType).toBe('regulation');
    });

    it('should detect authority', () => {
      const result = detectDocumentMetadata(
        'Приказ Министерства труда',
        'Текст приказа министерства труда...'
      );
      expect(result.authority).toBe('Министерство труда и социальной защиты');
    });
  });
});

describe('Utils', () => {
  describe('formatDate', () => {
    it('should format date in Russian', () => {
      const date = '2024-01-15';
      const formatted = formatDate(date);
      expect(formatted).toContain('2024');
    });
  });

  describe('truncate', () => {
    it('should truncate long text', () => {
      const text = 'This is a very long text that needs to be truncated';
      const truncated = truncate(text, 20);
      expect(truncated.endsWith('...')).toBe(true);
      expect(truncated.length).toBeLessThanOrEqual(23);
    });

    it('should not truncate short text', () => {
      const text = 'Short';
      expect(truncate(text, 20)).toBe(text);
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(id1.length).toBeGreaterThan(0);
    });
  });
});
