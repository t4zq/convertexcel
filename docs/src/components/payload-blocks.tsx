'use client';

import GithubSlugger from 'github-slugger';
import { Accordion, Accordions } from 'fumadocs-ui/components/accordion';
import { Callout } from 'fumadocs-ui/components/callout';
import { Card, Cards } from 'fumadocs-ui/components/card';
import { File, Files, Folder } from 'fumadocs-ui/components/files';
import { ImageZoom } from 'fumadocs-ui/components/image-zoom';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import type { ComponentProps, ReactNode } from 'react';
import { arrayOfRecords, mediaReference, type DocsBlock } from '@/lib/payload-content';

function Markdown({ children }: { children: string }) {
  const slugger = new GithubSlugger();
  const heading = (level: 2 | 3) => {
    const Heading = level === 2 ? 'h2' : 'h3';
    return function MarkdownHeading({ children: value }: { children?: ReactNode }) {
      const text = typeof value === 'string' ? value : String(value ?? '');
      return <Heading id={slugger.slug(text)}>{value}</Heading>;
    };
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{ h2: heading(2), h3: heading(3), a: ({ href, ...props }) => <a href={href} {...props} /> }}
    >
      {children}
    </ReactMarkdown>
  );
}

function BeforeAfter({ before, after }: { before: string; after: string }) {
  return (
    <div className="my-6 grid gap-4 md:grid-cols-2">
      <section className="rounded-xl border bg-fd-card p-4"><p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fd-muted-foreground">入力</p><Markdown>{before}</Markdown></section>
      <section className="rounded-xl border bg-fd-card p-4"><p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fd-muted-foreground">出力</p><Markdown>{after}</Markdown></section>
    </div>
  );
}

function PackageList({ children }: { children: string }) {
  return <div className="my-5 rounded-xl border border-fd-primary/30 bg-fd-primary/5 px-4 py-3"><p className="mb-2 text-sm font-semibold">必要なLaTeXパッケージ</p><Markdown>{children}</Markdown></div>;
}

function DocsVideo({ caption, ...props }: ComponentProps<'video'> & { caption?: ReactNode }) {
  return <figure className="my-6 overflow-hidden rounded-xl border bg-fd-card"><video className="aspect-video w-full bg-black object-contain" controls playsInline preload="metadata" {...props} />{caption && <figcaption className="border-t px-4 py-3 text-center text-sm text-fd-muted-foreground">{caption}</figcaption>}</figure>;
}

function Block({ block }: { block: DocsBlock }) {
  const items = arrayOfRecords(block.items);
  switch (block.blockType) {
    case 'markdown': return <Markdown>{String(block.content ?? '')}</Markdown>;
    case 'callout': return <Callout type={String(block.type ?? 'info') as ComponentProps<typeof Callout>['type']} title={String(block.title ?? '')}><Markdown>{String(block.content ?? '')}</Markdown></Callout>;
    case 'cards': return <Cards>{items.map((item, index) => <Card key={index} title={String(item.title ?? '')} description={String(item.description ?? '')} href={String(item.href ?? '')} />)}</Cards>;
    case 'tabs': return <Tabs items={items.map((item) => String(item.label ?? ''))}>{items.map((item, index) => <Tab key={index}><Markdown>{String(item.content ?? '')}</Markdown></Tab>)}</Tabs>;
    case 'accordions': return <Accordions type="multiple">{items.map((item, index) => <Accordion key={index} title={String(item.title ?? '')}><Markdown>{String(item.content ?? '')}</Markdown></Accordion>)}</Accordions>;
    case 'steps': return <Steps>{items.map((item, index) => <Step key={index}><h3>{String(item.title ?? '')}</h3><Markdown>{String(item.content ?? '')}</Markdown></Step>)}</Steps>;
    case 'files': return <Files><Folder name={String(block.folder ?? '')}>{arrayOfRecords(block.files).map((file, index) => <File key={index} name={String(file.name ?? '')} />)}</Folder></Files>;
    case 'beforeAfter': return <BeforeAfter before={String(block.before ?? '')} after={String(block.after ?? '')} />;
    case 'packageList': return <PackageList>{String(block.content ?? '')}</PackageList>;
    case 'converterLink': return <a className="my-5 inline-flex rounded-lg bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground no-underline" href={String(block.href ?? 'https://convertexcel.net/convert')}>{String(block.label ?? '変換画面で試す')}</a>;
    case 'media': {
      const media = mediaReference(block.media);
      if (!media?.url) return null;
      return media.mimeType?.startsWith('video/')
        ? <DocsVideo src={media.url} caption={String(block.caption ?? '') || undefined} />
        : <figure className="my-6"><ImageZoom src={media.url} alt={media.alt ?? String(block.caption ?? '')} width={1600} height={900} />{block.caption ? <figcaption className="mt-2 text-center text-sm text-fd-muted-foreground">{String(block.caption)}</figcaption> : null}</figure>;
    }
    default: return null;
  }
}

export function PayloadBlocks({ blocks }: { blocks: DocsBlock[] }) {
  return <>{blocks.map((block, index) => <Block key={String(block.id ?? `${block.blockType}-${index}`)} block={block} />)}</>;
}
