'use strict';

const BACKEND_URL = "https://lecturai-backend.onrender.com";
const ALLOWED_TYPES = ["mp3", "wav", "pdf", "docx", "txt"];
const MAX_FILE_SIZE = 20 * 1024 * 1024;

let _selectedFile = null;

// ─── FILE HANDLING ───
function handleFileSelect(e) {
  const f = e.target.files[0];
  if (f) validateAndSetFile(f);
}

function handleDrop(e) {
  e.preventDefault();
  const f = e.dataTransfer?.files[0];
  if (f) validateAndSetFile(f);
}

function validateAndSetFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();

  if (!ALLOWED_TYPES.includes(ext)) {
    alert("Unsupported file type");
    return;
  }

  if (file.size > MAX_FILE_SIZE) {
    alert("File too large (max 20MB)");
    return;
  }

  _selectedFile = file;

  document.getElementById('dropTitle').textContent = file.name;
  document.getElementById('dropSub').textContent = "Ready to process";

  document.getElementById('btnSummary').disabled = false;
  document.getElementById('btnQuiz').disabled = false;
}

// ─── MAIN PROCESS ───
async function startProcessing() {
  if (!_selectedFile) {
    alert("Select a file first");
    return;
  }

  try {
    const formData = new FormData();
    formData.append("file", _selectedFile);

    console.log("🚀 Calling API...");

    const response = await fetch(`${BACKEND_URL}/api/process`, {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    console.log("✅ Response:", data);

    if (!response.ok) {
      throw new Error(data.error || "Server error");
    }

    // ✅ SAVE
    localStorage.setItem("lecturAI_results", JSON.stringify(data));

    // ✅ REDIRECT
    window.location.href = "results.html";

  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  }
}
