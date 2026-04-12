from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
from openai import OpenAI

# ✅ Groq import (fallback AI)
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    print("[WARN] groq not installed — Groq fallback disabled")

app = Flask(__name__)
CORS(app)

# ✅ Limit file size (20MB)
app.config['MAX_CONTENT_LENGTH'] = 20 * 1024 * 1024

# ✅ API Keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GROQ_API_KEY   = os.getenv("GROQ_API_KEY")

if not OPENAI_API_KEY and not GROQ_API_KEY:
    raise ValueError("❌ Missing both OPENAI_API_KEY and GROQ_API_KEY — set at least one!")

# ✅ Clients
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
groq_client   = Groq(api_key=GROQ_API_KEY) if GROQ_AVAILABLE and GROQ_API_KEY else None

# ✅ Allowed formats (STRICT)
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'pdf', 'docx', 'txt'}


# ─── HELPERS ───────────────────────────────────────────────
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_text_from_txt(path):
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        return f.read()


def extract_text_from_pdf(path):
    import PyPDF2
    text = ""
    with open(path, 'rb') as f:
        reader = PyPDF2.PdfReader(f)
        for page in reader.pages:
            text += page.extract_text() or ""
    return text


def extract_text_from_docx(path):
    from docx import Document
    doc = Document(path)
    return "\n".join([p.text for p in doc.paragraphs])


def transcribe_audio(path):
    if not openai_client:
        raise RuntimeError("OpenAI client not available — set OPENAI_API_KEY")
    with open(path, "rb") as f:
        transcript = openai_client.audio.transcriptions.create(
            model="gpt-4o-mini-transcribe",
            file=f
        )
    return transcript.text


# ─── AI CALLERS ────────────────────────────────────────────
def call_openai(prompt):
    """Call OpenAI GPT-4o-mini."""
    if not openai_client:
        raise RuntimeError("OpenAI client not available — set OPENAI_API_KEY")
    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content


def call_groq(prompt):
    """Call Groq llama3-8b-8192."""
    if not groq_client:
        raise RuntimeError("Groq client not available — set GROQ_API_KEY and install groq")
    response = groq_client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content


def call_ai(prompt):
    """
    Fallback-aware AI caller.
    Tries OpenAI first; if that fails (missing key / quota), falls back to Groq.
    This makes the app: Never fail ✅ | Always respond ✅
    """
    try:
        return call_openai(prompt)
    except Exception as e:
        print(f"⚠️  OpenAI failed ({e}), falling back to Groq…")
        return call_groq(prompt)


# ─── AI FEATURES ───────────────────────────────────────────
def generate_summary(text):
    response = call_ai(
        f"Summarize this lecture clearly:\n{text[:4000]}"
    )
    return response


def generate_quiz(text):
    response = call_ai(
        f"Create 3 MCQs with answers from:\n{text[:4000]}"
    )
    return response


# ─── ROUTES ────────────────────────────────────────────────

@app.route('/')
def home():
    return "🚀 LecturAI Backend is Running"


@app.route('/api/health')
def health():
    return jsonify({
        "status": "ok",
        "openai":  openai_client is not None,
        "groq":    groq_client is not None
    })


@app.route('/api/process', methods=['POST'])
def process():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type"}), 400

    ext = file.filename.rsplit('.', 1)[1].lower()

    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp:
        file.save(tmp.name)
        path = tmp.name

    try:
        print(f"📁 Processing file: {file.filename}")

        # 🔹 Extract text
        if ext in ['mp3', 'wav']:
            text = transcribe_audio(path)
        elif ext == 'pdf':
            text = extract_text_from_pdf(path)
        elif ext == 'docx':
            text = extract_text_from_docx(path)
        else:
            text = extract_text_from_txt(path)

        if not text or len(text.strip()) < 20:
            return jsonify({"error": "Could not extract meaningful text"}), 400

        print("🧠 Generating summary...")
        summary = generate_summary(text)

        print("❓ Generating quiz...")
        quiz = generate_quiz(text)

        return jsonify({
            "summary": summary,
            "quiz":    quiz
        })

    except Exception as e:
        print("❌ ERROR:", str(e))
        return jsonify({
            "error": str(e),
            "type":  "backend_error"
        }), 500

    finally:
        if os.path.exists(path):
            os.remove(path)
            print("🧹 Temp file removed")


if __name__ == '__main__':
    app.run(debug=True, port=5000)
