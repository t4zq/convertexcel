import { Provider } from '@/components/provider';
import type { Metadata } from 'next';
import Script from 'next/script';
import 'katex/dist/katex.min.css';
import './global.css';

const adsenseClientId = 'ca-pub-8873009775575279';

export const metadata: Metadata = {
  metadataBase: new URL('https://docs.convertexcel.net'),
  title: {
    default: 'converTeXcel Docs',
    template: '%s | converTeXcel Docs',
  },
  description: 'Excelの表をLaTeX、TikZ/PGFPlots、gnuplot、CSVへ変換するconverTeXcelのドキュメントです。',
  other: {
    'google-adsense-account': adsenseClientId,
  },
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
        <Script
          id="adsense"
          async
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
        />
      </body>
    </html>
  );
}
