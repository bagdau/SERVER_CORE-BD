// 📥 Функция загрузки ключевых слов из файла
async function loadKeywords(filePath) {
  const response = await fetch(chrome.runtime.getURL(filePath));
  const text = await response.text();
  return text.split("\\n").map(word => word.trim()).filter(Boolean);
}

// 🔥 Массивы ключевых слов
let positiveKeywords = [];
let neutralKeywords = [];
let negativeKeywords = [];

// 📚 Загрузка всех ключевых слов
async function loadAllKeywords() {
  positiveKeywords = await loadKeywords("positive_keywords.txt");
  neutralKeywords = await loadKeywords("neutral_keywords.txt");
  negativeKeywords = await loadKeywords("negative_keywords.txt");

  console.log("✅ Ключевые слова загружены:", {
    positive: positiveKeywords.length,
    neutral: neutralKeywords.length,
    negative: negativeKeywords.length
  });
}

// 🛡️ Проверка, настоящий ли это комментарий
function isHumanComment(el) {
  const text = el.innerText?.trim() || "";
  if (!text) return false;
  if (text.startsWith("data:")) return false;
  if (text.length > 500) return false;
  if (/base64|javascript|href|src/.test(text.toLowerCase())) return false;
  if (el.closest("[data-testid='comment'], [role='article']")) return true;
  return false;
}

// 🧠 Классификация комментария
function classifyComment(text) {
  const lowered = text.toLowerCase();
  if (positiveKeywords.some(word => lowered.includes(word))) return "positive";
  if (negativeKeywords.some(word => lowered.includes(word))) return "negative";
  if (neutralKeywords.some(word => lowered.includes(word))) return "neutral";
  return "unknown";
}

// ✨ Обёртка комментария с анимацией
function wrapComment(el, category) {
  if (el.closest(".ai-moderated-wrapper")) return;

  const wrapper = document.createElement("div");
  wrapper.className = "ai-moderated-wrapper";

  switch (category) {
    case "positive":
      wrapper.style.backgroundColor = "#ddffdd";
      wrapper.style.border = "1px solid green";
      break;
    case "neutral":
      wrapper.style.backgroundColor = "#ddeeff";
      wrapper.style.border = "1px solid blue";
      break;
    case "negative":
      wrapper.style.backgroundColor = "#ffdddd";
      wrapper.style.border = "1px solid red";
      break;
  }

  el.parentNode.insertBefore(wrapper, el);
  wrapper.appendChild(el);
}

// 📤 Отправка комментария на сервер
function sendComment(comment, author = "unknown", postId = window.location.pathname, userId = "guest_user", category = "unknown") {
  fetch("http://127.0.0.1:5000/add-comment", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, post_id: postId, author, comment, category })
  })
  .then(res => res.json())
  .then(data => {
    let count = parseInt(localStorage.getItem("sentCount") || "0");
    localStorage.setItem("sentCount", (count + 1).toString());
  })
  .catch(console.error);
}

// 🧹 Обработка одного комментария
const processedElements = new WeakSet();

function handleComment(el) {
  const text = el.innerText?.trim() || "";
  if (!text || !isHumanComment(el) || processedElements.has(el)) return;

  const author = el.closest("article")?.querySelector("h3")?.innerText || "Неизвестный автор";
  const category = classifyComment(text);

  if (category !== "unknown") {
    wrapComment(el, category);
  }

  sendComment(text, author, window.location.pathname, "guest_user", category);
  processedElements.add(el);
}

// 🔍 Умный сканер комментариев
function scanCommentsSmart() {
  const elements = document.querySelectorAll("span, p, div");
  elements.forEach(el => handleComment(el));
}

// 👁️ Отслеживание новых комментариев через MutationObserver
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const elements = node.querySelectorAll("span, p, div");
        elements.forEach(handleComment);
      }
    });
  });
});

// 📦 Старт работы
(async () => {
  await loadAllKeywords();
  observer.observe(document.body, { childList: true, subtree: true });
  setInterval(scanCommentsSmart, 2000);
})();
