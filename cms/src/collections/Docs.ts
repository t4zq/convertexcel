import type { Access, CollectionConfig, CollectionAfterChangeHook } from 'payload'

import { docsBlocks } from '../blocks'

const readPublished: Access = ({ req }) => {
  if (req.user) return true
  return { _status: { equals: 'published' } }
}

const triggerDocsBuild: CollectionAfterChangeHook = async ({ doc, previousDoc, operation }) => {
  const hookUrl = process.env.DOCS_DEPLOY_HOOK_URL
  if (!hookUrl || doc._status !== 'published') return doc
  if (operation === 'update' && previousDoc?._status === 'published' && previousDoc?.updatedAt === doc.updatedAt) return doc

  try {
    const response = await fetch(hookUrl, { method: 'POST' })
    if (!response.ok) {
      console.error(JSON.stringify({ message: 'docs deploy hook failed', status: response.status, slug: doc.slug }))
    }
  } catch (error) {
    console.error(JSON.stringify({ message: 'docs deploy hook failed', error: String(error), slug: doc.slug }))
  }
  return doc
}

export const Docs: CollectionConfig = {
  slug: 'docs',
  labels: { singular: 'ドキュメント', plural: 'ドキュメント' },
  access: {
    create: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
    read: readPublished,
    update: ({ req }) => Boolean(req.user),
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', '_status', 'order', 'updatedAt'],
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      validate: (value: unknown) =>
        typeof value === 'string' && /^(?:index|[a-z0-9]+(?:-[a-z0-9]+)*)$/.test(value)
          ? true
          : 'slugは半角英小文字・数字・ハイフンで入力してください。',
    },
    { name: 'description', type: 'textarea', required: true },
    { name: 'order', type: 'number', required: true, defaultValue: 100, index: true },
    {
      name: 'content',
      type: 'blocks',
      blocks: docsBlocks,
      required: true,
      minRows: 1,
    },
  ],
  hooks: { afterChange: [triggerDocsBuild] },
  versions: {
    drafts: {
      autosave: { interval: 800 },
      schedulePublish: true,
    },
    maxPerDoc: 30,
  },
}
