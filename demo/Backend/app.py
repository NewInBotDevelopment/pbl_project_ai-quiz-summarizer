from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile

from groq import Groq

app = Flask(__name__)
CORS(app)

# ✅ File size limit (20MB)
app.config['MAX_CONTENT_LENGTH'] = 20 * 1024 * 1024

# ✅ API Key
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("❌ GROQ_API_KEY not set")

groq_client = Groq(api_key=GROQ_API_KEY)

# ✅ Stable working models
GROQ_MODELS = [
    "llama3-70b-8192",
    "mixtral-8x7b-32768"
]

# ✅ Allowed file types
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt'}


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


# ─── AI CALL (AUTO SWITCH) ───────────────────────
def call_groq(prompt):
    last_error = None

    for model in GROQ_MODELS:
        try:
            print(f"🔄 Trying model: {model}")

            response = groq_client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}]
            )

            print(f"✅ Success: {model}")
            return response.choices[0].message.content

        except Exception as e:
            print(f"❌ Failed: {model} → {e}")
            last_error = e

    raise RuntimeError(f"All models failed: {last_error}")


# ─── AI FEATURES ────────────────────────────────
def generate_summary(text):
    return call_groq(f"Summarize this lecture clearly:\n{text[:3000]}")


def generate_quiz(text):
    return call_groq(f"Create 3 MCQs with answers:\n{text[:3000]}")


# ─── ROUTES ─────────────────────────────────────
@app.route('/')
def home():
    return "🚀 Backend Running (Groq Only Mode)"


@app.route('/api/health')
def health():
    return jsonify({
        "status": "ok",
        "groq": True,
        "models": GROQ_MODELS
    })


@app.route('/api/process', methods=['POST'])
def process():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Only PDF, DOCX, TXT supported"}), 400

    ext = file.filename.rsplit('.', 1)[1].lower()

    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp:
        file.save(tmp.name)
        path = tmp.name

    try:
        print("📁 Processing:", file.filename)

        # 🔹 Extract text
        if ext == 'pdf':
            text = extract_text_from_pdf(path)
        elif ext == 'docx':
            text = extract_text_from_docx(path)
        else:
            text = extract_text_from_txt(path)

        print("📝 Extracted:", text[:200])

        # ✅ Prevent empty text crash
        if not text or len(text.strip()) < 5:
            text = "This is a short document. Generate a simple summary and quiz."

        # 🔹 AI processing
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
