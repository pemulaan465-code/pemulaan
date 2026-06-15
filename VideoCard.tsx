"use client";

import { Video } from "@/lib/api";
import { Play, Trash2 } from "lucide-react";

interface Props {
  video: Video;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export default function VideoCard({ video, selected, onSelect, onDelete }: Props) {
  const statusColor =
    video.status === "ready"
      ? "text-emerald-400"
      : video.status === "processing" || video.status === "running"
      ? "text-amber-400"
      : video.status === "error"
      ? "text-red-400"
      : "text-zinc-400";

  return (
    <div
      onClick={onSelect}
      className={`relative cursor-pointer rounded-xl border p-4 transition hover:border-zinc-600 ${
        selected ? "border-violet-500 bg-violet-500/10" : "border-zinc-800 bg-zinc-900"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="truncate font-medium" title={video.filename}>
            {video.filename}
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            {video.duration ? `${video.duration.toFixed(1)}s` : "-"} ·{" "}
            {new Date(video.created_at).toLocaleString("id-ID")}
          </p>
          <p className={`mt-2 text-xs font-semibold uppercase tracking-wide ${statusColor}`}>{video.status}</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
            <Play className="h-4 w-4 text-zinc-300" />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded p-1.5 text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      {video.engagement_score > 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
          <span>Engagement</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${Math.min(100, video.engagement_score)}%` }}
            />
          </div>
          <span>{video.engagement_score.toFixed(0)}</span>
        </div>
      )}
    </div>
  );
}
