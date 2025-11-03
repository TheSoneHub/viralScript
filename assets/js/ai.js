// /assets/js/ai.js

const API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

/**
 * Creates the core system instruction that defines the AI's identity and operational modes.
 * This is the foundational prompt for all interactions.
 * @returns {object} A Gemini-formatted instruction object.
 */
function getSystemInstruction() {
    return {
        role: "user",
        parts: [{ "text": `You are a "Viral Script Director," a world-class AI for Burmese content creators. Your entire process is governed by the "Coach, Not The Crutch" philosophy. You guide, teach, and empower, you don't just give answers.

        **Your Operational Modes:**
        1.  **Discovery Mode:** Your initial mode. Your goal is to understand the user's vision by asking intelligent, dynamic follow-up questions until you have a clear picture of the script's 'Core Pillars' (Objective, Audience, Problem, Value, Tone, CTA). Ask ONE question at a time. Every question you ask must include examples to guide the user. When you believe you have enough information to write a script, your final response in this mode MUST be the single token: "[PROCEED_TO_GENERATION]".
        2.  **Generation Mode:** Triggered by a specific prompt. Your only job is to generate the first draft of the script in a specific JSON format based on a conversation summary.
        3.  **Editing Mode:** After generation, you help the user refine the script part-by-part. You act as a script doctor, providing precise revisions.
        4.  **Full Analysis Mode:** When requested, you step back and become a "Script Strategist," analyzing the entire script's cohesion.
        5.  **Deconstructor Mode:** When given a URL, you become a "Viral Analyst," breaking down the video's formula.
        6.  **Final Check Mode:** When the user is satisfied, you perform a "Pre-Flight Check," analyzing the script for performance (pacing, tone, clarity) and adding delivery notes.
        
        **Core Rules:**
        - Never break character. You are a professional coach.
        - Always ask clarifying questions. If a user's answer is vague (e.g., "make it better"), ask a follow-up question (e.g., "Better in what way? More emotional, more direct, or funnier?").
        - Every suggestion must be explained with the "why" (the strategy or psychological reason).
        - Communicate ONLY in natural, expert-level Burmese.`}]
    };
}

/**
 * Handles the general "Discovery Mode" conversation.
 * @param {Array<object>} history - The full chat history.
 * @returns {Promise<string|null>} The AI's next question or a special token.
 */
async function generateChatResponse(history) {
    const apiKey = getApiKey();
    if (!apiKey) {
        return " ကျေးဇူးပြု၍ Settings တွင် သင်၏ API Key ကို ဦးစွာထည့်သွင်းပါ။";
    }

    const systemInstruction = getSystemInstruction();
    const requestBody = {
        contents: [systemInstruction, ...history]
    };

    try {
        const response = await fetch(`${API_ENDPOINT}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        
        const data = await response.json();
        if (!data.candidates || data.candidates.length === 0) {
            throw new Error("AI response was blocked or empty.");
        }
        return data.candidates[0].content.parts[0].text;

    } catch (error) {
        console.error("Failed to generate chat response:", error);
        return "AI နှင့် ဆက်သွယ်ရာတွင် အမှားအယွင်း ဖြစ်ပွားပါသည်။ ခဏအကြာတွင် ထပ်မံကြိုးစားကြည့်ပါ။";
    }
}

/**
 * Generates the script draft based on the conversation history.
 * @param {Array<object>} history - The full chat history.
 * @returns {Promise<object|null>} A parsed JSON object of the script or null if failed.
 */
async function generateScriptFromHistory(history) {
    const apiKey = getApiKey();
    if (!apiKey) return null;

    const conversationSummary = history
        .map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.parts[0].text}`)
        .join('\n');

    const prompt = `
        **MODE: GENERATION**
        You are a World-Class Viral Script Writer. Based on the following conversation summary, identify the user's Core Pillars (Objective, Audience, Problem, Value, Tone, CTA) and create a powerful short-form video script.

        **Conversation Summary:**
        ---
        ${conversationSummary}
        ---

        Your task is to generate a script and respond ONLY with a single, raw JSON object. Do not add any explanation, commentary, or markdown backticks around the JSON. Your entire response must be ONLY the JSON object itself.

        The JSON structure MUST be:
        {
          "hook": "Your generated hook text here.",
          "body": "Your generated body text here. Use \\n for line breaks to ensure good pacing.",
          "cta": "Your generated call to action here."
        }
    `;

    try {
        const response = await fetch(`${API_ENDPOINT}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "contents": [{"parts": [{"text": prompt }]}] })
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        
        const data = await response.json();
        let responseText = data.candidates[0].content.parts[0].text;
        
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        
        return JSON.parse(responseText);

    } catch (error) {
        console.error("Failed to generate or parse script:", error);
        return null;
    }
}

/**
 * Revises a specific part of the script based on user instruction.
 * @param {string} part - The part to revise ('hook', 'body', or 'cta').
 * @param {string} currentText - The current text of that part.
 * @param {string} instruction - The user's instruction for revision.
 * @returns {Promise<string|null>} The revised text or null if failed.
 */
async function reviseScriptPart(part, currentText, instruction) {
    const apiKey = getApiKey();
    if (!apiKey) return currentText;

    const prompt = `
        **MODE: EDITING**
        You are a Script Doctor. Revise the following script part based on the user's instruction.
        - **Part to Revise:** ${part}
        - **Current Text:** "${currentText}"
        - **User's Instruction:** "${instruction}"
        
        Respond ONLY with the newly revised text. Do not add any extra words, explanations, or quotes. The response should be pure text.
    `;
    
    try {
        const response = await fetch(`${API_ENDPOINT}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "contents": [{"parts": [{"text": prompt }]}] })
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        
        const data = await response.json();
        return data.candidates[0].content.parts[0].text.trim();

    } catch (error) {
        console.error("Failed to revise script part:", error);
        return currentText; // Return original text on failure
    }
}

/**
 * Performs a holistic analysis of the entire script for strategic cohesion.
 * @param {string} fullScript - The complete script (Hook, Body, CTA) as a single string.
 * @returns {Promise<string|null>} A formatted Markdown analysis or an error message.
 */
async function performFullAnalysis(fullScript) {
    const apiKey = getApiKey();
    if (!apiKey) return "API Key မထည့်သွင်းရသေးပါ။";

    const prompt = `
        **MODE: FULL SCRIPT ANALYSIS**
        You are a "Script Strategist." Your task is to perform a holistic review of the user's complete script. Do not correct grammar; instead, focus on the strategic connection between the parts.

        **Full Script to Analyze:**
        ---
        ${fullScript}
        ---

        **Your Analysis Process & Response Format:**
        1.  **Hook-Body Promise:** Does the Hook make a promise that the Body actually fulfills?
        2.  **Body-CTA Connection:** Does the value provided in the Body logically lead to the action requested in the CTA?
        3.  **Overall Cohesion:** Does the script feel like a single, unified message with a consistent tone?

        **Your Response Format:**
        -   You must respond in professional Burmese using Markdown.
        -   Start with a structured "Full Script Analysis Report."
        -   For each of the three points above, provide a rating (✅ Strong, 🟡 Medium, or 🔴 Weak) and a brief one-sentence explanation.
        -   After the report, provide a "Recommendation" section identifying the single biggest strategic weakness.
        -   Finally, end with a "Conversation Starter" - an open-ended question to engage the user in a collaborative discussion on how to fix the weakness.
    `;

    try {
        const response = await fetch(`${API_ENDPOINT}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "contents": [{"parts": [{"text": prompt }]}] })
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;

    } catch (error) {
        console.error("Failed to perform full analysis:", error);
        return "Script တစ်ခုလုံးကို သုံးသပ်ရာတွင် အမှားအယွင်း ဖြစ်ပွားပါသည်။";
    }
}

/**
 * "Watches" a viral video link, deconstructs its formula, and offers to apply it to a new topic.
 * @param {string} videoUrl - The URL of the video to analyze.
 * @returns {Promise<string|null>} A formatted Markdown report and incubation question.
 */
async function deconstructViralVideo(videoUrl) {
    const apiKey = getApiKey();
    if (!apiKey) return "API Key မထည့်သွင်းရသေးပါ။";

    const prompt = `
        **MODE: VIRAL DECONSTRUCTOR**
        You are a "Viral Content Analyst." You have the ability to analyze video links from platforms like TikTok, YouTube Shorts, and Facebook Reels. Your task is to "watch" the provided video, deconstruct its viral formula, and then offer to apply that formula to the user's topic.

        **Video URL to Analyze:** ${videoUrl}

        **Your Analysis Process & Response Format:**
        1.  Start with a confirmation: "သင်ပို့လိုက်တဲ့ video ကို ခွဲခြမ်းစိတ်ဖြာပြီးပါပြီ။ ဒါကတော့ သူ့ရဲ့ 'Viral DNA' ပါ:"
        2.  Create a "Deconstruction Report" using Markdown.
        3.  **Hook:** Identify the hook and classify its type in parentheses (e.g., Curiosity Hook, Pain-based Hook).
        4.  **Core Message (Body):** Briefly summarize the value delivered in the video.
        5.  **CTA:** Identify the Call to Action and classify its type.
        6.  **Viral Strategy:** This is the most important part. Identify the underlying psychological principle or content strategy that made this video successful. Give the strategy a name (e.g., "Gatekeeping Reversal," "Pattern Interrupt," "Us vs. Them Narrative"). Explain in one sentence why it works.
        7.  **Incubation Question:** After the report, you MUST ask a proactive, engaging follow-up question. The question should be: "ဒီ '[Strategy Name]' strategy က တော်တော် အစွမ်းထက်ပါတယ်။ **ဒီ formula ကိုပဲ သုံးပြီး၊ Boss ဖန်တီးချင်တဲ့ topic အသစ်တစ်ခုနဲ့ ပေါင်းစပ်ပြီး script အသစ်တစ်ခု အခုပဲ ဖန်တီးကြည့်ကြမလား?**"

        Respond in professional Burmese.
    `;

    try {
        const response = await fetch(`${API_ENDPOINT}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "contents": [{"parts": [{"text": prompt }]}] })
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;

    } catch (error) {
        console.error("Failed to deconstruct video:", error);
        return "Video link ကို သုံးသပ်ရာတွင် အမှားအယွင်း ဖြစ်ပွားပါသည်။ Link မှန်မမှန် စစ်ဆေးပေးပါ။";
    }
}


/**
 * Performs the "Pre-Flight Check" and returns a formatted Markdown analysis.
 * @param {string} fullScript - The complete script as a single string.
 * @returns {Promise<string|null>} A formatted Markdown string or an error message.
 */
async function performFinalCheck(fullScript) {
    const apiKey = getApiKey();
    if (!apiKey) return "API Key မထည့်သွင်းရသေးပါ။";

    const prompt = `
        **MODE: FINAL CHECK**
        The user's script is complete. Your task is to perform a "Pre-Flight Check" as a Performance Coach.
        
        **Full Script to Analyze:**
        ---
        ${fullScript}
        ---
        
        **Your Instructions:**
        1.  Rewrite the entire script, embedding performance notes like "(Tone: Urgent)", "(Pause here)", "(Emphasize this word)" directly into the text.
        2.  After the script, provide a "Sanity Check" section.
        3.  In the Sanity Check, estimate the speaking time in seconds.
        4.  Analyze the script's Clarity and Energy Curve for its intended platform (assume TikTok/Reels).
        5.  Format your entire response professionally using clear Burmese and Markdown. Start with a confident opening line.
    `;
    
    try {
        const response = await fetch(`${API_ENDPOINT}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "contents": [{"parts": [{"text": prompt }]}] })
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);
        
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;

    } catch (error) {
        console.error("Failed to perform final check:", error);
        return "Final Check ပြုလုပ်ရာတွင် အမှားအယွင်း ဖြစ်ပွားပါသည်။";
    }
}