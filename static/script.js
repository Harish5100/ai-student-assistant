// AI Student Assistant Client Application

// Theme Switcher Initialization
document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.documentElement.setAttribute("data-theme", savedTheme);

  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const currentTheme = document.documentElement.getAttribute("data-theme");
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
    });
  }

  // Keyboard shortcut: Press Enter in input fields to submit
  document.getElementById("quizTopic")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") generateQuiz();
  });

  document.getElementById("planTopic")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") generatePlan();
  });
});

// Quick Prompt Chip Handler
function fillPrompt(type, text, days) {
  if (type === "ask") {
    const el = document.getElementById("question");
    if (el) {
      el.value = text;
      el.focus();
      document.getElementById("askSection")?.scrollIntoView({ behavior: "smooth" });
    }
  } else if (type === "quiz") {
    const el = document.getElementById("quizTopic");
    if (el) {
      el.value = text;
      el.focus();
      document.getElementById("quizSection")?.scrollIntoView({ behavior: "smooth" });
    }
  } else if (type === "plan") {
    const elTopic = document.getElementById("planTopic");
    const elDays = document.getElementById("planDays");
    if (elTopic) {
      elTopic.value = text;
      if (elDays && days) elDays.value = days;
      elTopic.focus();
      document.getElementById("planSection")?.scrollIntoView({ behavior: "smooth" });
    }
  }
}

// Generic Fetch Wrapper
async function postJSON(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Server error (${response.status})`);
  }

  return data;
}

// Button Loading Helper
function setLoading(btnId, isLoading) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  const btnText = btn.querySelector(".btn-text");
  const spinner = btn.querySelector(".btn-spinner");

  if (isLoading) {
    btn.disabled = true;
    if (btnText) btnText.dataset.originalText = btnText.textContent;
    if (btnText) btnText.textContent = "Processing...";
    if (spinner) spinner.classList.remove("hidden");
  } else {
    btn.disabled = false;
    if (btnText && btnText.dataset.originalText) {
      btnText.textContent = btnText.dataset.originalText;
    }
    if (spinner) spinner.classList.add("hidden");
  }
}

// 1. Ask AI Tutor
async function askAI() {
  const questionEl = document.getElementById("question");
  const question = questionEl.value.trim();

  if (!question) {
    alert("Please enter an academic or study question.");
    questionEl.focus();
    return;
  }

  setLoading("askBtn", true);
  const wrapper = document.getElementById("answerWrapper");
  const content = document.getElementById("answerContent");
  wrapper.classList.add("hidden");

  try {
    const data = await postJSON("/api/ask", { question });
    const formattedHtml = typeof marked !== "undefined" ? marked.parse(data.answer) : data.answer;
    content.innerHTML = formattedHtml;
    wrapper.classList.remove("hidden");
  } catch (error) {
    content.innerHTML = `<div class="error-box">⚠️ ${escapeHTML(error.message)}</div>`;
    wrapper.classList.remove("hidden");
  } finally {
    setLoading("askBtn", false);
  }
}

// 2. Interactive Quiz Generator
let quizState = {
  score: 0,
  answered: 0,
  total: 0
};

async function generateQuiz() {
  const topicEl = document.getElementById("quizTopic");
  const topic = topicEl.value.trim();

  if (!topic) {
    alert("Please enter a quiz topic.");
    topicEl.focus();
    return;
  }

  setLoading("quizBtn", true);

  const wrapper = document.getElementById("quizResultWrapper");
  const header = document.getElementById("quizHeader");
  const container = document.getElementById("quizContainer");

  wrapper.classList.add("hidden");
  header.classList.add("hidden");
  container.innerHTML = "";

  try {
    const data = await postJSON("/api/quiz", { topic });
    const quiz = data.quiz;

    if (!quiz || !Array.isArray(quiz.questions)) {
      throw new Error("Invalid quiz structure received from AI.");
    }

    quizState = { score: 0, answered: 0, total: quiz.questions.length };

    document.getElementById("quizTitle").textContent = quiz.title || `${topic} Quiz`;
    updateScoreBadge();

    container.innerHTML = quiz.questions.map((q, idx) => renderQuizQuestion(q, idx)).join("");
    
    header.classList.remove("hidden");
    wrapper.classList.remove("hidden");
  } catch (error) {
    container.innerHTML = `<div class="error-box">⚠️ ${escapeHTML(error.message)}</div>`;
    wrapper.classList.remove("hidden");
  } finally {
    setLoading("quizBtn", false);
  }
}

function renderQuizQuestion(q, index) {
  const optionsHtml = q.options.map((opt) => {
    // Extract letter code: A, B, C, D
    const match = opt.match(/^([A-D])[\):.]?\s*(.*)/i);
    const letter = match ? match[1].toUpperCase() : opt.charAt(0).toUpperCase();
    const optText = match ? match[2] : opt;

    return `
      <button class="option-btn" 
              onclick="handleOptionSelect(this, '${letter}', '${escapeQuotes(q.correct_answer)}', 'exp_${index}')">
        <strong>${letter})</strong> ${escapeHTML(optText)}
      </button>
    `;
  }).join("");

  return `
    <div class="quiz-item">
      <p class="question-text"><strong>Q${index + 1}.</strong> ${escapeHTML(q.question)}</p>
      <div class="options-grid">
        ${optionsHtml}
      </div>
      <div id="exp_${index}" class="explanation-box hidden">
        <strong>Explanation:</strong> ${escapeHTML(q.explanation)}
      </div>
    </div>
  `;
}

function handleOptionSelect(btn, selectedLetter, correctLetter, expId) {
  const parentGrid = btn.parentElement;
  const allOptionBtns = parentGrid.querySelectorAll(".option-btn");

  // Disable all options in this question
  allOptionBtns.forEach(b => b.disabled = true);

  const cleanCorrect = correctLetter.trim().charAt(0).toUpperCase();
  const isCorrect = selectedLetter === cleanCorrect;

  if (isCorrect) {
    btn.classList.add("correct");
    btn.innerHTML += ` <span style="margin-left:auto;">✓ Correct</span>`;
    quizState.score++;
  } else {
    btn.classList.add("incorrect");
    btn.innerHTML += ` <span style="margin-left:auto;">✗ Wrong</span>`;

    // Highlight the correct option
    allOptionBtns.forEach(b => {
      if (b.textContent.trim().startsWith(cleanCorrect)) {
        b.classList.add("correct");
      }
    });
  }

  quizState.answered++;
  updateScoreBadge();

  // Show explanation
  const expBox = document.getElementById(expId);
  if (expBox) expBox.classList.remove("hidden");
}

function updateScoreBadge() {
  const badge = document.getElementById("quizScoreBadge");
  if (badge) {
    badge.textContent = `Score: ${quizState.score} / ${quizState.total}`;
  }
}

// 3. Study Plan Generator
async function generatePlan() {
  const topicEl = document.getElementById("planTopic");
  const daysEl = document.getElementById("planDays");
  const topic = topicEl.value.trim();
  const days = parseInt(daysEl.value, 10) || 7;

  if (!topic) {
    alert("Please enter a study plan topic.");
    topicEl.focus();
    return;
  }

  setLoading("planBtn", true);
  const wrapper = document.getElementById("planResultWrapper");
  const content = document.getElementById("planContent");
  wrapper.classList.add("hidden");

  try {
    const data = await postJSON("/api/study-plan", { topic, days });
    const formattedHtml = typeof marked !== "undefined" ? marked.parse(data.answer) : data.answer;
    content.innerHTML = formattedHtml;
    wrapper.classList.remove("hidden");
  } catch (error) {
    content.innerHTML = `<div class="error-box">⚠️ ${escapeHTML(error.message)}</div>`;
    wrapper.classList.remove("hidden");
  } finally {
    setLoading("planBtn", false);
  }
}

// Copy to Clipboard Utility
function copyToClipboard(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const textToCopy = el.innerText;
  navigator.clipboard.writeText(textToCopy).then(() => {
    showToast("Copied to clipboard!");
  }).catch(() => {
    alert("Failed to copy text.");
  });
}

function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 2200);
}

// Helper Utilities
function escapeHTML(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeQuotes(str) {
  if (!str) return "";
  return str.replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

