'use strict';

// ✅ BACKEND URL
const BACKEND_URL = "https://lecturai-backend.onrender.com";

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
  if (f) _setFile(f);
}

function handleDrop(e) {
  e.preventDefault();
  const f = e.dataTransfer?.files[0];
  if (f) _setFile(f);
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

    status.textContent = "Uploading file...";
    bar.style.width = "20%";

    // 🔥 ALWAYS LOG REQUEST (debug)
    console.log("Sending request to:", `${BACKEND_URL}/api/process`);

    const response = await fetch(`${BACKEND_URL}/api/process`, {
      method: "POST",
      body: formData
    });

    // 🔥 Handle backend errors properly
    const data = await response.json();

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
    console.error("FULL ERROR:", err);

    // 🔥 Better error message
    alert("❌ Backend Error:\n" + err.message);

    // Reset UI
    bar.style.width = "0%";
    status.textContent = "Something went wrong. Try again.";
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
