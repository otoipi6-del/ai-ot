// Google Drive интеграция (клиентская версия)
// Для полноценной работы требуется OAuth 2.0

const GOOGLE_DRIVE_API = 'https://www.googleapis.com/drive/v3'

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  webViewLink?: string
  modifiedTime?: string
}

// Получить список файлов из папки (требует OAuth)
export async function listDriveFiles(folderId: string, accessToken: string): Promise<DriveFile[]> {
  try {
    const response = await fetch(
      `${GOOGLE_DRIVE_API}/files?q='${folderId}'+in+parents&fields=files(id,name,mimeType,webViewLink,modifiedTime)`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch drive files')
    }

    const data = await response.json()
    return data.files || []
  } catch (error) {
    console.error('Google Drive error:', error)
    return []
  }
}

// Скачать файл (требует OAuth)
export async function downloadDriveFile(fileId: string, accessToken: string): Promise<Blob | null> {
  try {
    const response = await fetch(
      `${GOOGLE_DRIVE_API}/files/${fileId}?alt=media`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      throw new Error('Failed to download file')
    }

    return await response.blob()
  } catch (error) {
    console.error('Download error:', error)
    return null
  }
}

// Проверка наличия токена
export function hasGoogleAuth(): boolean {
  return !!localStorage.getItem('google_access_token')
}

// Сохранить токен
export function saveGoogleToken(token: string): void {
  localStorage.setItem('google_access_token', token)
}

// Удалить токен
export function clearGoogleToken(): void {
  localStorage.removeItem('google_access_token')
}
