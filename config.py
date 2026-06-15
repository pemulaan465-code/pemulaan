import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
CLIPS_DIR = BASE_DIR / "clips"
SUBTITLES_DIR = BASE_DIR / "subtitles"
DB_PATH = BASE_DIR / "ai_clipper.db"
MODEL_DIR = BASE_DIR / "models"

for d in (UPLOAD_DIR, CLIPS_DIR, SUBTITLES_DIR, MODEL_DIR):
    d.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DB_PATH}")
BACKEND_HOST = os.environ.get("BACKEND_HOST", "127.0.0.1")
BACKEND_PORT = int(os.environ.get("BACKEND_PORT", "8000"))

OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")
VOSK_MODEL_URL = "https://alphacephei.com/vosk/models/vosk-model-small-id-0.15.zip"
VOSK_MODEL_NAME = "vosk-model-small-id-0.15"

VIRAL_KEYWORDS = [
    "gila", "keren", "mantap", "viral", "heboh", "luar biasa", "beneran",
    "trending", "bikin", "kaget", "ngakak", "lucu", "seru", "sad", "emosi",
    "dapet", "murah", "gratis", "bonus", "rahasia", "tips", "tutorial",
    "jangan", "wajib", "pantas", "penasaran", "boom", "auto", "gokil", "epic",
]

EMOJI_MAP = {
    "gila": "🤯", "keren": "🔥", "mantap": "👍", "viral": "🚀", "heboh": "😱",
    "luar biasa": "✨", "beneran": "😮", "trending": "📈", "kaget": "😲",
    "ngakak": "😂", "lucu": "😂", "seru": "🎉", "sad": "😢", "emosi": "😡",
    "gratis": "🆓", "murah": "💸", "bonus": "🎁", "rahasia": "🤫", "tips": "💡",
    "tutorial": "📚", "jangan": "🚫", "wajib": "⚠️", "penasaran": "🤔",
    "boom": "💥", "auto": "🤖", "gokil": "🤪", "epic": "🏆",
}

TARGET_ASPECTS = {
    "tiktok": {"w": 1080, "h": 1920},
    "reels": {"w": 1080, "h": 1920},
    "shorts": {"w": 1080, "h": 1920},
}
