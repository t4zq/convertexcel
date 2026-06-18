import { Provider } from '@/components/provider';
import type { Metadata } from 'next';
import 'katex/dist/katex.min.css';
import './global.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://docs.convertexcel.net'),
  title: {
    default: 'converTeXcel Docs',
    template: '%s | converTeXcel Docs',
  },
  description: 'Excelの表をLaTeX、TikZ/PGFPlots、gnuplot、CSVへ変換するconverTeXcelのドキュメントです。',
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
