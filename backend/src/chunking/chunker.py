"""Text chunking via RecursiveCharacterTextSplitter for semantic code/text boundaries."""
from langchain_text_splitters import RecursiveCharacterTextSplitter, Language
from src.config import CHUNK_SIZE, CHUNK_OVERLAP

import threading

_splitters = {}
_splitters_lock = threading.Lock()

def _get_splitter(extension: str | None = None) -> RecursiveCharacterTextSplitter:
    """Lazy singleton dict — RecursiveCharacterTextSplitter with AST semantic separators."""
    global _splitters
    with _splitters_lock:
        if extension not in _splitters:
            if extension in [".py"]:
                _splitters[extension] = RecursiveCharacterTextSplitter.from_language(
                    language=Language.PYTHON, chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP
                )
            elif extension in [".js", ".jsx", ".mjs"]:
                _splitters[extension] = RecursiveCharacterTextSplitter.from_language(
                    language=Language.JS, chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP
                )
            elif extension in [".ts", ".tsx"]:
                _splitters[extension] = RecursiveCharacterTextSplitter.from_language(
                    language=Language.TS, chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP
                )
            elif extension in [".md", ".mdx"]:
                _splitters[extension] = RecursiveCharacterTextSplitter.from_language(
                    language=Language.MARKDOWN, chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP
                )
            elif extension in [".html"]:
                _splitters[extension] = RecursiveCharacterTextSplitter.from_language(
                    language=Language.HTML, chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP
                )
            elif extension in [".cpp", ".cc", ".cxx"]:
                _splitters[extension] = RecursiveCharacterTextSplitter.from_language(
                    language=Language.CPP, chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP
                )
            elif extension in [".go"]:
                _splitters[extension] = RecursiveCharacterTextSplitter.from_language(
                    language=Language.GO, chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP
                )
            elif extension in [".java"]:
                _splitters[extension] = RecursiveCharacterTextSplitter.from_language(
                    language=Language.JAVA, chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP
                )
            elif extension in [".rs"]:
                _splitters[extension] = RecursiveCharacterTextSplitter.from_language(
                    language=Language.RUST, chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP
                )
            else:
                # Fallback for plain text, JSON, YAML, etc.
                _splitters[extension] = RecursiveCharacterTextSplitter(
                    separators=["\n\n", "\n", ". ", " ", ""],
                    chunk_size=CHUNK_SIZE,
                    chunk_overlap=CHUNK_OVERLAP,
                    length_function=len,
                    is_separator_regex=False,
                )
    return _splitters[extension]


def chunk_text(text: str, extension: str | None = None, chunk_size: int | None = None, overlap: int | None = None) -> list[str]:
    """Split text using AST-aware semantic recursive splitting. Preserves code logic structure."""
    if chunk_size and overlap:
        # Custom sizes — create one-off splitter
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=overlap,
            length_function=len,
            is_separator_regex=False,
        )
    else:
        splitter = _get_splitter(extension)
    return splitter.split_text(text)
