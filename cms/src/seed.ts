import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getPayload } from 'payload'

import config from './payload.config'
import type { Doc } from './payload-types'

type SeedDoc = {
  title: string
  slug: string
  description: string
  order: number
  content: Doc['content']
}

const payload = await getPayload({ config })
const snapshotPath = path.resolve(process.cwd(), '../docs/content/payload-docs.json')
const docs = JSON.parse(await readFile(snapshotPath, 'utf8')) as SeedDoc[]

for (const doc of docs) {
  const existing = await payload.find({
    collection: 'docs',
    where: { slug: { equals: doc.slug } },
    limit: 1,
    overrideAccess: true,
  })

  const data = { ...doc, _status: 'published' as const }
  if (existing.docs[0]) {
    await payload.update({ collection: 'docs', id: existing.docs[0].id, data, draft: false, overrideAccess: true })
  } else {
    await payload.create({ collection: 'docs', data, draft: false, overrideAccess: true })
  }
}

const email = process.env.PAYLOAD_ADMIN_EMAIL
const password = process.env.PAYLOAD_ADMIN_PASSWORD
if (email && password) {
  const existing = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1, overrideAccess: true })
  if (!existing.docs[0]) await payload.create({ collection: 'users', data: { email, password }, overrideAccess: true })
}

payload.logger.info(`Seeded ${docs.length} documents.`)
process.exit(0)
