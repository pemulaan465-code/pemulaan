"use client";

import { useState } from "react";
import { Clip } from "@/lib/api";
import { Download, Play, FileText, Sparkles, Hash, Zap, RefreshCw } from "lucide-react";
import SubtitleEditor from "./SubtitleEditor";

interface Props {
  clip: Clip;
  onRegenerate: () => void;
}

export default function ClipCard({ clip, onRegenerate }: Props) {
  const [editing, setEditing] = useState(false);

  const thumb = clip.thumbnail_path
    ? `/api/py/clips/${clip.id}/thumbnail`
    : undefined;

  const clipUrl = `/api/py/clips/${clip.id}/file`;

  const score = Math.min(100, Math.max(1, clip.viral_score || 0));
  const scoreColor = score >= 80 ? "from-emerald-500 to-teal-400" : score >= 50 ? "from-amber-500 to-yellow-400" : "from-red-500 to-orange-400";

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
      <div className="relative aspect-[9/16] bg-black">
        <video
          src={clipUrl}
          poster={thumb}
          controls
          className="h-full w-full object-contain"
          preload="metadata"
        />
        <div className="absolute right-3 top-3 rounded-full bg-black/60 px-2 py-1 text-xs font-bold text-white backdrop-blur">
          {clip.duration.toFixed(0)}s
        </div>
        <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs font-bold text-white backdrop-blur">
          <Sparkles className="h-3 w-3" />
          Viral {score.toFixed(0)}
        </div>
      </div>

      <div className="p-4">
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
          <div className={`h-full rounded-full bg-gradient-to-r ${scoreColor}`} style={{ width: `${score}%` }} />
        </div>

        <p className="mb-1 text-sm font-semibold text-zinc-100 line-clamp-2" title={clip.title || ""}>
          {clip.title || `Klip ${clip.start.toFixed(1)}s - ${clip.end.toFixed(1)}s`}
        </p>
        <p className="mb-2 text-xs text-zinc-500 line-clamp-2" title={clip.hook || ""}>
          {clip.hook}
        </p>
        <p className="mb-3 text-xs text-cyan-400 line-clamp-1" title={clip.hashtags || ""}>
          <Hash className="mb-0.5 inline h-3 w-3" /> {clip.hashtags}
        </p>

        <div className="flex flex-wrap gap-2">
          <a
            href={`/api/py/clips/${clip.id}/download`}
            download
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-500"
          >
            <Download className="h-4 w-4" /> Download
          </a>
          <button
            onClick={() => setEditing(true)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700"
          >
            <FileText className="h-4 w-4" /> Subtitle
          </button>
          <button
            onClick={onRegenerate}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-700"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {editing && <SubtitleEditor clip={clip} onClose={() => setEditing(false)} />}
    </div>
  );
}
