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
    // Proxy call to server-side endpoint. Server holds the real API key.
    try {
        // Netlify Function path
        // If the user has provided a local API key (saved via Settings), include it as a dev key
        // The Netlify function will only accept this dev key when running in non-production.
        let outboundBody = requestBody;
        try {
            const localKey = typeof getApiKey === 'function' ? getApiKey() : null;
            if (localKey) {
                // clone so we don't mutate the original
                outboundBody = Object.assign({}, requestBody, { dev_api_key: localKey });
            }
        } catch (e) {
            // ignore errors reading local key
        }

        const response = await fetch('/.netlify/functions/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(outboundBody),
            signal,
        });

        if (!response.ok) {
            const errText = await response.text().catch(() => '');
            throw new Error(`Proxy API Error: ${response.status} ${response.statusText} ${errText}`);
        }

        const data = await response.json();
        if (!data.candidates || data.candidates.length === 0) {
            throw new Error("AI response was blocked or empty. This might be due to safety settings.");
        }
        return data;
    } catch (e) {
        // Bubble up
        throw e;
    }
}
// ... (the rest of ai.js remains the same) ...

/**
 * Creates the core system instruction that defines the AI's identity.
 * @returns {object} A Gemini-formatted instruction object.
 */
// /assets/js/ai.js

// ... (Other functions remain the same) ...

/**
 * v8: Uses the strictest possible command structure to force JSON compliance.
 * @returns {object} A Gemini-formatted instruction object.
 */
async function getSystemInstruction() {
    const userProfile = typeof getUserProfile === 'function' ? getUserProfile() : null;
    const insp = await loadInspiration().catch(() => ({ hooks: [], ctas: [] }));
    let personalizationLayer = '';
    if (userProfile && (userProfile.brand || userProfile.audience)) {
        personalizationLayer = `\n---\nUSER PROFILE FOR PERSONALIZATION:\n- Brand Identity: "${userProfile.brand || 'Not provided'}"\n- Target Audience: "${userProfile.audience || 'Not provided'}"\n---\n`;
    }

    const sampleHooks = (insp.hooks || []).slice(0,3).map(h => `- ${h}`).join('\n') || '- [No hook samples available]';
    const sampleCtas = (insp.ctas || []).slice(0,3).map(c => `- ${c}`).join('\n') || '- [No CTA samples available]';

    const instructionText = `You are a professional, senior-level AI scriptwriter and short-form video strategist. Your goal is to produce tight, high-conversion scripts optimized for 15–60s social videos. Use the user's profile and the inspiration samples to create focused Hook -> Body -> CTA flows that are actionable, specific, and emotionally compelling.${personalizationLayer}\nINSPIRATION SAMPLES:\nHOOKS:\n${sampleHooks}\nCTAS:\n${sampleCtas}\n\nWORKFLOW:\n1) If the user's last message is a new topic, propose THREE short creative angles in Burmese (one short sentence each). Ask the user to pick one and STOP.\n2) When the user picks an angle, RESPOND ONLY with a single RAW JSON object (no commentary, no markdown, no backticks). The JSON must follow the schema: {"title":string,"estimated_duration":string,"tone":string,"scenes":[{"scene_type":"hook|body|cta","script_burmese":string}] } with at least one hook, one body, and one cta.\n3) If the conversation already contains a valid JSON script from you, switch to EDITING MODE: respond in Burmese (no JSON) and follow user's edit instructions precisely.\n\nQUALITY RULES:\n- Use Burmese for all text fields.\n- Hook: concise (10-15 words), create curiosity or promise.\n- Body: deliver concrete value (steps, numbers, example).\n- CTA: specific action tied to value (benefit-driven).\n- If you cannot produce valid JSON, respond with: ERROR_JSON: <one-line diagnostic in Burmese>.`;

    return { role: 'user', parts: [{ text: instructionText }] };
}

async function generateChatResponse(history, signal) {
    const systemInstruction = await getSystemInstruction();
    const requestBody = { contents: [systemInstruction, ...history] };

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
        // For unexpected errors, rethrow so the UI can surface detailed info to the user
        console.error("Failed to generate chat response:", error);
        throw error;
    }
}

/**
 * Generates the script draft (clean, strict JSON output). Returns parsed object or null.
 */
async function generateScriptFromHistory(history, signal) {
        const conversationSummary = history
                .map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.parts[0].text}`)
                .join('\n');

        const prompt = `
MODE: GENERATION
You are a senior Short-Form Video Scriptwriter. Using the conversation summary below, produce ONE RAW JSON object only. Do not include any explanation, markdown, or backticks. Use Burmese for all textual fields.

Conversation Summary:
---
${conversationSummary}
---

REQUIREMENTS:
- Output exactly one JSON object and nothing else.
- Schema (exact):
    {
        "title": "short Burmese title (<=8 words)",
        "estimated_duration": "e.g., 40-55s",
        "tone": "comma-separated tone keywords",
        "scenes": [
            { "scene_type": "hook", "script_burmese": "single short hook line (max ~10-15 words)" },
            { "scene_type": "body", "script_burmese": "body lines, 1-3 short sentences; use \\\n+ to indicate line breaks" },
            { "scene_type": "cta", "script_burmese": "single short CTA line with concrete action" }
        ]
    }

NOTES:
- First scene must be "hook" and create curiosity or promise.
- Body must deliver concrete value (steps, examples, numbers).
- CTA must be a specific action tied to the value.
- Keep concise for 15-60s delivery.

Now produce the JSON for a script based on the conversation summary above.
`;

        const requestBody = { contents: [{ parts: [{ text: prompt }] }] };

        try {
                const data = await fetchFromApi(requestBody, signal);
                let responseText = data.candidates[0].content.parts[0].text || '';
                responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                const start = responseText.indexOf('{');
                const end = responseText.lastIndexOf('}');
                if (start === -1 || end === -1 || end < start) return null;
                const jsonString = responseText.substring(start, end + 1);
                try { return JSON.parse(jsonString); }
                catch (e) {
                        try {
                                const relaxed = jsonString.replace(/\r?\n/g, ' ').replace(/'/g, '"').replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
                                return JSON.parse(relaxed);
                        } catch (e2) { console.error('JSON parse failed in generateScriptFromHistory:', e2); return null; }
                }
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
        // include short inspiration samples when available to nudge tone/CTA/hook choices
        const insp = await loadInspiration();
        const inspHooks = (insp.hooks || []).slice(0,3).map(h=>`- ${h}`).join('\n');
        const inspCtas = (insp.ctas || []).slice(0,3).map(c=>`- ${c}`).join('\n');

        const prompt = `
        **MODE: EDITING**
        You are a Script Doctor. Revise the following script part based on the user's instruction.
        - **Part to Revise:** ${part}
        - **Current Text:** "${currentText}"
        - **User's Instruction:** "${instruction}"
        
        Respond ONLY with the newly revised text. Do not add any extra words, explanations, or quotes.
                \nINSPIRATION SAMPLES (do not copy verbatim; use as style cues):\nHOOKS:\n${inspHooks}\nCTAS:\n${inspCtas}\n
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