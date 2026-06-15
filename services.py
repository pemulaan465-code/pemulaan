import os
import re
import json
import math
import shutil
import subprocess
import zipfile
import uuid
from pathlib import Path
from typing import List, Dict, Optional
from datetime import timedelta

from pydub import AudioSegment, silence
from sqlalchemy.orm import Session

from backend.config import (
    UPLOAD_DIR, CLIPS_DIR, SUBTITLES_DIR, MODEL_DIR,
    VOSK_MODEL_URL, VOSK_MODEL_NAME, VIRAL_KEYWORDS, EMOJI_MAP,
    TARGET_ASPECTS, OPENAI_API_KEY,
)
from backend.database import Video, Clip

# In-memory job registry
jobs: Dict[str, dict] = {}

def _run(cmd: List[str], **kwargs):
    return subprocess.run(cmd, check=True, capture_output=True, text=True, **kwargs)

def get_video_duration(path: str) -> float:
    try:
        out = _run([
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", path,
        ])
        return float(out.stdout.strip())
    except Exception:
        return 0.0

def extract_audio(video_path: str, audio_path: str):
    _run([
        "ffmpeg", "-y", "-i", video_path, "-vn", "-acodec", "pcm_s16le",
        "-ar", "16000", "-ac", "1", audio_path,
    ])

def download_vosk_model() -> str:
    model_path = MODEL_DIR / VOSK_MODEL_NAME
    if model_path.exists():
        return str(model_path)
    import urllib.request
    zip_path = MODEL_DIR / f"{VOSK_MODEL_NAME}.zip"
    if not zip_path.exists():
        print("Downloading Vosk model...")
        urllib.request.urlretrieve(VOSK_MODEL_URL, zip_path)
    with zipfile.ZipFile(zip_path, "r") as z:
        z.extractall(MODEL_DIR)
    zip_path.unlink(missing_ok=True)
    return str(model_path)

def transcribe_vosk(audio_path: str):
    try:
        import vosk
    except Exception as e:
        return [], str(e)
    model_path = download_vosk_model()
    model = vosk.Model(model_path)
    rec = vosk.KaldiRecognizer(model, 16000)
    rec.SetWords(True)
    wf = open(audio_path, "rb")
    wf.read(44)  # skip wav header if wav
    results = []
    while True:
        data = wf.read(4000)
        if len(data) == 0:
            break
        if rec.AcceptWaveform(data):
            results.append(json.loads(rec.Result()))
    results.append(json.loads(rec.FinalResult()))
    wf.close()
    words = []
    for r in results:
        for w in r.get("result", []):
            words.append({
                "word": w["word"],
                "start": w["start"],
                "end": w["end"],
                "conf": w.get("conf", 1),
            })
    return words, ""

def transcribe_whisper(audio_path: str):
    try:
        import whisper
    except Exception as e:
        return [], str(e)
    model = whisper.load_model("tiny")
    result = model.transcribe(audio_path, language="id")
    words = []
    for s in result.get("segments", []):
        for w in s.get("words", []):
            words.append({
                "word": w["word"].strip(),
                "start": w["start"],
                "end": w["end"],
                "conf": 1.0,
            })
    if not words:
        for s in result.get("segments", []):
            words.append({
                "word": s["text"].strip(),
                "start": s["start"],
                "end": s["end"],
                "conf": 1.0,
            })
    return words, ""

def transcribe(audio_path: str):
    words, err = transcribe_whisper(audio_path)
    if words:
        return words, "whisper"
    words, err = transcribe_vosk(audio_path)
    if words:
        return words, "vosk"
    # Fallback: heuristic segments every 4s
    seg = AudioSegment.from_file(audio_path)
    dur = len(seg) / 1000.0
    words = []
    step = 4.0
    for t in range(0, int(dur), int(step)):
        words.append({"word": "[auto subtitle]", "start": t, "end": min(t + step, dur), "conf": 0.5})
    return words, "fallback"

def build_transcript(words: List[dict]) -> str:
    return " ".join(w["word"] for w in words).strip()

def keywords_in_text(text: str) -> List[str]:
    text_l = text.lower()
    found = []
    for k in VIRAL_KEYWORDS:
        if re.search(r"\b" + re.escape(k) + r"\b", text_l):
            found.append(k)
    return found

def analyze_audio(audio_path: str, words: List[dict], duration: float):
    seg = AudioSegment.from_file(audio_path)
    window_ms = 1000
    rms_windows = []
    for i in range(0, len(seg), window_ms):
        chunk = seg[i:i + window_ms]
        rms_windows.append(chunk.rms)
    max_rms = max(rms_windows) if rms_windows else 1
    rms_norm = [r / max_rms for r in rms_windows]

    # Pauses from silence > 350ms
    pauses = silence.detect_nonsilent(seg, min_silence_len=350, silence_thresh=-40)

    # Pitch proxy via zero crossing rate (ZCR) per second
    sample_rate = seg.frame_rate
    samples = seg.get_array_of_samples()
    zcr_per_sec = []
    sec_len = sample_rate
    for i in range(0, len(samples), sec_len):
        s = samples[i:i + sec_len]
        zc = sum(1 for j in range(1, len(s)) if s[j] * s[j - 1] < 0)
        zcr_per_sec.append(zc)
    max_z = max(zcr_per_sec) if zcr_per_sec else 1
    zcr_norm = [z / max_z for z in zcr_per_sec]

    # Build per-second score
    step = 1.0
    segments = []
    for t in range(0, int(duration), int(step)):
        idx = min(t, len(rms_norm) - 1)
        volume = rms_norm[idx] if idx >= 0 else 0
        z_idx = min(t, len(zcr_norm) - 1)
        emotion = zcr_norm[z_idx] if z_idx >= 0 else 0
        # keyword hits in this second
        sec_words = [w for w in words if t <= w["start"] < t + step]
        kw_score = sum(1 for w in sec_words if any(k in w["word"].lower() for k in VIRAL_KEYWORDS)) / max(len(sec_words), 1)
        # pause density: less pause = higher engagement
        nonsilent_ms = sum(min(e, (t + 1) * 1000) - max(s, t * 1000) for s, e in pauses if e > t * 1000 and s < (t + 1) * 1000)
        pause_score = nonsilent_ms / 1000.0
        score = min(100, (volume * 30 + emotion * 20 + kw_score * 35 + pause_score * 15))
        segments.append({"t": float(t), "score": score, "volume": volume, "emotion": emotion, "kw": kw_score})
    return segments

def smooth_scores(segments: List[dict], window: int = 3):
    out = []
    for i, s in enumerate(segments):
        vals = [segments[j]["score"] for j in range(max(0, i - window), min(len(segments), i + window + 1))]
        s2 = s.copy()
        s2["score"] = sum(vals) / len(vals)
        out.append(s2)
    return out

def pick_clip_windows(segments: List[dict], duration: float, clip_lengths: List[int], n_each: int = 1):
    best = []
    for L in clip_lengths:
        L = float(L)
        if L > duration:
            continue
        candidates = []
        for start_t in range(0, int(duration - L) + 1, max(1, int(L // 5))):
            end_t = start_t + L
            vals = [s["score"] for s in segments if start_t <= s["t"] < end_t]
            avg = sum(vals) / max(len(vals), 1)
            peak = max(vals) if vals else 0
            candidates.append({"start": float(start_t), "end": float(end_t), "avg": avg, "peak": peak})
        candidates.sort(key=lambda x: (x["avg"], x["peak"]), reverse=True)
        for c in candidates[:n_each]:
            best.append({"start": c["start"], "end": c["end"], "duration": L, "score": c["avg"]})
    # Deduplicate overlapping
    best.sort(key=lambda x: x["score"], reverse=True)
    chosen = []
    for b in best:
        if not any(abs(b["start"] - c["start"]) < 5 and abs(b["end"] - c["end"]) < 5 for c in chosen):
            chosen.append(b)
    chosen.sort(key=lambda x: x["start"])
    return chosen

def srt_time(seconds: float) -> str:
    td = timedelta(seconds=seconds)
    total = int(td.total_seconds() * 1000)
    h = total // 3600000
    m = (total % 3600000) // 60000
    s = (total % 60000) // 1000
    ms = total % 1000
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

def enhance_word(word: str) -> str:
    wlow = word.lower().strip(".,!?")
    if wlow in EMOJI_MAP:
        return f"<font color='#FFFF00'>{word}</font> {EMOJI_MAP[wlow]}"
    return word

def words_to_srt(words: List[dict], max_chars: int = 40, max_duration: float = 4.0) -> str:
    if not words:
        return ""
    blocks = []
    current = []
    cur_start = words[0]["start"]
    cur_chars = 0
    for w in words:
        if (cur_chars + len(w["word"]) > max_chars or w["end"] - cur_start > max_duration) and current:
            text = " ".join(enhance_word(x["word"]) for x in current)
            blocks.append({"start": cur_start, "end": current[-1]["end"], "text": text})
            current = [w]
            cur_start = w["start"]
            cur_chars = len(w["word"])
        else:
            current.append(w)
            cur_chars += len(w["word"]) + 1
    if current:
        text = " ".join(enhance_word(x["word"]) for x in current)
        blocks.append({"start": cur_start, "end": current[-1]["end"], "text": text})
    srt = ""
    for i, b in enumerate(blocks, 1):
        srt += f"{i}\n{srt_time(b['start'])} --> {srt_time(b['end'])}\n{b['text']}\n\n"
    return srt

def write_srt(srt_text: str, path: str):
    Path(path).write_text(srt_text, encoding="utf-8")

def build_ffmpeg_filter(width: int, height: int, srt_path: Optional[str]):
    # Vertical 9:16 output with center pad
    base = f"scale={width}:-1:force_original_aspect_ratio=decrease,pad={width}:{height}:(ow-iw)/2:(oh-ih)/2:black,setsar=1"
    if srt_path and Path(srt_path).exists():
        # escape colons for filter
        safe = srt_path.replace(":", "\\:")
        base += f",subtitles={safe}:force_style='FontName=Arial,FontSize=18,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Alignment=2,MarginV=30'"
    return base

def generate_clip(video_path: str, clip_id: str, start: float, end: float, aspect: str, srt_path: Optional[str]):
    clip_dir = CLIPS_DIR / clip_id
    clip_dir.mkdir(parents=True, exist_ok=True)
    out_path = clip_dir / f"{aspect}.mp4"
    dims = TARGET_ASPECTS[aspect]
    vf = build_ffmpeg_filter(dims["w"], dims["h"], srt_path)
    dur = end - start
    _run([
        "ffmpeg", "-y", "-ss", str(start), "-t", str(dur), "-i", video_path,
        "-vf", vf, "-c:v", "libx264", "-preset", "fast", "-crf", "23",
        "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", str(out_path),
    ])
    return str(out_path)

def generate_thumbnail(video_path: str, clip_id: str, start: float, title: str):
    clip_dir = CLIPS_DIR / clip_id
    clip_dir.mkdir(parents=True, exist_ok=True)
    thumb_path = clip_dir / "thumbnail.jpg"
    # Sanitize for drawtext
    safe = re.sub(r"[^A-Za-z0-9\s\-]", "", title)[:50]
    _run([
        "ffmpeg", "-y", "-ss", str(start + 1), "-i", video_path,
        "-vf", f"scale=1080:-1:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:black,drawtext=text='{safe}':fontcolor=white:fontsize=48:borderw=4:x=(w-text_w)/2:y=(h*0.8)",
        "-vframes", "1", str(thumb_path),
    ])
    return str(thumb_path)

import httpx

def _call_openai(prompt: str, max_tokens: int = 50) -> str:
    if not OPENAI_API_KEY:
        return ""
    try:
        r = httpx.post(
            "https://api.openai.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
            json={
                "model": "gpt-3.5-turbo",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens,
                "temperature": 0.8,
            },
            timeout=20,
        )
        r.raise_for_status()
        return r.json()["choices"][0]["message"]["content"].strip().strip('"')
    except Exception:
        return ""

def generate_title(text: str, keywords: str) -> str:
    kws = [k.strip() for k in keywords.split(",") if k.strip()][:3]
    kw = kws[0] if kws else "viral"
    templates = [
        f"{kw.title()}?! Ini Gak Masuk Akal! 🤯",
        f"Auto Viral: Momen {kw.title()} Paling Epik 🔥",
        f"Kamu Harus Lihat {kw.title()} Ini! 😱",
        f"Tutorial {kw.title()} yang Wajib Kamu Coba 💡",
        f"Rahasia {kw.title()} Terbongkar! 🤫",
    ]
    ai = _call_openai(
        f"Buatkan judul viral pendek dalam bahasa Indonesia untuk video dengan kata kunci: {keywords}\n\nTranskrip: {text[:500]}",
        max_tokens=40,
    )
    return ai or templates[hash(text) % len(templates)]

def generate_hashtags(keywords: str) -> str:
    base = ["#viral", "#fyp", "#trending", "#indonesia", "#shorts"]
    kws = [k.strip() for k in keywords.split(",") if k.strip()][:5]
    return " ".join(base + [f"#{k.replace(' ', '')}" for k in kws])

def generate_hook(text: str, keywords: str) -> str:
    kws = [k.strip() for k in keywords.split(",") if k.strip()][:3]
    kw = kws[0] if kws else "ini"
    hooks = [
        f"Tunggu sampai detik ke-5, {kw} ini bakal bikin kamu speechless!",
        f"Jangan skip! Momen {kw} terbaik ada di sini!",
        f"Siap-siap tertawa dengan {kw} yang satu ini!",
        f"Kamu nggak akan percaya dengan {kw} ini!",
    ]
    ai = _call_openai(
        f"Buatkan hook/pengawal pendek memikat dalam bahasa Indonesia untuk video dengan kata kunci: {keywords}\n\nTranskrip: {text[:500]}",
        max_tokens=50,
    )
    return ai or hooks[hash(text) % len(hooks)]

def update_job(job_id: str, status: str, progress: int, message: str, clip_ids: List[str] = None):
    if job_id not in jobs:
        jobs[job_id] = {"job_id": job_id, "status": status, "progress": 0, "message": "", "clip_ids": []}
    jobs[job_id].update({
        "status": status,
        "progress": progress,
        "message": message,
        "clip_ids": clip_ids if clip_ids is not None else jobs[job_id].get("clip_ids", []),
    })

from backend.database import SessionLocal

def process_video_task(video_id: str, clip_lengths: List[int], job_id: str):
    db = SessionLocal()
    update_job(job_id, "running", 5, "Membaca video...")
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        update_job(job_id, "failed", 100, "Video tidak ditemukan")
        db.close()
        return
    try:
        video_path = video.original_path
        duration = get_video_duration(video_path)
        video.duration = duration
        db.commit()

        update_job(job_id, "running", 15, "Mengekstrak audio...")
        audio_path = str(UPLOAD_DIR / video_id / "audio.wav")
        extract_audio(video_path, audio_path)

        update_job(job_id, "running", 30, "Mentranskrip audio...")
        words, engine = transcribe(audio_path)
        transcript = build_transcript(words)
        video.transcript = transcript
        keywords = ", ".join(keywords_in_text(transcript))
        video.keywords = keywords
        db.commit()

        update_job(job_id, "running", 50, "Menganalisis engagement...")
        segments = analyze_audio(audio_path, words, duration)
        segments = smooth_scores(segments)
        avg_score = sum(s["score"] for s in segments) / max(len(segments), 1)
        video.engagement_score = avg_score
        db.commit()

        update_job(job_id, "running", 65, "Memilih momen viral...")
        windows = pick_clip_windows(segments, duration, clip_lengths, n_each=1)

        clip_ids = []
        for i, w in enumerate(windows):
            clip_id = str(uuid.uuid4())
            clip_dir = CLIPS_DIR / clip_id
            clip_dir.mkdir(parents=True, exist_ok=True)
            srt_text = words_to_srt([x for x in words if w["start"] <= x["start"] < w["end"]])
            srt_path = str(SUBTITLES_DIR / f"{clip_id}.srt")
            write_srt(srt_text, srt_path)

            title = generate_title(transcript, keywords)
            hashtags = generate_hashtags(keywords)
            hook = generate_hook(transcript, keywords)

            update_job(job_id, "running", 70 + int((i / max(len(windows), 1)) * 25), f"Memotong klip {i+1}/{len(windows)}...")
            out_path = generate_clip(video_path, clip_id, w["start"], w["end"], "tiktok", srt_path)
            thumb_path = generate_thumbnail(video_path, clip_id, w["start"], title)

            clip = Clip(
                id=clip_id, video_id=video_id, start=w["start"], end=w["end"],
                duration=w["duration"], viral_score=w["score"], status="ready",
                file_path=out_path, srt_path=srt_path, thumbnail_path=thumb_path,
                title=title, hashtags=hashtags, hook=hook,
            )
            db.add(clip)
            clip_ids.append(clip_id)
        video.status = "ready"
        db.commit()
        update_job(job_id, "completed", 100, "Selesai", clip_ids=clip_ids)
    except Exception as e:
        video.status = "error"
        video.error = str(e)
        db.commit()
        update_job(job_id, "failed", 100, str(e))
    finally:
        db.close()
