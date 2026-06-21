import json
import threading
from pathlib import Path

from config import settings

_lock = threading.Lock()


def _path() -> Path:
    p = Path(settings.chroma_persist_dir)
    p.mkdir(parents=True, exist_ok=True)
    return p / "documents.json"


def load_metadata() -> dict:
    with _lock:
        path = _path()
        if not path.exists():
            return {}
        try:
            return json.loads(path.read_text())
        except Exception:
            return {}


def save_metadata(data: dict) -> None:
    with _lock:
        _path().write_text(json.dumps(data, indent=2))
