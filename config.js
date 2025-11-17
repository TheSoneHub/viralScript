// /config.js

/**
 * App Configuration
 * -----------------
 * This file contains the core settings for the ViralScript application.
 */

// --- Access Management ---
// This URL points to the Google Apps Script that securely validates user emails
// by checking them against a private Google Sheet.
const EMAIL_VALIDATION_API_URL = "https://script.google.com/macros/s/AKfycbxqR0-ULXX2REtZV3AF4HU9ztQaPih_V0WqdfzrnI9j1JmQsOIG3RpC2jfl7xEUMBHL-A/exec";


// --- AI Model Configuration ---
// Default settings for the generative AI model.
const AI_DEFAULTS = {
  // Controls the "creativity" or randomness of the AI's responses.
  // Lower is more focused (0.2), higher is more creative (0.9).
  temperature: 0.7,
};