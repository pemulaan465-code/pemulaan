import os
import uuid
import shutil
from pathlib import Path
from typing import List, Optional

from fastapi import FastAPI, File, Form, UploadFile, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from backend.config import UPLOAD_DIR, CLIPS_DIR, SUBTITLES_DIR
from backend.database import get_db, Video, Clip
from backend import models
from backend.services import (
    process_video_task, jobs, get_video_duration, generate_clip, generate_thumbnail,
    generate_title, generate_hashtags, generate_hook, write_srt,
)

app = FastAPI(title="AI Clipper API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/clips", StaticFiles(directory=str(CLIPS_DIR)), name="clips")
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

ALLOWED_EXTS = {".mp4", ".mov", ".avi"}

def ensure_dir(video_id: str) -> Path:
    d = UPLOAD_DIR / video_id
    d.mkdir(parents=True, exist_ok=True)
    return d

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/videos/upload")
def upload_video(file: UploadFile = File(...), db: Session = Depends(get_db)):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(400, "Format video tidak didukung. Gunakan MP4/MOV/AVI.")
    video_id = str(uuid.uuid4())
    d = ensure_dir(video_id)
    dest = d / f"original{ext}"
    with dest.open("wb") as buf:
        shutil.copyfileobj(file.file, buf)
    duration = get_video_duration(str(dest))
    video = Video(
        id=video_id, filename=file.filename, original_path=str(dest),
        status="uploaded", duration=duration,
    )
    db.add(video)
    db.commit()
    return {"video_id": video_id, "filename": file.filename, "duration": duration}

@app.get("/api/videos", response_model=List[models.VideoOut])
def list_videos(db: Session = Depends(get_db)):
    videos = db.query(Video).order_by(Video.created_at.desc()).all()
    return videos

@app.get("/api/videos/{video_id}", response_model=models.VideoOut)
def get_video(video_id: str, db: Session = Depends(get_db)):
    v = db.query(Video).filter(Video.id == video_id).first()
    if not v:
        raise HTTPException(404, "Video tidak ditemukan")
    return v

@app.post("/api/videos/{video_id}/process")
def process_video(
    video_id: str,
    background_tasks: BackgroundTasks,
    durations: Optional[str] = Form("15,30,60,90"),
    db: Session = Depends(get_db),
):
    v = db.query(Video).filter(Video.id == video_id).first()
    if not v:
        raise HTTPException(404, "Video tidak ditemukan")
    try:
        clip_lengths = [int(x.strip()) for x in durations.split(",") if x.strip()]
    except ValueError:
        raise HTTPException(400, "Durasi tidak valid")
    job_id = str(uuid.uuid4())
    v.status = "processing"
    db.commit()
    background_tasks.add_task(process_video_task, video_id, clip_lengths, job_id)
    return {"job_id": job_id}

@app.get("/api/jobs/{job_id}", response_model=models.JobStatus)
def get_job(job_id: str):
    if job_id not in jobs:
        raise HTTPException(404, "Job tidak ditemukan")
    return jobs[job_id]

@app.get("/api/videos/{video_id}/clips", response_model=List[models.ClipOut])
def get_clips(video_id: str, db: Session = Depends(get_db)):
    clips = db.query(Clip).filter(Clip.video_id == video_id).order_by(Clip.start.asc()).all()
    return clips

@app.get("/api/clips/{clip_id}/download")
def download_clip(clip_id: str, db: Session = Depends(get_db)):
    c = db.query(Clip).filter(Clip.id == clip_id).first()
    if not c or not Path(c.file_path).exists():
        raise HTTPException(404, "Clip tidak ditemukan")
    return FileResponse(c.file_path, filename=f"clip_{clip_id}.mp4", media_type="video/mp4")

@app.get("/api/clips/{clip_id}/file")
def stream_clip(clip_id: str, db: Session = Depends(get_db)):
    c = db.query(Clip).filter(Clip.id == clip_id).first()
    if not c or not Path(c.file_path).exists():
        raise HTTPException(404, "Clip tidak ditemukan")
    return FileResponse(c.file_path, media_type="video/mp4")

@app.get("/api/clips/{clip_id}/thumbnail")
def clip_thumbnail(clip_id: str, db: Session = Depends(get_db)):
    c = db.query(Clip).filter(Clip.id == clip_id).first()
    if not c or not Path(c.thumbnail_path).exists():
        raise HTTPException(404, "Thumbnail tidak ditemukan")
    return FileResponse(c.thumbnail_path, media_type="image/jpeg")

@app.get("/api/clips/{clip_id}/subtitles")
def get_subtitles(clip_id: str, db: Session = Depends(get_db)):
    c = db.query(Clip).filter(Clip.id == clip_id).first()
    if not c or not Path(c.srt_path).exists():
        raise HTTPException(404, "Subtitle tidak ditemukan")
    return {"srt": Path(c.srt_path).read_text(encoding="utf-8")}

@app.put("/api/clips/{clip_id}/subtitles")
def edit_subtitles(clip_id: str, data: models.SubtitleEdit, db: Session = Depends(get_db)):
    c = db.query(Clip).filter(Clip.id == clip_id).first()
    if not c:
        raise HTTPException(404, "Clip tidak ditemukan")
    write_srt(data.srt_text, c.srt_path)
    return {"status": "saved"}

@app.post("/api/clips/{clip_id}/regenerate")
def regenerate_clip(clip_id: str, db: Session = Depends(get_db)):
    c = db.query(Clip).filter(Clip.id == clip_id).first()
    if not c:
        raise HTTPException(404, "Clip tidak ditemukan")
    video = db.query(Video).filter(Video.id == c.video_id).first()
    if not video:
        raise HTTPException(404, "Video tidak ditemukan")
    out_path = generate_clip(video.original_path, clip_id, c.start, c.end, "tiktok", c.srt_path)
    thumb_path = generate_thumbnail(video.original_path, clip_id, c.start, c.title)
    c.file_path = out_path
    c.thumbnail_path = thumb_path
    db.commit()
    return {"file_path": out_path, "thumbnail_path": thumb_path}

@app.post("/api/generate/title")
def gen_title(data: models.GenerateRequest):
    return {"result": generate_title(data.text, data.keywords)}

@app.post("/api/generate/hashtags")
def gen_hashtags(data: models.GenerateRequest):
    return {"result": generate_hashtags(data.keywords)}

@app.post("/api/generate/hook")
def gen_hook(data: models.GenerateRequest):
    return {"result": generate_hook(data.text, data.keywords)}

@app.delete("/api/videos/{video_id}")
def delete_video(video_id: str, db: Session = Depends(get_db)):
    v = db.query(Video).filter(Video.id == video_id).first()
    if not v:
        raise HTTPException(404, "Video tidak ditemukan")
    # Delete files
    d = Path(v.original_path).parent
    if d.exists():
        shutil.rmtree(d, ignore_errors=True)
    for c in v.clips:
        cp = CLIPS_DIR / c.id
        if cp.exists():
            shutil.rmtree(cp, ignore_errors=True)
        sp = Path(c.srt_path)
        if sp.exists():
            sp.unlink(missing_ok=True)
    db.delete(v)
    db.commit()
    return {"status": "deleted"}
