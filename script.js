

const API_KEY = "AIzaSyCc4bvr_gfa-XTFeNxnvxMhlQfRFA1Uklc"; 
const MODEL_NAME = "gemini-2.5-flash";


let mode = "ask"; 
const chatArea = document.getElementById("chatArea");
const inputEl = document.getElementById("inputText");
const sendBtn = document.getElementById("sendBtn");
const copyBtn = document.getElementById("copyLast");
const clearBtn = document.getElementById("clearChat");
const modeBtns = document.querySelectorAll(".mode-btn");

const toggleOptions = document.querySelectorAll(".toggle-option");
const slider = document.querySelector(".toggle-slider");

const updateToggleUI = (m) => {
  toggleOptions.forEach((opt, i) => {
    opt.classList.toggle("active", opt.dataset.mode === m);

    if (opt.dataset.mode === m) {
      slider.style.transform = `translateX(${i * 100}%)`;
    }
  });
};

toggleOptions.forEach((opt) => {
  opt.addEventListener("click", () => {
    mode = opt.dataset.mode;
    setMode(mode);       
    updateToggleUI(mode);
  });
});


updateToggleUI("ask");


let conversation = [];


const scrollToBottom = () => chatArea.scrollTop = chatArea.scrollHeight;
const createBubble = (text, who = "ai", opts = {}) => {
  const div = document.createElement("div");
  div.className = `bubble ${who}`;
  div.innerHTML = `<div class="content">${text}</div>`;
  if (opts.meta) {
    const m = document.createElement("div");
    m.className = "meta";
    m.textContent = opts.meta;
    div.appendChild(m);
  }
  chatArea.appendChild(div);
  scrollToBottom();
  return div;
};

const createTyping = () => {
  const wrapper = document.createElement("div");
  wrapper.className = "bubble ai";
  wrapper.innerHTML = `
    <div class="loader">
      <div class="dot"></div><div class="dot"></div><div class="dot"></div>
    </div>`;
  chatArea.appendChild(wrapper);
  scrollToBottom();
  return wrapper;
};


const buildPrompt = (userText) => {
  if (mode === "ask") return userText;
  if (mode === "summarize") return `Summarize this text concisely:\n\n${userText}`;
  if (mode === "ideas") return `Give 5 creative ideas or prompts about: ${userText}`;
  return userText;
};


const callGemini = async (prompt) => {
  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }]
  };

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  const data = await res.json();
 
  const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return aiText ?? "No response received.";
};


const setMode = (m) => {
  mode = m;
  modeBtns.forEach(b => b.classList.toggle("active", b.dataset.mode === m));
  inputEl.placeholder = m === "ask" ? "Ask a question..." : m === "summarize" ? "Paste long text to summarize..." : "Tell me the topic for ideas...";
};

modeBtns.forEach(btn => btn.addEventListener("click", () => setMode(btn.dataset.mode)));

sendBtn.addEventListener("click", async () => {
  const text = inputEl.value.trim();
  if (!text) return;
  
  createBubble(text, "user");
  conversation.push({ role: "user", text });
  inputEl.value = "";

  const typingNode = createTyping();

  try {
    const prompt = buildPrompt(text);
    const aiReply = await callGemini(prompt);
    
    typingNode.remove();
    
    createBubble(aiReply, "ai");
    conversation.push({ role: "assistant", text: aiReply });
  } catch (err) {
    typingNode.remove();
    createBubble(`Error: ${err.message}`, "ai", { meta: "API Error" });
    console.error(err);
  }
});

inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendBtn.click();
  }
});

copyBtn.addEventListener("click", () => {
  
  const lastAI = [...conversation].reverse().find(m => m.role === "assistant");
  if (!lastAI) return alert("No AI reply to copy yet.");
  navigator.clipboard.writeText(lastAI.text)
    .then(() => { copyBtn.textContent = "Copied ✓"; setTimeout(()=>copyBtn.textContent="Copy",1100); })
    .catch(()=> alert("Copy failed"));
});

clearBtn.addEventListener("click", () => {
  if (!confirm("Clear conversation?")) return;
  conversation = [];
  chatArea.innerHTML = "";
});


setMode("ask");
inputEl.focus();

const body = document.body;
const toggleBtn = document.getElementById("themeToggle");

body.classList.add("light");

toggleBtn.addEventListener("click", () => {
    if (body.classList.contains("light")) {
        body.classList.remove("light");
        body.classList.add("dark");
        toggleBtn.textContent = "☀ Light Mode";
    } else {
        body.classList.remove("dark");
        body.classList.add("light");
        toggleBtn.textContent = "🌙 Dark Mode";
    }
});
