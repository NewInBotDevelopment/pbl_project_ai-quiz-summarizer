'use strict';

const BACKEND_URL = "https://lecturai-backend.onrender.com";
let _selectedFile = null;

// ─── FILE SELECT ─────────────────────────────
function handleFileSelect(e) {
  const f = e.target.files[0];

  if (!f) {
    alert("No file selected");
    return;
  }

  console.log("📄 Selected file:", f.name);

  _selectedFile = f;

  // ✅ ENABLE BUTTONS (IMPORTANT FIX)
  const btnSummary = document.getElementById("btnSummary");
  const btnQuiz = document.getElementById("btnQuiz");

  if (btnSummary) btnSummary.disabled = false;
  if (btnQuiz) btnQuiz.disabled = false;
}

// ─── DRAG & DROP SUPPORT ─────────────────────
function handleDrop(e) {
  e.preventDefault();

  const f = e.dataTransfer.files[0];
  if (f) {
    console.log("📄 Dropped file:", f.name);
    _selectedFile = f;

    document.getElementById("btnSummary").disabled = false;
    document.getElementById("btnQuiz").disabled = false;
  }
}

function handleDragOver(e) {
  e.preventDefault();
}

function handleDragLeave(e) {
  e.preventDefault();
}

// ─── MAIN PROCESS ────────────────────────────
async function startProcessing(mode = "summary") {
  if (!_selectedFile) {
    alert("Select a file first");
    return;
  }

  console.log("📄 File being sent:", _selectedFile);

  const formData = new FormData();
  formData.append("file", _selectedFile);

  try {
    console.log("🚀 Calling API...");

    let response;

    // ✅ RETRY (Render cold start fix)
    for (let i = 0; i < 2; i++) {
      try {
        response = await fetch(`${BACKEND_URL}/api/process`, {
          method: "POST",
          body: formData
        });
        break;
      } catch (err) {
        console.log("Retrying...");
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    if (!response) {
      throw new Error("Server not responding");
    }

    const data = await response.json();

    console.log("✅ Response:", data);

    if (!response.ok) {
      throw new Error(data.error || "Server error");
    }

    // ✅ FALLBACK SAFETY
    if (!data.summary) data.summary = "No summary generated";
    if (!data.quiz) data.quiz = "No quiz generated";

    // ✅ SAVE DATA
    localStorage.setItem("lecturAI_results", JSON.stringify(data));

    // ✅ REDIRECT
    window.location.href = "results.html";

  } catch (err) {
    console.error("❌ Error:", err);
    alert("Error: " + err.message);
  }
}
