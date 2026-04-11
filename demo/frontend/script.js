'use strict';

// ✅ BACKEND URL
const BACKEND_URL = "https://lecturai-backend.onrender.com";

// ✅ Allowed file types (SYNC with backend)
const ALLOWED_TYPES = ["mp3", "wav", "pdf", "docx", "txt"];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// ─── THEME ────────────────────────────────────────────────
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

(function restoreTheme() {
  const saved = localStorage.getItem('lecturAI_theme');
  applyTheme(saved === 'light' ? 'light' : 'dark');
})();

// ─── FILE UTILITIES ────────────────────────────────────────
const FILE_ICONS = {
  mp3:'🎵', wav:'🎵', pdf:'📕', docx:'📘', txt:'📄'
};

function getFileIcon(name = '') {
  return FILE_ICONS[name.split('.').pop().toLowerCase()] || '📄';
}

function fmtBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

// ─── FILE SELECTION ────────────────────────────────────────
let _selectedFile = null;

function handleFileSelect(e) {
  const f = e.target.files[0];
  if (f) validateAndSetFile(f);
}

function handleDrop(e) {
  e.preventDefault();
  const f = e.dataTransfer?.files[0];
  if (f) validateAndSetFile(f);
}

// ✅ VALIDATION BEFORE SETTING FILE
function validateAndSetFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  // ❌ Type check
  if (!ALLOWED_TYPES.includes(ext)) {
    alert("❌ Unsupported file type\nAllowed: mp3, wav, pdf, docx, txt");
    return;
  }

  // ❌ Size check
  if (file.size > MAX_FILE_SIZE) {
    alert("❌ File too large (Max 20MB)");
    return;
  }

  _setFile(file);
}

function _setFile(file) {
  _selectedFile = file;

  document.getElementById('dropIcon').textContent = getFileIcon(file.name);
  document.getElementById('dropTitle').textContent = file.name;
  document.getElementById('dropSub').textContent =
    `${fmtBytes(file.size)} · Ready to process`;

  document.getElementById('btnSummary').disabled = false;
  document.getElementById('btnQuiz').disabled = false;
}

// ─── MAIN PROCESS FUNCTION ────────────────────────────────
async function startProcessing(mode = 'summary') {
  if (!_selectedFile) {
    alert("Please select a file first");
    return;
  }

  const overlay = document.getElementById('loadingOverlay');
  overlay?.classList.add('show');

  const bar = document.getElementById('loadingBar');
  const status = document.getElementById('loadingSubtitle');

  try {
    const formData = new FormData();
    formData.append("file", _selectedFile);

    console.log("🚀 Sending to backend:", `${BACKEND_URL}/api/process`);

    status.textContent = "Uploading file...";
    bar.style.width = "20%";

    const response = await fetch(`${BACKEND_URL}/api/process`, {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    // ✅ HANDLE BACKEND ERRORS PROPERLY
    if (!response.ok) {
      throw new Error(data.error || "Server error");
    }

    status.textContent = "Processing with AI...";
    bar.style.width = "70%";

    status.textContent = "Finalizing...";
    bar.style.width = "100%";

    // ✅ SAVE RESULT
    localStorage.setItem('lecturAI_results', JSON.stringify(data));

    // ✅ SAVE HISTORY
    const hist = JSON.parse(localStorage.getItem('lecturAI_history') || '[]');
    hist.unshift({
      id: Date.now(),
      filename: _selectedFile.name,
      date: new Date().toLocaleDateString(),
      results: data
    });
    if (hist.length > 6) hist.length = 6;
    localStorage.setItem('lecturAI_history', JSON.stringify(hist));

    // Redirect
    setTimeout(() => {
      window.location.href = 'results.html';
    }, 500);

  } catch (err) {
    console.error("❌ FULL ERROR:", err);

    alert("❌ Error:\n" + err.message);

    // ✅ RESET UI ON FAILURE
    bar.style.width = "0%";
    status.textContent = "Failed. Try again.";
    document.getElementById('loadingOverlay')?.classList.remove('show');
  }
}

// ─── HISTORY ──────────────────────────────────────────────
function loadHistory() {
  const grid = document.getElementById('historyGrid');
  if (!grid) return;

  const hist = JSON.parse(localStorage.getItem('lecturAI_history') || '[]');
  grid.innerHTML = '';

  hist.forEach(item => {
    const card = document.createElement('div');
    card.innerHTML = `
      <div>${getFileIcon(item.filename)}</div>
      <div>${item.filename}</div>
      <div>${item.date}</div>
    `;
    card.onclick = () => {
      localStorage.setItem('lecturAI_results', JSON.stringify(item.results));
      window.location.href = 'results.html';
    };
    grid.appendChild(card);
  });
}

loadHistory();
