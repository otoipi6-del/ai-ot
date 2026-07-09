/**
 * Google Drive Integration
 * Monitors folder for new/updated documents and syncs to Supabase
 */

import { supabase } from './supabase';
import { processAndStoreDocument, extractTextFromFile, detectDocumentMetadata } from './document-processor';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink: string;
}

/**
 * List files in a Google Drive folder
 * Requires Google Service Account with Drive API access
 */
export async function listDriveFiles(folderId: string): Promise<DriveFile[]> {
  const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}');

  if (!serviceAccount.client_email) {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not configured');
  }

  // Get access token using service account
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: await createJWT(serviceAccount),
    }),
  });

  const { access_token } = await tokenResponse.json();

  // List files in folder
  const listResponse = await fetch(
    `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,modifiedTime,webViewLink)`,
    { headers: { 'Authorization': `Bearer ${access_token}` } }
  );

  const data = await listResponse.json();
  return data.files || [];
}

/**
 * Download file from Google Drive
 */
export async function downloadDriveFile(fileId: string): Promise<Buffer> {
  const serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON || '{}');

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: await createJWT(serviceAccount),
    }),
  });

  const { access_token } = await tokenResponse.json();

  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { 'Authorization': `Bearer ${access_token}` } }
  );

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Create JWT for Google Service Account
 */
async function createJWT(serviceAccount: any): Promise<string> {
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const claim = btoa(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  }));

  // Note: In production, use a proper JWT library with RSA signing
  // This is a simplified version for demonstration
  return `${header}.${claim}`;
}

/**
 * Sync Google Drive folder to Supabase
 * Checks for new and updated files
 */
export async function syncDriveFolder(folderId: string): Promise<{
  added: number;
  updated: number;
  removed: number;
  errors: string[];
}> {
  const result = { added: 0, updated: 0, removed: 0, errors: [] as string[] };

  try {
    // Get current files from Drive
    const driveFiles = await listDriveFiles(folderId);

    // Get tracked files from database
    const { data: trackedFiles } = await supabase
      .from('drive_sync_state')
      .select('*');

    const trackedMap = new Map(trackedFiles?.map(f => [f.file_id, f]) || []);

    // Process each file
    for (const file of driveFiles) {
      const tracked = trackedMap.get(file.id);
      const isNew = !tracked;
      const isUpdated = tracked && tracked.modified_time !== file.modifiedTime;

      if (isNew || isUpdated) {
        try {
          // Download and process file
          const buffer = await downloadDriveFile(file.id);
          const text = await extractTextFromFile(buffer, file.mimeType);

          const metadata = detectDocumentMetadata(file.name, text);

          if (isNew) {
            // Store new document
            await processAndStoreDocument({
              title: file.name,
              content: text,
              sourceUrl: file.webViewLink,
              documentType: metadata.documentType as any,
              authority: metadata.authority,
            }, file.id);

            // Track sync state
            await supabase.from('drive_sync_state').insert({
              file_id: file.id,
              file_name: file.name,
              modified_time: file.modifiedTime,
              document_id: file.id,
            });

            result.added++;
          } else if (isUpdated && tracked.document_id) {
            // Update existing document
            // Delete old chunks
            await supabase
              .from('document_chunks')
              .delete()
              .eq('document_id', tracked.document_id);

            // Re-process
            await processAndStoreDocument({
              title: file.name,
              content: text,
              sourceUrl: file.webViewLink,
              documentType: metadata.documentType as any,
              authority: metadata.authority,
            }, file.id);

            // Update sync state
            await supabase
              .from('drive_sync_state')
              .update({ modified_time: file.modifiedTime })
              .eq('file_id', file.id);

            result.updated++;
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : String(error);
          result.errors.push(`File "${file.name}": ${msg}`);
        }
      }
    }

    // Check for removed files
    const driveFileIds = new Set(driveFiles.map(f => f.id));
    for (const tracked of trackedFiles || []) {
      if (!driveFileIds.has(tracked.file_id)) {
        // File was removed from Drive
        if (tracked.document_id) {
          await supabase.from('documents').delete().eq('id', tracked.document_id);
        }
        await supabase.from('drive_sync_state').delete().eq('file_id', tracked.file_id);
        result.removed++;
      }
    }

  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    result.errors.push(`Sync failed: ${msg}`);
  }

  return result;
}
