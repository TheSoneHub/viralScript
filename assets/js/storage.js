// /assets/js/storage.js

// --- API Key Storage ---
function saveApiKey(key) {
    if (!key) return;
    localStorage.setItem("gemini_api_key", btoa(key));
}

function getApiKey() {
    const encodedKey = localStorage.getItem("gemini_api_key");
    return encodedKey ? atob(encodedKey) : null;
}

function deleteApiKey() {
    localStorage.removeItem("gemini_api_key");
}


// --- Chat History Storage ---
function saveChatHistory(history) {
    try {
        localStorage.setItem("viralscript_chat_history", JSON.stringify(history));
    } catch (e) {
        console.error("Failed to save chat history:", e);
    }
}

function getChatHistory() {
    try {
        const historyJson = localStorage.getItem("viralscript_chat_history");
        return historyJson ? JSON.parse(historyJson) : [];
    } catch (e) {
        console.error("Failed to retrieve chat history:", e);
        return [];
    }
}

function deleteChatHistory() {
    localStorage.removeItem("viralscript_chat_history");
    console.log("Chat history cleared from storage.");
}