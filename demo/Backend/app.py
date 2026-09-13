# LecturAI Clean Flask Application Backend
# Production-ready, free-first, grounded document intelligence server

import os
import time
import tempfile
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load local environment variables if available
load_dotenv()

from llm_provider import get_provider
from document_pipeline import DocumentParser
from retrieval import HybridRetriever
from generation_pipeline import GroundedGenerator

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
logger = logging.getLogger('LecturAI-App')

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Limit upload file size (25MB)
app.config['MAX_CONTENT_LENGTH'] = 25 * 1024 * 1024

ALLOWED_EXTENSIONS = {'pdf', 'pptx', 'ppt', 'docx', 'doc', 'txt', 'md', 'mp3', 'wav', 'mp4', 'm4a', 'mpeg'}

# In-memory session cache for Ask-Your-Document Q&A
# Maps doc_id -> (Document, HybridRetriever)
DOCUMENT_CACHE = {}

def allowed_file(filename: str) -> bool:
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/', methods=['GET'])
def root():
    return jsonify({
        "service": "LecturAI Document Intelligence Backend",
        "status": "online",
        "version": "2.0.0-grounded"
    })


@app.route('/api/health', methods=['GET'])
def health():
    provider = get_provider()
    models = provider.get_models()
    return jsonify({
        "status": "ok",
        "provider": type(provider).__name__,
        "models": models,
        "primary_model": models[0] if models else "none",
        "fallback_model": models[1] if len(models) > 1 else "none",
        "supported_extensions": list(ALLOWED_EXTENSIONS)
    })


@app.route('/api/process', methods=['POST'])
def process():
    start_time = time.time()
    temp_path = None

    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded. Please select a document."}), 400

        file = request.files['file']
        if not file.filename:
            return jsonify({"error": "Selected file has an empty filename."}), 400

        if not allowed_file(file.filename):
            return jsonify({
                "error": f"Unsupported file type. Supported formats: {', '.join(sorted(ALLOWED_EXTENSIONS)).upper()}"
            }), 400

        ext = file.filename.rsplit('.', 1)[1].lower()

        # Save to safe temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp:
            file.save(tmp.name)
            temp_path = tmp.name

        logger.info(f"Processing uploaded file: {file.filename} (temp: {temp_path})")

        # Stage 1: Document Parsing & Hierarchy Extraction
        doc = DocumentParser.parse(temp_path, file.filename)

        if not doc.pages or sum(p.word_count for p in doc.pages) < 5:
            return jsonify({
                "error": "The uploaded document contains little to no readable text or content. Please upload a document with extractable text or clear audio."
            }), 422

        # Stage 2: Index into Local Hybrid Retrieval
        retriever = HybridRetriever(doc)

        # Cache for interactive Ask-Your-Document Q&A
        DOCUMENT_CACHE[doc.document_id] = (doc, retriever)
        # Keep cache bounded to last 10 documents
        if len(DOCUMENT_CACHE) > 10:
            oldest_key = next(iter(DOCUMENT_CACHE))
            DOCUMENT_CACHE.pop(oldest_key, None)

        # Stage 3: Multi-Stage Grounded Generation
        provider = get_provider()
        generator = GroundedGenerator(provider)
        results = generator.generate_all(doc, retriever)

        elapsed = round(time.time() - start_time, 1)

        # Return full backwards-compatible payload + advanced PBL features
        response_payload = {
            "document_id": doc.document_id,
            "filename": doc.filename,
            "wordCount": doc.statistics.get("total_words", 0),
            "processTime": f"{elapsed}s",
            "transcript": doc.full_text[:8000],

            # Backwards compatible core fields
            "summary": results["summary"],
            "summary_sources": results["summary_sources"],
            "detailed_summary": results["detailed_summary"],
            "key_points": results["key_points"],
            "key_points_sources": results["key_points_sources"],
            "quiz": results["quiz"],

            # Advanced Document Intelligence additions
            "document_overview": results["document_overview"],
            "coverage": results["coverage"],
            "knowledge_map": results["knowledge_map"],
            "grounding_report": results["grounding_report"]
        }

        logger.info(f"Successfully processed {doc.filename} in {elapsed}s with coverage {results['coverage']['coverage_score']}%")
        return jsonify(response_payload)

    except Exception as e:
        logger.exception(f"Processing failed for file: {e}")
        # Never dump raw text as summary. Return clear, informative status
        return jsonify({
            "error": f"Document processing failed: {str(e)}",
            "details": "The system attempted multi-model extraction and fallback, but could not complete generation safely."
        }), 500

    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as ce:
                logger.warning(f"Failed to clean temporary file {temp_path}: {ce}")


@app.route('/api/ask', methods=['POST'])
def ask_document():
    """Grounded Ask-Your-Document Q&A."""
    try:
        data = request.get_json(force=True)
        doc_id = data.get("document_id")
        question = data.get("question", "").strip()

        if not question:
            return jsonify({"error": "Question parameter is required."}), 400

        # Retrieve cached document
        if doc_id and doc_id in DOCUMENT_CACHE:
            doc, retriever = DOCUMENT_CACHE[doc_id]
        elif DOCUMENT_CACHE:
            # Fallback to most recent document
            doc_id = list(DOCUMENT_CACHE.keys())[-1]
            doc, retriever = DOCUMENT_CACHE[doc_id]
        else:
            return jsonify({
                "answer": "No active document session found. Please upload a document first.",
                "source_pages": [],
                "grounded": False
            }), 404

        provider = get_provider()
        generator = GroundedGenerator(provider)
        ans = generator.answer_question(question, doc, retriever)

        return jsonify(ans)

    except Exception as e:
        logger.exception(f"Ask document failed: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    logger.info(f"Starting LecturAI Grounded Backend on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=False)
