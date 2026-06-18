import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Tab, Tabs } from 'fumadocs-ui/components/tabs';
import type { MDXComponents } from 'mdx/types';
import type { ReactNode } from 'react';

function BeforeAfter({ before, after }: { before: ReactNode; after: ReactNode }) {
  return (
    <div className="my-6 grid gap-4 md:grid-cols-2">
      <section className="rounded-xl border bg-fd-card p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fd-muted-foreground">入力</p>
        {before}
      </section>
      <section className="rounded-xl border bg-fd-card p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fd-muted-foreground">出力</p>
        {after}
      </section>
    </div>
  );
}

function PackageList({ children }: { children: ReactNode }) {
  return (
    <div className="my-5 rounded-xl border border-fd-primary/30 bg-fd-primary/5 px-4 py-3">
      <p className="mb-2 text-sm font-semibold">必要なLaTeXパッケージ</p>
      <div className="text-sm [&>p]:m-0">{children}</div>
    </div>
  );
}

function TryInConverter({ href = 'https://convertexcel.net/convert', children = '変換画面で試す' }: { href?: string; children?: ReactNode }) {
  return (
    <a className="my-5 inline-flex rounded-lg bg-fd-primary px-4 py-2 text-sm font-medium text-fd-primary-foreground no-underline" href={href}>
      {children}
    </a>
  );
}

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    Tab,
    Tabs,
    BeforeAfter,
    PackageList,
    TryInConverter,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
