import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "水耕栽培アシスタント",
  description: "育成記録を AI に分析してもらう水耕栽培アプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <header className="border-b border-leaf-100 bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="text-xl font-bold text-leaf-700">
              🌱 水耕栽培アシスタント
            </Link>
            <Link
              href="/plants/new"
              className="rounded-md bg-leaf-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-leaf-700"
            >
              + 植物を追加
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-8 text-center text-xs text-slate-400">
          Powered by Claude · Next.js
        </footer>
      </body>
    </html>
  );
}
