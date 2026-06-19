import GithubSlugger from 'github-slugger';

export type MediaReference = {
  alt?: string | null;
  filename?: string | null;
  mimeType?: string | null;
  url?: string | null;
};

export type DocsBlock = {
  blockType: string;
  [key: string]: unknown;
};

export type PayloadDoc = {
  title: string;
  slug: string;
  description: string;
  order: number;
  content: DocsBlock[];
};

export type PayloadSnapshot = PayloadDoc[];

export function markdownFromBlock(block: DocsBlock): string {
  switch (block.blockType) {
    case 'markdown':
      return String(block.content ?? '');
    case 'callout':
      return `> **${String(block.title ?? '')}**\n> ${String(block.content ?? '').replaceAll('\n', '\n> ')}`;
    case 'cards':
      return arrayOfRecords(block.items)
        .map((item) => `- [${String(item.title ?? '')}](${String(item.href ?? '')}) — ${String(item.description ?? '')}`)
        .join('\n');
    case 'tabs':
    case 'accordions':
    case 'steps':
      return arrayOfRecords(block.items)
        .map((item, index) => `### ${block.blockType === 'steps' ? `${index + 1}. ` : ''}${String(item.title ?? item.label ?? '')}\n\n${String(item.content ?? '')}`)
        .join('\n\n');
    case 'files':
      return `### ${String(block.folder ?? '')}\n\n${arrayOfRecords(block.files).map((item) => `- ${String(item.name ?? '')}`).join('\n')}`;
    case 'beforeAfter':
      return `### 入力\n\n${String(block.before ?? '')}\n\n### 出力\n\n${String(block.after ?? '')}`;
    case 'packageList':
      return `> **必要なLaTeXパッケージ**\n> ${String(block.content ?? '').replaceAll('\n', '\n> ')}`;
    case 'converterLink':
      return `[${String(block.label ?? '変換画面で試す')}](${String(block.href ?? 'https://convertexcel.net/convert')})`;
    case 'media': {
      const media = mediaReference(block.media);
      if (!media?.url) return '';
      return media.mimeType?.startsWith('video/')
        ? `[${String(block.caption ?? media.filename ?? '動画')}](${media.url})`
        : `![${media.alt ?? String(block.caption ?? '')}](${media.url})`;
    }
    default:
      return '';
  }
}

export function markdownFromDoc(doc: PayloadDoc): string {
  return `# ${doc.title}\n\n${doc.description}\n\n${doc.content.map(markdownFromBlock).filter(Boolean).join('\n\n')}`;
}

export function structuredData(doc: PayloadDoc) {
  const markdown = markdownFromDoc(doc);
  const slugger = new GithubSlugger();
  const headings = [...markdown.matchAll(/^## (.+)$/gm)].map((match) => ({
    id: slugger.slug(match[1]),
    content: match[1],
  }));

  return {
    headings,
    contents: [{ heading: undefined, content: markdown }],
  };
}

export function tocFromDoc(doc: PayloadDoc) {
  const slugger = new GithubSlugger();
  return doc.content.flatMap((block) =>
    [...markdownFromBlock(block).matchAll(/^(#{2,3}) (.+)$/gm)].map((match) => ({
      title: match[2],
      url: `#${slugger.slug(match[2])}`,
      depth: match[1].length,
    })),
  );
}

export function arrayOfRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object') : [];
}

export function mediaReference(value: unknown): MediaReference | null {
  return value && typeof value === 'object' ? (value as MediaReference) : null;
}
