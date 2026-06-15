from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional

class VideoOut(BaseModel):
    id: str
    filename: str
    status: str
    duration: float
    engagement_score: float
    keywords: str
    created_at: datetime
    class Config:
        from_attributes = True

class ClipOut(BaseModel):
    id: str
    video_id: str
    start: float
    end: float
    duration: float
    viral_score: float
    status: str
    file_path: str
    srt_path: str
    thumbnail_path: str
    title: str
    hashtags: str
    hook: str
    created_at: datetime
    class Config:
        from_attributes = True

class JobStatus(BaseModel):
    job_id: str
    status: str
    progress: int
    message: str
    clip_ids: List[str]

class SubtitleEdit(BaseModel):
    srt_text: str

class GenerateRequest(BaseModel):
    text: str
    keywords: Optional[str] = ""
