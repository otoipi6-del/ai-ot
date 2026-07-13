import { NextRequest, NextResponse } from 'next/server';
import { processAndStoreDocument, extractTextFromFile, detectDocumentMetadata } from '@/lib/document-processor';
import { syncDriveFolder } from '@/lib/google-drive';

/**
 * API route for manual document upload
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const documentType = formData.get('documentType') as string;
    const authority = formData.get('authority') as string;
    const effectiveDate = formData.get('effectiveDate') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'File is required' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text
    const text = await extractTextFromFile(buffer, file.type);

    // Auto-detect metadata if not provided
    let metaDocumentType = documentType || 'other';
    let metaAuthority = authority || undefined;

    if (!documentType) {
      const detected = detectDocumentMetadata(title || file.name, text);
      metaDocumentType = detected.documentType;
      metaAuthority = detected.authority;
    }

    // Process and store
    const documentId = await processAndStoreDocument({
      title: title || file.name,
      content: text,
      documentType: metaDocumentType as 'law' | 'regulation' | 'explanation' | 'standard' | 'other',
      authority: metaAuthority,
      effectiveDate: effectiveDate || undefined,
    });

    return NextResponse.json({
      success: true,
      documentId,
      title: title || file.name,
      documentType: metaDocumentType,
      authority: metaAuthority,
      contentLength: text.length,
    });

  } catch (error) {
    console.error('Ingest API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process document',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * API route for Google Drive sync
 */
export async function PUT(request: NextRequest) {
  try {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!folderId) {
      return NextResponse.json(
        { error: 'GOOGLE_DRIVE_FOLDER_ID not configured' },
        { status: 400 }
      );
    }

    const result = await syncDriveFolder(folderId);

    return NextResponse.json({
      success: true,
      ...result,
    });

  } catch (error) {
    console.error('Drive sync error:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync Google Drive',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
