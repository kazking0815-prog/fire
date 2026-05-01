"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { renderMarkdown } from "@/lib/markdown";

export default function AdvicePage() {
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const [meta, setMeta] = useState<{
    usedPhotos: number;
    records: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchAdvice() {
    setLoading(true);
    setError(null);
    setAdvice(null);
    setMeta(null);
    try {
      const res = await fetch(`/api/advice/${params.id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "AI 呼び出しに失敗しました");
        return;
      }
      setAdvice(data.advice);
      setMeta({ usedPhotos: data.usedPhotos, records: data.records });
    } catch (err) {
      setError(err instanceof Error ? err.message : "通信エラー");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Link
        href={`/plants/${params.id}`}
        className="text-sm text-leaf-600 hover:underline"
      >
        ← 戻る
      </Link>
      <h1 className="mt-2 text-2xl font-bold">🤖 AI からのアドバイス</h1>
      <p className="mt-1 text-sm text-slate-500">
        記録と最新の写真を Claude に渡して、育成方法のフィードバックをもらいます。
      </p>

      <button
        onClick={fetchAdvice}
        disabled={loading}
        className="mt-4 rounded-md bg-leaf-600 px-4 py-2 text-sm font-medium text-white hover:bg-leaf-700 disabled:opacity-50"
      >
        {loading ? "分析中... (10〜30秒ほどかかります)" : "アドバイスをもらう"}
      </button>

      {error && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {advice && (
        <div className="mt-6">
          {meta && (
            <p className="mb-3 text-xs text-slate-500">
              {meta.records} 件の記録
              {meta.usedPhotos > 0 && ` + 直近${meta.usedPhotos}枚の写真`}
              を分析
            </p>
          )}
          <article
            className="markdown rounded-lg border border-leaf-100 bg-white p-6"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(advice) }}
          />
        </div>
      )}
    </div>
  );
}
