# ViralScript AI 🧪

**Live Demo Link:** [https://viralscript.netlify.app/](https://viralscript.netlify.app/)

ViralScript AI is not just a script generator; it's your personal AI **"Chief Creative Officer."** Designed for Burmese content creators, this tool transforms a simple topic into a viral video concept by proposing strategic angles, generating complete scripts, and helping you refine your work until it's perfect.

It's built on a "Coach, Not a Crutch" philosophy, enhanced with a "Hired Pro" workflow. You provide the vision; the AI handles the creative heavy lifting.

## ✨ Core Features

-   **🤖 Proactive Creative Strategy:** Don't just get a script. The AI first proposes **3 distinct, viral angles** (e.g., Contrarian, Secret Unveiling, Problem/Solve) for your topic, letting you choose the creative direction.
-   **✍️ Full Script Production:** Once you choose an angle, the AI generates a complete, scene-by-scene script, including details for visuals, audio, and dialogue, and automatically populates the editor.
-   **🧠 Personalized to Your Brand:** A dedicated "User Profile" section in the settings allows the AI to learn your brand identity and target audience, tailoring all suggestions to your unique style.
-   **📱 Mobile-First Design:** A seamless experience whether you're brainstorming on your desktop or writing on your phone. The interface is fully responsive and handles mobile keyboards correctly.
-   **🗄️ Secure Script Vault:** Save, load, and manage all your finished scripts directly in your browser's local storage. Your work is always private and accessible.
-   **💡 Inspiration Banks:** Overcome writer's block with curated lists of viral hooks and calls-to-action.
-   **🔐 Secure & Private Access:** User access is managed via a private Google Sheet, ensuring only approved users can log in. All user data (API Key, Profile, Scripts) is stored locally on the user's device.

## 🛠️ Tech Stack

-   **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+)
-   **AI:** Google Gemini API
-   **"Backend" for Access:** Google Sheets + Google Apps Script
-   **Dependencies:** [Marked.js](https://marked.js.org/) for rendering Markdown in the chat.

## 🚀 Setup & Configuration

To get your own instance of ViralScript AI running, follow these steps.

### Step 1: Set Up Google Sheet for Email Access

1.  Create a new, private Google Sheet.
2.  In **Column A**, list the email addresses of users you want to grant access to. Put one email in each row. **Do not add a header.**
3.  Find your **Sheet ID** in the URL: `.../spreadsheets/d/`**`THIS_IS_THE_SHEET_ID`**`/edit`. Copy this ID.

### Step 2: Deploy the Google Apps Script

1.  In your Google Sheet, go to `Extensions` > `Apps Script`.
2.  Delete any existing code and paste the code from the `google-apps-script.gs` file provided in this project.
3.  Replace `"YOUR_SHEET_ID_HERE"` in the script with the actual **Sheet ID** you copied.
4.  Click **Deploy** > **New deployment**.
5.  Set the configuration:
    -   Select type (⚙️ icon): **Web app**.
    -   Who has access: **Anyone**. (This is safe; it only allows access to the script's yes/no response, not your sheet's data).
6.  Click **Deploy**. Authorize access for your Google Account. If you see an "unsafe app" warning, click `Advanced` and proceed. This is normal for your own scripts.
7.  **Copy the generated Web app URL.** This is your secure API endpoint.

### Step 3: Configure the Application

1.  Open the `config.js` file in the project.
2.  Paste the **Web app URL** you just copied into the `EMAIL_VALIDATION_API_URL` constant.

    ```javascript
    const EMAIL_VALIDATION_API_URL = "YOUR_DEPLOYED_GOOGLE_APPS_SCRIPT_URL_HERE";
    ```

### Step 4: Launch and Add API Key

1.  Push the project to your hosting service (like Netlify).
2.  Open the live URL and log in with an email from your Google Sheet.
3.  Click the **Settings icon (⚙️)** in the top right.
4.  Enter your personal [Google Gemini API Key](https://ai.google.dev/).
5.  **Save your Profile information** to start getting personalized results.

Your application is now fully configured and ready to use!

##  workflow (How to Use)

1.  **Start with a Topic:** In the chat, tell the AI Director your video idea (e.g., "how to be more productive").
2.  **Choose Your Angle:** The AI will propose 3 creative angles. Reply with your choice (e.g., "use angle 2").
3.  **Receive Your Script:** The complete script will be automatically generated and placed into the Editor.
4.  **Refine and Edit:** You can now edit the script directly in the editor or have a conversation with the AI to make revisions (e.g., "make the hook shorter" or "suggest a different CTA").

## Local development, proxy server & tests (added)

This repository includes a small local proxy server and unit tests to make development safer and easier.

### Run unit tests

1. Install dependencies (Node.js 18+):

```powershell
npm install
```

2. Run tests:

```powershell
npm test
```

### Start the local proxy & static site

The project includes `server.js` — a minimal Express server that serves the static files and proxies AI requests to Google Gemini.

Set your Gemini API key into the environment and start the server (PowerShell example):

```powershell
$env:GEN_API_KEY = 'YOUR_GOOGLE_GEN_API_KEY_HERE'; npm run start-server
```

Visit `http://localhost:3000`.

### Notes
- The server reads `GEN_API_KEY` from the environment. Do NOT commit your key to source control.
- CI is configured in `.github/workflows/ci.yml` to run tests on pushes and PRs to `main`.

If you want me to harden the proxy for production (add `helmet`, `express-rate-limit`, and a Dockerfile), I can add those next.