import { loader, source as createSource } from 'fumadocs-core/source';
import { docsContentRoute, docsImageRoute, docsRoute } from './shared';
import snapshot from '../../content/payload-docs.json';
import { markdownFromDoc, structuredData, tocFromDoc, type PayloadSnapshot } from './payload-content';

const payloadDocs = (snapshot as PayloadSnapshot).toSorted((a, b) => a.order - b.order);
const payloadSource = createSource({
  metas: [{
    type: 'meta' as const,
    path: 'meta.json',
    data: { title: 'ドキュメント', pages: payloadDocs.map((doc) => doc.slug) },
  }],
  pages: payloadDocs.map((doc) => ({
    type: 'page' as const,
    path: `${doc.slug}.json`,
    slugs: doc.slug === 'index' ? [] : [doc.slug],
    data: {
      title: doc.title,
      description: doc.description,
      blocks: doc.content,
      toc: tocFromDoc(doc),
      full: false,
      markdown: markdownFromDoc(doc),
      structuredData: structuredData(doc),
    },
  })),
});

export const source = loader({
  baseUrl: docsRoute,
  source: payloadSource,
  plugins: [],
});

export function getPageImage(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'image.png'];

  return {
    segments,
    url: `${docsImageRoute}/${segments.join('/')}`,
  };
}

export function getPageMarkdownUrl(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'content.md'];

  return {
    segments,
    url: `${docsContentRoute}/${segments.join('/')}`,
  };
}

export async function getLLMText(page: (typeof source)['$inferPage']) {
  return `# ${page.data.title} (${page.url})

${page.data.markdown}`;
}
