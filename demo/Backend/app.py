from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile

from groq import Groq

app = Flask(__name__)
CORS(app)

# ✅ File size limit
app.config['MAX_CONTENT_LENGTH'] = 20 * 1024 * 1024

# ✅ API KEY
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("❌ GROQ_API_KEY not set")

groq_client = Groq(api_key=GROQ_API_KEY)

# ✅ Stable models
GROQ_MODELS = [
    "llama3-70b-8192",
    "mixtral-8x7b-32768"
]

# ✅ Allowed files
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt'}

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


# ─── AI CALL ─────────────────────
def call_groq(prompt):
    last_error = None

    for model in GROQ_MODELS:
        try:
            print(f"🔄 Trying model: {model}")

            response = groq_client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}]
            )

            return response.choices[0].message.content

        except Exception as e:
            print(f"❌ Model failed: {model} → {e}")
            last_error = e

    raise RuntimeError(str(last_error))


# ─── AI FEATURES ─────────────────
def generate_summary(text):
    try:
        return call_groq(f"Summarize clearly:\n{text[:3000]}")
    except:
        return "⚠️ Could not generate summary."


def generate_quiz(text):
    try:
        return call_groq(f"Create 3 MCQs with answers:\n{text[:3000]}")
    except:
        return "⚠️ Could not generate quiz."


# ─── ROUTES ─────────────────────
@app.route('/')
def home():
    return "🚀 Backend Running (Stable Mode)"


@app.route('/api/health')
def health():
    return jsonify({
        "status": "ok",
        "models": GROQ_MODELS
    })


@app.route('/api/process', methods=['POST'])
def process():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({"error": "Empty filename"}), 400

        if not allowed_file(file.filename):
            return jsonify({"error": "Unsupported file type"}), 400

        ext = file.filename.rsplit('.', 1)[1].lower()

        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp:
            file.save(tmp.name)
            path = tmp.name

        # ─── TEXT EXTRACTION ───
        if ext == 'pdf':
            text = extract_text_from_pdf(path)
        elif ext == 'docx':
            text = extract_text_from_docx(path)
        else:
            text = extract_text_from_txt(path)

        print("📝 Extracted:", text[:200])

        # ✅ Fix empty text
        if not text or len(text.strip()) < 5:
            text = "Short input. Generate a basic summary and quiz."

        # ─── AI PROCESS ───
        summary = generate_summary(text)
        quiz = generate_quiz(text)

        return jsonify({
            "summary": summary,
            "quiz": quiz
        })

    except Exception as e:
        print("❌ ERROR:", e)
        return jsonify({"error": "Server failed processing file"}), 500

    finally:
        try:
            if os.path.exists(path):
                os.remove(path)
        except:
            pass


if __name__ == "__main__":
    app.run(port=5000)
