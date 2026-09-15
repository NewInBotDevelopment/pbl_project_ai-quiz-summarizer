const DEFAULT_RENDER_BACKEND = "https://lecturai-backend.onrender.com";
const BACKEND_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? (localStorage.getItem('lecturAI_backend_url') || "http://127.0.0.1:5000")
  : (localStorage.getItem('lecturAI_backend_url') || DEFAULT_RENDER_BACKEND);
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
  const icons = { pdf: '📄', pptx: '📊', ppt: '📊', docx: '📝', doc: '📝', txt: '📃', md: '📃', mp3: '🎵', wav: '🎵', mp4: '🎬', m4a: '🎵' };
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
  if (f.size > 25 * 1024 * 1024) {
    alert(`Selected file is too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 25 MB.`);
    e.target.value = '';
    return;
  }
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
  if (f.size > 25 * 1024 * 1024) {
    alert(`Dropped file is too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 25 MB.`);
    return;
  }
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

    let targetUrl = BACKEND_URL;
    let response;
    const maxAttempts = 5;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        if (i > 0) {
          const subtitle = document.getElementById('loadingSubtitle');
          if (subtitle) {
            subtitle.textContent = `Waking up cloud server (attempt ${i + 1}/${maxAttempts})…`;
          }
        }
        response = await fetch(`${targetUrl}/api/process`, {
          method: 'POST',
          body: formData
        });
        if (response) break;
      } catch (err) {
        console.log(`Attempt ${i+1} on ${targetUrl} failed, retrying...`, err);
        // If local backend is down, fall back to Render cloud backend
        if (targetUrl.includes('127.0.0.1') || targetUrl.includes('localhost')) {
          console.warn('Local backend unavailable, switching to Render cloud backend:', DEFAULT_RENDER_BACKEND);
          targetUrl = DEFAULT_RENDER_BACKEND;
        }
        if (i < maxAttempts - 1) {
          // Free tier Render spin-up typically takes ~30-40 seconds
          await new Promise(r => setTimeout(r, 6000));
        }
      }
    }

    if (!response) {
      throw new Error(`Cloud server (${targetUrl}) did not respond after ${maxAttempts} attempts.\nIf the server was asleep, it may need an extra 15-30 seconds to wake up.`);
    }

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
    alert('Analysis Failed: ' + err.message + '\n\nPlease ensure your connection is stable and try again in a moment.');
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
