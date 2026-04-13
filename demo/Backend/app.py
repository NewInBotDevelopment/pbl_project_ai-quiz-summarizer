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
    "llama-3.3-70b-versatile",
    "llama-3.1-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768"
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


def extract_transcript_from_audio(path):
    """Transcribe audio/video using Groq Whisper."""
    try:
        print(f"🎙️ Transcribing: {path}")
        with open(path, "rb") as file:
            transcription = groq_client.audio.transcriptions.create(
                file=(os.path.basename(path), file.read()),
                model="whisper-large-v3",
                response_format="verbose_json",
            )
        
        # Combine segments with timestamps if possible, or just raw text
        full_text = ""
        if hasattr(transcription, 'segments'):
            for s in transcription.segments:
                timestamp = time.strftime('%M:%S', time.gmtime(s['start']))
                full_text += f"[{timestamp}] {s['text']}\n"
        else:
            full_text = transcription.text
            
        return full_text
    except Exception as e:
        print("Whisper error:", e)
        return ""


# ─── AI CALL (WITH RETRY + FALLBACK) ─────────────────────
def call_groq(prompt, max_tokens=4096, json_mode=False):
    last_error = None

    for model in GROQ_MODELS:
        for attempt in range(2):
            try:
                print(f"🔄 Trying model: {model} (attempt {attempt+1})")
                
                kwargs = {
                    "model": model,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": max_tokens,
                }
                
                if json_mode:
                    kwargs["response_format"] = {"type": "json_object"}

                response = groq_client.chat.completions.create(**kwargs)
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
    """Generate HIGHLY DETAILED AI content in a single structured Groq call."""

    prompt = f"""You are a world-class academic analysis assistant. Your goal is to provide a HIGHLY ACCURATE, DEEP, and RIGOROUS analysis of the following lecture/document. 
    
Analyze the text and respond with ONLY a valid JSON object — no markdown code fences, no extra text.

Return this exact JSON structure:
{{
  "summary": ["Detailed bullet 1", "Detailed bullet 2", "Detailed bullet 3", "Detailed bullet 4", "Detailed bullet 5"],
  "detailed_summary": "A comprehensive 4-6 paragraph summary covering every major theme, nuance, and conclusion in the text.",
  "key_points": ["Deep concept 1", "Deep concept 2", "Deep concept 3", "Deep concept 4", "Deep concept 5", "Deep concept 6", "Deep concept 7", "Deep concept 8"],
  "quiz": {{
    "mcqs": [
      {{ "question": "...", "options": ["A", "B", "C", "D"], "answer": 0, "explanation": "..." }},
      // ... total 10 MCQs ...
    ],
    "short_questions": [
      {{ "question": "...", "answer": "..." }},
      // ... total 5 short questions ...
    ]
  }}
}}

    Rules:
    - accuracy: Ensure every point is factual based ONLY on the provided text.
    - detail: Do not be generic. Use specific terms, names, and data from the text.
    - ignore_noise: Skip any Table of Contents, indices, or bibliographic references at the beginning/end. Focus on the core educational content.
    - summary: 5 long, information-dense bullet points summarizing the main message.
    - detailed_summary: Highly professional, academic tone, multi-paragraph (4-6 paragraphs).
    - key_points: exactly 8 technical concepts or main arguments.
    - quiz.mcqs: exactly 10 high-quality MCQs covering the entire document. "answer" is 0-3.
    - quiz.short_questions: exactly 5 challenging questions with detailed (100+ word) model answers.
    - Respond with ONLY the JSON object.

    Document text:
    {text[:40000]}
    """
    
    raw = call_groq(prompt, max_tokens=4096, json_mode=True)

    # Smart Extraction: Find the outermost braces
    try:
        start = raw.find('{')
        end = raw.rfind('}') + 1
        if start != -1 and end > start:
            return json.loads(raw[start:end])
        return json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"⚠️ JSON parse failed: {e}")
        # Log the raw response for debugging
        print(f"RAW RESPONSE: {raw[:500]}...")
        raise RuntimeError(f"Could not parse AI response as JSON.")


def _build_fallback(text):
    """Return a more robust fallback result if the AI call fails."""
    lines = [l.strip() for l in text.split("\n") if l.strip()]
    bullets = lines[:5] if len(lines) >= 5 else (lines + ["Key lesson from the document."] * 5)[:5]
    key_pts = lines[:8] if len(lines) >= 8 else (lines + ["Important technical concept."] * 8)[:8]

    return {
        "summary": bullets,
        "detailed_summary": f"Could not generate AI summary. Here is the direct text extraction:\n\n{text[:1500]}...",
        "key_points": key_pts,
        "quiz": {
            "mcqs": [
                {
                    "question": "Based on the title or first lines, what is this document primarily about?",
                    "options": [lines[0][:50] if lines else "Topic A", "General Overview", "Technical Deep-dive", "Case Study"],
                    "answer": 0,
                    "explanation": "Inferred from the document start."
                },
                {
                    "question": "Which of these is likely a key theme?",
                    "options": ["Analysis", "Implementation", "Overview", "All of the above"],
                    "answer": 3,
                    "explanation": "Fallback general question."
                },
                {
                    "question": "The text extracted suggests a length of approximately how many words?",
                    "options": ["Under 500", "Around 1000", "Over 2000", "Varies"],
                    "answer": 3,
                    "explanation": "Determined by extraction."
                }
            ],
            "short_questions": [
                {
                    "question": "What is the primary objective of this material?",
                    "answer": "Please review the full transcript below as the AI was unable to process a high-detail summary for this specific file."
                },
                {
                    "question": "List three important terms found in the text.",
                    "answer": ", ".join(key_pts[:3])
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
        audio_exts = {'mp3', 'wav', 'mp4', 'm4a', 'mpeg'}
        if ext in audio_exts:
            text = extract_transcript_from_audio(path)
        elif ext == 'pdf':
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
