// /assets/js/storage.js
// This file manages all data stored in the user's browser (localStorage).

// === 1. API KEY STORAGE ===

/**
 * Saves the user's Google Gemini API Key to localStorage.
 * The key is encoded in Base64 for simple obfuscation (not encryption).
 * @param {string} key - The API key to save.
 */
function saveApiKey(key) {
    if (!key) {
        console.error("Attempted to save an empty API key.");
        return;
    }
    try {
        localStorage.setItem("gemini_api_key", btoa(key));
    } catch (e) {
        console.error("Failed to save API key to localStorage:", e);
    }
}

/**
 * Retrieves the decoded Google Gemini API Key from localStorage.
 * @returns {string|null} The decoded API key, or null if it doesn't exist.
 */
function getApiKey() {
    try {
        const encodedKey = localStorage.getItem("gemini_api_key");
        return encodedKey ? atob(encodedKey) : null;
    } catch (e) {
        console.error("Failed to retrieve or decode API key from localStorage:", e);
        return null;
    }
}

/**
 * Deletes the user's API Key from localStorage.
 */
function deleteApiKey() {
    try {
        localStorage.removeItem("gemini_api_key");
    } catch (e) {
        console.error("Failed to delete API key from localStorage:", e);
    }
}


// === 2. CHAT HISTORY STORAGE ===

/**
 * Saves the current chat conversation history to localStorage.
 * @param {Array<object>} history - The chat history array to save.
 */
function saveChatHistory(history) {
    try {
        localStorage.setItem("viralscript_chat_history", JSON.stringify(history));
    } catch (e) {
        console.error("Failed to save chat history to localStorage:", e);
        // This can happen if the history is too large for localStorage.
    }
}

/**
 * Retrieves the chat conversation history from localStorage.
 * @returns {Array<object>} The chat history array, or an empty array if none exists or an error occurs.
 */
function getChatHistory() {
    try {
        const historyJson = localStorage.getItem("viralscript_chat_history");
        return historyJson ? JSON.parse(historyJson) : [];
    } catch (e) {
        console.error("Failed to retrieve or parse chat history from localStorage:", e);
        return [];
    }
}

/**
 * Deletes the chat history from localStorage.
 */
function deleteChatHistory() {
    try {
        localStorage.removeItem("viralscript_chat_history");
    } catch (e) {
        console.error("Failed to delete chat history from localStorage:", e);
    }
}


// === 3. SCRIPT VAULT STORAGE ===

/**
 * Retrieves all saved scripts from localStorage.
 * @returns {Array<object>} An array of script objects.
 */
function getSavedScripts() {
    try {
        const scriptsJson = localStorage.getItem('viralscript_vault');
        return scriptsJson ? JSON.parse(scriptsJson) : [];
    } catch (e) {
        console.error("Failed to retrieve scripts from localStorage:", e);
        return [];
    }
}

/**
 * Saves a new script object to the vault in localStorage.
 * @param {object} scriptObject - The script object to save {id, title, hook, body, cta}.
 * @returns {boolean} True on success, false on failure.
 */
function saveScript(scriptObject) {
    try {
        const scripts = getSavedScripts();
        // Add the new script to the beginning of the array so it appears at the top of the list.
        scripts.unshift(scriptObject);
        localStorage.setItem('viralscript_vault', JSON.stringify(scripts));
        return true;
    } catch (e) {
        console.error("Failed to save script to localStorage:", e);
        return false;
    }
}

/**
 * Deletes a script from the vault by its unique ID.
 * @param {number} scriptId - The ID (timestamp) of the script to delete.
 * @returns {boolean} True on success, false on failure.
 */
function deleteScript(scriptId) {
    try {
        let scripts = getSavedScripts();
        // Filter out the script with the matching ID.
        scripts = scripts.filter(script => script.id !== scriptId);
        localStorage.setItem('viralscript_vault', JSON.stringify(scripts));
        return true;
    } catch (e) {
        console.error("Failed to delete script from localStorage:", e);
        return false;
    }
}