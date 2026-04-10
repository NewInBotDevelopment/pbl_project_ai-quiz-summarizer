"""
====================================================
AI Lecture Summarizer & Quiz Generator — Flask API
====================================================
Author: Lakshya Katiyar & Prithvi Raj Singh
University: Manipal University Jaipur
Department: Computer Science & Engineering
Year: 2026
====================================================

SETUP:
  pip install -r requirements.txt
  python app.py

ENDPOINTS:
  POST /api/process   — Upload file, returns AI analysis JSON
  GET  /api/health    — Health check
  GET  /api/history   — Recent processing logs
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
import time
import json
import logging
from datetime import datetime
from pathlib import Path

# ──────────────────────────────────────────────
# OPTIONAL IMPORTS (fail gracefully if not installed)
# ──────────────────────────────────────────────
try:
    import openai
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False
    print("[WARN] openai not installed — AI features disabled")

try:
    import whisper
    WHISPER_AVAILABLE = True
except ImportError:
    WHISPER_AVAILABLE = False
    print("[WARN] openai-whisper not installed — ASR disabled")

try:
    import PyPDF2
    PDF_AVAILABLE = True
except ImportError:
    PDF_AVAILABLE = False
    print("[WARN] PyPDF2 not installed — PDF extraction disabled")

try:
    from docx import Document as DocxDocument
    DOCX_AVAILABLE = True
except ImportError:
    DOCX_AVAILABLE = False
    print("[WARN] python-docx not installed — DOCX extraction disabled")

try:
    from moviepy.editor import VideoFileClip
    MOVIEPY_AVAILABLE = True
except ImportError:
    MOVIEPY_AVAILABLE = False
    print("[WARN] moviepy not installed — video extraction disabled")


# ──────────────────────────────────────────────
# FLASK APP SETUP
# ──────────────────────────────────────────────
app = Flask(__name__)
CORS(app, origins=["*"])  # Allow all origins for local dev

logging.basicConfig(level=logging.INFO, format='%(asctime)s — %(levelname)s — %(message)s')
logger = logging.getLogger(__name__)

# Configuration
UPLOAD_FOLDER = tempfile.gettempdir()
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'mp4', 'webm', 'pdf', 'docx', 'doc', 'txt'}
MAX_FILE_SIZE_MB = 100
OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY', 'YOUR_API_KEY_HERE')  # Set via env var

# Processing history (in-memory; use DB in production)
processing_history = []


# ──────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────

def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def get_file_extension(filename: str) -> str:
    return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''


def extract_audio_from_video(video_path: str, output_path: str) -> str:
    """Extract audio from video file using moviepy."""
    if not MOVIEPY_AVAILABLE:
        raise RuntimeError("moviepy not installed. Install with: pip install moviepy")
    clip = VideoFileClip(video_path)
    clip.audio.write_audiofile(output_path, logger=None)
    clip.close()
    return output_path


def transcribe_audio(audio_path: str) -> str:
    """Transcribe audio file using OpenAI Whisper."""
    if not WHISPER_AVAILABLE:
        return "[ASR unavailable — install openai-whisper to enable transcription]"

    logger.info(f"Loading Whisper model (base)…")
    model = whisper.load_model("base")
    result = model.transcribe(audio_path, fp16=False)
    return result.get("text", "").strip()


def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text content from a PDF file."""
    if not PDF_AVAILABLE:
        return "[PDF extraction unavailable — install PyPDF2]"

    text_parts = []
    with open(pdf_path, 'rb') as f:
        reader = PyPDF2.PdfReader(f)
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n\n".join(text_parts)


def extract_text_from_docx(docx_path: str) -> str:
    """Extract text from a DOCX file."""
    if not DOCX_AVAILABLE:
        return "[DOCX extraction unavailable — install python-docx]"

    doc = DocxDocument(docx_path)
    return "\n".join(para.text for para in doc.paragraphs if para.text.strip())


def extract_text_from_txt(txt_path: str) -> str:
    """Read plain text file."""
    with open(txt_path, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read()


def get_transcript(file_path: str, extension: str) -> str:
    """
    Get text content from any supported file type.
    Routes to the correct extractor based on extension.
    """
    logger.info(f"Extracting text from .{extension} file…")

    if extension in ('mp3', 'wav'):
        return transcribe_audio(file_path)
    elif extension in ('mp4', 'webm'):
        audio_path = file_path.replace(f'.{extension}', '_audio.wav')
        extract_audio_from_video(file_path, audio_path)
        transcript = transcribe_audio(audio_path)
        if os.path.exists(audio_path):
            os.remove(audio_path)
        return transcript
    elif extension == 'pdf':
        return extract_text_from_pdf(file_path)
    elif extension in ('docx', 'doc'):
        return extract_text_from_docx(file_path)
    elif extension == 'txt':
        return extract_text_from_txt(file_path)
    else:
        return "[Unsupported file type]"


def call_openai(prompt: str, system: str = None, max_tokens: int = 1200) -> str:
    """
    Call the OpenAI ChatCompletion API.
    Returns the model's response text.
    """
    if not OPENAI_AVAILABLE:
        raise RuntimeError("openai package not installed")

    client = openai.OpenAI(api_key=OPENAI_API_KEY)
    messages = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=messages,
        max_tokens=max_tokens,
        temperature=0.5,
    )
    return response.choices[0].message.content.strip()


def generate_summary(transcript: str) -> dict:
    """
    Generate short summary bullets, detailed summary, and key points
    using OpenAI GPT.
    """
    logger.info("Generating AI summary…")

    # Truncate if very long (token limit)
    truncated = transcript[:6000] if len(transcript) > 6000 else transcript

    # Short summary (bullets)
    bullet_prompt = f"""You are an expert educational content summarizer.

Given the following lecture transcript, produce exactly 5 concise bullet points summarizing the main topics covered.
Return ONLY a JSON array of 5 strings, nothing else. Example: ["Point 1", "Point 2", ...]

TRANSCRIPT:
{truncated}"""

    bullet_response = call_openai(bullet_prompt, max_tokens=600)

    try:
        # Clean up markdown code fences if present
        cleaned = bullet_response.strip().lstrip('```json').lstrip('```').rstrip('```').strip()
        bullets = json.loads(cleaned)
    except Exception:
        bullets = [line.strip('•- ').strip() for line in bullet_response.split('\n') if line.strip()][:5]

    # Detailed summary
    detailed_prompt = f"""You are an expert educational content summarizer.

Write a comprehensive 3-paragraph summary of the following lecture transcript.
Be clear, informative, and maintain academic tone. Return plain text only.

TRANSCRIPT:
{truncated}"""

    detailed = call_openai(detailed_prompt, max_tokens=800)

    # Key points
    keypoints_prompt = f"""Given the following lecture transcript, list exactly 8 key concepts, facts, or takeaways.
Return ONLY a JSON array of 8 strings. Example: ["Key point 1", ...]

TRANSCRIPT:
{truncated}"""

    kp_response = call_openai(keypoints_prompt, max_tokens=500)
    try:
        cleaned_kp = kp_response.strip().lstrip('```json').lstrip('```').rstrip('```').strip()
        key_points = json.loads(cleaned_kp)
    except Exception:
        key_points = [line.strip('•- ').strip() for line in kp_response.split('\n') if line.strip()][:8]

    return {
        "summary": bullets,
        "detailed_summary": detailed,
        "key_points": key_points
    }


def generate_quiz(transcript: str) -> dict:
    """
    Generate 5 MCQs and 3 short questions from the transcript
    using OpenAI GPT.
    """
    logger.info("Generating quiz questions…")

    truncated = transcript[:5000] if len(transcript) > 5000 else transcript

    quiz_prompt = f"""You are an educational quiz generator.

Based on the following lecture transcript, generate a quiz in EXACTLY this JSON format:

{{
  "mcqs": [
    {{
      "question": "...",
      "options": ["A option", "B option", "C option", "D option"],
      "answer": 0,
      "explanation": "Brief explanation of why this is correct"
    }}
  ],
  "short_questions": [
    {{
      "question": "...",
      "answer": "Detailed model answer"
    }}
  ]
}}

Rules:
- Generate exactly 5 MCQs. Each MCQ has exactly 4 options.
- "answer" is the 0-based INDEX of the correct option (0=A, 1=B, 2=C, 3=D).
- Generate exactly 3 short answer questions with detailed model answers.
- Base all questions on content from the transcript.
- Return ONLY valid JSON, no other text.

TRANSCRIPT:
{truncated}"""

    response = call_openai(quiz_prompt, max_tokens=2000)

    try:
        cleaned = response.strip().lstrip('```json').lstrip('```').rstrip('```').strip()
        quiz = json.loads(cleaned)
    except Exception as e:
        logger.error(f"Quiz JSON parse error: {e}")
        # Return safe fallback
        quiz = {
            "mcqs": [
                {
                    "question": "What is the main topic of this lecture?",
                    "options": ["Science", "Technology", "The lecture content", "History"],
                    "answer": 2,
                    "explanation": "The lecture covers the main topic discussed in the content."
                }
            ],
            "short_questions": [
                {
                    "question": "Summarize the key concept from this lecture.",
                    "answer": "The lecture covers important concepts as discussed in the transcript."
                }
            ]
        }

    return quiz


# ──────────────────────────────────────────────
# API ROUTES
# ──────────────────────────────────────────────

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
        "capabilities": {
            "openai": OPENAI_AVAILABLE,
            "whisper_asr": WHISPER_AVAILABLE,
            "pdf_extraction": PDF_AVAILABLE,
            "docx_extraction": DOCX_AVAILABLE,
            "video_extraction": MOVIEPY_AVAILABLE
        }
    })


@app.route('/api/process', methods=['POST'])
def process_file():
    """
    Main endpoint: accepts file upload, extracts text,
    generates AI summary + quiz, returns JSON.
    """
    start_time = time.time()

    # ── Validate request ──
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files['file']

    if not file.filename or file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": f"File type not allowed. Supported: {', '.join(ALLOWED_EXTENSIONS)}"}), 400

    extension = get_file_extension(file.filename)

    # ── Save to temp file ──
    with tempfile.NamedTemporaryFile(
        delete=False,
        suffix=f'.{extension}',
        dir=UPLOAD_FOLDER
    ) as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    try:
        logger.info(f"Processing file: {file.filename} ({extension})")

        # ── Step 1: Extract text / transcript ──
        transcript = get_transcript(tmp_path, extension)

        if not transcript or len(transcript.strip()) < 50:
            return jsonify({"error": "Could not extract meaningful text from the file. Please try a different file."}), 422

        # ── Step 2: Generate summary & key points ──
        summary_result = generate_summary(transcript)

        # ── Step 3: Generate quiz ──
        quiz = generate_quiz(transcript)

        # ── Compile final result ──
        elapsed = round(time.time() - start_time, 1)
        word_count = len(transcript.split())

        result = {
            "filename": file.filename,
            "processTime": f"{elapsed}s",
            "wordCount": word_count,
            "transcript": transcript[:3000] + ("…[truncated]" if len(transcript) > 3000 else ""),
            "summary": summary_result["summary"],
            "detailed_summary": summary_result["detailed_summary"],
            "key_points": summary_result["key_points"],
            "quiz": quiz
        }

        # Log to history
        processing_history.append({
            "filename": file.filename,
            "timestamp": datetime.utcnow().isoformat(),
            "processTime": f"{elapsed}s",
            "wordCount": word_count
        })
        if len(processing_history) > 50:
            processing_history.pop(0)

        logger.info(f"✅ Completed in {elapsed}s — {word_count} words")
        return jsonify(result)

    except Exception as e:
        logger.error(f"Processing error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500

    finally:
        # Clean up temp file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@app.route('/api/history', methods=['GET'])
def get_history():
    """Return recent processing history."""
    return jsonify({
        "history": processing_history[-10:],
        "total": len(processing_history)
    })


# ──────────────────────────────────────────────
# ENTRY POINT
# ──────────────────────────────────────────────
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'true').lower() == 'true'

    print(f"""
╔══════════════════════════════════════════════╗
║   AI Lecture Summarizer — Flask Backend      ║
║   Manipal University Jaipur, CSE 2026        ║
╠══════════════════════════════════════════════╣
║  URL    : http://localhost:{port}               ║
║  Health : http://localhost:{port}/api/health    ║
║  Debug  : {debug}                            ║
╚══════════════════════════════════════════════╝
    """)

    app.run(host='0.0.0.0', port=port, debug=debug)
