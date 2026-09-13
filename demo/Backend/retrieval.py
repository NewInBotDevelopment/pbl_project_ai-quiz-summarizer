# LecturAI Hybrid Local Retrieval Layer
# Uses BM25 ranking (rank-bm25) + lexical scoring + metadata filtering
# Zero API cost, runs locally in milliseconds, with source citation tracking

import re
import logging
from typing import List, Dict, Any, Tuple
from rank_bm25 import BM25Okapi
from document_pipeline import Document, DocumentChunk

logger = logging.getLogger("RetrievalEngine")

def tokenize(text: str) -> List[str]:
    """Lightweight lowercase alphanumeric tokenizer."""
    return re.findall(r'\b[a-zA-Z0-9_]{2,}\b', text.lower())

class HybridRetriever:
    """Fast, local hybrid keyword/BM25 retriever with citation tracking."""

    def __init__(self, document: Document):
        self.document = document
        self.chunks: List[DocumentChunk] = document.chunks
        self.bm25: BM25Okapi = None
        self.corpus_tokens: List[List[str]] = []
        self._build_index()

    def _build_index(self):
        if not self.chunks:
            logger.warning("No chunks available to build index.")
            return

        self.corpus_tokens = [tokenize(chunk.source_text) for chunk in self.chunks]
        # Avoid empty token lists for BM25
        safe_corpus = [tokens if tokens else ["empty"] for tokens in self.corpus_tokens]
        self.bm25 = BM25Okapi(safe_corpus)
        logger.info(f"Built BM25 index over {len(self.chunks)} chunks for {self.document.filename}")

    def retrieve(self, query: str, top_k: int = 5, page_filter: int = None, section_filter: str = None) -> List[Tuple[DocumentChunk, float]]:
        """Retrieve most relevant chunks for a query, optionally filtering by page/section."""
        if not self.chunks or not self.bm25:
            return []

        query_tokens = tokenize(query)
        if not query_tokens:
            return [(c, 1.0) for c in self.chunks[:top_k]]

        raw_scores = self.bm25.get_scores(query_tokens)

        # Pair chunks with scores
        scored_chunks = []
        for idx, score in enumerate(raw_scores):
            chunk = self.chunks[idx]
            if page_filter is not None and chunk.page_number != page_filter:
                continue
            if section_filter and section_filter.lower() not in chunk.section.lower():
                continue

            # Exact keyword overlap boost
            overlap_count = sum(1 for qt in query_tokens if qt in self.corpus_tokens[idx])
            boosted_score = float(score) + (overlap_count * 0.5)

            scored_chunks.append((chunk, boosted_score))

        scored_chunks.sort(key=lambda x: x[1], reverse=True)
        return scored_chunks[:top_k]

    def get_diverse_context(self, max_tokens: int = 12000) -> str:
        """Sample representative chunks across the document hierarchy for global synthesis."""
        if not self.chunks:
            return ""

        # Spread chunk selection evenly across pages
        selected_chunks = []
        seen_pages = set()

        # First pass: one chunk per page
        for c in self.chunks:
            if c.page_number not in seen_pages:
                selected_chunks.append(c)
                seen_pages.add(c.page_number)

        # If room left, add remaining chunks
        if len(selected_chunks) < len(self.chunks):
            for c in self.chunks:
                if c not in selected_chunks:
                    selected_chunks.append(c)

        # Sort chronologically by page and chunk
        selected_chunks.sort(key=lambda x: (x.page_number, x.chunk_id))

        context_blocks = []
        word_count = 0
        for c in selected_chunks:
            block = f"[Page {c.page_number} | Section: {c.section}]\n{c.source_text}"
            words = len(block.split())
            if word_count + words > max_tokens:
                break
            context_blocks.append(block)
            word_count += words

        return "\n\n---\n\n".join(context_blocks)
