/* =========================================================
   LECTUR AI — SHARED SCRIPT  (script.js)
   Upload page logic, theme, history, loading overlay,
   mock data generation, and shared utilities.
   ========================================================= */

'use strict';

// ─── THEME ─────────────────────────────────────────────────
function applyTheme(mode) {
  document.body.classList.toggle('light', mode === 'light');
  const toggle = document.getElementById('themeToggle');
  if (toggle) toggle.classList.toggle('light', mode === 'light');
}

function toggleTheme() {
  const isLight = document.body.classList.contains('light');
  const next = isLight ? 'dark' : 'light';
  applyTheme(next);
  localStorage.setItem('lecturAI_theme', next);
}

// Restore on load — dark is default
(function restoreTheme() {
  const saved = localStorage.getItem('lecturAI_theme');
  applyTheme(saved === 'light' ? 'light' : 'dark');
})();

// ─── NAVBAR SCROLL ─────────────────────────────────────────
(function initNavbar() {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// ─── BACKGROUND ORB MOUSE PARALLAX ─────────────────────────
(function initParallax() {
  const orb1 = document.querySelector('.bg-orb-1');
  const orb2 = document.querySelector('.bg-orb-2');
  if (!orb1 || !orb2) return;
  window.addEventListener('mousemove', (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 30;
    const y = (e.clientY / window.innerHeight - 0.5) * 30;
    orb1.style.transform = `translate(${x}px, ${y}px)`;
    orb2.style.transform = `translate(${-x}px, ${-y}px)`;
  }, { passive: true });
})();

// ─── FILE UTILITIES ─────────────────────────────────────────
const FILE_ICONS = {
  mp3:'🎵', wav:'🎵', mp4:'🎬', webm:'🎬',
  pdf:'📕', docx:'📘', doc:'📘', txt:'📄'
};

function getFileIcon(name = '') {
  return FILE_ICONS[name.split('.').pop().toLowerCase()] || '📄';
}

function fmtBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

// ─── FILE SELECTION ─────────────────────────────────────────
let _selectedFile = null;

function handleFileSelect(e) {
  const f = e.target.files[0];
  if (f) _setFile(f);
}

function handleDragOver(e) {
  e.preventDefault();
  document.getElementById('dropZone')?.classList.add('drag-over');
}

function handleDragLeave() {
  document.getElementById('dropZone')?.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  document.getElementById('dropZone')?.classList.remove('drag-over');
  const f = e.dataTransfer?.files[0];
  if (f) _setFile(f);
}

function _setFile(file) {
  _selectedFile = file;

  // Update drop zone appearance
  const icon = document.getElementById('dropIcon');
  const title = document.getElementById('dropTitle');
  const sub = document.getElementById('dropSub');
  if (icon) icon.textContent = getFileIcon(file.name);
  if (title) title.textContent = file.name;
  if (sub) sub.textContent = `${fmtBytes(file.size)}  ·  Click to change`;

  // Show file preview chip
  const preview = document.getElementById('filePreview');
  if (preview) {
    document.getElementById('previewIcon').textContent = getFileIcon(file.name);
    document.getElementById('previewName').textContent = file.name;
    document.getElementById('previewMeta').textContent =
      `${fmtBytes(file.size)} · ${file.name.split('.').pop().toUpperCase()}`;
    preview.classList.add('show');
  }

  // Enable action buttons
  ['btnSummary', 'btnQuiz'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
  });
}

function removeFile() {
  _selectedFile = null;

  const icon = document.getElementById('dropIcon');
  const title = document.getElementById('dropTitle');
  const sub = document.getElementById('dropSub');
  if (icon)  icon.textContent = '📁';
  if (title) title.textContent = 'Drop your lecture file here';
  if (sub)   sub.textContent   = 'Click to browse, or drag & drop any file';

  document.getElementById('filePreview')?.classList.remove('show');
  const inp = document.getElementById('fileInput');
  if (inp) inp.value = '';

  ['btnSummary', 'btnQuiz'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) { btn.disabled = true; btn.style.opacity = '0.4'; }
  });
}

// ─── PROCESSING PIPELINE ────────────────────────────────────
const PIPELINE = [
  { id: 'lstep-1', label: 'Validating & loading file…',             pct: 8  },
  { id: 'lstep-2', label: 'Transcribing audio / extracting text…',  pct: 35 },
  { id: 'lstep-3', label: 'Generating AI summary…',                 pct: 65 },
  { id: 'lstep-4', label: 'Building quiz questions…',               pct: 92 },
];
const DELAYS = [0, 1000, 2600, 4600];

function startProcessing(mode = 'summary') {
  if (!_selectedFile) return;

  // Persist file info
  localStorage.setItem('lecturAI_filename', _selectedFile.name);
  localStorage.setItem('lecturAI_filesize', fmtBytes(_selectedFile.size));
  localStorage.setItem('lecturAI_mode', mode);

  // Show overlay
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.classList.add('show');

  // Reset steps
  PIPELINE.forEach(s => {
    const el = document.getElementById(s.id);
    if (el) el.classList.remove('active', 'done');
  });

  const bar    = document.getElementById('loadingBar');
  const status = document.getElementById('loadingSubtitle');

  // Animate each step
  PIPELINE.forEach((step, i) => {
    setTimeout(() => {
      // Mark previous done
      if (i > 0) {
        const prev = document.getElementById(PIPELINE[i - 1].id);
        if (prev) {
          prev.classList.remove('active');
          prev.classList.add('done');
          const icon = prev.querySelector('.step-icon');
          if (icon) icon.textContent = '✓';
        }
      }
      // Mark current active
      document.getElementById(step.id)?.classList.add('active');
      if (bar) bar.style.width = step.pct + '%';
      if (status) status.textContent = step.label;
    }, DELAYS[i]);
  });

  // Finish
  setTimeout(() => {
    const last = document.getElementById(PIPELINE[3].id);
    if (last) { last.classList.remove('active'); last.classList.add('done'); const ico = last.querySelector('.step-icon'); if (ico) ico.textContent = '✓'; }
    if (bar)    bar.style.width = '100%';
    if (status) status.textContent = '✅ Complete! Loading results…';

    // Save mock result
    _persistMockResult(_selectedFile.name);

    setTimeout(() => { window.location.href = 'results.html'; }, 700);
  }, 6400);
}

// ─── MOCK DATA ───────────────────────────────────────────────
function _persistMockResult(filename) {
  const data = _buildMock(filename);
  localStorage.setItem('lecturAI_results', JSON.stringify(data));

  const hist = JSON.parse(localStorage.getItem('lecturAI_history') || '[]');
  hist.unshift({
    id: Date.now(),
    filename,
    date: new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }),
    results: data
  });
  if (hist.length > 6) hist.length = 6;
  localStorage.setItem('lecturAI_history', JSON.stringify(hist));
}

function _buildMock(filename) {
  const topic = filename.replace(/\.[^.]+$/, '').replace(/[_\-]/g, ' ');
  return {
    filename,
    processTime: (Math.random() * 8 + 3).toFixed(1) + 's',
    wordCount:   Math.floor(Math.random() * 2000 + 1000),

    transcript: `[00:00] Welcome to today's session on ${topic}. We'll cover the core principles in depth.

[01:15] Let's begin with foundational concepts. In natural language processing, the pipeline typically involves tokenization, vectorization, and model inference. Each stage transforms raw text into a structured representation that machines can process efficiently.

[03:40] The Transformer architecture, introduced by Vaswani et al. in 2017 ("Attention is All You Need"), fundamentally changed sequence modelling. Its self-attention mechanism allows every token to attend to every other token, capturing long-range dependencies that RNNs struggled with.

[06:55] OpenAI Whisper combines a convolutional audio encoder with a transformer text decoder, enabling robust speech recognition across 99 languages with a single model. Its multitask training paradigm also allows translation and language identification.

[10:20] For summarization, two paradigms exist: extractive methods select existing sentences by importance score, while abstractive methods generate entirely new text using seq2seq models — the approach used by modern LLMs like GPT-4.

[14:30] Quiz generation leverages the model's latent knowledge of the text: named entity recognition identifies key terms, and relation extraction surfaces the factual relationships that form the basis of good exam questions.

[18:45] Evaluation uses ROUGE for summarization (measuring n-gram overlap with reference summaries) and human evaluation for quiz quality. Our system achieves a ROUGE-L of 0.847, placing it in the top tier of academic systems.

[23:00] Deployment uses a Flask REST API behind an nginx reverse proxy, with the Whisper model loaded once at startup and held in memory for fast inference. The frontend communicates asynchronously to keep the UI responsive.

[27:30] Thank you. Key takeaways: the pipeline is modular, each stage can be swapped independently, and the static demo version runs fully in the browser for GitHub Pages compatibility.`,

    summary: [
      `Transformer architecture with self-attention forms the backbone of modern NLP, enabling long-range token dependencies.`,
      `OpenAI Whisper provides multilingual speech recognition using a convolutional encoder + transformer decoder pipeline.`,
      `Abstractive summarization generates new, coherent sentences — preferred over extractive methods for lecture content.`,
      `Quiz generation uses NER and relation extraction to identify testable facts and build context-relevant questions.`,
      `The system achieves ROUGE-L 0.847, deployed via Flask REST API with async frontend communication.`
    ],

    detailed_summary: `This lecture provides a comprehensive walkthrough of the AI pipeline powering the Lecture Summarizer and Quiz Generator. Beginning with fundamental NLP concepts — tokenization, vectorization, and inference — the session establishes the groundwork needed to understand how raw lecture content is processed.\n\nThe architectural core of the system is the Transformer, whose self-attention mechanism allows the model to weigh the relevance of every word relative to every other word in the sequence. This is augmented by OpenAI Whisper for speech recognition, which uniquely combines a convolutional feature extractor (processing mel-spectrograms) with an autoregressive transformer decoder to produce accurate transcripts across a wide variety of accents and recording conditions.\n\nThe summarization and quiz generation modules use a fine-tuned large language model operating on the transcript. Abstractive summarization produces human-quality condensed notes, while quiz generation leverages the model's understanding of factual relationships to compose multiple-choice and short-answer questions. The entire pipeline is exposed via a lightweight Flask API, with the static demo version falling back to precomputed mock responses for full GitHub Pages compatibility.`,

    key_points: [
      'NLP pipeline: tokenization → vectorization → model inference → structured output',
      'Transformer self-attention allows O(1) path length between any two tokens regardless of sequence length',
      'Whisper processes audio as mel-spectrograms via a CNN encoder before the transformer decoder',
      'Whisper is trained on 680,000 hours of multilingual weakly-supervised data',
      'Abstractive summarization generates paraphrased output; extractive ranking uses TF-IDF or BERT embeddings',
      'ROUGE-L measures Longest Common Subsequence overlap — more robust than ROUGE-1/ROUGE-2 for fluency',
      'Quiz generation pipeline: NER → relation extraction → question template filling → distractor generation',
      'Flask API: single-process Whisper inference, async file handling, CORS enabled for browser clients'
    ],

    quiz: {
      mcqs: [
        {
          question: 'What mechanism in the Transformer architecture allows tokens to attend to all other tokens simultaneously?',
          options: ['Recurrent state propagation','Self-attention','Convolutional pooling','Positional encoding'],
          answer: 1,
          explanation: 'Self-attention computes pairwise token relevance scores, enabling parallel long-range dependency capture.'
        },
        {
          question: 'What audio representation does OpenAI Whisper use as input to its encoder?',
          options: ['Raw PCM waveform','MFCC feature vectors','Mel-spectrogram','Fourier amplitude spectrum'],
          answer: 2,
          explanation: 'Whisper converts audio to 80-channel log-magnitude mel-spectrograms which its CNN encoder processes.'
        },
        {
          question: 'Which summarization approach generates entirely new sentences rather than selecting existing ones?',
          options: ['Extractive','Token-ranking','Abstractive','Sentence scoring'],
          answer: 2,
          explanation: 'Abstractive summarization uses seq2seq or LLM generation to produce novel, paraphrased summaries.'
        },
        {
          question: 'What metric measures the Longest Common Subsequence overlap between a generated and reference summary?',
          options: ['BLEU','ROUGE-1','ROUGE-2','ROUGE-L'],
          answer: 3,
          explanation: 'ROUGE-L uses LCS, capturing fluency and word-order alignment better than n-gram count metrics.'
        },
        {
          question: 'How does the static demo version achieve GitHub Pages compatibility without a Python server?',
          options: [
            'It bundles Python via WebAssembly',
            'It calls a third-party AI API directly',
            'It serves precomputed mock responses from localStorage',
            'It uses a service worker to run Flask'
          ],
          answer: 2,
          explanation: 'The static demo stores mock AI responses in localStorage and renders them without any backend calls.'
        }
      ],
      short_questions: [
        {
          question: 'Explain why the Transformer replaced RNNs as the dominant sequence model for NLP tasks.',
          answer: 'RNNs process tokens sequentially, which limits parallelism and makes it hard to learn dependencies between distant tokens (vanishing gradient). The Transformer\'s self-attention computes all pairwise token interactions in parallel, providing an O(1) maximum dependency path length regardless of sequence length. This enables much faster training on GPUs and superior performance on long documents — critical advantages for lecture-length content.'
        },
        {
          question: 'Why is ROUGE-L preferred over ROUGE-1 for evaluating lecture summaries?',
          answer: 'ROUGE-1 counts unigram overlaps, which can reward summaries that include the right words in completely wrong order. ROUGE-L uses the Longest Common Subsequence, which implicitly rewards correct word order and sentence fluency without requiring consecutive n-gram matches. For lecture summaries — where coherent sentence structure matters — ROUGE-L provides a more meaningful quality signal that correlates better with human judgement.'
        },
        {
          question: 'Describe the quiz generation pipeline from raw transcript to final questions.',
          answer: '1. Named Entity Recognition (NER) identifies key nouns, technical terms, dates, and proper nouns in the transcript. 2. Relation extraction surfaces factual relationships between entities (e.g. "Transformer was introduced by Vaswani in 2017"). 3. A question template is applied to each fact (e.g. "Who introduced ___?"). 4. Distractors are generated by the LLM as plausible but incorrect alternatives, ensuring the MCQ is non-trivial. 5. The questions are post-filtered by a relevance scorer to remove duplicates and low-quality items.'
        }
      ]
    }
  };
}

// ─── HISTORY ────────────────────────────────────────────────
function loadHistory() {
  const section = document.getElementById('historySection');
  const grid    = document.getElementById('historyGrid');
  if (!section || !grid) return;

  const hist = JSON.parse(localStorage.getItem('lecturAI_history') || '[]');
  if (!hist.length) { section.style.display = 'none'; return; }

  section.style.display = 'block';
  grid.innerHTML = '';
  hist.forEach(item => {
    const card = document.createElement('div');
    card.className = 'glass-sm history-card';
    card.setAttribute('role', 'listitem');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `Open ${item.filename}`);
    card.innerHTML = `
      <div class="h-icon">${getFileIcon(item.filename)}</div>
      <div class="h-name" title="${item.filename}">${item.filename}</div>
      <div class="h-date">${item.date}</div>
    `;
    card.onclick = () => {
      localStorage.setItem('lecturAI_results', JSON.stringify(item.results));
      window.location.href = 'results.html';
    };
    card.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') card.click(); };
    grid.appendChild(card);
  });
}

function clearHistory() {
  if (!confirm('Clear all recent sessions?')) return;
  localStorage.removeItem('lecturAI_history');
  const section = document.getElementById('historySection');
  if (section) section.style.display = 'none';
}

// Init
loadHistory();
