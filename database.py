from sqlalchemy import create_engine, Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from datetime import datetime
from backend.config import DATABASE_URL

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Video(Base):
    __tablename__ = "videos"
    id = Column(String, primary_key=True)
    filename = Column(String, nullable=False)
    original_path = Column(String, nullable=False)
    status = Column(String, default="uploaded")
    duration = Column(Float, default=0.0)
    transcript = Column(Text, default="")
    keywords = Column(Text, default="")
    engagement_score = Column(Float, default=0.0)
    error = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    clips = relationship("Clip", back_populates="video", cascade="all, delete-orphan")

class Clip(Base):
    __tablename__ = "clips"
    id = Column(String, primary_key=True)
    video_id = Column(String, ForeignKey("videos.id"))
    start = Column(Float, default=0.0)
    end = Column(Float, default=0.0)
    duration = Column(Float, default=0.0)
    viral_score = Column(Float, default=0.0)
    status = Column(String, default="pending")
    file_path = Column(String, default="")
    srt_path = Column(String, default="")
    thumbnail_path = Column(String, default="")
    title = Column(Text, default="")
    hashtags = Column(Text, default="")
    hook = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    video = relationship("Video", back_populates="clips")

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
