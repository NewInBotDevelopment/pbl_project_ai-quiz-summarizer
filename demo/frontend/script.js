'use strict';

const BACKEND_URL = "https://lecturai-backend.onrender.com";
let _selectedFile = null;

// ─── FILE SELECT ───
function handleFileSelect(e) {
  const f = e.target.files[0];
  if (f) _selectedFile = f;
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

    console.log("🚀 Sending request...");

    const response = await fetch(`${BACKEND_URL}/api/process`, {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    console.log("✅ Response:", data);

    if (!response.ok) {
      throw new Error(data.error || "Server error");
    }

    // ✅ Save data
    localStorage.setItem("lecturAI_results", JSON.stringify(data));

    // ✅ Redirect
    window.location.href = "results.html";

  } catch (err) {
    console.error("❌ Error:", err);
    alert("Error: " + err.message);
  }
}
