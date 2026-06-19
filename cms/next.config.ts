import { withPayload } from '@payloadcms/next/withPayload'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
  },
  // No route uses next/og or ImageResponse. Excluding its native renderer keeps
  // the Worker below Cloudflare Free's compressed bundle limit.
  outputFileTracingExcludes: {
    '*': ['node_modules/next/dist/compiled/@vercel/og/**/*'],
  },
  // Packages with Cloudflare Workers (workerd) specific code
  // Read more: https://opennext.js.org/cloudflare/howtos/workerd
  // pino/* are kept external: pino-abstract-transport require()s the `worker_threads`
  // builtin, which webpack cannot bundle. workerd (nodejs_compat) provides it at runtime.
  serverExternalPackages: ['jose', 'pg-cloudflare', 'pino', 'pino-pretty', 'pino-abstract-transport', 'thread-stream'],

  // Your Next.js config here
  webpack: (webpackConfig: any, { isServer }: { isServer: boolean }) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    // storage-r2's client component imports the plugin-cloud-storage utilities
    // barrel. That barrel also exports server-only helpers, causing webpack to
    // pull Payload's Node dependencies into the browser admin bundle.
    if (!isServer) {
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        '@payloadcms/plugin-cloud-storage/utilities$': path.resolve(
          dirname,
          'src/lib/payload-cloud-storage-client.ts',
        ),
      }
    }

    return webpackConfig
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
