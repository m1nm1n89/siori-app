"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { supabase } from "@/lib/supabase";
import type { ShioriData } from "@/lib/types";

const uid = () => Math.random().toString(36).slice(2, 8);

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const extractUuid = (s: string) => s.match(UUID_RE)?.[0] ?? null;

export default function TopPage() {
  const router = useRouter();
  const [joinInput, setJoinInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const card: CSSProperties = {
    background: "var(--color-background-primary)",
    border: "2px dashed var(--color-border-secondary)",
    borderRadius: 16, padding: "28px 24px", textAlign: "center",
  };
  const btn = (bg: string, op = 1): CSSProperties => ({
    background: bg, color: "white", border: "none", borderRadius: 24,
    padding: "12px 28px", fontSize: 15, fontWeight: 500, cursor: "pointer", opacity: op,
  });

  const doCreate = async () => {
    setBusy(true);
    setError("");
    const id = crypto.randomUUID();
    const d: ShioriData = {
      id, title: "みんなの旅のしおり", dest: "", from: "", to: "",
      members: [], days: [{ id: uid(), label: "1日目", events: [] }], packing: [], notes: "",
    };
    const { error: err } = await supabase
      .from("shioris")
      .insert({ id, data: JSON.stringify(d) });
    if (err) {
      setError("作成に失敗しました。しばらく待ってから再試行してください。");
      setBusy(false);
      return;
    }
    router.push(`/siori/${id}`);
  };

  const doJoin = async () => {
    setError("");
    const uuid = extractUuid(joinInput);
    if (!uuid) { setError("有効なURLまたはUUIDを入力してください"); return; }
    setBusy(true);
    const { data: row } = await supabase
      .from("shioris")
      .select("id")
      .eq("id", uuid)
      .single();
    if (!row) {
      setError("しおりが見つかりませんでした😢 URLを確認してください");
      setBusy(false);
      return;
    }
    router.push(`/siori/${uuid}`);
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Hiragino Maru Gothic ProN','BIZ UDPGothic',sans-serif", background: "var(--color-background-tertiary)" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>📔</div>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 28, margin: "0 0 4px", letterSpacing: 4 }}>たびのしおり</h1>
        <p style={{ color: "var(--color-text-secondary)", fontSize: 13, margin: 0 }}>🌸 みんなで作れる旅のしおりメーカー 🌸</p>
      </div>
      <div style={{ maxWidth: 400, width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={card}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>✏️</div>
          <h2 style={{ margin: "0 0 16px", fontSize: 17 }}>あたらしく作る</h2>
          <button onClick={doCreate} disabled={busy} style={btn("#ff8f00")}>
            {busy ? "作成中..." : "しおりをつくる 🎒"}
          </button>
        </div>
        <div style={card}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔗</div>
          <h2 style={{ margin: "0 0 12px", fontSize: 17 }}>URLで参加する</h2>
          <input
            value={joinInput}
            onChange={e => setJoinInput(e.target.value)}
            placeholder="共有URLまたはUUIDを貼り付け"
            style={{ width: "100%", marginBottom: 12, fontSize: 13, boxSizing: "border-box", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--color-border-secondary)" }}
          />
          <button onClick={doJoin} disabled={busy || !joinInput} style={btn("#6d9e4e", joinInput ? 1 : 0.5)}>
            {busy ? "検索中..." : "参加する 🌸"}
          </button>
        </div>
        {error && (
          <p style={{ color: "#c62828", fontSize: 13, textAlign: "center", margin: 0, background: "#ffebee", padding: "8px 12px", borderRadius: 8 }}>
            {error}
          </p>
        )}
      </div>
      <p style={{ color: "var(--color-text-secondary)", fontSize: 11, marginTop: 24, textAlign: "center" }}>
        ⚠️ 個人情報の入力はお控えください。
      </p>
    </div>
  );
}
