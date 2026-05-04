"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewPlantPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name"),
      species: fd.get("species"),
      systemType: fd.get("systemType"),
      startDate: fd.get("startDate"),
      notes: fd.get("notes"),
    };
    const res = await fetch("/api/plants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "登録に失敗しました");
      setSubmitting(false);
      return;
    }
    const { plant } = await res.json();
    router.push(`/plants/${plant.id}`);
  }

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">植物を追加</h1>
      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-lg border border-leaf-100 bg-white p-6"
      >
        <Field label="名前 *" hint="例: 1号レタス、ベランダのバジル">
          <input
            name="name"
            required
            placeholder="お気に入りの名前で OK"
            className="input"
          />
        </Field>
        <Field label="種類 *" hint="例: リーフレタス、ミニトマト、バジル">
          <input
            name="species"
            required
            placeholder="植物の種類"
            className="input"
          />
        </Field>
        <Field label="栽培方式" hint="例: DWC, NFT, パッシブ水耕、スポンジ培地">
          <input
            name="systemType"
            placeholder="任意"
            className="input"
          />
        </Field>
        <Field label="栽培開始日 *">
          <input
            name="startDate"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="input"
          />
        </Field>
        <Field label="メモ" hint="種・養液・場所など、自由に">
          <textarea
            name="notes"
            rows={3}
            placeholder="任意"
            className="input"
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-md bg-leaf-600 px-4 py-2 text-sm font-medium text-white hover:bg-leaf-700 disabled:opacity-50"
          >
            {submitting ? "登録中..." : "登録する"}
          </button>
        </div>
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
