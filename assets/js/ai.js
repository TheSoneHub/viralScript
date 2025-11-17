// /assets/js/ai.js

const API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

/**
 * A reusable fetch function for the Gemini API.
 * @param {object} requestBody - The body of the request to send to the API.
 * @param {AbortSignal} signal - An AbortSignal to allow cancelling the request.
 * @returns {Promise<object>} The JSON response from the API.
 */
// /assets/js/ai.js

// ... (API_ENDPOINT remains the same) ...

async function fetchFromApi(requestBody, signal) {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("API_KEY_MISSING");
    }

    const response = await fetch(`${API_ENDPOINT}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: signal,
    });

    if (!response.ok) {
        // Specifically check for invalid API key error from Google
        if (response.status === 400) {
            const errorData = await response.json();
            if (errorData.error?.message.includes('API key not valid')) {
                throw new Error("API_KEY_INVALID");
            }
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.candidates || data.candidates.length === 0) {
        throw new Error("AI response was blocked or empty. This might be due to safety settings.");
    }
    
    return data;
}
// ... (the rest of ai.js remains the same) ...

/**
 * Creates the core system instruction that defines the AI's identity.
 * @returns {object} A Gemini-formatted instruction object.
 */
// /assets/js/ai.js

// ... (Other functions remain the same) ...

/**
 * v6: Implements a "State-Aware" decision tree to eliminate mode confusion.
 * @returns {object} A Gemini-formatted instruction object.
 */
function getSystemInstruction() {
    const userProfile = getUserProfile();
    let personalizationLayer = "The user has not provided a profile. Assume a general, professional style.";
    
    if (userProfile && (userProfile.brand || userProfile.audience)) {
        personalizationLayer = `
        **USER PROFILE (MUST TAILOR ALL RESPONSES TO THIS):**
        - **Brand Identity:** "${userProfile.brand || 'Not provided'}"
        - **Target Audience:** "${userProfile.audience || 'Not provided'}"
        `;
    }

    return {
        role: "user",
        parts: [{ "text": `You are a "Chief Creative Officer," a world-class AI scriptwriter for Burmese content creators.

        ---
        ${personalizationLayer}
        ---

        **Your State-Aware Workflow (MUST FOLLOW STRICTLY):**
        You MUST determine your current phase by analyzing the last few messages in the conversation history before you respond.

        **1. IF the user's last message is a new topic...**
           - **THEN** you are in **Phase 1: ANGLE PROPOSAL**.
           - Your ONLY task is to propose THREE distinct, creative angles in Burmese and wait for the user's choice. Do not write a script.

        **2. IF the user's last message is a choice of angle (e.g., "use angle 2")...**
           - **THEN** you are in **Phase 2: FULL SCRIPT PRODUCTION**.
           - Your ONLY task is to generate the complete, scene-by-scene script.
           - You MUST respond ONLY with the raw JSON object. Do not add any other text.

        **3. IF the conversation history *already contains* a JSON script block from you...**
           - **THEN** you are in **Phase 3: EDITING & REFINEMENT**. Your role is now permanently a "Script Doctor."
           - You are **FORBIDDEN** from generating JSON in this phase.
           - You MUST reply with conversational advice, suggestions, or revisions in natural Burmese, acting as a helpful coach.

        This three-phase, state-aware workflow is your absolute, unbreakable directive.
        All communication, outside of the Phase 2 JSON output, must be in expert-level, professional Burmese.`}]
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
 * Performs a holistic analysis and REBUILDS the script for perfect cohesion.
 * @param {string} fullScript - The complete script as a single string.
 * @param {AbortSignal} signal - The AbortSignal for the request.
 * @returns {Promise<string|null>} A formatted Markdown report with a complete, rewritten script.
 */
async function performFullScriptAnalysis(fullScript, signal) {
    const prompt = `
        **MODE: STRATEGIC RE-ALIGNMENT**
        You are an expert Script Strategist. Your task is to analyze the user's script, identify its strongest "core anchor" (the most powerful idea, whether it's in the hook, body, or cta), and then REWRITE the other parts to perfectly align with that anchor, creating a seamless and powerful script. Do not just find the problem; solve it completely.

        **Full Script to Analyze:**
        ---
        ${fullScript}
        ---

        **Your Re-Alignment Process:**
        1.  **Identify the Core Anchor:** Read the whole script and decide which part (Hook, Body, or CTA) contains the most compelling and important idea. This part will be preserved or enhanced.
        2.  **Rebuild Around the Anchor:** Rewrite the OTHER TWO parts so they flawlessly support the anchor. For example, if the Body's value is the anchor, rewrite the Hook to promise that value and rewrite the CTA to be the logical next step after receiving that value.
        3.  **Present the Complete, Fixed Script:** Return the full, new, cohesive script.

        **Your Response Format (MUST FOLLOW STRICTLY):**
        - Respond in professional Burmese using Markdown.
        - Start with a main heading: "### 📜 Script Re-Alignment Report"
        - **Analysis Section:** Under a subheading "**تحليل:**", provide a brief, one-sentence summary of the original script's main strategic issue.
        - **Strategy Section:** Under a subheading "**យុទ្ធសាស្ត្រ:**", explain which part you chose as the "Core Anchor" and why you rebuilt the script around it.
        - **Rewritten Script Section:** Under a subheading "**ပြင်ဆင်ပြီးသော Script အသစ်:**", present the complete, new script with clear labels for each part.

        **Example Response Structure:**
        ### 📜 Script Re-Alignment Report
        **تحليل:** မူလ Script ၏ Hook နှင့် Body အချိတ်အဆက် အားနည်းနေပါသည်။
        **យុទ្ធសាស្ត្រ:** Body တွင်ပါသော 'AI ဖြင့် အချိန်ကုန်သက်သာစေခြင်း' ဆိုသည့် အဓိက Value ကို Anchor အဖြစ်အသုံးပြုပြီး Hook နှင့် CTA ကို ထို Value နှင့်ကိုက်ညီအောင် အသစ်ပြန်လည်ရေးသားထားပါသည်။
        **ပြင်ဆင်ပြီးသော Script အသစ်:**
        **New Hook:**
        [The newly written Hook text]

        **New Body:**
        [The original Body text, preserved as the anchor]

        **New CTA:**
        [The newly written CTA text]
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