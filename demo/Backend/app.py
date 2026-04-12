from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile

# OpenAI (optional)
from openai import OpenAI

# Groq (fallback)
from groq import Groq

app = Flask(__name__)
CORS(app)

# ✅ Limit file size
app.config['MAX_CONTENT_LENGTH'] = 20 * 1024 * 1024

# ✅ API Keys
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
GROQ_API_KEY   = os.getenv("GROQ_API_KEY")

if not OPENAI_API_KEY and not GROQ_API_KEY:
    raise ValueError("❌ Set OPENAI_API_KEY or GROQ_API_KEY")

# ✅ Clients
openai_client = OpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
groq_client   = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

# ✅ Allowed formats
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt'}  # 🔥 Removed audio (causing errors)


# ─── HELPERS ─────────────────────────────────────
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


# ─── AI CALLERS ─────────────────────────────────
def call_openai(prompt):
    if not openai_client:
        raise RuntimeError("OpenAI not available")

    response = openai_client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content


def call_groq(prompt):
    if not groq_client:
        raise RuntimeError("Groq not available")

    response = groq_client.chat.completions.create(
        model="llama3-8b-8192",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content


def call_ai(prompt):
    try:
        return call_openai(prompt)
    except Exception as e:
        print("⚠️ OpenAI failed → using Groq:", e)
        return call_groq(prompt)


# ─── AI FEATURES ────────────────────────────────
def generate_summary(text):
    return call_ai(f"Summarize this lecture:\n{text[:3000]}")


def generate_quiz(text):
    return call_ai(f"Create 3 MCQs with answers:\n{text[:3000]}")


# ─── ROUTES ─────────────────────────────────────
@app.route('/')
def home():
    return "🚀 Backend Running (OpenAI + Groq Ready)"


@app.route('/api/health')
def health():
    return jsonify({
        "status": "ok",
        "openai": bool(openai_client),
        "groq": bool(groq_client)
    })


@app.route('/api/process', methods=['POST'])
def process():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']

    if not allowed_file(file.filename):
        return jsonify({"error": "Only PDF, DOCX, TXT supported"}), 400

    ext = file.filename.rsplit('.', 1)[1].lower()

    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp:
        file.save(tmp.name)
        path = tmp.name

    try:
        print("📁 Processing:", file.filename)

        if ext == 'pdf':
            text = extract_text_from_pdf(path)
        elif ext == 'docx':
            text = extract_text_from_docx(path)
        else:
            text = extract_text_from_txt(path)

        if not text or len(text.strip()) < 20:
            return jsonify({"error": "No readable content"}), 400

        summary = generate_summary(text)
        quiz = generate_quiz(text)

        return jsonify({
            "summary": summary,
            "quiz": quiz
        })

    except Exception as e:
        print("❌ ERROR:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        if os.path.exists(path):
            os.remove(path)


if __name__ == "__main__":
    app.run(port=5000)
