import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-1 flex-col justify-center px-6 py-20 text-center">
      <p className="mb-3 text-sm font-medium text-fd-muted-foreground">Excelから、レポートへ。</p>
      <h1 className="mb-5 text-4xl font-bold tracking-tight sm:text-5xl">converTeXcel Docs</h1>
      <p className="mx-auto mb-8 max-w-2xl text-fd-muted-foreground">
        Excelやスプレッドシートの表を、LaTeX表・TikZ/PGFPlots・gnuplot・CSVへ変換する方法を紹介します。
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link href="/docs" className="rounded-lg bg-fd-primary px-5 py-2.5 font-medium text-fd-primary-foreground">
          ドキュメントを読む
        </Link>
        <a href="https://convertexcel.net/convert" className="rounded-lg border px-5 py-2.5 font-medium">
          変換ツールを開く
        </a>
      </div>
    </div>
  );
}
