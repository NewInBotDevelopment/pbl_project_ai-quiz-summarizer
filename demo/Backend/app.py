from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import tempfile
import time
import json
from datetime import datetime
from openai import OpenAI

app = Flask(__name__)
CORS(app)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

ALLOWED_EXTENSIONS = {'mp3', 'wav', 'pdf', 'docx', 'txt'}

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
    with open(path, "rb") as f:
        transcript = client.audio.transcriptions.create(
            model="gpt-4o-mini-transcribe",
            file=f
        )
    return transcript.text

def generate_summary(text):
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": f"Summarize this:\n{text[:4000]}"}]
    )
    return response.choices[0].message.content

def generate_quiz(text):
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": f"Create 3 MCQs from:\n{text[:4000]}"}]
    )
    return response.choices[0].message.content

@app.route('/api/health')
def health():
    return jsonify({"status": "ok"})

@app.route('/api/process', methods=['POST'])
def process():
    if 'file' not in request.files:
        return jsonify({"error": "No file"}), 400

    file = request.files['file']

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type"}), 400

    ext = file.filename.rsplit('.', 1)[1].lower()

    with tempfile.NamedTemporaryFile(delete=False, suffix=f".{ext}") as tmp:
        file.save(tmp.name)
        path = tmp.name

    try:
        if ext in ['mp3', 'wav']:
            text = transcribe_audio(path)
        elif ext == 'pdf':
            text = extract_text_from_pdf(path)
        elif ext == 'docx':
            text = extract_text_from_docx(path)
        else:
            text = extract_text_from_txt(path)

        summary = generate_summary(text)
        quiz = generate_quiz(text)

        return jsonify({
            "summary": summary,
            "quiz": quiz
        })

   except Exception as e:
    print("ERROR:", str(e))
    return jsonify({"error": str(e)}), 500

    finally:
        os.remove(path)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
