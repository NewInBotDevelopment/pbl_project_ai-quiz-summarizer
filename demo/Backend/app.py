from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
import time

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

# ✅ Stable models (ordered fallback)
GROQ_MODELS = [
    "llama3-70b-8192",
    "mixtral-8x7b-32768"
]

# ✅ Allowed file types
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt'}


# ─── HELPERS ─────────────────────
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_text_from_txt(path):
    try:
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()
    except Exception as e:
        print("TXT error:", e)
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
    except Exception as e:
        print("PDF error:", e)
        return ""


def extract_text_from_docx(path):
    try:
        from docx import Document
        doc = Document(path)
        return "\n".join([p.text for p in doc.paragraphs])
    except Exception as e:
        print("DOCX error:", e)
        return ""


# ─── AI CALL (WITH RETRY + FALLBACK) ─────────────────────
def call_groq(prompt):
    last_error = None

    for model in GROQ_MODELS:
        for attempt in range(2):  # retry each model once
            try:
                print(f"🔄 Trying model: {model} (attempt {attempt+1})")

                response = groq_client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}]
                )

                result = response.choices[0].message.content

                if result:
                    print(f"✅ Success: {model}")
                    return result

            except Exception as e:
                print(f"❌ Failed: {model} → {e}")
                last_error = e
                time.sleep(1)  # wait before retry

    raise RuntimeError(f"All models failed: {last_error}")


# ─── AI FEATURES ─────────────────
def generate_summary(text):
    try:
        result = call_groq(f"Summarize clearly:\n{text[:3000]}")
        return result if result else "⚠️ No summary generated."
    except Exception as e:
        print("Summary error:", e)
        return "⚠️ Could not generate summary."


def generate_quiz(text):
    try:
        result = call_groq(f"Create 3 MCQs with answers:\n{text[:3000]}")
        return result if result else "⚠️ No quiz generated."
    except Exception as e:
        print("Quiz error:", e)
        return "⚠️ Could not generate quiz."


# ─── ROUTES ─────────────────────
@app.route('/')
def home():
    return "🚀 Backend Running (Production Ready)"


@app.route('/api/health')
def health():
    return jsonify({
        "status": "ok",
        "models": GROQ_MODELS
    })


@app.route('/api/process', methods=['POST'])
def process():
    path = None  # ✅ prevent crash in finally

    try:
        # 🔹 Validate file
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({"error": "Empty filename"}), 400

        if not allowed_file(file.filename):
            return jsonify({"error": "Unsupported file type"}), 400

        ext = file.filename.rsplit('.', 1)[1].lower()

        # 🔹 Save temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp:
            file.save(tmp.name)
            path = tmp.name

        print("📁 Processing:", file.filename)

        # 🔹 Extract text
        if ext == 'pdf':
            text = extract_text_from_pdf(path)
        elif ext == 'docx':
            text = extract_text_from_docx(path)
        else:
            text = extract_text_from_txt(path)

        print("📝 Extracted preview:", text[:200])

        # 🔹 Fix empty input
        if not text or len(text.strip()) < 5:
            text = "Short input. Generate a basic summary and quiz."

        # 🔹 AI processing
        summary = generate_summary(text)
        quiz = generate_quiz(text)

        # ✅ FINAL SAFETY (never return empty)
        if not summary:
            summary = "⚠️ Summary unavailable."
        if not quiz:
            quiz = "⚠️ Quiz unavailable."

        return jsonify({
            "summary": summary,
            "quiz": quiz
        })

    except Exception as e:
        print("❌ CRITICAL ERROR:", e)
        return jsonify({"error": "Server failed processing file"}), 500

    finally:
        # 🔹 Safe cleanup
        try:
            if path and os.path.exists(path):
                os.remove(path)
        except Exception as e:
            print("Cleanup error:", e)


if __name__ == "__main__":
    app.run(port=5000)
