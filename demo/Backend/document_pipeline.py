# LecturAI Structure-Aware Document Pipeline
# Supports PDF (preserving tables, pages, headings, OCR fallback), PPTX, DOCX, TXT/MD, and Audio/Video

import os
import re
import io
import time
import logging
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

logger = logging.getLogger("DocumentPipeline")

@dataclass
class DocumentChunk:
    chunk_id: str
    document_id: str
    filename: str
    page_number: int
    section: str
    content_type: str  # 'text', 'table', 'code', 'figure_caption'
    source_text: str
    token_estimate: int = 0

@dataclass
class DocumentPage:
    page_number: int
    text: str
    tables: List[List[List[str]]] = field(default_factory=list)
    has_ocr: bool = False
    word_count: int = 0

@dataclass
class Document:
    document_id: str
    filename: str
    file_type: str
    pages: List[DocumentPage] = field(default_factory=list)
    chunks: List[DocumentChunk] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    statistics: Dict[str, Any] = field(default_factory=dict)
    full_text: str = ""


class DocumentParser:
    """Multi-format structured parser with automatic fallback and OCR."""

    @staticmethod
    def parse(file_path: str, filename: str) -> Document:
        ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
        doc_id = f"{int(time.time())}_{os.path.basename(file_path)}"
        doc = Document(document_id=doc_id, filename=filename, file_type=ext)

        if ext == 'pdf':
            DocumentParser._parse_pdf(file_path, doc)
        elif ext in ('pptx', 'ppt'):
            DocumentParser._parse_pptx(file_path, doc)
        elif ext in ('docx', 'doc'):
            DocumentParser._parse_docx(file_path, doc)
        elif ext in ('mp3', 'wav', 'mp4', 'm4a', 'mpeg'):
            DocumentParser._parse_audio(file_path, doc)
        else:
            DocumentParser._parse_txt(file_path, doc)

        # Generate structure-aware chunks
        doc.chunks = DocumentParser._create_chunks(doc)

        # Compute document statistics
        total_words = sum(p.word_count for p in doc.pages)
        total_tables = sum(len(p.tables) for p in doc.pages)
        ocr_pages = sum(1 for p in doc.pages if p.has_ocr)
        doc.statistics = {
            'total_pages': len(doc.pages),
            'total_words': total_words,
            'total_tables': total_tables,
            'ocr_pages': ocr_pages,
            'total_chunks': len(doc.chunks),
            'file_type': ext
        }
        doc.full_text = "\n\n".join([f"--- Page {p.page_number} ---\n{p.text}" for p in doc.pages])
        return doc

    @staticmethod
    def _parse_pdf(file_path: str, doc: Document):
        import pdfplumber

        try:
            with pdfplumber.open(file_path) as pdf:
                for idx, page in enumerate(pdf.pages):
                    page_num = idx + 1
                    raw_text = page.extract_text() or ''
                    tables_data = []

                    # Extract structured tables
                    try:
                        extracted_tables = page.extract_tables()
                        for tbl in extracted_tables:
                            if tbl and len(tbl) > 1:
                                tables_data.append(tbl)
                    except Exception as te:
                        logger.warning(f"Table extraction error on page {page_num}: {te}")

                    # Format tables into markdown text to preserve structure
                    table_markdown = ''
                    if tables_data:
                        for tidx, tbl in enumerate(tables_data):
                            clean_tbl = [[str(cell or '').strip().replace('\n', ' ') for cell in row] for row in tbl if any(row)]
                            if len(clean_tbl) >= 2:
                                header = '| ' + ' | '.join(clean_tbl[0]) + ' |'
                                sep = '| ' + ' | '.join(['---'] * len(clean_tbl[0])) + ' |'
                                rows = ['| ' + ' | '.join(row) + ' |' for row in clean_tbl[1:]]
                                table_markdown += f"\n\n[Table {tidx+1} on Page {page_num}]:\n" + '\n'.join([header, sep] + rows) + '\n'

                    # Check if OCR is needed (scanned or image-only page)
                    combined_text = raw_text.strip()
                    has_ocr = False
                    if len(combined_text) < 35:  # Low text threshold
                        ocr_text = DocumentParser._ocr_page(file_path, idx)
                        if len(ocr_text.strip()) > len(combined_text):
                            combined_text = ocr_text
                            has_ocr = True

                    if table_markdown:
                        combined_text += '\n' + table_markdown

                    words = len(combined_text.split())
                    doc_page = DocumentPage(
                        page_number=page_num,
                        text=combined_text,
                        tables=tables_data,
                        has_ocr=has_ocr,
                        word_count=words
                    )
                    doc.pages.append(doc_page)

        except Exception as e:
            logger.error(f"pdfplumber failed: {e}, attempting pypdfium2 fallback")
            DocumentParser._parse_pdf_fallback(file_path, doc)

    @staticmethod
    def _parse_pdf_fallback(file_path: str, doc: Document):
        import pypdfium2 as pdfium
        try:
            pdf = pdfium.PdfDocument(file_path)
            for idx in range(len(pdf)):
                page = pdf[idx]
                text_page = page.get_textpage()
                raw_text = text_page.get_text_range()
                words = len(raw_text.split())
                doc.pages.append(DocumentPage(
                    page_number=idx + 1,
                    text=raw_text,
                    has_ocr=False,
                    word_count=words
                ))
        except Exception as e:
            logger.error(f"Pdfium fallback also failed: {e}")

    @staticmethod
    def _ocr_page(file_path: str, page_idx: int) -> str:
        """Extract text from page image using pypdfium2 + pytesseract if available."""
        try:
            import pypdfium2 as pdfium
            import pytesseract
            pdf = pdfium.PdfDocument(file_path)
            page = pdf[page_idx]
            pil_image = page.render(scale=2.0).to_pil()
            ocr_text = pytesseract.image_to_string(pil_image)
            return ocr_text.strip()
        except Exception as e:
            logger.debug(f"OCR attempt skipped or unavailable for page {page_idx+1}: {e}")
            return ''

    @staticmethod
    def _parse_pptx(file_path: str, doc: Document):
        from pptx import Presentation
        prs = Presentation(file_path)
        for idx, slide in enumerate(prs.slides):
            slide_num = idx + 1
            slide_texts = []
            tables = []
            for shape in slide.shapes:
                if shape.has_text_frame:
                    for paragraph in shape.text_frame.paragraphs:
                        text = paragraph.text.strip()
                        if text:
                            slide_texts.append(text)
                elif shape.has_table:
                    tbl = shape.table
                    matrix = []
                    for row in tbl.rows:
                        matrix.append([cell.text.strip() for cell in row.cells])
                    if matrix:
                        tables.append(matrix)
            content = '\n'.join(slide_texts)
            doc.pages.append(DocumentPage(
                page_number=slide_num,
                text=content,
                tables=tables,
                word_count=len(content.split())
            ))

    @staticmethod
    def _parse_docx(file_path: str, doc: Document):
        from docx import Document as DocxDoc
        d = DocxDoc(file_path)
        paras = [p.text for p in d.paragraphs if p.text.strip()]
        full_text = '\n\n'.join(paras)
        words = len(full_text.split())
        doc.pages.append(DocumentPage(
            page_number=1,
            text=full_text,
            word_count=words
        ))

    @staticmethod
    def _parse_txt(file_path: str, doc: Document):
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
        except Exception:
            content = ''
        words = len(content.split())
        doc.pages.append(DocumentPage(
            page_number=1,
            text=content,
            word_count=words
        ))

    @staticmethod
    def _parse_audio(file_path: str, doc: Document):
        from llm_provider import GroqProvider
        gp = GroqProvider()
        transcript = ''
        if gp.client:
            try:
                with open(file_path, 'rb') as af:
                    t = gp.client.audio.transcriptions.create(
                        file=(os.path.basename(file_path), af.read()),
                        model='whisper-large-v3-turbo',
                        response_format='verbose_json'
                    )
                if hasattr(t, 'segments'):
                    lines = []
                    for s in t.segments:
                        ts = time.strftime('%M:%S', time.gmtime(s['start']))
                        lines.append(f"[{ts}] {s['text']}")
                    transcript = '\n'.join(lines)
                else:
                    transcript = t.text
            except Exception as e:
                logger.error(f"Whisper transcription error: {e}")
                transcript = f"[Transcription error: {e}]"
        doc.pages.append(DocumentPage(
            page_number=1,
            text=transcript,
            word_count=len(transcript.split())
        ))

    @staticmethod
    def _create_chunks(doc: Document, max_chunk_words: int = 350) -> List[DocumentChunk]:
        """Structure-aware chunking preserving sections, headings, and tables."""
        chunks = []
        chunk_idx = 0

        for page in doc.pages:
            p_text = page.text
            if not p_text.strip():
                continue

            # Split on double linebreaks or headers
            paragraphs = [p.strip() for p in re.split(r'\n\s*\n', p_text) if p.strip()]
            current_chunk = []
            current_word_count = 0
            current_section = 'General'

            for p in paragraphs:
                # Detect heading candidate
                if len(p) < 80 and (p.isupper() or p.startswith('#') or re.match(r'^(Chapter|Section|\d+\.)', p, re.I)):
                    current_section = p.strip('#* :')

                p_words = len(p.split())
                if current_word_count + p_words > max_chunk_words and current_chunk:
                    chunk_text = '\n\n'.join(current_chunk)
                    chunk_idx += 1
                    chunks.append(DocumentChunk(
                        chunk_id=f"chk_{chunk_idx}",
                        document_id=doc.document_id,
                        filename=doc.filename,
                        page_number=page.page_number,
                        section=current_section,
                        content_type='table' if '| ---' in chunk_text else 'text',
                        source_text=chunk_text,
                        token_estimate=len(chunk_text.split())
                    ))
                    current_chunk = [p]
                    current_word_count = p_words
                else:
                    current_chunk.append(p)
                    current_word_count += p_words

            if current_chunk:
                chunk_text = '\n\n'.join(current_chunk)
                chunk_idx += 1
                chunks.append(DocumentChunk(
                    chunk_id=f"chk_{chunk_idx}",
                    document_id=doc.document_id,
                    filename=doc.filename,
                    page_number=page.page_number,
                    section=current_section,
                    content_type='table' if '| ---' in chunk_text else 'text',
                    source_text=chunk_text,
                    token_estimate=len(chunk_text.split())
                ))

        return chunks
