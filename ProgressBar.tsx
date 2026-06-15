"use client";

interface Props {
  progress: number;
  message: string;
}

export default function ProgressBar({ progress, message }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-zinc-300">{message || "Memproses..."}</span>
        <span className="font-semibold text-violet-400">{progress}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}
