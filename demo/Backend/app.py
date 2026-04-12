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

# ✅ Valid Groq models (ordered fallback)
GROQ_MODELS = [
    "llama3-70b-8192",
    "llama3-8b-8192",
    "gemma2-9b-it"
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
def call_groq(prompt, max_tokens=2048):
    last_error = None

    for model in GROQ_MODELS:
        for attempt in range(2):
            try:
                print(f"🔄 Trying model: {model} (attempt {attempt+1})")
                response = groq_client.chat.completions.create(
                    model=model,
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=max_tokens
                )
                result = response.choices[0].message.content
                if result:
                    print(f"✅ Success: {model}")
                    return result
            except Exception as e:
                print(f"❌ Failed: {model} → {e}")
                last_error = e
                time.sleep(1)

    raise RuntimeError(f"All models failed: {last_error}")


# ─── STRUCTURED AI OUTPUT ────────
def generate_structured_output(text, filename):
    """Generate ALL AI content in a single structured Groq call."""

    prompt = f"""You are an AI lecture analysis assistant. Analyze the following lecture/document text and respond with ONLY a valid JSON object — no markdown, no extra text.

Return this exact JSON structure:
{{
  "summary": ["bullet point 1", "bullet point 2", "bullet point 3", "bullet point 4", "bullet point 5"],
  "detailed_summary": "A detailed 2-3 paragraph summary of the content.",
  "key_points": ["concept 1", "concept 2", "concept 3", "concept 4", "concept 5", "concept 6"],
  "quiz": {{
    "mcqs": [
      {{
        "question": "Question text?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "answer": 0,
        "explanation": "Why this answer is correct."
      }},
      {{
        "question": "Second question?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "answer": 1,
        "explanation": "Explanation here."
      }},
      {{
        "question": "Third question?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "answer": 2,
        "explanation": "Explanation here."
      }},
      {{
        "question": "Fourth question?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "answer": 0,
        "explanation": "Explanation here."
      }},
      {{
        "question": "Fifth question?",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "answer": 3,
        "explanation": "Explanation here."
      }}
    ],
    "short_questions": [
      {{
        "question": "Short answer question 1?",
        "answer": "Detailed model answer."
      }},
      {{
        "question": "Short answer question 2?",
        "answer": "Detailed model answer."
      }},
      {{
        "question": "Short answer question 3?",
        "answer": "Detailed model answer."
      }}
    ]
  }}
}}

Rules:
- summary: exactly 5 concise bullet strings
- key_points: exactly 6 short concept strings
- quiz.mcqs: exactly 5 MCQs, "answer" is the 0-based index of the correct option
- quiz.short_questions: exactly 3 questions with detailed answers
- Respond with ONLY the JSON object, nothing else.

Document text:
{text[:4000]}"""

    raw = call_groq(prompt, max_tokens=3000)

    # Strip markdown code fences if the model wraps the JSON
    raw = raw.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        # parts[1] is the content between first pair of ```
        raw = parts[1]
        if raw.lower().startswith("json"):
            raw = raw[4:]
    raw = raw.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"⚠️ JSON parse failed: {e}")
        # Best-effort: try to extract JSON from the response
        start = raw.find('{')
        end = raw.rfind('}') + 1
        if start != -1 and end > start:
            try:
                return json.loads(raw[start:end])
            except Exception:
                pass
        raise RuntimeError(f"Could not parse AI response as JSON: {raw[:300]}")


def _build_fallback(text):
    """Return a basic structured result without a second API call."""
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    bullets = lines[:5] if len(lines) >= 5 else lines + ["Key concept from the document."] * (5 - len(lines))
    key_pts = lines[:6] if len(lines) >= 6 else lines + ["Important concept."] * (6 - len(lines))

    return {
        "summary": bullets,
        "detailed_summary": text[:1000],
        "key_points": key_pts,
        "quiz": {
            "mcqs": [
                {
                    "question": "What is the primary subject of this document?",
                    "options": ["Topic A", "Topic B", "Topic C", "Topic D"],
                    "answer": 0,
                    "explanation": "Based on the document content."
                }
            ],
            "short_questions": [
                {
                    "question": "Summarize the key takeaways from this document.",
                    "answer": text[:300] if text else "Please refer to the source document."
                }
            ]
        }
    }


# ─── ROUTES ─────────────────────
@app.route('/')
def home():
    return "🚀 LecturAI Backend Running"


@app.route('/api/health')
def health():
    return jsonify({"status": "ok", "models": GROQ_MODELS})


@app.route('/api/process', methods=['POST'])
def process():
    path = None
    start_time = time.time()

    try:
        # Validate file presence
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files['file']

        if file.filename == '':
            return jsonify({"error": "Empty filename"}), 400

        if not allowed_file(file.filename):
            return jsonify({"error": f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS).upper()}"}), 400

        ext = file.filename.rsplit('.', 1)[1].lower()

        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp:
            file.save(tmp.name)
            path = tmp.name

        print("📁 Processing:", file.filename)

        # Extract text
        if ext == 'pdf':
            text = extract_text_from_pdf(path)
        elif ext == 'docx':
            text = extract_text_from_docx(path)
        else:
            text = extract_text_from_txt(path)

        print("📝 Extracted preview:", text[:200])

        if not text or len(text.strip()) < 5:
            text = "This is a short or empty document. Generate a basic educational summary and quiz about AI and machine learning."

        word_count = len(text.split())

        # AI processing
        try:
            ai_data = generate_structured_output(text, file.filename)
        except Exception as ai_err:
            print(f"⚠️ AI structured call failed, using fallback: {ai_err}")
            ai_data = _build_fallback(text)

        elapsed = round(time.time() - start_time, 1)

        return jsonify({
            "filename": file.filename,
            "wordCount": word_count,
            "processTime": f"{elapsed}s",
            "transcript": text[:5000],
            "summary": ai_data.get("summary", ["Summary unavailable."]),
            "detailed_summary": ai_data.get("detailed_summary", "Detailed summary unavailable."),
            "key_points": ai_data.get("key_points", []),
            "quiz": ai_data.get("quiz", {"mcqs": [], "short_questions": []})
        })

    except Exception as e:
        print("❌ CRITICAL ERROR:", e)
        return jsonify({"error": f"Server failed: {str(e)}"}), 500

    finally:
        try:
            if path and os.path.exists(path):
                os.remove(path)
        except Exception as e:
            print("Cleanup error:", e)


if __name__ == "__main__":
    app.run(port=5000)
