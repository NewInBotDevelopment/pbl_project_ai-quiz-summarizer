from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
import time
import json

from groq import Groq

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# ✅ File size limit (20MB)
app.config['MAX_CONTENT_LENGTH'] = 20 * 1024 * 1024

# ✅ API KEY
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("❌ GROQ_API_KEY not set")

groq_client = Groq(api_key=GROQ_API_KEY)

# ✅ Stable models
GROQ_MODELS = [
    "llama3-70b-8192",
    "gemma2-9b-it"
]

# ✅ Allowed file types
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt', 'mp3', 'wav', 'mp4', 'm4a', 'mpeg'}


# ─── HELPERS ─────────────────────
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_text_from_txt(path):
    try:
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    except:
        return ""


def extract_text_from_pdf(path):
    try:
        import PyPDF2
        text = ""
        with open(path, 'rb') as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                text += page.extract_text() or ""
        return text
    except:
        return ""


def extract_text_from_docx(path):
    try:
        from docx import Document
        doc = Document(path)
        return "\n".join([p.text for p in doc.paragraphs])
    except:
        return ""


def extract_transcript_from_audio(path):
    try:
        with open(path, "rb") as file:
            transcription = groq_client.audio.transcriptions.create(
                file=(os.path.basename(path), file.read()),
                model="whisper-large-v3"
            )
        return transcription.text
    except:
        return ""


# ─── AI CALL ─────────────────────
def call_groq(prompt):
    for model in GROQ_MODELS:
        try:
            response = groq_client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"❌ Model failed {model}: {e}")
    raise RuntimeError("All models failed")


# ─── AI OUTPUT ───────────────────
def generate_structured_output(text):
    prompt = f"""You are an AI assistant.

Return ONLY JSON in this format:

{{
  "summary": ["Point 1", "Point 2", "Point 3", "Point 4", "Point 5"],
  "detailed_summary": "Detailed explanation",
  "key_points": ["Point1","Point2","Point3","Point4","Point5","Point6","Point7","Point8"],
  "quiz": {{
    "mcqs": [
      {{"question": "...", "options": ["A","B","C","D"], "answer": 0, "explanation": "..."}}
    ],
    "short_questions": [
      {{"question": "...", "answer": "..."}}
    ]
  }}
}}

Text:
{text[:3000]}
"""

    raw = call_groq(prompt)

    try:
        start = raw.find('{')
        end = raw.rfind('}') + 1
        return json.loads(raw[start:end])
    except:
        raise RuntimeError("JSON parse failed")


# ─── FALLBACK ────────────────────
def fallback(text):
    lines = text.split("\n")
    return {
        "summary": lines[:5],
        "detailed_summary": text[:1000],
        "key_points": lines[:8],
        "quiz": {
            "mcqs": [],
            "short_questions": []
        }
    }


# ─── ROUTES ─────────────────────
@app.route('/')
def home():
    return "🚀 Backend Running"


@app.route('/api/process', methods=['POST'])
def process():
    path = None

    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file"}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({"error": "Empty filename"}), 400

        if not allowed_file(file.filename):
            return jsonify({"error": "Invalid type"}), 400

        ext = file.filename.split('.')[-1].lower()

        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp:
            file.save(tmp.name)
            path = tmp.name

        # Extract text
        if ext in ['mp3', 'wav', 'mp4', 'm4a', 'mpeg']:
            text = extract_transcript_from_audio(path)
        elif ext == 'pdf':
            text = extract_text_from_pdf(path)
        elif ext == 'docx':
            text = extract_text_from_docx(path)
        else:
            text = extract_text_from_txt(path)

        if not text:
            text = "Short content. Generate basic summary."

        try:
            data = generate_structured_output(text)
        except:
            data = fallback(text)

        return jsonify(data)

    except Exception as e:
        print("ERROR:", e)
        return jsonify({"error": str(e)}), 500

    finally:
        if path and os.path.exists(path):
            os.remove(path)


if __name__ == "__main__":
    app.run(port=5000)
