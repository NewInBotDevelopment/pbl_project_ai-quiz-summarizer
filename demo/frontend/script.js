'use strict';

const BACKEND_URL = "https://lecturai-backend.onrender.com";
let _selectedFile = null;

// ─── THEME ────────────────────────────────────
function toggleTheme() {
  document.body.classList.toggle('light');
  const btn = document.getElementById('themeToggle');
  if (btn) btn.classList.toggle('light');
  localStorage.setItem('lecturAI_theme', document.body.classList.contains('light') ? 'light' : 'dark');
}

// Restore saved theme on load (class-based, matches original CSS)
(function restoreTheme() {
  if (localStorage.getItem('lecturAI_theme') === 'light') {
    document.body.classList.add('light');
    const btn = document.getElementById('themeToggle');
    if (btn) btn.classList.add('light');
  }
})();

// ─── FILE PREVIEW UPDATE ──────────────────────
function _updateFilePreview(file) {
  const icons = { pdf: '📄', docx: '📝', doc: '📝', txt: '📃', mp3: '🎵', wav: '🎵', mp4: '🎬', m4a: '🎵' };
  const ext = file.name.split('.').pop().toLowerCase();
  const icon = icons[ext] || '📁';
  const sizeMB = (file.size / 1024 / 1024).toFixed(2);

  const previewIcon = document.getElementById('previewIcon');
  const previewName = document.getElementById('previewName');
  const previewMeta = document.getElementById('previewMeta');
  const filePreview = document.getElementById('filePreview');
  const dropTitle   = document.getElementById('dropTitle');
  const dropSub     = document.getElementById('dropSub');
  const dropIconEl  = document.getElementById('dropIcon');

  if (previewIcon) previewIcon.textContent = icon;
  if (previewName) previewName.textContent = file.name;
  if (previewMeta) previewMeta.textContent = `${ext.toUpperCase()} · ${sizeMB} MB`;
  if (filePreview) filePreview.style.display = 'flex';
  if (dropTitle)   dropTitle.textContent = '✅ File ready!';
  if (dropSub)     dropSub.textContent   = 'Click below to generate summary or quiz';
  if (dropIconEl)  dropIconEl.textContent = icon;
}

// ─── FILE SELECT ─────────────────────────────
function handleFileSelect(e) {
  const f = e.target.files[0];
  if (!f) { alert('No file selected'); return; }
  console.log('📄 Selected file:', f.name);
  _selectedFile = f;
  _updateFilePreview(f);
  const btnSummary = document.getElementById('btnSummary');
  const btnQuiz    = document.getElementById('btnQuiz');
  if (btnSummary) btnSummary.disabled = false;
  if (btnQuiz)    btnQuiz.disabled    = false;
}

// ─── REMOVE FILE ─────────────────────────────
function removeFile() {
  _selectedFile = null;

  const fileInput   = document.getElementById('fileInput');
  const filePreview = document.getElementById('filePreview');
  const dropTitle   = document.getElementById('dropTitle');
  const dropSub     = document.getElementById('dropSub');
  const dropIconEl  = document.getElementById('dropIcon');
  const btnSummary  = document.getElementById('btnSummary');
  const btnQuiz     = document.getElementById('btnQuiz');

  if (fileInput)   fileInput.value  = '';
  if (filePreview) filePreview.style.display = 'none';
  if (dropTitle)   dropTitle.textContent  = 'Drop your lecture file here';
  if (dropSub)     dropSub.textContent    = 'Click to browse, or drag & drop any file';
  if (dropIconEl)  dropIconEl.textContent = '📁';
  if (btnSummary)  btnSummary.disabled = true;
  if (btnQuiz)     btnQuiz.disabled    = true;
}

// ─── DRAG & DROP SUPPORT ─────────────────────
function handleDrop(e) {
  e.preventDefault();
  const dropZone = document.getElementById('dropZone');
  if (dropZone) dropZone.classList.remove('drag-over');

  const f = e.dataTransfer.files[0];
  if (!f) return;
  console.log('📄 Dropped file:', f.name);
  _selectedFile = f;
  _updateFilePreview(f);

  const btnSummary = document.getElementById('btnSummary');
  const btnQuiz    = document.getElementById('btnQuiz');
  if (btnSummary) btnSummary.disabled = false;
  if (btnQuiz)    btnQuiz.disabled    = false;
}

function handleDragOver(e) {
  e.preventDefault();
  const dropZone = document.getElementById('dropZone');
  if (dropZone) dropZone.classList.add('drag-over');
}

function handleDragLeave(e) {
  e.preventDefault();
  const dropZone = document.getElementById('dropZone');
  if (dropZone) dropZone.classList.remove('drag-over');
}

// ─── LOADING OVERLAY ─────────────────────────
const LOADING_STEPS = [
  { id: 'lstep-1', label: 'Validating & loading file',        delay: 0    },
  { id: 'lstep-2', label: 'Transcribing audio / extracting text', delay: 1500 },
  { id: 'lstep-3', label: 'Generating AI summary',            delay: 4000 },
  { id: 'lstep-4', label: 'Building quiz questions',          delay: 7000 },
];

function _showLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.classList.add('active');

  // Reset steps
  LOADING_STEPS.forEach(s => {
    const el = document.getElementById(s.id);
    if (el) el.classList.remove('active', 'done');
  });

  // Animate progress bar
  const bar = document.getElementById('loadingBar');
  if (bar) { bar.style.width = '0%'; }

  // Step-by-step activation
  LOADING_STEPS.forEach((s, i) => {
    setTimeout(() => {
      // Mark previous done
      if (i > 0) {
        const prev = document.getElementById(LOADING_STEPS[i-1].id);
        if (prev) { prev.classList.remove('active'); prev.classList.add('done'); }
      }
      const el = document.getElementById(s.id);
      if (el) el.classList.add('active');

      const subtitle = document.getElementById('loadingSubtitle');
      if (subtitle) subtitle.textContent = s.label + '…';

      if (bar) bar.style.width = `${(i + 1) * 25}%`;
    }, s.delay);
  });
}

function _hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) overlay.classList.remove('active');
}

// ─── MAIN PROCESS ────────────────────────────
async function startProcessing(mode = 'summary') {
  if (!_selectedFile) { alert('Select a file first'); return; }

  console.log('📄 File being sent:', _selectedFile.name);
  _showLoading();

  const formData = new FormData();
  formData.append('file', _selectedFile);

  try {
    console.log('🚀 Calling API...');

    let response;
    // Retry once for Render cold-start
    for (let i = 0; i < 2; i++) {
      try {
        response = await fetch(`${BACKEND_URL}/api/process`, {
          method: 'POST',
          body: formData
        });
        break;
      } catch (err) {
        console.log(`Attempt ${i+1} failed, retrying...`);
        if (i === 0) await new Promise(r => setTimeout(r, 2000));
      }
    }

    if (!response) throw new Error('Server not responding after 2 attempts. It may be starting up — please try again in 30 seconds.');

    const data = await response.json();
    console.log('✅ Response:', data);

    if (!response.ok) throw new Error(data.error || 'Server error');

    // Ensure required fields exist (safety net)
    if (!data.summary)          data.summary          = ['Summary not available.'];
    if (!data.detailed_summary) data.detailed_summary = 'Detailed summary not available.';
    if (!data.key_points)       data.key_points       = [];
    if (!data.quiz)             data.quiz             = { mcqs: [], short_questions: [] };
    if (!data.filename)         data.filename         = _selectedFile.name;
    if (!data.wordCount)        data.wordCount        = 0;
    if (!data.processTime)      data.processTime      = '—';

    // Save and redirect
    localStorage.setItem('lecturAI_results', JSON.stringify(data));
    _saveHistory(data);

    _hideLoading();
    window.location.href = 'results.html';

  } catch (err) {
    _hideLoading();
    console.error('❌ Error details:', err);
    alert('Analysis Failed: ' + err.message + '\n\nPlease ensure the backend server is running and your Groq API key is valid.');
  }
}

// ─── SESSION HISTORY ─────────────────────────
function _saveHistory(data) {
  try {
    const history = JSON.parse(localStorage.getItem('lecturAI_history') || '[]');
    history.unshift({
      filename: data.filename,
      processTime: data.processTime,
      wordCount: data.wordCount,
      timestamp: new Date().toISOString()
    });
    // Keep last 10 sessions
    localStorage.setItem('lecturAI_history', JSON.stringify(history.slice(0, 10)));
    _renderHistory();
  } catch (e) {
    console.warn('History save failed:', e);
  }
}

function _renderHistory() {
  const section   = document.getElementById('historySection');
  const grid      = document.getElementById('historyGrid');
  if (!section || !grid) return;

  const history = JSON.parse(localStorage.getItem('lecturAI_history') || '[]');
  if (!history.length) { section.style.display = 'none'; return; }

  section.style.display = 'block';
  grid.innerHTML = '';
  history.forEach(item => {
    const card = document.createElement('div');
    card.className = 'history-card';
    card.setAttribute('role', 'listitem');
    card.innerHTML = `
      <div class="history-filename">📄 ${item.filename}</div>
      <div class="history-meta">${item.wordCount?.toLocaleString() || '—'} words · ${item.processTime || '—'}</div>
      <div class="history-date">${new Date(item.timestamp).toLocaleDateString()}</div>
    `;
    card.addEventListener('click', () => {
      window.location.href = 'results.html';
    });
    grid.appendChild(card);
  });
}

function clearHistory() {
  localStorage.removeItem('lecturAI_history');
  const section = document.getElementById('historySection');
  if (section) section.style.display = 'none';
}

// Init history on load
document.addEventListener('DOMContentLoaded', _renderHistory);
