// /assets/js/storage.js
// This file manages all data persistence for the application using the browser's localStorage.

// === 1. API KEY STORAGE ===
// Manages the user's Google Gemini API Key.
// The key is encoded in Base64 for light obfuscation to prevent accidental viewing.

const API_KEY_STORAGE_KEY = "viralscript_gemini_api_key";

/**
 * Saves the user's API key to localStorage after encoding it.
 * @param {string} key - The raw API key to be saved.
 */
function saveApiKey(key) {
    if (!key || typeof key !== 'string') {
        console.error("Attempted to save an invalid API key.");
        return;
    }
    try {
        const encodedKey = btoa(key); // Encode to Base64
        localStorage.setItem(API_KEY_STORAGE_KEY, encodedKey);
    } catch (error) {
        console.error("Failed to save API Key to localStorage:", error);
    }
}

/**
 * Retrieves and decodes the user's API key from localStorage.
 * @returns {string|null} The decoded API key, or null if it's not found.
 */
function getApiKey() {
    try {
        const encodedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
        if (encodedKey) {
            return atob(encodedKey); // Decode from Base64
        }
        return null;
    } catch (error) {
        console.error("Failed to retrieve API Key from localStorage:", error);
        // If decoding fails (e.g., corrupted data), clear the invalid key.
        deleteApiKey();
        return null;
    }
}

/**
 * Deletes the user's API key from localStorage.
 */
function deleteApiKey() {
    try {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
    } catch (error) {
        console.error("Failed to delete API Key from localStorage:", error);
    }
}


// === 2. DRAFTS WORKSPACE STORAGE ===
// Manages the collection of script drafts. Each draft is an object containing
// its ID, name, the script content, and the associated chat history.

const DRAFTS_STORAGE_KEY = "viralscript_drafts_workspace";

/**
 * Retrieves all script drafts from localStorage.
 * Returns an array of draft objects.
 * @returns {Array<Object>} An array of all saved drafts, or an empty array if none exist.
 */
function getAllDrafts() {
    try {
        const draftsJson = localStorage.getItem(DRAFTS_STORAGE_KEY);
        // If data exists, parse it. Otherwise, return an empty array.
        return draftsJson ? JSON.parse(draftsJson) : [];
    } catch (error) {
        console.error("Failed to get all drafts from localStorage:", error);
        // If parsing fails, it means the data is corrupted. Return an empty array.
        return [];
    }
}

/**
 * Saves a single draft object.
 * If a draft with the same ID already exists, it updates it.
 * If not, it adds it as a new draft.
 * @param {Object} draftObject - The draft object to save. Must include an 'id' property.
 */
function saveDraft(draftObject) {
    if (!draftObject || !draftObject.id) {
        console.error("Attempted to save an invalid draft object.");
        return;
    }
    try {
        let drafts = getAllDrafts();
        const existingDraftIndex = drafts.findIndex(d => d.id === draftObject.id);

        if (existingDraftIndex > -1) {
            // Found an existing draft, so replace it with the updated version.
            drafts[existingDraftIndex] = draftObject;
        } else {
            // No existing draft found, so add this one to the end of the array.
            drafts.push(draftObject);
        }

        // Save the entire updated array back to localStorage.
        localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(drafts));
    } catch (error) {
        console.error("Failed to save draft to localStorage:", error);
    }
}

/**
 * Retrieves a single draft from localStorage by its unique ID.
 * @param {number} draftId - The ID of the draft to retrieve.
 * @returns {Object|null} The found draft object, or null if no draft with that ID exists.
 */
function getDraftById(draftId) {
    if (!draftId) {
        return null;
    }
    try {
        const drafts = getAllDrafts();
        return drafts.find(d => d.id === draftId) || null;
    } catch (error) {
        console.error(`Failed to get draft with ID ${draftId}:`, error);
        return null;
    }
}

/**
 * Deletes a draft from localStorage by its unique ID.
 * @param {number} draftId - The ID of the draft to delete.
 */
function deleteDraftById(draftId) {
    if (!draftId) {
        console.error("Attempted to delete a draft with an invalid ID.");
        return;
    }
    try {
        let drafts = getAllDrafts();
        // Create a new array containing all drafts *except* the one with the matching ID.
        const updatedDrafts = drafts.filter(d => d.id !== draftId);
        
        // Save the new, filtered array back to localStorage.
        localStorage.setItem(DRAFTS_STORAGE_KEY, JSON.stringify(updatedDrafts));
    } catch (error) {
        console.error(`Failed to delete draft with ID ${draftId}:`, error);
    }
}