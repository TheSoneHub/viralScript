
# ViralScript 🧪 link-https://viralscript.netlify.app/

**ViralScript** is a minimalist, AI-powered script editor designed specifically for short-form content creators in Myanmar. It serves as an intelligent co-pilot, helping creators brainstorm, structure, and refine their scripts for platforms like TikTok, Facebook Reels, and YouTube Shorts.

The core philosophy of ViralScript is **"The Coach, Not The Crutch."** Instead of just providing answers, the integrated AI mentor teaches users the principles of viral content strategy, helping them become better writers in the long run.

![ViralScript Screenshot](assets/img/screenshot.png) 
*(Note: You should add a screenshot of the app to an `assets/img/` folder for this to work)*

---

## ✨ Core Features

*   **Smart Editor Workspace:** A clean, distraction-free interface with dedicated sections for a video's three core pillars: **Hook, Body, and CTA**.
*   **AI Creative Coach:** A powerful, context-aware AI chat assistant that acts as a professional script doctor.
    *   **Multiple Personalities:** Switch between different AI personas (`Creative Coach`, `Viral Editor`, `Hook Analyzer`) to get the exact type of feedback you need.
    *   **Deep Analysis:** The AI provides in-depth analysis based on principles of storytelling, viewer psychology, and platform algorithms.
*   **Live Analysis Engine:** Get real-time, unobtrusive feedback on your writing as you type. The AI analyzes your hook's strength, your body's clarity, and your CTA's effectiveness on the fly.
*   **On-Demand Hook Bank:** Instantly access a library of proven, viral hook templates categorized by psychological triggers (Curiosity, Pain-Point, etc.) to overcome writer's block.
*   **Pre-Writing Context Setup:** Define your `Content Goal`, `Target Audience`, and `Platform` to give the AI the strategic context it needs for perfectly tailored advice.
*   **Privacy-First:** Your scripts and API key are stored **only in your browser's local storage**. No data is ever sent to a server, ensuring complete privacy and control.
*   **Minimalist & Fast:** Built with vanilla HTML, CSS, and JavaScript for a lightning-fast, responsive experience with zero bloat.

---

## 🚀 Getting Started

ViralScript is a front-end only application that runs entirely in your browser.

### Prerequisites

1.  A modern web browser (Chrome, Firefox, Safari, Edge).
2.  Your own **Google Gemini API Key**. You can get one for free from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Installation & Usage

1.  **Download or Clone:**
    ```bash
    git clone https://github.com/your-username/viralscript.git
    cd viralscript
    ```
2.  **Open `index.html`:** Simply open the `index.html` file in your web browser.
3.  **Enter Your API Key:**
    *   Click the **Settings** icon (⚙️) in the top right of the AI Chat panel.
    *   Paste your Google Gemini API Key into the input field and click "Save Key."
    *   The status light will turn green, indicating the app is ready.
4.  **Start Writing:** Use the editor to draft your script and interact with the AI Coach to refine your ideas!

---

## 🛠️ Tech Stack

This project is intentionally built with a simple and robust stack to ensure it's lightweight, fast, and easy to maintain.

*   **Front-End:** Vanilla HTML5, CSS3, JavaScript (ES6+)
*   **AI Integration:** Google Gemini API (`gemini-flash-latest`)
*   **Data Storage:** Browser `LocalStorage`
*   **Markdown Parsing:** [Marked.js](https://marked.js.org/) for rendering AI responses.
*   **Deployment:** Can be deployed for free on any static hosting platform like Netlify, Vercel, or GitHub Pages.

---

## 📂 Project Structure

```
ViralScript/
│
├── index.html          # Main application UI
├── hooks.json          # Database of viral hook templates
│
├── assets/
│   ├── css/
│   │   └── style.css   # All application styles
│   ├── js/
│   │   ├── main.js     # Core UI logic and event listeners
│   │   ├── ai.js       # All Gemini API integration and prompting logic
│   │   └── storage.js  # Functions for managing LocalStorage
│   └── img/
│       └── screenshot.png # Application screenshot
│
└── README.md           # This file
```

---

## 🌟 Vision & Philosophy

In a world full of generic AI tools, ViralScript aims to be a true creative partner. It's designed not to replace the creator's thinking, but to augment it. By teaching the "why" behind every suggestion, the goal is to empower creators, improve their skills, and help them confidently produce content that resonates and goes viral.

Built for Myanmar, by a developer who understands the local content landscape.
```

## Contributing
Small bug fixes, accessibility improvements, or logo refinements are welcome. Open a PR or edit the files directly.

## License
This project is provided as-is. Include a license file if you want to specify reuse terms.

## Contact
If you need help or want improvements, leave a note in the repository or contact the project maintainer.