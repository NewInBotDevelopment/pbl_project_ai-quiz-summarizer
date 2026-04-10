/* =========================================================
   RESULTS PAGE — results.js
   Reads data from localStorage (set by script.js) and
   renders all sections. Handles tabs, MCQ interaction,
   copy, download, share, and toast notifications.
   ========================================================= */

'use strict';

// ─── STATE ──────────────────────────────────────────────────
let _data = null;
let _answersVisible = false;

// ─── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  _loadData();
});

function _loadData() {
  try {
    const raw = localStorage.getItem('lecturAI_results');
    _data = raw ? JSON.parse(raw) : _fallback();
  } catch {
    _data = _fallback();
    showToast('Using demo data (parse error)', 'info');
  }
  if (!_data) { _data = _fallback(); showToast('Showing demo results', 'info'); }
  _renderAll();
}

function _renderAll() {
  _renderHeader();
  _renderSummary();
  _renderKeyPoints();
  _renderQuiz();
  _renderTranscript();
  _updateCounts();
}

// ─── HEADER ──────────────────────────────────────────────────
function _renderHeader() {
  const fn = document.getElementById('resultsFilename');
  const sw = document.getElementById('statWords');
  const st = document.getElementById('statTime');
  const sq = document.getElementById('statQuiz');
  if (fn) fn.textContent = _data.filename || 'lecture.mp4';
  if (sw) sw.textContent = `📝 ${(_data.wordCount || 0).toLocaleString()} words`;
  if (st) st.textContent = `⚡ ${_data.processTime || '—'}`;
  const qTotal = (_data.quiz?.mcqs?.length || 0) + (_data.quiz?.short_questions?.length || 0);
  if (sq) sq.textContent = `❓ ${qTotal} questions`;
}

function _updateCounts() {
  const kpEl = document.getElementById('kp-count');
  const qcEl = document.getElementById('quiz-count');
  if (kpEl) kpEl.textContent = _data.key_points?.length || 0;
  if (qcEl) {
    const t = (_data.quiz?.mcqs?.length || 0) + (_data.quiz?.short_questions?.length || 0);
    qcEl.textContent = t;
  }
}

// ─── SUMMARY ─────────────────────────────────────────────────
function _renderSummary() {
  // Quick bullets
  const qBody = document.getElementById('quickSummaryBody');
  if (qBody && _data.summary?.length) {
    qBody.innerHTML = '';
    _data.summary.forEach((pt, i) => {
      const li = document.createElement('li');
      li.className = 'summary-item';
      li.innerHTML = `<span class="summary-item-num" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><span>${pt}</span>`;
      qBody.appendChild(li);
    });
  }

  // Detailed
  const dBody = document.getElementById('detailSummaryBody');
  if (dBody && _data.detailed_summary) {
    dBody.innerHTML = _data.detailed_summary
      .split('\n\n')
      .filter(p => p.trim())
      .map(p => `<p class="detail-para">${p.replace(/\n/g, '<br>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</p>`)
      .join('');
  }
}

// ─── KEY POINTS ──────────────────────────────────────────────
function _renderKeyPoints() {
  const container = document.getElementById('kpGridBody');
  if (!container || !_data.key_points?.length) return;
  container.innerHTML = '';
  _data.key_points.forEach((pt, i) => {
    const card = document.createElement('div');
    card.className = 'kp-card';
    card.setAttribute('role', 'listitem');
    card.innerHTML = `
      <div class="kp-num" aria-hidden="true">${String(i+1).padStart(2,'0')}</div>
      <div class="kp-text">${pt}</div>
    `;
    container.appendChild(card);
  });
}

// ─── MCQ ─────────────────────────────────────────────────────
function _renderQuiz() {
  _renderMCQs(_data.quiz?.mcqs || []);
  _renderShortQs(_data.quiz?.short_questions || []);
}

const LETTERS = ['A','B','C','D'];

function _renderMCQs(mcqs) {
  const container = document.getElementById('mcqBody');
  if (!container) return;
  container.innerHTML = '';
  mcqs.forEach((q, qi) => {
    const card = document.createElement('div');
    card.className = 'mcq-card';
    card.setAttribute('role', 'listitem');

    const opts = q.options.map((opt, oi) => `
      <div
        class="mcq-option"
        id="mcq-${qi}-opt-${oi}"
        onclick="_selectOption(${qi},${oi},${q.answer})"
        role="radio"
        tabindex="0"
        aria-label="Option ${LETTERS[oi]}: ${opt}"
        onkeydown="if(event.key==='Enter'||event.key===' ')_selectOption(${qi},${oi},${q.answer})"
      >
        <span class="opt-letter" aria-hidden="true">${LETTERS[oi]}</span>
        <span>${opt}</span>
      </div>
    `).join('');

    card.innerHTML = `
      <div class="mcq-meta" aria-label="Question ${qi+1} of ${mcqs.length}">Q${qi+1} / ${mcqs.length}</div>
      <div class="mcq-q">${q.question}</div>
      <div class="mcq-options" role="radiogroup" aria-label="Answer options">${opts}</div>
      <div class="mcq-explanation" id="mcq-exp-${qi}" role="note">
        <span aria-hidden="true">✅</span>
        <span><strong>${LETTERS[q.answer]}</strong> — ${q.options[q.answer]}${q.explanation ? `<br><em style="opacity:0.8;font-size:0.78rem;">${q.explanation}</em>` : ''}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

function _selectOption(qi, chosen, correct) {
  const opts = document.querySelectorAll(`[id^="mcq-${qi}-opt-"]`);
  opts.forEach((el, i) => {
    el.classList.remove('selected','correct','wrong');
    if (i === correct) el.classList.add('correct');
    else if (i === chosen && chosen !== correct) el.classList.add('wrong');
  });
  const exp = document.getElementById(`mcq-exp-${qi}`);
  if (exp) exp.classList.add('show');
}

// Show / hide all answers
function toggleAllAnswers() {
  _answersVisible = !_answersVisible;
  const label = document.getElementById('toggleLabel');
  if (label) label.textContent = _answersVisible ? 'Hide Answers' : 'Show Answers';

  // MCQ
  const mcqs = _data.quiz?.mcqs || [];
  mcqs.forEach((q, qi) => {
    const opts = document.querySelectorAll(`[id^="mcq-${qi}-opt-"]`);
    opts.forEach((el, i) => {
      el.classList.remove('selected','correct','wrong');
      if (_answersVisible && i === q.answer) el.classList.add('correct');
    });
    const exp = document.getElementById(`mcq-exp-${qi}`);
    if (exp) exp.classList.toggle('show', _answersVisible);
  });

  // Short
  document.querySelectorAll('.sq-answer').forEach(el => {
    el.classList.toggle('show', _answersVisible);
  });
  document.querySelectorAll('.sq-toggle').forEach(btn => {
    btn.textContent = _answersVisible ? '🙈 Hide Answer' : '👁 Show Answer';
  });
}

// ─── SHORT QUESTIONS ─────────────────────────────────────────
function _renderShortQs(qs) {
  const container = document.getElementById('sqBody');
  if (!container) return;
  container.innerHTML = '';
  qs.forEach((q, qi) => {
    const card = document.createElement('div');
    card.className = 'sq-card';
    card.setAttribute('role', 'listitem');
    card.innerHTML = `
      <div class="sq-meta">Short Answer ${qi+1}</div>
      <div class="sq-q">${q.question}</div>
      <div class="sq-answer-wrap">
        <button class="sq-toggle" onclick="_toggleSQAnswer(${qi}, this)" aria-expanded="false" aria-controls="sq-ans-${qi}">
          👁 Show Answer
        </button>
        <div class="sq-answer" id="sq-ans-${qi}" role="region" aria-label="Answer">${q.answer}</div>
      </div>
    `;
    container.appendChild(card);
  });
}

function _toggleSQAnswer(qi, btn) {
  const ans = document.getElementById(`sq-ans-${qi}`);
  if (!ans) return;
  const showing = ans.classList.toggle('show');
  btn.textContent = showing ? '🙈 Hide Answer' : '👁 Show Answer';
  btn.setAttribute('aria-expanded', showing);
}

// ─── TRANSCRIPT ──────────────────────────────────────────────
function _renderTranscript() {
  const container = document.getElementById('transcriptBody');
  if (!container || !_data.transcript) return;
  container.innerHTML = '';
  _data.transcript.split('\n').filter(l => l.trim()).forEach(line => {
    const m = line.match(/^\[(\d+:\d+)\]\s*(.*)/);
    const div = document.createElement('div');
    div.className = 'ts-line';
    if (m) {
      div.innerHTML = `<span class="ts-stamp">${m[1]}</span><span class="ts-text">${m[2]}</span>`;
    } else {
      div.innerHTML = `<span class="ts-text" style="padding-left:70px;">${line}</span>`;
    }
    container.appendChild(div);
  });
}

// ─── TABS ────────────────────────────────────────────────────
function switchTab(id) {
  document.querySelectorAll('.tab-item').forEach(t => {
    t.classList.remove('active');
    t.setAttribute('aria-selected','false');
  });
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

  const btn = document.getElementById(`tab-${id}`);
  const panel = document.getElementById(`panel-${id}`);
  if (btn) { btn.classList.add('active'); btn.setAttribute('aria-selected','true'); }
  if (panel) panel.classList.add('active');
}

// ─── COPY ────────────────────────────────────────────────────
function copyCardText(elId, btn) {
  const el = document.getElementById(elId);
  if (!el) return;
  const text = el.innerText || el.textContent;
  navigator.clipboard.writeText(text)
    .then(() => {
      const orig = btn.textContent;
      btn.textContent = '✓ Copied';
      btn.classList.add('copied');
      showToast('Copied to clipboard!', 'success');
      setTimeout(() => { btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy'; btn.classList.remove('copied'); }, 2000);
    })
    .catch(() => showToast('Copy failed — try selecting manually', 'error'));
}

// ─── SHARE ───────────────────────────────────────────────────
function shareResults() {
  if (navigator.share) {
    navigator.share({ title: 'LecturAI Results', text: 'Check my AI-generated lecture summary & quiz!', url: location.href });
  } else {
    navigator.clipboard.writeText(location.href)
      .then(() => showToast('🔗 Link copied!', 'info'));
  }
}

// ─── DOWNLOAD ────────────────────────────────────────────────
function downloadReport() {
  const modal = document.getElementById('pdfModal');
  const fill  = document.getElementById('modalFill');
  const status= document.getElementById('modalStatus');
  if (modal) modal.classList.add('show');

  const steps = [
    [25,'Building summary section…'],
    [50,'Adding quiz questions…'],
    [75,'Formatting transcript…'],
    [90,'Finalising…'],
    [100,'Done!']
  ];
  let i = 0;
  const iv = setInterval(() => {
    if (i >= steps.length) {
      clearInterval(iv);
      setTimeout(() => {
        if (modal) modal.classList.remove('show');
        if (fill) fill.style.width = '0%';
        _doDownload();
      }, 500);
      return;
    }
    if (fill) fill.style.width = steps[i][0] + '%';
    if (status) status.textContent = steps[i][1];
    i++;
  }, 650);
}

function _doDownload() {
  if (!_data) return;
  const LETTERS = ['A','B','C','D'];
  let out = `LECTUR AI — ANALYSIS REPORT\n`;
  out += `File     : ${_data.filename}\n`;
  out += `Generated: ${new Date().toLocaleString()}\n`;
  out += `${'─'.repeat(62)}\n\n`;

  out += `QUICK SUMMARY\n${'─'.repeat(40)}\n`;
  (_data.summary || []).forEach((s,i) => { out += `${i+1}. ${s}\n`; });

  out += `\nDETAILED SUMMARY\n${'─'.repeat(40)}\n`;
  out += (_data.detailed_summary || '').replace(/<[^>]+>/g,'') + '\n';

  out += `\nKEY POINTS\n${'─'.repeat(40)}\n`;
  (_data.key_points || []).forEach(k => { out += `• ${k}\n`; });

  out += `\nMULTIPLE CHOICE QUESTIONS\n${'─'.repeat(40)}\n`;
  (_data.quiz?.mcqs || []).forEach((q,qi) => {
    out += `\nQ${qi+1}: ${q.question}\n`;
    q.options.forEach((o,oi) => { out += `   ${LETTERS[oi]}. ${o}\n`; });
    out += `   ✓ Answer: ${LETTERS[q.answer]}\n`;
    if (q.explanation) out += `   ℹ ${q.explanation}\n`;
  });

  out += `\nSHORT ANSWER QUESTIONS\n${'─'.repeat(40)}\n`;
  (_data.quiz?.short_questions || []).forEach((q,qi) => {
    out += `\nQ${qi+1}: ${q.question}\nA: ${q.answer}\n`;
  });

  const blob = new Blob([out], { type:'text/plain;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), { href:url, download:`LecturAI_Report_${Date.now()}.txt` });
  a.click();
  URL.revokeObjectURL(url);
  showToast('📥 Report downloaded!', 'success');
}

// ─── TOAST ───────────────────────────────────────────────────
const _toastQueue = [];
let _toastRunning = false;

function showToast(msg, type = 'info') {
  _toastQueue.push({ msg, type });
  if (!_toastRunning) _nextToast();
}

function _nextToast() {
  if (!_toastQueue.length) { _toastRunning = false; return; }
  _toastRunning = true;
  const { msg, type } = _toastQueue.shift();
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success:'✅', error:'❌', info:'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon" aria-hidden="true">${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));

  setTimeout(() => {
    el.classList.remove('show');
    el.addEventListener('transitionend', () => { el.remove(); _nextToast(); }, { once:true });
  }, 3200);
}

// ─── FALLBACK DATA ────────────────────────────────────────────
function _fallback() {
  return {
    filename: 'demo_lecture.mp4',
    processTime: '5.4s',
    wordCount: 1620,
    transcript: `[00:00] Welcome to the LecturAI demo. This page shows what AI-generated results look like.

[01:00] The system transcribes lecture audio using OpenAI Whisper, then passes the text through GPT to create summaries and quizzes.

[03:00] In demo mode, all results are generated from local mock data — no server required. This means the app works on GitHub Pages.

[05:00] The real backend uses Flask and can be deployed to Render for free. Set your OPENAI_API_KEY and it will process real lectures.

[07:00] Thank you for exploring LecturAI — built for the PBL 2026 at Manipal University Jaipur.`,
    summary: [
      'LecturAI transcribes lectures using OpenAI Whisper for multilingual speech recognition.',
      'GPT-3.5 generates concise bullet-point and detailed summaries from the transcript.',
      'Quiz generation produces 5 MCQs with explanations and 3 short-answer questions.',
      'The static demo runs on GitHub Pages using localStorage mock data — no backend needed.',
      'Full AI features require the Flask backend deployed to Render with an OpenAI API key.'
    ],
    detailed_summary: `This is a demonstration of the LecturAI system, an AI-powered lecture summarizer and quiz generator built for the PBL 2026 curriculum at Manipal University Jaipur.\n\nThe system operates in two modes: a static demo mode (which you are currently viewing) that uses precomputed mock data stored in localStorage, and a full AI mode powered by the Flask backend. In full mode, uploaded audio and video files are transcribed using OpenAI's Whisper model, and the resulting text is sent to GPT-3.5 for summarization and quiz generation.\n\nThe interface is designed to feel like a premium AI SaaS product, with glassmorphism cards, smooth animations, and an accessible tabbed layout for results. Upload any lecture file on the home page to see the full pipeline in action.`,
    key_points: [
      'Two deployment modes: static demo (GitHub Pages) and full AI (Flask + Render)',
      'Whisper transcribes audio in 99 languages with high accuracy',
      'GPT-3.5-turbo generates summaries and quizzes with structured JSON output',
      'localStorage stores results and session history for offline access',
      'Quiz includes 5 MCQs with correct-answer highlighting and explanations',
      'Short-answer questions include detailed model answers for self-assessment',
      'Download report generates a formatted .txt file with all results',
      'Dark/light mode toggle persists across sessions via localStorage'
    ],
    quiz: {
      mcqs: [
        {
          question: 'Which AI model is used for speech-to-text transcription in this system?',
          options: ['Google Speech-to-Text', 'Amazon Transcribe', 'OpenAI Whisper', 'Mozilla DeepSpeech'],
          answer: 2,
          explanation: 'OpenAI Whisper supports 99 languages and runs locally without API costs.'
        },
        {
          question: 'How does the static demo version work without a Python backend?',
          options: ['It calls OpenAI API directly from the browser', 'It uses mock JSON data stored in localStorage', 'It runs Python via WebAssembly', 'It uses a hidden server'],
          answer: 1,
          explanation: 'All mock data is pre-generated in script.js and saved to localStorage for retrieval on the results page.'
        },
        {
          question: 'What platform is recommended for deploying the Flask backend for free?',
          options: ['Heroku', 'AWS Lambda', 'Render', 'Netlify'],
          answer: 2,
          explanation: 'Render offers a free tier that supports Python Flask applications with persistent processes.'
        },
        {
          question: 'What language model generates summaries and quiz questions?',
          options: ['Claude 3', 'Gemini Pro', 'GPT-3.5-turbo', 'LLaMA 2'],
          answer: 2,
          explanation: 'GPT-3.5-turbo is cost-effective and produces high-quality structured JSON output for summaries and quizzes.'
        },
        {
          question: 'Which file formats does LecturAI support for upload?',
          options: ['Only audio files (MP3, WAV)', 'Only video files (MP4)', 'MP3, WAV, MP4, WebM, PDF, DOCX, TXT', 'Only PDF and DOCX'],
          answer: 2,
          explanation: 'The system supports audio, video, and document formats through dedicated extraction modules.'
        }
      ],
      short_questions: [
        {
          question: 'Why is a static demo version important for a GitHub Pages deployment?',
          answer: 'GitHub Pages only hosts static files — HTML, CSS, and JavaScript. It cannot execute server-side code like Python. A static demo overcomes this limitation by pre-generating realistic AI responses in JavaScript and storing them in localStorage, allowing the full user experience (upload → processing → results) to be demonstrated without any server infrastructure. This makes the project accessible to professors and evaluators without requiring them to set up the backend.'
        },
        {
          question: 'Explain the role of CORS configuration in the Flask backend.',
          answer: 'Cross-Origin Resource Sharing (CORS) is a browser security mechanism that blocks JavaScript on one origin (e.g., GitHub Pages at yourusername.github.io) from making HTTP requests to a different origin (e.g., the Flask API at yourapp.onrender.com). Without CORS headers, the browser would reject the API responses. Flask-CORS adds "Access-Control-Allow-Origin: *" headers to all API responses, explicitly permitting cross-origin requests and enabling the frontend to communicate with the backend regardless of where each is hosted.'
        },
        {
          question: 'Describe how the loading overlay improves perceived performance.',
          answer: 'AI processing (transcription + summarization + quiz generation) takes 5–15 seconds, which would feel unresponsive if the UI showed nothing. The loading overlay uses a full-screen blur backdrop, a triple-ring animated spinner, and a step-by-step pipeline list that updates as each stage completes. This technique — known as "skeleton UX" or "progress signposting" — reduces perceived wait time by giving the user constant visual feedback, making the wait feel shorter and the system feel more reliable and trustworthy.'
        }
      ]
    }
  };
}
