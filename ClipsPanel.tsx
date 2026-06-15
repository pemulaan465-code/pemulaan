"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { RefreshCw, Zap, Clock, Sparkles, Hash, Play, Trash2 } from "lucide-react";
import ClipCard from "./ClipCard";
import ProgressBar from "./ProgressBar";
import VideoCard from "./VideoCard";
import {
  processVideo,
  getJob,
  listVideos,
  getClips,
  deleteVideo,
  Video,
  Clip,
} from "@/lib/api";

const DURATIONS = [15, 30, 60, 90];

export default function ClipsPanel() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selected, setSelected] = useState<Video | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [job, setJob] = useState<{ job_id: string; progress: number; message: string; status: string } | null>(null);
  const [selectedDurations, setSelectedDurations] = useState<number[]>([15, 30, 60, 90]);
  const [loadingClips, setLoadingClips] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchVideos = useCallback(async () => {
    try {
      const data = await listVideos();
      setVideos(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const fetchClips = useCallback(async (videoId: string) => {
    setLoadingClips(true);
    try {
      const data = await getClips(videoId);
      setClips(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingClips(false);
    }
  }, []);

  useEffect(() => {
    if (selected) fetchClips(selected.id);
  }, [selected, fetchClips]);

  const startProcess = async () => {
    if (!selected) return;
    try {
      const res = await processVideo(selected.id, selectedDurations);
      setJob({ job_id: res.job_id, progress: 0, message: "Memulai...", status: "running" });
    } catch (e: any) {
      alert(e.message || "Gagal memulai proses");
    }
  };

  useEffect(() => {
    if (!job || job.status === "completed" || job.status === "failed") return;
    pollRef.current && clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const status = await getJob(job.job_id);
        setJob({ ...job, progress: status.progress, message: status.message, status: status.status });
        if (status.status === "completed" || status.status === "failed") {
          pollRef.current && clearInterval(pollRef.current);
          fetchVideos();
          if (selected) fetchClips(selected.id);
        }
      } catch (e) {
        console.error(e);
      }
    }, 1200);
    return () => {
      pollRef.current && clearInterval(pollRef.current);
    };
  }, [job, fetchVideos, fetchClips, selected]);

  const handleDelete = async (videoId: string) => {
    if (!confirm("Hapus video ini?")) return;
    try {
      await deleteVideo(videoId);
      if (selected?.id === videoId) setSelected(null);
      fetchVideos();
    } catch (e: any) {
      alert(e.message || "Gagal menghapus");
    }
  };

  const toggleDuration = (d: number) => {
    setSelectedDurations((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Video list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-500">Video Tersedia</h2>
            <button onClick={fetchVideos} className="rounded p-1 text-zinc-500 hover:bg-white/5 hover:text-zinc-200">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1 scrollbar-thin">
            {videos.length === 0 && <p className="text-sm text-zinc-500">Belum ada video.</p>}
            {videos.map((v) => (
              <VideoCard
                key={v.id}
                video={v}
                selected={selected?.id === v.id}
                onSelect={() => setSelected(v)}
                onDelete={() => handleDelete(v.id)}
              />
            ))}
          </div>
        </div>

        {/* Main panel */}
        <div className="space-y-6">
          {!selected ? (
            <div className="flex h-96 flex-col items-center justify-center rounded-3xl border border-white/5 bg-[#141416] text-center">
              <Sparkles className="mb-4 h-12 w-12 text-zinc-600" />
              <p className="text-lg font-medium text-zinc-300">Pilih video untuk mulai generate klip</p>
              <p className="text-sm text-zinc-500">AI akan mendeteksi momen viral dan memotong otomatis.</p>
            </div>
          ) : (
            <>
              <div className="rounded-3xl border border-white/5 bg-[#141416] p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">{selected.filename}</h2>
                    <div className="mt-1 flex flex-wrap gap-3 text-sm text-zinc-500">
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {selected.duration.toFixed(1)}s</span>
                      <span className="flex items-center gap-1"><Sparkles className="h-3.5 w-3.5" /> Engagement {selected.engagement_score.toFixed(1)}</span>
                      <span className="flex items-center gap-1"><Hash className="h-3.5 w-3.5" /> {selected.keywords || "-"}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:items-end">
                    <span className="text-xs uppercase tracking-wide text-zinc-600">Durasi klip</span>
                    <div className="flex gap-2">
                      {DURATIONS.map((d) => (
                        <button
                          key={d}
                          onClick={() => toggleDuration(d)}
                          className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition ${
                            selectedDurations.includes(d)
                              ? "border-yellow-500/50 bg-yellow-500/10 text-yellow-400"
                              : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20"
                          }`}
                        >
                          {d}s
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={startProcess}
                      disabled={!!job && job.status === "running"}
                      className="mt-2 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 px-5 py-2.5 font-bold text-black shadow-lg shadow-amber-900/30 transition hover:brightness-110 disabled:opacity-60"
                    >
                      <Zap className="h-4 w-4" />
                      {job && job.status === "running" ? "Memproses..." : "Generate Clips"}
                    </button>
                  </div>
                </div>

                {job && job.status !== "completed" && job.status !== "failed" && (
                  <div className="mt-5">
                    <ProgressBar progress={job.progress} message={job.message} />
                  </div>
                )}
                {job?.status === "completed" && (
                  <div className="mt-5 rounded-xl border border-emerald-800/50 bg-emerald-900/20 p-3 text-sm text-emerald-300">
                    Selesai! {clips.length} klip siap diunduh.
                  </div>
                )}
                {job?.status === "failed" && (
                  <div className="mt-5 rounded-xl border border-red-800/50 bg-red-900/20 p-3 text-sm text-red-300">
                    Gagal: {job.message}
                  </div>
                )}
              </div>

              {clips.length > 0 && (
                <div>
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-white">
                    <Play className="h-5 w-5 text-yellow-500" /> Klip Viral
                  </h3>
                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {clips.map((c) => (
                      <ClipCard key={c.id} clip={c} onRegenerate={() => fetchClips(selected.id)} />
                    ))}
                  </div>
                </div>
              )}

              {loadingClips && (
                <div className="flex items-center justify-center py-12 text-zinc-500">
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Memuat klip...
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
