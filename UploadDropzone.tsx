"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Film } from "lucide-react";

interface Props {
  onUpload: (file: File) => void;
  uploading: boolean;
}

export default function UploadDropzone({ onUpload, uploading }: Props) {
  const onDrop = useCallback(
    (accepted: File[]) => {
      if (accepted[0]) onUpload(accepted[0]);
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "video/*": [".mp4", ".mov", ".avi"] },
    multiple: false,
    disabled: uploading,
  });

  return (
    <div
      {...getRootProps()}
      className={`group cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition ${
        isDragActive
          ? "border-violet-500 bg-violet-500/10"
          : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-500 hover:bg-zinc-900"
      } ${uploading ? "pointer-events-none opacity-60" : ""}`}
    >
      <input {...getInputProps()} />
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800 group-hover:bg-zinc-700">
        {uploading ? (
          <Film className="h-8 w-8 animate-pulse text-violet-400" />
        ) : (
          <Upload className="h-8 w-8 text-zinc-400 group-hover:text-zinc-200" />
        )}
      </div>
      <p className="text-lg font-medium">
        {uploading ? "Mengunggah video..." : isDragActive ? "Lepaskan video di sini" : "Drag & drop video MP4/MOV/AVI"}
      </p>
      <p className="mt-1 text-sm text-zinc-500">atau klik untuk memilih file</p>
    </div>
  );
}
