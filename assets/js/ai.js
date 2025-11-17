// /assets/js/ai.js

const API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

/**
 * A reusable fetch function for the Gemini API.
 * @param {object} requestBody - The body of the request to send to the API.
 * @param {AbortSignal} signal - An AbortSignal to allow cancelling the request.
 * @returns {Promise<object>} The JSON response from the API.
 */
async function fetchFromApi(requestBody, signal) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("API_KEY_MISSING");
    }

    const response = await fetch(`${API_ENDPOINT}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: signal, // Pass the signal to the fetch request
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
        // This can happen due to safety settings or an empty response
        throw new Error("AI response was blocked or empty.");
    }
    
    return data;
}

/**
 * Creates the core system instruction that defines the AI's identity.
 * @returns {object} A Gemini-formatted instruction object.
 */
function getSystemInstruction() {
    return {
        role: "user",
        parts: [{ "text": `You are a "Viral Script Director," a world-class AI for Burmese content creators. Your entire process is governed by the "Coach, Not The Crutch" philosophy. You guide, teach, and empower, you don't just give answers.

        **Your Operational Modes:**
        1.  **Discovery Mode:** Your initial and primary mode. Your goal is to understand the user's vision by asking ONE intelligent follow-up question at a time. 
            - **CRITICAL RULE:** In this mode, you MUST NEVER generate a script or JSON code yourself. Your ONLY job is to ask clarifying questions to understand the 'Core Pillars' (Objective, Audience, Problem, Value, Tone, CTA).
            - When you have enough information, your final response in this mode MUST be the single token: "[PROCEED_TO_GENERATION]". Nothing else.
        2.  **Generation Mode:** Triggered ONLY by a specific system prompt. You will generate a detailed script in a specific JSON format.
        3.  **Editing Mode:** You act as a script doctor, providing precise revisions on specific parts.
        
        **Core Rules:**
        - Never break character. You are a professional coach.
        - Every suggestion must be explained with the "why".
        - Communicate ONLY in natural, expert-level Burmese.`}]
    };
}

/**
 * Handles the general "Discovery Mode" conversation.
 * @param {Array<object>} history - The full chat history.
 * @param {AbortSignal} signal - The AbortSignal for the request.
 * @returns {Promise<string>} The AI's next question or a special token.
 */
async function generateChatResponse(history, signal) {
    const systemInstruction = getSystemInstruction();
    const requestBody = {
        contents: [systemInstruction, ...history]
    };

    try {
        const data = await fetchFromApi(requestBody, signal);
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Chat response generation was aborted.');
            return 'Generation stopped.';
        }
        if (error.message === "API_KEY_MISSING") {
             return " ကျေးဇူးပြု၍ Settings တွင် သင်၏ API Key ကို ဦးစွာထည့်သွင်းပါ။";
        }
        console.error("Failed to generate chat response:", error);
        return "AI နှင့် ဆက်သွယ်ရာတွင် အမှားအယွင်း ဖြစ်ပွားပါသည်။ ခဏအကြာတွင် ထပ်မံကြိုးစားကြည့်ပါ။";
    }
}

// /assets/js/ai.js

// ... (Other functions remain the same) ...

/**
 * Generates the script draft, now with a stronger emphasis on cohesion.
 * @param {Array<object>} history - The full chat history.
 * @param {AbortSignal} signal - The AbortSignal for the request.
 * @returns {Promise<object|null>} A parsed JSON object of the script or null if failed.
 */
async function generateScriptFromHistory(history, signal) {
    const conversationSummary = history
        .map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.parts[0].text}`)
        .join('\n');

    const prompt = `
        **MODE: GENERATION**
        You are a World-Class Viral Script Writer. Based on the conversation summary, generate a detailed, scene-by-scene script.

        **Conversation Summary:**
        ---
        ${conversationSummary}
        ---
        
        **CRITICAL REQUIREMENT:** The entire script must be strategically cohesive. The Hook must make a promise that the Body fulfills. The value in the Body must create a natural transition to the Call to Action. All three parts must feel like a single, unified message.

        Your task is to respond ONLY with a single, raw JSON object. Do not add any explanation, commentary, or markdown backticks.

        The JSON structure MUST be:
        {
          "title": "A short, catchy title for the script.",
          "estimated_duration": "e.g., 45-55 seconds",
          "tone": "e.g., Expert & Authoritative",
          "scenes": [
            {
              "scene_id": "SCENE 1: THE HOOK",
              "script_burmese": "The Burmese script for this scene."
            },
            {
              "scene_id": "SCENE 2: THE BODY/VALUE",
              "script_burmese": "The Burmese script for this scene. Use \\n for line breaks."
            },
            {
              "scene_id": "SCENE 3: THE CALL TO ACTION",
              "script_burmese": "The Burmese script for the CTA."
            }
          ]
        }
    `;
    const requestBody = { contents: [{ parts: [{ text: prompt }] }] };

    try {
        const data = await fetchFromApi(requestBody, signal);
        let responseText = data.candidates[0].content.parts[0].text;
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(responseText);
    } catch (error) {
        if (error.name === 'AbortError') console.log('Script generation was aborted.');
        console.error("Failed to generate or parse script:", error);
        return null;
    }
}

/**
 * Revises a specific part of the script based on user instruction.
 * @param {string} part - The part to revise ('hook', 'body', or 'cta').
 * @param {string} currentText - The current text of that part.
 * @param {string} instruction - The user's instruction for revision.
 * @param {AbortSignal} signal - The AbortSignal for the request.
 * @returns {Promise<string>} The revised text. Returns original text on failure.
 */
async function reviseScriptPart(part, currentText, instruction, signal) {
    const prompt = `
        **MODE: EDITING**
        You are a Script Doctor. Revise the following script part based on the user's instruction.
        - **Part to Revise:** ${part}
        - **Current Text:** "${currentText}"
        - **User's Instruction:** "${instruction}"
        
        Respond ONLY with the newly revised text. Do not add any extra words, explanations, or quotes.
    `;
    const requestBody = { contents: [{ parts: [{ text: prompt }] }] };

    try {
        const data = await fetchFromApi(requestBody, signal);
        return data.candidates[0].content.parts[0].text.trim();
    } catch (error) {
        if (error.name === 'AbortError') console.log('Script revision was aborted.');
        console.error("Failed to revise script part:", error);
        return currentText; // Return original text on failure
    }
}

// /assets/js/ai.js

// ... (Other functions remain the same) ...

/**
 * Performs a holistic analysis AND suggests a concrete fix for the weakest part.
 * @param {string} fullScript - The complete script as a single string.
 * @param {AbortSignal} signal - The AbortSignal for the request.
 * @returns {Promise<string|null>} A formatted Markdown analysis with a suggested repair.
 */
async function performFullScriptAnalysis(fullScript, signal) {
    const prompt = `
        **MODE: STRATEGIC ANALYSIS & REPAIR**
        You are a "Script Strategist." Your task is to perform a holistic review of the user's complete script, identify the single biggest strategic weakness, and proactively rewrite that part to fix the script's cohesion.

        **Full Script to Analyze:**
        ---
        ${fullScript}
        ---

        **Your Analysis & Repair Process:**
        1.  **Analyze Cohesion:** Critically examine the connections: Does the Hook's promise get fulfilled in the Body? Does the Body's value logically lead to the CTA?
        2.  **Identify Weakest Link:** Determine which part (Hook, Body, or CTA) is the primary reason for any strategic disconnect.
        3.  **Rewrite the Weak Part:** Rewrite ONLY the identified weak part to perfectly align with the other two parts, making the entire script seamless.

        **Your Response Format (MUST FOLLOW STRICTLY):**
        - You must respond in professional Burmese using Markdown.
        - Start with a main heading: "### 📜 Script Analysis & Repair"
        - **Analysis Section:** Under a subheading "**تحليل:**", provide a very brief, one-sentence summary of the main issue.
        - **Repair Section:** Under a subheading "**ပြုပြင်မှု:**", state which part you rewrote and why. For example: "Hook နှင့် Body အချိတ်အဆက် ပိုကောင်းစေရန် Body ကို အသစ်ပြန်လည် ရေးသားထားပါသည်။"
        - **The Fix:** Provide the newly rewritten text under a clear label like "**New Body:**" or "**New Hook:**". Only show the new text for the part you fixed.
    `;
    const requestBody = { contents: [{ parts: [{ text: prompt }] }] };

    try {
        const data = await fetchFromApi(requestBody, signal);
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        if (error.name === 'AbortError') console.log('Full analysis was aborted.');
        console.error("Failed to perform full analysis:", error);
        return "Script တစ်ခုလုံးကို သုံးသပ်ရာတွင် အမှားအယွင်း ဖြစ်ပွားပါသည်။";
    }
}

/**
 * Deconstructs a viral video's formula from a URL.
 * @param {string} videoUrl - The URL of the video to analyze.
 * @param {AbortSignal} signal - The AbortSignal for the request.
 * @returns {Promise<string>} A formatted Markdown report.
 */
async function deconstructViralVideo(videoUrl, signal) {
    const prompt = `
        **MODE: VIRAL DECONSTRUCTOR**
        You are a "Viral Content Analyst." Analyze the provided video link and deconstruct its viral formula.

        **Video URL:** ${videoUrl}

        **Analysis & Response Format:**
        1.  Start with a confirmation: "သင်ပို့လိုက်တဲ့ video ကို ခွဲခြမ်းစိတ်ဖြာပြီးပါပြီ။ ဒါကတော့ သူ့ရဲ့ 'Viral DNA' ပါ:"
        2.  Create a "Deconstruction Report" using Markdown.
        3.  **Hook:** Identify the hook and its type (e.g., Curiosity, Pain-based).
        4.  **Core Message (Body):** Summarize the value delivered.
        5.  **CTA:** Identify the Call to Action.
        6.  **Viral Strategy:** Identify the underlying psychological principle. Give it a name (e.g., "Gatekeeping Reversal," "Pattern Interrupt"). Explain why it works in one sentence.
        7.  **Incubation Question:** End with the proactive question: "ဒီ '[Strategy Name]' strategy က တော်တော် အစွမ်းထက်ပါတယ်။ **ဒီ formula ကိုပဲ သုံးပြီး၊ Boss ဖန်တီးချင်တဲ့ topic အသစ်တစ်ခုနဲ့ ပေါင်းစပ်ပြီး script အသစ်တစ်ခု အခုပဲ ဖန်တီးကြည့်ကြမလား?**"

        Respond in professional Burmese.
    `;
    const requestBody = { contents: [{ parts: [{ text: prompt }] }] };

    try {
        const data = await fetchFromApi(requestBody, signal);
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        if (error.name === 'AbortError') console.log('Video deconstruction was aborted.');
        console.error("Failed to deconstruct video:", error);
        return "Video link ကို သုံးသပ်ရာတွင် အမှားအယွင်း ဖြစ်ပွားပါသည်။ Link မှန်မမှန် စစ်ဆေးပေးပါ။";
    }
}

/**
 * Performs the "Pre-Flight Check" for a finished script.
 * @param {string} fullScript - The complete script as a single string.
 * @param {AbortSignal} signal - The AbortSignal for the request.
 * @returns {Promise<string>} A formatted Markdown string with performance notes.
 */
async function performFinalCheck(fullScript, signal) {
    const prompt = `
        **MODE: FINAL CHECK**
        The script is complete. Perform a "Pre-Flight Check" as a Performance Coach.
        
        **Full Script:**
        ---
        ${fullScript}
        ---
        
        **Instructions:**
        1.  Rewrite the entire script, embedding performance notes like "(Tone: Urgent)", "(Pause here)", "(Emphasize this word)" directly into the text.
        2.  After the script, provide a "Sanity Check" section.
        3.  In the Sanity Check, estimate the speaking time in seconds and analyze its Clarity and Energy Curve for a short-form video platform.
        4.  Format your entire response professionally in clear Burmese using Markdown.
    `;
    const requestBody = { contents: [{ parts: [{ text: prompt }] }] };

    try {
        const data = await fetchFromApi(requestBody, signal);
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        if (error.name === 'AbortError') console.log('Final check was aborted.');
        console.error("Failed to perform final check:", error);
        return "Final Check ပြုလုပ်ရာတွင် အမှားအယွင်း ဖြစ်ပွားပါသည်။";
    }
}