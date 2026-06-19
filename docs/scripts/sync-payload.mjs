import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const snapshotPath = path.resolve('content/payload-docs.json');
const apiUrl = process.env.PAYLOAD_API_URL?.replace(/\/$/, '');

if (!apiUrl) {
  JSON.parse(await readFile(snapshotPath, 'utf8'));
  console.log('PAYLOAD_API_URL is not set; using the committed Payload snapshot.');
  process.exit(0);
}

const response = await fetch(`${apiUrl}/api/docs?where[_status][equals]=published&sort=order&limit=100&depth=1`);
if (!response.ok) throw new Error(`Payload sync failed: ${response.status} ${response.statusText}`);

const payload = await response.json();
if (!payload || !Array.isArray(payload.docs)) throw new Error('Payload sync returned an invalid response.');

const snapshot = payload.docs.map(({ title, slug, description, order, content }) => ({
  title,
  slug,
  description,
  order,
  content,
}));

await writeFile(snapshotPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
console.log(`Synced ${snapshot.length} published documents from Payload.`);
