from pathlib import Path

import fitz  # PyMuPDF
from docx import Document as DocxDocument


def extract_text(file_path: str) -> str:
    path = Path(file_path)
    suffix = path.suffix.lower()

    if suffix == ".pdf":
        return _from_pdf(path)
    elif suffix == ".docx":
        return _from_docx(path)
    elif suffix == ".txt":
        return path.read_text(encoding="utf-8", errors="replace")
    else:
        raise ValueError(f"Unsupported format: {suffix}")


def _from_pdf(path: Path) -> str:
    doc = fitz.open(str(path))
    pages = []
    for i, page in enumerate(doc, start=1):
        text = page.get_text("text")
        if text.strip():
            pages.append(f"[Page {i}]\n{text.strip()}")
    doc.close()
    return "\n\n".join(pages)


def _from_docx(path: Path) -> str:
    doc = DocxDocument(str(path))
    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    return "\n\n".join(paragraphs)
