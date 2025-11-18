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
````markdown
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

## Local development & tests (Netlify Functions)

This repo uses Netlify Functions as the server-side proxy. The frontend is already wired to `/.netlify/functions/generate` and the function lives in `netlify/functions/generate.js`.

### Run unit tests

1. Install dependencies (Node.js 18+):

```powershell
npm install
```

2. Run tests:

```powershell
npm test
```

### Local development with Netlify Functions (recommended)

Install the Netlify CLI (either globally or use the devDependency installed by `npm install`) and run the local dev server which also runs functions:

```powershell
# install globally (optional)
npm i -g netlify-cli

# or use the local devDependency after npm install
npm run dev
```

`netlify dev` serves the static site and executes Netlify Functions locally so you can test the full flow without deploying.

### Deploying to Netlify

1. Push the repository to GitHub (or connect your repo to Netlify).
2. In Netlify, create a new site and connect the repo.
3. In Netlify site settings → Build & deploy → Environment, add an environment variable:

   - Key: `GEN_API_KEY`
   - Value: `<YOUR_GOOGLE_GEN_API_KEY>`

4. Deploy the site. Netlify will use `netlify.toml` and the function at `netlify/functions/generate.js` to provide the `/.netlify/functions/generate` endpoint.

### Quick smoke test after deploy

- Open the site on your device/browser.
- In the AI Director chat, type a topic; the AI should propose three angles.
- Reply with an angle number; the app should parse the AI's JSON response and populate the Editor (`Hook`, `Body`, `CTA`) instead of showing raw JSON in chat.

### Notes

- Keep `GEN_API_KEY` secret — use Netlify Environment variables. Do not commit it to source control.
- If you want, I can add a Netlify Deploy button or a short GitHub Actions workflow to auto-deploy on push.
If you'd like a simpler one-click or automated deploy, follow the quick options below.

---

**One-click deploy (Netlify)**

Click the button to create a new Netlify site from this repository (you'll still need to set `GEN_API_KEY` in Netlify site settings after creating the site):

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=TheSoneHub/viralScript)

---

**Automated deploy from GitHub (optional)**

If you prefer automatic deploys on push to `main`, add the following GitHub Secrets to your repository settings:

- `NETLIFY_AUTH_TOKEN` — a personal access token from your Netlify user (Account settings → Applications → Personal access tokens).
- `NETLIFY_SITE_ID` — the Site ID from your Netlify site's General settings.

Then enable the provided GitHub Action (it will run on pushes to `main` and deploy using the Netlify CLI).

**After deploy (very important)**

- In Netlify site settings → Build & deploy → Environment, add `GEN_API_KEY` with your Google Gemini API key.
- Test the app: open the site, run the AI Director flow, and verify the Editor gets populated (no raw JSON in chat).

````