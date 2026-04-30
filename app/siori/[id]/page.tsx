"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { CSSProperties } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeData } from "@/lib/sanitize";
import type { ShioriData, TravelEvent } from "@/lib/types";

const uid = () => Math.random().toString(36).slice(2, 8);
const fmtDate = (d: string) =>
  d ? new Date(d + "T12:00:00").toLocaleDateString("ja-JP", { month: "long", day: "numeric" }) : "";

// ─── EditScreen ───────────────────────────────────────────────────────────────

interface EditScreenProps {
  data: ShioriData;
  onUpdate: (d: ShioriData) => void;
  onPreview: () => void;
  onCopy: () => void;
  copied: boolean;
  saving: boolean;
  shioriId: string;
}

function EditScreen({ data, onUpdate, onPreview, onCopy, copied, saving, shioriId }: EditScreenProps) {
  const [tab, setTab] = useState("basic");
  const upd = (d: ShioriData) => onUpdate(d);
  const inp: CSSProperties = { width: "100%", boxSizing: "border-box", borderRadius: 8, fontSize: 14, padding: "8px 12px" };
  const lbl: CSSProperties = { fontSize: 12, color: "var(--color-text-secondary)", fontWeight: 500, display: "block", marginBottom: 4 };
  const btn = (bg: string, op = 1): CSSProperties => ({
    background: bg, color: "white", border: "none", borderRadius: 20,
    padding: "8px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", opacity: op,
  });
  const TABS: [string, string][] = [
    ["basic", "📋 基本情報"], ["schedule", "📅 スケジュール"],
    ["packing", "🎒 持ち物"], ["notes", "📝 メモ"],
  ];

  const addEvent = (dayId: string) => {
    upd({ ...data, days: data.days.map(d => d.id === dayId ? { ...d, events: [...d.events, { id: uid(), time: "", transport: "🚌", place: "", activity: "" }] } : d) });
  };
  const updEv = (dayId: string, evId: string, field: keyof TravelEvent, val: string) => {
    upd({ ...data, days: data.days.map(d => d.id === dayId ? { ...d, events: d.events.map(e => e.id === evId ? { ...e, [field]: val } : e) } : d) });
  };
  const rmEv = (dayId: string, evId: string) => {
    upd({ ...data, days: data.days.map(d => d.id === dayId ? { ...d, events: d.events.filter(e => e.id !== evId) } : d) });
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-background-tertiary)", fontFamily: "'Hiragino Maru Gothic ProN','BIZ UDPGothic',sans-serif", padding: 16 }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 22 }}>📔</span>
            <input value={data.title} onChange={e => upd({ ...data, title: e.target.value })} style={{ fontFamily: "var(--font-serif)", fontSize: 16, fontWeight: 500, border: "none", borderBottom: "2px dashed var(--color-border-secondary)", borderRadius: 0, padding: "4px 0", background: "transparent", width: "100%", boxSizing: "border-box" }} />
          </div>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button onClick={onCopy} style={btn(copied ? "#6d9e4e" : "#5b8dc9")}>{copied ? "✅ コピー済" : "🔗 シェア"}</button>
            <button onClick={onPreview} style={btn("#ff8f00")}>👁 プレビュー</button>
          </div>
        </div>
        <div style={{ background: "var(--color-background-warning)", border: "1px solid var(--color-border-tertiary)", borderRadius: 8, padding: "6px 12px", marginBottom: 12, fontSize: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ color: "var(--color-text-warning)" }}>🔑 ID: <strong style={{ letterSpacing: 1, fontSize: 11 }}>{shioriId}</strong></span>
          <span style={{ color: "var(--color-text-secondary)" }}>— URLをシェアしてみんなで編集できます</span>
          {saving && <span style={{ marginLeft: "auto", color: "var(--color-text-secondary)", fontSize: 11 }}>保存中...</span>}
        </div>
        <div style={{ display: "flex", gap: 3, overflowX: "auto" }}>
          {TABS.map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{ background: tab === key ? "#ff8f00" : "var(--color-background-secondary)", color: tab === key ? "white" : "var(--color-text-secondary)", border: "1px solid var(--color-border-tertiary)", borderBottom: tab === key ? "1px solid #ff8f00" : "none", borderRadius: "10px 10px 0 0", padding: "8px 14px", fontSize: 12, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>{label}</button>
          ))}
        </div>
        <div style={{ background: "var(--color-background-primary)", border: "1px solid var(--color-border-tertiary)", borderRadius: "0 12px 12px 12px", padding: 20, minHeight: 300 }}>
          {tab === "basic" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={lbl}>🗺️ 行き先</label><input value={data.dest} onChange={e => upd({ ...data, dest: e.target.value })} placeholder="例：京都・奈良" style={inp} /></div>
              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}><label style={lbl}>📅 出発日</label><input type="date" value={data.from} onChange={e => upd({ ...data, from: e.target.value })} style={inp} /></div>
                <div style={{ flex: 1 }}><label style={lbl}>📅 帰着日</label><input type="date" value={data.to} onChange={e => upd({ ...data, to: e.target.value })} style={inp} /></div>
              </div>
              <div>
                <label style={lbl}>👥 メンバー</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                  {data.members.map(m => (
                    <span key={m.id} style={{ background: "var(--color-background-warning)", border: "1px solid var(--color-border-tertiary)", borderRadius: 16, padding: "4px 12px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                      <span>{m.name}</span>
                      <button onClick={() => upd({ ...data, members: data.members.filter(mb => mb.id !== m.id) })} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 12, padding: 0 }}>✕</button>
                    </span>
                  ))}
                </div>
                <button onClick={() => { const n = prompt("メンバーの名前を入力"); if (n?.trim()) upd({ ...data, members: [...data.members, { id: uid(), name: n.trim() }] }); }} style={btn("#bcaaa4")}>＋ メンバー追加</button>
              </div>
            </div>
          )}
          {tab === "schedule" && (
            <div>
              {data.days.map(day => (
                <div key={day.id} style={{ marginBottom: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ background: "#ff8f00", color: "white", borderRadius: 12, padding: "2px 10px", fontSize: 13, fontWeight: 500 }}>📅</span>
                    <input value={day.label} onChange={e => upd({ ...data, days: data.days.map(d => d.id === day.id ? { ...d, label: e.target.value } : d) })} style={{ ...inp, width: 90, fontSize: 13 }} />
                  </div>
                  {day.events.map(ev => (
                    <div key={ev.id} style={{ display: "flex", gap: 5, marginBottom: 8, alignItems: "center", background: "var(--color-background-secondary)", border: "1px solid var(--color-border-tertiary)", borderRadius: 8, padding: 8 }}>
                      <input value={ev.time} onChange={e => updEv(day.id, ev.id, "time", e.target.value)} placeholder="9:00" style={{ ...inp, width: 50, textAlign: "center", fontSize: 13, padding: "6px 4px" }} />
                      <select value={ev.transport} onChange={e => updEv(day.id, ev.id, "transport", e.target.value)} style={{ border: "1px solid var(--color-border-secondary)", borderRadius: 6, padding: "5px 2px", fontSize: 18, background: "var(--color-background-primary)", cursor: "pointer" }}>
                        {["🚌", "🚃", "🚅", "✈️", "🚶", "⛴️", "🚗", "🏫", "🎡", "🏯"].map(t => <option key={t}>{t}</option>)}
                      </select>
                      <input value={ev.place} onChange={e => updEv(day.id, ev.id, "place", e.target.value)} placeholder="場所" style={{ ...inp, flex: 1, fontSize: 13, padding: "6px 8px" }} />
                      <input value={ev.activity} onChange={e => updEv(day.id, ev.id, "activity", e.target.value)} placeholder="内容" style={{ ...inp, flex: 2, fontSize: 13, padding: "6px 8px" }} />
                      <button onClick={() => rmEv(day.id, ev.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 15, padding: "0 4px" }}>🗑</button>
                    </div>
                  ))}
                  <button onClick={() => addEvent(day.id)} style={{ background: "var(--color-background-secondary)", color: "var(--color-text-secondary)", border: "1px solid var(--color-border-secondary)", borderRadius: 20, padding: "6px 14px", fontSize: 12, cursor: "pointer" }}>＋ 行程を追加</button>
                </div>
              ))}
              <button onClick={() => upd({ ...data, days: [...data.days, { id: uid(), label: `${data.days.length + 1}日目`, events: [] }] })} style={btn("#6d9e4e")}>＋ 日を追加</button>
            </div>
          )}
          {tab === "packing" && (
            <div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {data.packing.length === 0 && <p style={{ color: "var(--color-text-secondary)", textAlign: "center", fontSize: 14 }}>まだ何もありません 📦</p>}
                {data.packing.map(p => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--color-background-secondary)", border: "1px solid var(--color-border-tertiary)", borderRadius: 8, padding: "10px 12px" }}>
                    <input type="checkbox" checked={p.checked} onChange={e => upd({ ...data, packing: data.packing.map(i => i.id === p.id ? { ...i, checked: e.target.checked } : i) })} style={{ width: 18, height: 18, cursor: "pointer", accentColor: "#6d9e4e" }} />
                    <span style={{ flex: 1, fontSize: 14, textDecoration: p.checked ? "line-through" : "none", color: p.checked ? "var(--color-text-secondary)" : "var(--color-text-primary)" }}>{p.item}</span>
                    <button onClick={() => upd({ ...data, packing: data.packing.filter(i => i.id !== p.id) })} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", fontSize: 13 }}>✕</button>
                  </div>
                ))}
              </div>
              <button onClick={() => { const it = prompt("持ち物を入力"); if (it?.trim()) upd({ ...data, packing: [...data.packing, { id: uid(), item: it.trim(), checked: false }] }); }} style={btn("#5b8dc9")}>＋ 持ち物を追加</button>
            </div>
          )}
          {tab === "notes" && (
            <div>
              <div style={{ marginBottom: 10 }}>
                <label style={lbl}>✏️ メモ・約束ごと</label>
              </div>
              <textarea value={data.notes} onChange={e => upd({ ...data, notes: e.target.value })} placeholder="旅の心得、注意事項、楽しみ方などを書こう！" style={{ ...inp, minHeight: 200, resize: "vertical", lineHeight: 1.8 }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PreviewScreen ────────────────────────────────────────────────────────────

interface PreviewScreenProps {
  data: ShioriData;
  onBack: () => void;
  onCopy: () => void;
  copied: boolean;
}

function PreviewScreen({ data, onBack, onCopy, copied }: PreviewScreenProps) {
  const btn = (bg: string): CSSProperties => ({ background: bg, color: "white", border: "none", borderRadius: 24, padding: "10px 20px", cursor: "pointer", fontWeight: 500 });
  const sec = (): CSSProperties => ({ background: "var(--color-background-primary)", border: "1.5px solid var(--color-border-tertiary)", borderRadius: 12, padding: "16px 20px", marginBottom: 12 });
  const h2s = (color: string): CSSProperties => ({ color, fontFamily: "var(--font-serif)", fontSize: 17, margin: "0 0 12px", borderBottom: "1px dashed var(--color-border-tertiary)", paddingBottom: 8 });

  return (
    <div style={{ background: "var(--color-background-tertiary)", minHeight: "100vh", padding: 16, fontFamily: "'Hiragino Maru Gothic ProN','BIZ UDPGothic',sans-serif" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 20, justifyContent: "center", flexWrap: "wrap" }}>
        <button onClick={onBack} style={{ ...btn("var(--color-background-secondary)"), color: "var(--color-text-primary)", border: "1px solid var(--color-border-secondary)" }}>← 編集に戻る</button>
        <button onClick={onCopy} style={btn(copied ? "#6d9e4e" : "#5b8dc9")}>{copied ? "✅ コピー済" : "🔗 URLをシェア"}</button>
        <button onClick={() => window.print()} style={btn("#ff8f00")}>🖨 印刷</button>
      </div>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <div style={{ background: "var(--color-background-primary)", border: "3px solid var(--color-border-primary)", borderRadius: 16, padding: "36px 24px", textAlign: "center", marginBottom: 16, position: "relative" }}>
          {([ ["top", "left", "🌸"], ["top", "right", "⭐"], ["bottom", "left", "🎵"], ["bottom", "right", "📸"] ] as [string, string, string][]).map(([v, h, e], i) => (
            <div key={i} style={{ position: "absolute", [v]: 10, [h]: 10, fontSize: 16, opacity: 0.5 }}>{e}</div>
          ))}
          <div style={{ fontSize: 52, marginBottom: 8 }}>📔</div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 26, margin: "0 0 8px", letterSpacing: 3 }}>{data.title || "旅のしおり"}</h1>
          {data.dest && <p style={{ fontSize: 18, color: "var(--color-text-secondary)", margin: "8px 0" }}>✈️ {data.dest}</p>}
          {(data.from || data.to) && <p style={{ fontSize: 14, color: "var(--color-text-secondary)", margin: "8px 0", borderTop: "1px dashed var(--color-border-tertiary)", paddingTop: 10, marginTop: 12 }}>📅 {fmtDate(data.from)}{data.from && data.to ? " 〜 " : ""}{fmtDate(data.to)}</p>}
          {data.members.length > 0 && <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "8px 0" }}>👥 {data.members.map(m => m.name).join("・")}</p>}
        </div>
        {data.days.filter(d => d.events.length > 0).map(day => (
          <div key={day.id} style={sec()}>
            <h2 style={h2s("#ff8f00")}>📅 {day.label}</h2>
            {day.events.map(ev => (
              <div key={ev.id} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                <span style={{ color: "var(--color-text-secondary)", fontSize: 12, minWidth: 40, fontFamily: "monospace", paddingTop: 3 }}>{ev.time}</span>
                <span style={{ fontSize: 18, lineHeight: 1.2 }}>{ev.transport}</span>
                <div>
                  {ev.place && <div style={{ fontWeight: 500, fontSize: 14 }}>{ev.place}</div>}
                  {ev.activity && <div style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>{ev.activity}</div>}
                </div>
              </div>
            ))}
          </div>
        ))}
        {data.packing.length > 0 && (
          <div style={sec()}>
            <h2 style={h2s("#6d9e4e")}>🎒 持ち物リスト</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
              {data.packing.map(p => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 15 }}>{p.checked ? "☑️" : "☐"}</span>
                  <span style={{ fontSize: 13, textDecoration: p.checked ? "line-through" : "none", color: p.checked ? "var(--color-text-secondary)" : "var(--color-text-primary)" }}>{p.item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {data.notes && (
          <div style={sec()}>
            <h2 style={h2s("#9c6cb7")}>📝 メモ・約束ごと</h2>
            <p style={{ fontSize: 14, lineHeight: 1.9, whiteSpace: "pre-wrap", margin: 0 }}>{data.notes}</p>
          </div>
        )}
        <div style={{ textAlign: "center", color: "var(--color-text-secondary)", fontSize: 11, padding: "16px 0" }}>✏️ たびのしおりメーカーで作成 ✏️</div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ShioriPage() {
  const { id } = useParams<{ id: string }>();
  const [screen, setScreen] = useState<"edit" | "preview">("edit");
  const [data, setData] = useState<ShioriData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaveTime = useRef(0);

  // 初期ロード
  useEffect(() => {
    supabase
      .from("shioris")
      .select("data")
      .eq("id", id)
      .single()
      .then(({ data: row, error }) => {
        if (error || !row) { setNotFound(true); }
        else { setData(JSON.parse(row.data as string)); }
        setLoading(false);
      });
  }, [id]);

  // リアルタイム購読
  useEffect(() => {
    const ch = supabase
      .channel(`shiori-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "shioris", filter: `id=eq.${id}` },
        (payload) => {
          // 自分の保存直後のエコーバックは無視
          if (Date.now() - lastSaveTime.current > 1500) {
            setData(JSON.parse((payload.new as { data: string }).data));
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id]);

  // デバウンス保存（600ms）
  const scheduleSave = useCallback((d: ShioriData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    setSaving(true);
    saveTimer.current = setTimeout(async () => {
      lastSaveTime.current = Date.now();
      await supabase
        .from("shioris")
        .update({ data: JSON.stringify(sanitizeData(d)) })
        .eq("id", d.id);
      setSaving(false);
    }, 600);
  }, []);

  const upd = useCallback((d: ShioriData) => {
    setData(d);
    scheduleSave(d);
  }, [scheduleSave]);

  const doCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const center: CSSProperties = {
    minHeight: "100vh", display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center", gap: 16,
    fontFamily: "'Hiragino Maru Gothic ProN','BIZ UDPGothic',sans-serif",
    background: "var(--color-background-tertiary)",
  };

  if (loading) return (
    <div style={center}>
      <div style={{ fontSize: 48 }}>📔</div>
      <p style={{ color: "var(--color-text-secondary)" }}>読み込み中...</p>
    </div>
  );

  if (notFound) return (
    <div style={center}>
      <div style={{ fontSize: 48 }}>🔍</div>
      <p style={{ fontWeight: 500 }}>しおりが見つかりませんでした</p>
      <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>URLが正しいか確認してください</p>
      <Link href="/" style={{ color: "#5b8dc9", fontSize: 14 }}>← トップに戻る</Link>
    </div>
  );

  if (!data) return null;

  if (screen === "preview") return (
    <PreviewScreen data={data} onBack={() => setScreen("edit")} onCopy={doCopy} copied={copied} />
  );

  return (
    <EditScreen
      data={data}
      onUpdate={upd}
      onPreview={() => setScreen("preview")}
      onCopy={doCopy}
      copied={copied}
      saving={saving}
      shioriId={id}
    />
  );
}
