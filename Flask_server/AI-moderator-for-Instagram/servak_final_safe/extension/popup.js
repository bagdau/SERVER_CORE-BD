document.addEventListener("DOMContentLoaded", () => {
  const sentCountSpan = document.getElementById("sentCount");
  const refreshButton = document.getElementById("refreshButton");
  const resetButton = document.getElementById("resetButton");

  sentCountSpan.textContent = localStorage.getItem("sentCount") || "0";

  refreshButton.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => { if (typeof scanCommentsSmart === "function") scanCommentsSmart(); }
    });
  });

  resetButton.addEventListener("click", () => {
    localStorage.setItem("sentCount", "0");
    sentCountSpan.textContent = "0";
  });
});