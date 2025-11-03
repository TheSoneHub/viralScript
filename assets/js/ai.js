// /assets/js/ai.js
// This file contains all logic related to interacting with the Google Gemini API.
// It is responsible for constructing precise prompts for different tasks and handling the API responses.

// === 1. CONSTANTS ===

const API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";


// === 2. CORE API COMMUNICATION ===

/**
 * A centralized function to make calls to the Gemini API.
 * This handles authentication, request formatting, and basic error handling.
 * @param {Array<Object>} contents - The 'contents' array to be sent to the Gemini API.
 * @returns {Promise<string|null>} The text response from the AI, or null if an error occurs.
 */
async function callGeminiAPI(contents) {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error("API Key is missing. Cannot make API call.");
        alert("ကျေးဇူးပြု၍ Settings တွင် သင်၏ API key ကို ဦးစွာထည့်သွင်းပါ။");
        return null;
    }

    try {
        const response = await fetch(`${API_ENDPOINT}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("API Error Response:", errorData);
            throw new Error(`API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.candidates || data.candidates.length === 0) {
            console.warn("AI response was blocked or empty.", data);
            return "AI ထံမှ အကြောင်းပြန်ကြားချက် မရရှိပါ (သို့မဟုတ်) content မှာ ကန့်သတ်ချက်များကြောင့် ပိတ်ဆို့ခံရခြင်း ဖြစ်နိုင်ပါသည်။";
        }
        
        return data.candidates[0].content.parts[0].text;

    } catch (error) {
        console.error("Failed to call Gemini API:", error);
        return null;
    }
}


// === 3. PROMPT ENGINEERING & PUBLIC FUNCTIONS ===

// --- A. Discovery / Consultation Mode ---

/**
 * Creates the system instruction for the AI during the guided discovery phase.
 * It tells the AI its persona and the specific question it needs to ask.
 * @param {string} personality - The selected AI persona ('Creative Coach', 'Viral Editor', etc.).
 * @param {Object} questionData - An object containing the question, explanation, and examples for the current step.
 * @returns {Object} The system instruction object for the Gemini API.
 */
function getSystemInstructionForDiscovery(personality, questionData) {
    let personaPrompt;
    switch (personality) {
        case 'Viral Editor':
            personaPrompt = `သင်၏ လက်ရှိ Persona မှာ 'Viral Editor' ဖြစ်သည်။ သင်၏ အသံနေအသံထားမှာ တိကျ၊ ပြတ်သားပြီး professional ဆန်သည်။`;
            break;
        case 'Hook Analyzer':
            personaPrompt = `သင်၏ လက်ရှိ Persona မှာ 'Hook Analyzer' ဖြစ်သည်။ သင်၏ တာဝန်မှာ user ၏ idea များကို hook-focused ရှုထောင့်မှ အကြံဉာဏ်ပေးရန် ဖြစ်သည်။`;
            break;
        case 'Creative Coach':
        default:
            personaPrompt = `သင်၏ လက်ရှိ Persona မှာ 'Creative Coach' ဖြစ်သည်။ သင်၏ အသံနေအသံထားမှာ အားပေးတိုက်တွန်းတတ်ပြီး ဖန်တီးမှုဆိုင်ရာ idea အသစ်များဖြင့် ပြည့်နှက်နေသည်။`;
            break;
    }

    return {
        role: "user",
        parts: [{ "text": `
        သင်၏ Core Identity မှာ 'Creative Consultant AI' ဖြစ်သည်။ သင်၏ အဓိကတာဝန်မှာ Burmese content creator များကို သူတို့၏ script idea များအတွက် လမ်းညွှန်ပေးရန် ဖြစ်သည်။
        ${personaPrompt}

        **သင်၏ လက်ရှိအလုပ်:**
        User ကို အောက်ပါမေးခွန်း **တစ်ခုတည်းကိုသာ** မေးပါ။ User ၏ အဖြေကို စောင့်ပါ။ မေးခွန်းများ ကြိုမေးခြင်း (သို့) အကြံပြုချက်များ ကြိုပေးခြင်း မပြုလုပ်ပါနှင့်။
        
        **မေးခွန်း:**
        ${questionData.question}

        **ရှင်းလင်းချက်:**
        ${questionData.explanation}

        **ဥပမာများ:**
        ${questionData.examples}
        
        သင်၏ တုံ့ပြန်မှုကို တိုရှင်းပြီး မေးခွန်းအပေါ်တွင်သာ အာရုံစိုက်ပါ။`}]
    };
}

/**
 * Generates the AI's next question during the discovery phase.
 * @param {Array<Object>} history - The current chat history.
 * @param {string} personality - The selected AI persona.
 * @param {Object} questionData - The data for the next question to be asked.
 * @returns {Promise<string|null>} The AI's response text.
 */
async function generateDiscoveryResponse(history, personality, questionData) {
    const systemInstruction = getSystemInstructionForDiscovery(personality, questionData);
    const formattedHistory = history.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
    }));
    const contents = [systemInstruction, ...formattedHistory];
    return await callGeminiAPI(contents);
}


// --- B. Script Generation Mode ---

/**
 * Creates the prompt to generate the full script based on collected data.
 * @param {Object} discoveryData - The object containing all answers from the user.
 * @returns {Object} The complete 'contents' array for the Gemini API.
 */
function createScriptGenerationPrompt(discoveryData) {
    const prompt = `
        You are a World-Class Viral Script Writer for Burmese audiences. Based on the following user requirements, create a powerful and effective short-form video script.
        
        **User Requirements:**
        - Topic: ${discoveryData.topic}
        - Objective: ${discoveryData.objective}
        - Target Audience: ${discoveryData.audience}
        - Core Problem/Context: ${discoveryData.problem}
        - Value/Solution: ${discoveryData.value}
        - Desired Hook Type: ${discoveryData.hookType}
        - Call to Action: ${discoveryData.cta}
        - Platform: ${discoveryData.platform}
        - Duration: ${discoveryData.duration}

        Your task is to generate a script and respond ONLY with a single, raw JSON object. Do not add any explanation, introduction, or markdown backticks. The JSON structure MUST be exactly as follows:
        {
          "hook": "Your generated hook text here.",
          "body": "Your generated body text here. Use \\n for line breaks to ensure good pacing.",
          "cta": "Your generated call to action here."
        }
    `;
    return [{ role: "user", parts: [{ text: prompt }] }];
}

/**
 * Generates a full script and expects a clean JSON object in return.
 * @param {Object} discoveryData - The collected data from the user.
 * @returns {Promise<Object|null>} A parsed JSON object with hook, body, and cta, or null on failure.
 */
async function generateScriptFromDiscovery(discoveryData) {
    const contents = createScriptGenerationPrompt(discoveryData);
    const responseText = await callGeminiAPI(contents);
    
    if (!responseText) return null;

    try {
        // Clean the response to ensure it's valid JSON, just in case.
        const cleanedText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanedText);
    } catch (error) {
        console.error("Failed to parse script JSON from AI response:", error, "Response was:", responseText);
        return null;
    }
}


// --- C. Interactive Editing Mode ---

/**
 * Creates the prompt to revise a specific part of the script.
 * @param {string} partToRevise - 'hook', 'body', or 'cta'.
 * @param {string} currentText - The current text of that part.
 * @param {string} userInstruction - The user's command for how to change it.
 * @returns {Object} The complete 'contents' array for the Gemini API.
 */
function createRevisionPrompt(partToRevise, currentText, userInstruction) {
    const prompt = `
        You are a Script Doctor. The user wants to revise a part of their script.
        
        **Part to Revise:** ${partToRevise}
        **Current Text:** "${currentText}"
        **User's Instruction:** "${userInstruction}"

        Your task is to rewrite the text based on the user's instruction. 
        Respond ONLY with the revised text. 
        Do not add any extra words, explanations, quotes, or conversational text like "Here is the revised version:".
    `;
    return [{ role: "user", parts: [{ text: prompt }] }];
}

/**
 * Revises a single part of the script based on user feedback.
 * @param {string} partToRevise - 'hook', 'body', or 'cta'.
 * @param {string} currentText - The text that needs to be revised.
 * @param {string} userInstruction - The user's instruction.
 * @returns {Promise<string|null>} The revised text, or null on failure.
 */
async function reviseScriptPart(partToRevise, currentText, userInstruction) {
    const contents = createRevisionPrompt(partToRevise, currentText, userInstruction);
    const responseText = await callGeminiAPI(contents);
    // The response should be clean text, so we return it directly.
    return responseText;
}