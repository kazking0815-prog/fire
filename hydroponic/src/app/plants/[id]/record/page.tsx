"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

export default function NewRecordPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const res = await fetch(`/api/plants/${params.id}/records`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "保存に失敗しました");
      setSubmitting(false);
      return;
    }
    router.push(`/plants/${params.id}`);
  }

  return (
    <div>
      <Link
        href={`/plants/${params.id}`}
        className="text-sm text-leaf-600 hover:underline"
      >
        ← 戻る
      </Link>
      <h1 className="mt-2 mb-4 text-2xl font-bold">記録を追加</h1>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-lg border border-leaf-100 bg-white p-6"
      >
        <Field label="日付 *">
          <input
            type="date"
            name="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="input"
          />
        </Field>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700">
            養液の状態
          </legend>
          <div className="grid grid-cols-3 gap-3">
            <Number name="waterTempC" label="水温 (℃)" step="0.1" />
            <Number name="ph" label="pH" step="0.1" />
            <Number name="ecMs" label="EC (mS/cm)" step="0.01" />
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700">
            環境
          </legend>
          <div className="grid grid-cols-3 gap-3">
            <Number name="roomTempC" label="室温 (℃)" step="0.1" />
            <Number name="humidity" label="湿度 (%)" step="1" />
            <Number name="lightHours" label="照明時間 (h)" step="0.5" />
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700">
            生育
          </legend>
          <div className="grid grid-cols-2 gap-3">
            <Number name="heightCm" label="草丈 (cm)" step="0.1" />
            <Number name="leafCount" label="葉の枚数" step="1" />
          </div>
        </fieldset>

        <Field label="写真" hint="葉の様子・全体・気になる箇所など (任意)">
          <input
            type="file"
            name="photo"
            accept="image/*"
            className="block text-sm"
          />
        </Field>

        <Field label="メモ" hint="気付いたこと・処置・天候など (任意)">
          <textarea name="memo" rows={3} className="input" />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-leaf-600 px-4 py-2 text-sm font-medium text-white hover:bg-leaf-700 disabled:opacity-50"
        >
          {submitting ? "保存中..." : "保存する"}
        </button>
      </form>
      <style>{`
        .input {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 0.375rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
        .input:focus {
          outline: none;
          border-color: #3fa658;
          box-shadow: 0 0 0 1px #3fa658;
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

function Number({
  name,
  label,
  step,
}: {
  name: string;
  label: string;
  step: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-slate-500">{label}</span>
      <input
        name={name}
        type="number"
        step={step}
        inputMode="decimal"
        className="input"
      />
    </label>
  );
}
