/**
 * Document Processing Module
 * Handles PDF, DOCX, XLSX, TXT files from Google Drive
 */

import { supabase } from './supabase';
import { generateEmbeddings } from './embedding';

export interface ProcessedDocument {
  title: string;
  content: string;
  sourceUrl?: string;
  documentType: 'law' | 'regulation' | 'explanation' | 'standard' | 'other';
  authority?: string;
  effectiveDate?: string;
}

/**
 * Chunk text into smaller pieces for embedding
 */
export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      // Keep overlap
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.floor(overlap / 5));
      currentChunk = overlapWords.join(' ') + ' ' + sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Process and store a document with embeddings
 */
export async function processAndStoreDocument(
  doc: ProcessedDocument,
  fileId?: string
): Promise<string> {
  // 1. Insert document record
  const { data: documentRecord, error: docError } = await supabase
    .from('documents')
    .insert({
      title: doc.title,
      content: doc.content,
      source_url: doc.sourceUrl,
      document_type: doc.documentType,
      authority: doc.authority,
      effective_date: doc.effectiveDate,
      chunk_count: 0,
    })
    .select()
    .single();

  if (docError) throw docError;

  const documentId = documentRecord.id;

  // 2. Chunk the content
  const chunks = chunkText(doc.content);

  // 3. Generate embeddings for all chunks
  const embeddings = await generateEmbeddings(chunks);

  // 4. Insert chunks with embeddings
  const chunkRecords = chunks.map((content, index) => ({
    document_id: documentId,
    content,
    embedding: embeddings[index],
    metadata: {
      chunk_index: index,
      total_chunks: chunks.length,
      source_file_id: fileId,
    },
  }));

  const { error: chunkError } = await supabase
    .from('document_chunks')
    .insert(chunkRecords);

  if (chunkError) throw chunkError;

  // 5. Update document with chunk count
  await supabase
    .from('documents')
    .update({ chunk_count: chunks.length })
    .eq('id', documentId);

  return documentId;
}

/**
 * Extract text from different file types
 */
export async function extractTextFromFile(
  fileBuffer: Buffer,
  mimeType: string
): Promise<string> {
  switch (mimeType) {
    case 'application/pdf':
      const pdfParse = await import('pdf-parse');
      const pdfData = await pdfParse.default(fileBuffer);
      return pdfData.text;

    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      const mammoth = await import('mammoth');
      const docxResult = await mammoth.extractRawText({ buffer: fileBuffer });
      return docxResult.value;

    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      const xlsx = await import('xlsx');
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
      let xlsxText = '';
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        xlsxText += `\n--- Лист: ${sheetName} ---\n`;
        xlsxText += xlsx.utils.sheet_to_csv(sheet);
      });
      return xlsxText;

    case 'text/plain':
      return fileBuffer.toString('utf-8');

    default:
      throw new Error(`Unsupported file type: ${mimeType}`);
  }
}

/**
 * Detect document type and authority from title/content
 */
export function detectDocumentMetadata(
  title: string,
  content: string
): { documentType: string; authority?: string } {
  const lowerTitle = title.toLowerCase();
  const lowerContent = content.substring(0, 2000).toLowerCase();

  // Detect document type
  let documentType = 'other';
  if (lowerTitle.includes('закон') || lowerTitle.includes('кодекс')) {
    documentType = 'law';
  } else if (lowerTitle.includes('постановление') || lowerTitle.includes('приказ') || lowerTitle.includes('инструкция')) {
    documentType = 'regulation';
  } else if (lowerTitle.includes('разъяснение') || lowerTitle.includes('письмо') || lowerTitle.includes('методические')) {
    documentType = 'explanation';
  } else if (lowerTitle.includes('стандарт') || lowerTitle.includes('гост') || lowerTitle.includes('санпин')) {
    documentType = 'standard';
  }

  // Detect authority
  const authorityKeywords: Record<string, string[]> = {
    'Министерство труда и социальной защиты': ['министерство труда', 'минтруда', 'государственная инспекция труда'],
    'Министерство здравоохранения': ['министерство здравоохранения', 'минздрав'],
    'Министерство строительства и архитектуры': ['министерство строительства', 'минстрой'],
    'Центр гигиены и эпидемиологии': ['центр гигиены', 'гигиена и эпидемиология'],
    'Госпромнадзор': ['госпромнадзор', 'государственный промышленный надзор'],
    'Белэнерго': ['белэнерго', 'энергонадзор'],
    'Верховный Суд РБ': ['пленум верховного суда', 'верховный суд'],
  };

  let authority: string | undefined;
  for (const [authName, keywords] of Object.entries(authorityKeywords)) {
    if (keywords.some(kw => lowerTitle.includes(kw) || lowerContent.includes(kw))) {
      authority = authName;
      break;
    }
  }

  return { documentType, authority };
}
