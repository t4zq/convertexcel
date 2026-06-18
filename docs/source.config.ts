import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { rehypeCode } from 'fumadocs-core/mdx-plugins';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

// You can customize Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: 'content/docs',
  docs: {
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkMath],
    // KaTeX must consume math nodes before Shiki sees their `language-math` class.
    rehypeCodeOptions: false,
    rehypePlugins: [rehypeKatex, rehypeCode],
  },
});
