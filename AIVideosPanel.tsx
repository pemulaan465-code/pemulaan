"use client";

import { Wand2, Clock, Sparkles, Zap } from "lucide-react";

export default function AIVideosPanel() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/5 bg-gradient-to-b from-[#1a1a1d] to-[#101012] p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-900/30">
          <Wand2 className="h-8 w-8 text-white" />
        </div>
        <h2 className="mb-2 text-2xl font-black text-white">AI Videos Generator</h2>
        <p className="mx-auto max-w-md text-sm text-zinc-500">
          Fitur premium untuk generate video lengkap dari teks, mood, dan voiceover otomatis.
        </p>
        <button className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 px-6 py-3 font-bold text-black shadow-lg shadow-amber-900/30 transition hover:brightness-110">
          <Zap className="h-4 w-4" /> Unlock dengan Moods
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: Sparkles, title: "Text to Video", desc: "Jadikan ide menjadi video visual." },
          { icon: Wand2, title: "AI Avatar", desc: "Presenter virtual untuk konten Anda." },
          { icon: Clock, title: "Batch Render", desc: "Render puluhan klip sekaligus." },
        ].map((f, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-[#141416] p-5">
            <f.icon className="mb-3 h-6 w-6 text-yellow-500" />
            <h3 className="mb-1 font-semibold text-white">{f.title}</h3>
            <p className="text-xs text-zinc-500">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
