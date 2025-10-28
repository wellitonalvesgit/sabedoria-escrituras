/**
 * Utilitários para trabalhar com URLs do Google Drive
 */

/**
 * Converte URL do Google Drive para formato de preview (embed)
 *
 * @param url - URL original do Google Drive
 * @returns URL formatada para embed em iframe
 *
 * @example
 * // URL de compartilhamento
 * convertToPreviewUrl('https://drive.google.com/file/d/ABC123/view?usp=sharing')
 * // Retorna: 'https://drive.google.com/file/d/ABC123/preview'
 *
 * @example
 * // URL de abertura
 * convertToPreviewUrl('https://drive.google.com/open?id=ABC123')
 * // Retorna: 'https://drive.google.com/file/d/ABC123/preview'
 */
export function convertGoogleDriveToPreview(url: string): string {
  if (!url) return url

  // Padrão 1: /file/d/{ID}/view ou /file/d/{ID}/edit
  const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileIdMatch) {
    const fileId = fileIdMatch[1]
    return `https://drive.google.com/file/d/${fileId}/preview`
  }

  // Padrão 2: /open?id={ID}
  const openIdMatch = url.match(/\/open\?id=([a-zA-Z0-9_-]+)/)
  if (openIdMatch) {
    const fileId = openIdMatch[1]
    return `https://drive.google.com/file/d/${fileId}/preview`
  }

  // Padrão 3: Google Docs
  const docsMatch = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/)
  if (docsMatch) {
    const fileId = docsMatch[1]
    return `https://docs.google.com/document/d/${fileId}/preview`
  }

  // Se já estiver no formato preview ou não for do Google Drive, retornar como está
  return url
}

/**
 * Converte URL do Google Drive para formato de download direto
 *
 * @param url - URL original do Google Drive
 * @returns URL formatada para download direto
 */
export function convertGoogleDriveToDownload(url: string): string {
  if (!url) return url

  const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileIdMatch) {
    const fileId = fileIdMatch[1]
    return `https://drive.google.com/uc?export=download&id=${fileId}`
  }

  return url
}

/**
 * Verifica se uma URL é do Google Drive
 *
 * @param url - URL para verificar
 * @returns true se for URL do Google Drive
 */
export function isGoogleDriveUrl(url: string): boolean {
  if (!url) return false

  const patterns = [
    /^https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/,
    /^https:\/\/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/,
    /^https:\/\/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/
  ]

  return patterns.some(pattern => pattern.test(url))
}

/**
 * Extrai o ID do arquivo de uma URL do Google Drive
 *
 * @param url - URL do Google Drive
 * @returns ID do arquivo ou null se não encontrado
 */
export function extractGoogleDriveFileId(url: string): string | null {
  if (!url) return null

  // Tentar extrair de /file/d/{ID}
  const fileIdMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileIdMatch) {
    return fileIdMatch[1]
  }

  // Tentar extrair de /open?id={ID}
  const openIdMatch = url.match(/\/open\?id=([a-zA-Z0-9_-]+)/)
  if (openIdMatch) {
    return openIdMatch[1]
  }

  // Tentar extrair de /document/d/{ID}
  const docsMatch = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/)
  if (docsMatch) {
    return docsMatch[1]
  }

  return null
}
