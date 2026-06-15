"use client";

import { useEffect, useState } from "react";
import { Clip, getSubtitles, saveSubtitles, regenerateClip } from "@/lib/api";
import { X, Save, RefreshCw } from "lucide-react";

interface Props {
  clip: Clip;
  onClose: () => void;
}

export default function SubtitleEditor({ clip, onClose }: Props) {
  const [srt, setSrt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    getSubtitles(clip.id)
      .then((r) => setSrt(r.srt))
      .catch(() => setSrt(""))
      .finally(() => setLoading(false));
  }, [clip.id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveSubtitles(clip.id, srt);
      setMessage("Tersimpan! Menyegarkan klip...");
      await regenerateClip(clip.id);
      setMessage("Subtitle diperbarui dan klip disegarkan.");
    } catch (e: any) {
      setMessage(e.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
          <h3 className="font-semibold">Edit Subtitle</h3>
          <button onClick={onClose} className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">
          {loading ? (
            <p className="text-sm text-zinc-500">Memuat subtitle...</p>
          ) : (
            <textarea
              value={srt}
              onChange={(e) => setSrt(e.target.value)}
              className="h-80 w-full rounded-xl border border-zinc-700 bg-zinc-950 p-4 font-mono text-sm text-zinc-200 focus:border-violet-500 focus:outline-none"
              placeholder="1&#10;00:00:00,000 --> 00:00:04,000&#10;Contoh subtitle"
            />
          )}
          {message && <p className="mt-3 text-sm text-zinc-400">{message}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-800 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800"
          >
            Tutup
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-60"
          >
            {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Menyimpan..." : "Simpan & Terapkan"}
          </button>
        </div>
      </div>
    </div>
  );
}
