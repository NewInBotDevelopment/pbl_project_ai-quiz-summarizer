'use strict';

const BACKEND_URL = "https://lecturai-backend.onrender.com";
let _selectedFile = null;

function handleFileSelect(e) {
  const f = e.target.files[0];
  if (f) _selectedFile = f;
}

async function startProcessing() {
  if (!_selectedFile) {
    alert("Select a file first");
    return;
  }

  const formData = new FormData();
  formData.append("file", _selectedFile);

  try {
    console.log("🚀 Calling API...");

    let response;

    // ✅ RETRY LOGIC (Render cold start fix)
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

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Server error");
    }

    // ✅ SAFETY fallback
    if (!data.summary) data.summary = "No summary generated";
    if (!data.quiz) data.quiz = "No quiz generated";

    localStorage.setItem("lecturAI_results", JSON.stringify(data));

    window.location.href = "results.html";

  } catch (err) {
    console.error(err);
    alert("Error: " + err.message);
  }
}
