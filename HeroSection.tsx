"use client";

import { useState, useRef } from "react";
import { Link, Upload, Play, Music } from "lucide-react";

interface Props {
  onUpload: (file: File) => void;
  uploading: boolean;
}

export default function HeroSection({ onUpload, uploading }: Props) {
  const [link, setLink] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) onUpload(e.target.files[0]);
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-b from-[#1a1a1d] to-[#101012] p-8 text-center md:p-12">
      {/* Background glow */}
      <div className="pointer-events-none absolute -top-20 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-500/10 blur-[80px]" />

      {/* Crown Icon */}
      <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl" />
        <svg viewBox="0 0 100 80" className="relative h-20 w-20 drop-shadow-2xl">
          <defs>
            <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fde047" />
              <stop offset="50%" stopColor="#facc15" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>
          </defs>
          <path
            d="M10 55 L10 25 Q10 15 20 20 L30 40 L45 5 Q50 -5 55 5 L70 40 L80 20 Q90 15 90 25 L90 55 Q90 70 75 70 L25 70 Q10 70 10 55Z"
            fill="url(#crownGrad)"
          />
        </svg>
      </div>

      <h1 className="mb-2 text-3xl font-black text-white md:text-4xl">
        Satu Video, Puluhan Klip Viral!
      </h1>
      <p className="mb-8 text-sm text-zinc-500 md:text-base">
        Upload video atau tempel link YouTube, AI otomatis membuat klip siap viral.
      </p>

      {/* Input row */}
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 sm:flex-row">
        <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 focus-within:border-yellow-500/50">
          <Link className="h-5 w-5 text-zinc-500" />
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://www.youtube.com/watch?..."
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
          />
        </div>
        <button className="w-full rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-500 px-6 py-3.5 text-sm font-bold text-black shadow-lg shadow-amber-900/30 transition hover:brightness-110 sm:w-auto">
          Masukkan Link Video
        </button>
      </div>

      <div className="my-5 flex items-center justify-center gap-3 text-xs font-medium text-zinc-600">
        <div className="h-px w-16 bg-white/10" /> OR <div className="h-px w-16 bg-white/10" />
      </div>

      <input ref={fileInputRef} type="file" accept="video/mp4,video/quicktime,video/x-msvideo" className="hidden" onChange={handleFile} />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-8 py-3.5 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-60"
      >
        <Upload className="h-4 w-4" />
        {uploading ? "Mengunggah..." : "Upload Video"}
      </button>

      {/* Connect buttons */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button className="relative inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5">
          <Play className="h-4 w-4 rounded-sm bg-red-500 p-0.5 text-white" /> Connect YouTube
          <span className="absolute -right-2 -top-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">New!</span>
        </button>
        <button className="relative inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/5">
          <Music className="h-4 w-4 text-cyan-400" /> Connect TikTok
          <span className="absolute -right-2 -top-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-bold text-white">New!</span>
        </button>
      </div>
    </section>
  );
}
