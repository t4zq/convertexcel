import { source } from '@/lib/source';
import type { MetadataRoute } from 'next';

const siteUrl = 'https://docs.convertexcel.net';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return source.getPages().map((page) => ({
    url: `${siteUrl}${page.url}`,
    changeFrequency: 'weekly',
    priority: page.url === '/docs' ? 1 : 0.7,
  }));
}
