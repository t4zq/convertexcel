type GetFileKeyArgs = {
  collectionPrefix?: string
  docPrefix?: string
  filename: string
  useCompositePrefixes?: boolean
}

const sanitizePrefix = (prefix: string): string => {
  let decodedPrefix: string

  try {
    decodedPrefix = decodeURIComponent(prefix)
  } catch {
    return ''
  }

  if (/%[0-9a-f]{2}/i.test(decodedPrefix)) {
    return ''
  }

  return decodedPrefix
    .replace(/\\/g, '/')
    .split('/')
    .filter((segment) => segment !== '..' && segment !== '.')
    .join('/')
    .replace(/^\/+/, '')
    .replace(/[\x00-\x1f\x80-\x9f]/g, '')
}

const sanitizeFilename = (filename: string): string => {
  const normalized = filename.replace(/\\/g, '/')
  const basename = normalized.slice(normalized.lastIndexOf('/') + 1).replace(/[\x00-\x1f\x80-\x9f]/g, '')

  if (!basename || basename === '.' || basename === '..') {
    throw new Error('Invalid filename')
  }

  return basename
}

const joinKey = (...parts: string[]): string => parts.filter(Boolean).join('/').replace(/\/{2,}/g, '/')

// Browser-safe equivalent of the helper used by @payloadcms/storage-r2.
export const getFileKey = ({
  collectionPrefix = '',
  docPrefix = '',
  filename,
  useCompositePrefixes = false,
}: GetFileKeyArgs) => {
  const safeCollectionPrefix = sanitizePrefix(collectionPrefix)
  const safeDocPrefix = sanitizePrefix(docPrefix)
  const safeFilename = sanitizeFilename(filename)
  const fileKey = useCompositePrefixes
    ? joinKey(safeCollectionPrefix, safeDocPrefix, safeFilename)
    : joinKey(safeDocPrefix || safeCollectionPrefix, safeFilename)

  return {
    fileKey,
    sanitizedCollectionPrefix: safeCollectionPrefix,
    sanitizedDocPrefix: safeDocPrefix,
    sanitizedFilename: safeFilename,
  }
}
