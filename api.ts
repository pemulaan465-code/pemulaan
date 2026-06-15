const API_PREFIX = "/api/py";

export async function apiFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${API_PREFIX}${path}`, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function uploadVideo(file: File, onProgress?: (p: number) => void) {
  const form = new FormData();
  form.append("file", file);
  return apiFetch("/videos/upload", { method: "POST", body: form }) as Promise<{
    video_id: string;
    filename: string;
    duration: number;
  }>;
}

export async function processVideo(videoId: string, durations: number[]) {
  const form = new FormData();
  form.append("durations", durations.join(","));
  return apiFetch(`/videos/${videoId}/process`, { method: "POST", body: form }) as Promise<{
    job_id: string;
  }>;
}

export async function getJob(jobId: string) {
  return apiFetch(`/jobs/${jobId}`) as Promise<{
    job_id: string;
    status: string;
    progress: number;
    message: string;
    clip_ids: string[];
  }>;
}

export async function listVideos() {
  return apiFetch("/videos") as Promise<Video[]>;
}

export async function getVideo(videoId: string) {
  return apiFetch(`/videos/${videoId}`) as Promise<Video>;
}

export async function getClips(videoId: string) {
  return apiFetch(`/videos/${videoId}/clips`) as Promise<Clip[]>;
}

export async function getSubtitles(clipId: string) {
  return apiFetch(`/clips/${clipId}/subtitles`) as Promise<{ srt: string }>;
}

export async function saveSubtitles(clipId: string, srt: string) {
  return apiFetch(`/clips/${clipId}/subtitles`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ srt_text: srt }),
  }) as Promise<{ status: string }>;
}

export async function regenerateClip(clipId: string) {
  return apiFetch(`/clips/${clipId}/regenerate`, { method: "POST" }) as Promise<{
    file_path: string;
    thumbnail_path: string;
  }>;
}

export async function deleteVideo(videoId: string) {
  return apiFetch(`/videos/${videoId}`, { method: "DELETE" }) as Promise<{ status: string }>;
}

export async function generateTitle(text: string, keywords: string) {
  return apiFetch("/generate/title", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, keywords }),
  }) as Promise<{ result: string }>;
}

export async function generateHashtags(keywords: string) {
  return apiFetch("/generate/hashtags", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "", keywords }),
  }) as Promise<{ result: string }>;
}

export async function generateHook(text: string, keywords: string) {
  return apiFetch("/generate/hook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, keywords }),
  }) as Promise<{ result: string }>;
}

export interface Video {
  id: string;
  filename: string;
  status: string;
  duration: number;
  engagement_score: number;
  keywords: string;
  created_at: string;
  transcript?: string;
}

export interface Clip {
  id: string;
  video_id: string;
  start: number;
  end: number;
  duration: number;
  viral_score: number;
  status: string;
  file_path: string;
  srt_path: string;
  thumbnail_path: string;
  title: string;
  hashtags: string;
  hook: string;
  created_at: string;
}
