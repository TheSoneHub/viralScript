# ViralScript AI 🧪

**Live Demo:** [https://viralscript.netlify.app/](https://viralscript.netlify.app/)

ViralScript AI is your personal AI partner for crafting viral short-form video scripts. It acts as a "Viral Script Director," guiding you from a raw idea to a polished, performance-ready script using a structured, conversational workflow.

## Core Features

-   **🤖 Conversational AI Director:** A sophisticated AI persona that coaches you through the scriptwriting process.
-   **💡 Guided Discovery:** The AI asks intelligent follow-up questions to understand your vision before writing.
-   **✍️ One-Click Generation:** Generates a full script (Hook, Body, CTA) based on your conversation.
-   **✂️ Surgical Editing:** Refine any part of the script with simple instructions (e.g., "make the hook funnier").
-   **📈 Strategic Analysis:** Get a full analysis of your script's cohesion and viral potential.
-   **🕵️ Viral Deconstruction:** Paste a video link (TikTok, Reels, etc.) and the AI will break down its viral formula.
-   **🗄️ Script Vault:** Save, load, and manage all your scripts directly in the browser.
-   **✨ Inspiration Banks:** Overcome writer's block with curated banks of viral hooks and calls-to-action.
-   **🔐 Secure Access:** User access is managed securely through a private Google Sheet, not a hardcoded list.

## Tech Stack

-   **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
-   **AI:** Google Gemini API
-   **Dependencies:** [Marked.js](https://marked.js.org/) for Markdown rendering in the chat.

## Setup & Configuration

To run this application, you need to configure a secure email validation system and add your personal AI API key.

### Step 1: Set Up Google Sheet for Email Access

1.  **Create a new Google Sheet.**
2.  In **Column A**, list all the email addresses you want to grant access to, one email per row. Do not add a header.
3.  Note the **Sheet ID** from your browser's URL bar. It's the long string of characters in `.../spreadsheets/d/SHEET_ID_HERE/edit`.

### Step 2: Deploy the Google Apps Script API

1.  In your Google Sheet, go to `Extensions` > `Apps Script`.
2.  Delete any existing code and paste the code from the [Google Apps Script file](google-apps-script.gs) provided in this project.
3.  Replace `"YOUR_SHEET_ID_HERE"` with your actual Sheet ID from Step 1.
4.  Click the **Deploy** button > **New deployment**.
5.  For "Select type", choose **Web app**.
6.  Under "Who has access", select **Anyone**. This is safe; it only allows access to the script's output, not your sheet's data.
7.  Click **Deploy**. Authorize the script's access if prompted.
8.  **Copy the generated Web app URL.**

### Step 3: Configure the Application

1.  Open the `config.js` file in the project.
2.  Paste the **Web app URL** you copied into the `EMAIL_VALIDATION_API_URL` constant.

    ```javascript
    const EMAIL_VALIDATION_API_URL = "YOUR_DEPLOYED_GOOGLE_APPS_SCRIPT_URL_HERE";
    ```

### Step 4: Add Your Gemini API Key

1.  Launch the application.
2.  After logging in with an approved email, click the **Settings icon** (⚙️).
3.  Enter your [Google Gemini API Key](https://ai.google.dev/) and click **Save**. The key will be stored locally and securely in your browser.

Your application is now fully configured and ready to use!