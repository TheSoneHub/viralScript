/**
 * ==========================================================================
 * ViralScript - Browser Storage Manager
 * ==========================================================================
 * This file handles all interactions with the browser's localStorage.
 * It is responsible for:
 * 1. Securely saving, retrieving, and deleting the user's Gemini API key.
 * 2. Persisting and retrieving the chat conversation history.
 *
 * All data is stored exclusively on the user's device and is never sent
 * to any server.
 */

// ==========================================================================
//   1. API Key Management Functions
// ==========================================================================

/**
 * Saves the provided API key to localStorage after Base64 encoding for
 * light obfuscation. This prevents the key from being plainly visible
 * in browser developer tools.
 * @param {string} key - The user's Google Gemini API key.
 */
function saveApiKey(key) {
    if (!key || typeof key !== 'string') {
        console.error("Save API Key Error: Invalid key provided.");
        return;
    }
    try {
        // btoa() creates a Base64-encoded ASCII string from a string of binary data.
        const encodedKey = btoa(key);
        localStorage.setItem("gemini_api_key", encodedKey);
        console.log("API Key has been saved to localStorage.");
    } catch (error) {
        console.error("Failed to save API Key to localStorage:", error);
    }
}

/**
 * Retrieves the API key from localStorage and decodes it from Base64.
 * @returns {string|null} The decoded API key if it exists, otherwise null.
 */
function getApiKey() {
    try {
        const encodedKey = localStorage.getItem("gemini_api_key");
        if (encodedKey) {
            // atob() decodes a Base64-encoded string.
            return atob(encodedKey);
        }
        return null;
    } catch (error) {
        console.error("Failed to retrieve API Key from localStorage:", error);
        // If decoding fails (e.g., corrupted data), remove the bad item.
        localStorage.removeItem("gemini_api_key");
        return null;
    }
}

/**
 * Deletes the API key from localStorage entirely.
 */
function deleteApiKey() {
    try {
        localStorage.removeItem("gemini_api_key");
        console.log("API Key has been deleted from localStorage.");
    } catch (error) {
        console.error("Failed to delete API Key from localStorage:", error);
    }
}


// ==========================================================================
//   2. Chat History Management Functions
// ==========================================================================

/**
 * Saves the entire chat history array to localStorage after converting
 * it to a JSON string.
 * @param {Array<Object>} history - The array of chat message objects.
 */
function saveChatHistory(history) {
    if (!Array.isArray(history)) {
        console.error("Save Chat History Error: Provided history is not an array.");
        return;
    }
    try {
        const historyJson = JSON.stringify(history);
        localStorage.setItem("viralscript_chat_history", historyJson);
    } catch (error) {
        console.error("Failed to save chat history to localStorage:", error);
    }
}

/**
 * Retrieves the chat history from localStorage and parses it back into
 * a JavaScript array.
 * @returns {Array<Object>} The array of chat message objects, or an empty array if none exists or an error occurs.
 */
function getChatHistory() {
    try {
        const historyJson = localStorage.getItem("viralscript_chat_history");
        if (historyJson) {
            return JSON.parse(historyJson);
        }
        return []; // Return an empty array if no history is found
    } catch (error) {
        console.error("Failed to retrieve chat history from localStorage:", error);
        // If parsing fails (e.g., corrupted data), remove the bad item.
        localStorage.removeItem("viralscript_chat_history");
        return [];
    }
}

/**
 * Deletes the entire chat history from localStorage. This is used by the
 * "Clear Chat" feature.
 */
function deleteChatHistory() {
    try {
        localStorage.removeItem("viralscript_chat_history");
        console.log("Chat history has been deleted from localStorage.");
    } catch (error) {
        console.error("Failed to delete chat history from localStorage:", error);
    }
}