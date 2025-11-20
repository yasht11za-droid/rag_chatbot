const messagesContainer = document.getElementById("messages");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

const backendUrl = "http://localhost:3000/chat"; // change if different

function appendMessage(message, type) {
  const msgDiv = document.createElement("div");
  msgDiv.className = type === "user" 
    ? "text-right text-gray-700"
    : "text-left text-gray-800 bg-gray-100 p-2 rounded-lg";

  msgDiv.textContent = message;
  messagesContainer.appendChild(msgDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendMessage() {
  const text = userInput.value.trim();
  if (!text) return;

  appendMessage(text, "user");
  userInput.value = "";

  try {
    const res = await fetch(backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: text })
    });

    const data = await res.json();
    const answer = data.answer || "Sorry, I couldn't find the answer.";

    appendMessage(answer, "bot");
  } catch (err) {
    appendMessage("Error connecting to server.", "bot");
    console.error(err);
  }
}

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", e => {
  if (e.key === "Enter") sendMessage();
});
