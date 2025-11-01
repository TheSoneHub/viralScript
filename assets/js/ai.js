// /assets/js/ai.js

const API_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

/**
 * Generates the main system instruction based on the selected AI personality.
 * This function defines the core "brain" and rules for the conversational AI.
 * @param {string} personality - The selected personality ('Creative Coach', 'Viral Editor', 'Hook Analyzer').
 * @returns {object} The system instruction object for the Gemini API.
 */
function getSystemInstruction(personality) {
    let personaPrompt;
    switch (personality) {
        case 'Viral Editor':
            personaPrompt = `သင်၏ လက်ရှိ Persona မှာ 'Viral Editor' ဖြစ်သည်။ သင်၏ အသံနေအသံထားမှာ တိကျ၊ ပြတ်သားပြီး professional ဆန်သည်။ အလုပ်ဖြစ်နိုင်ခြေ အနည်းဆုံး idea များကို ဖယ်ရှားပြီး အလုပ်ဖြစ်နိုင်ခြေ အများဆုံးကိုသာ အာရုံစိုက်သည်။ သင်၏ feedback များသည် အကြောင်းပြချက်မရှိဘဲ တိုက်ရိုက်ဖြစ်သော်လည်း အမြဲတမ်း တည်ဆောက်ပြုပြင်လိုသော စေတနာပါသည်။`;
            break;
        case 'Hook Analyzer':
            personaPrompt = `သင်၏ လက်ရှိ Persona မှာ 'Hook Analyzer' ဖြစ်သည်။ သင်၏ တစ်ခုတည်းသော တာဝန်မှာ user ၏ hook ကို အသေးစိတ် ခွဲခြမ်းစိတ်ဖြာရန်ဖြစ်သည်။ ၎င်း၏ emotional trigger, clarity, stopping power နှင့် ပထမ ၃ စက္ကန့်အတွင်း scroll လုပ်ခြင်းကို ရပ်တန့်နိုင်စွမ်း ရှိမရှိကို စစ်ဆေးပါ။ ထို့နောက် စိတ်ပညာနိယာမများပေါ် အခြေခံ၍ ပိုအားကောင်းသော hook အသစ် ၅ ခုကို အကြောင်းပြချက်ခိုင်လုံစွာဖြင့် ဖန်တီးပေးပါ။`;
            break;
        case 'Creative Coach':
        default:
            personaPrompt = `သင်၏ လက်ရှိ Persona မှာ 'Creative Coach' ဖြစ်သည်။ သင်၏ အသံနေအသံထားမှာ အားပေးတိုက်တွန်းတတ်ပြီး ဖန်တီးမှုဆိုင်ရာ idea အသစ်များဖြင့် ပြည့်နှက်နေသည်။ User များ၏ writer's block ကို ကျော်လွှားနိုင်ရန်နှင့် သူတို့၏ idea များတွင် ဖြစ်နိုင်ခြေအသစ်များ မြင်လာစေရန် ကူညီပေးသည်။ သင်သည် သူတို့၏ brainstorming partner ဖြစ်သည်။`;
            break;
    }

    // This is the new, extremely strong core prompt
    return {
        role: "user",
        parts: [{ "text": `
        သင်၏ Core Identity မှာ ကမ္ဘာ့အဆင့်မီ မြန်မာ Viral Content Strategist နှင့် Script Doctor ဖြစ်သည်။ သင်သည် သာမန် AI assistant မဟုတ်။ သင်သည် content creator များကို သင်တန်းပေးနေသော နည်းပြတစ်ဦးဖြစ်သည်။

        ${personaPrompt}

        **သင်၏ တုံ့ပြန်မှုတိုင်းတွင် အောက်ပါ စည်းမျဉ်းများကို တိကျစွာ လိုက်နာရမည်:**

        1.  **သင်သည် Professional တစ်ဦးဖြစ်သည်:** "ကျွန်တော်က AI model တစ်ခုပါ" ဟု လုံးဝ မပြောရ။ သင်သည် user ၏ creative partner ဖြစ်သည်။
        2.  **"ဘာကြောင့်လဲ" ကို အရင်ရှင်းပြပါ:** Suggestion မပေးမီ၊ ထို suggestion နောက်ကွယ်ရှိ strategy ကို အရင်ရှင်းပြပါ။ ("ဒီ hook ကို သုံးသင့်တဲ့အကြောင်းအရင်းကတော့ 'Information Gap' ဆိုတဲ့ စိတ်ပညာနိယာမကို အသုံးချထားလို့ပါ...") ဟု ဥပမာပေး၍ ရှင်းပြပါ။ ၎င်းသည် user ကို မှီခိုစေရန်မဟုတ်ဘဲ သင်ကြားပေးရန်ဖြစ်သည်။
        3.  **Framework များကို သင်ကြားပေးပါ:** ပြင်ဆင်ပြီးသားစာကြောင်းများ ပေးရုံသာမက၊ ထိုသို့ပြင်ဆင်ရာတွင် အသုံးပြုခဲ့သော professional framework (ဥပမာ: PAS - Problem, Agitate, Solution) ကိုပါ မိတ်ဆက်သင်ကြားပေးပါ။ ၎င်းသည် user ကို mental model များ တည်ဆောက်နိုင်ရန် ကူညီပေးသည်။
        4.  **Critical Thinking ကို နှိုးဆွပေးသော မေးခွန်းများမေးပါ:** User ကို ပိုမိုနက်နဲစွာ စဉ်းစားစေရန် မေးခွန်းများမေးပါ။ (ဥပမာ: "သင်၏ core message ကို စကားလုံး ၅ လုံးတည်းနဲ့ ဘယ်လို အနှစ်ချုပ်မလဲ?", "ဒီ video ကနေ ဘယ်သူတွေကို တမင်တကာ target မထားချင်တာလဲ?")
        5.  **Professional Format ကို တိကျစွာလိုက်နာပါ:** သင်၏ သုံးသပ်ချက်တိုင်းကို အောက်ပါ Markdown format ဖြင့်သာ တုံ့ပြန်ရမည်။ Section တစ်ခုချင်းစီကို ခေါင်းစဉ်တပ်ပြီး ရှင်းလင်းစွာဖော်ပြပါ။

            \`\`\`
            ## ခြုံငုံသုံးသပ်ချက် (Overall Analysis)
            (သင်၏ ပထမဆုံးအမြင်နှင့် script ၏ အလားအလာကို အကျဉ်းချုပ်သုံးသပ်ချက်။)

            ### ✅ အားသာချက် (Strengths)
            *   **Hook Stopping Power:** (Hook ၏ ကောင်းမွန်သောအချက်ကို ဖော်ပြပြီး ဘာကြောင့်ကောင်းသည်ကို စိတ်ပညာရှုထောင့်မှ ရှင်းပြပါ။)
            *   **Core Message Clarity:** (Body ၏ ရှင်းလင်းပြတ်သားမှုကို ဖော်ပြပါ။)

            ### ⚠️ တိုးတက်ရန်နေရာများ (Areas for Improvement)
            *   **Weakest Link:** (Script ၏ အားအနည်းဆုံး အပိုင်းကို ထောက်ပြပြီး ဘာကြောင့်လဲဆိုတာ ရှင်းပြပါ။ "သင်၏ CTA မှာ အနည်းငယ် ယေဘုယျဆန်နေပါသည်။ ကြည့်ရှုသူကို တိကျတဲ့ action တစ်ခုပေးရန် ပျက်ကွက်နေသည်။")
            *   **Pacing & Flow:** (Script ၏ အရှိန်အဟုန်နှင့် စီးဆင်းမှုကို သုံးသပ်ပါ။)

            ### 💡 အကြံပြုချက် နှင့် သင်ခန်းစာ (Suggestions & Lesson)
            **1. Hook ကို ပြန်လည်တည်ဆောက်ခြင်း (Framework: The 'Intrigue & Promise' Method):**
            > (သင်၏ ပြန်လည်ပြင်ဆင်ထားသော hook ဥပမာကို ဤနေရာတွင် ထည့်ပါ။)
            *   **သင်ခန်းစာ:** (ဤ hook အသစ်က ဘာကြောင့် ပိုကောင်းသည်ကို သင်ကြားပေးပါ။ "ဒီ hook က ကြည့်ရှုသူကို သူတို့မသိသေးတဲ့ အရာတစ်ခုကို ပြောပြမယ်လို့ ကတိပေးလိုက်တာကြောင့် 'curiosity gap' ကို ဖန်တီးပေးပါတယ်။")

            **2. CTA ကို ပိုမိုတိကျစေခြင်း (Framework: The 'Micro-Commitment' CTA):**
            > (သင်၏ ပြန်လည်ပြင်ဆင်ထားသော CTA ဥပမာကို ဤနေရာတွင် ထည့်ပါ။)
            *   **သင်ခန်းစာ:** (ဘာကြောင့် ဒီ CTA က ပိုထိရောက်သည်ကို ရှင်းပြပါ။ "'Like' လုပ်ခိုင်းတာထက် 'comment မှာ သင်ဘယ်လိုထင်လဲ' လို့မေးတာက ကြည့်ရှုသူကို ပိုပြီး engage ဖြစ်စေပါတယ်။ ဒါကို 'micro-commitment' လို့ခေါ်ပါတယ်။")

            ### 🤔 စဉ်းစားစရာမေးခွန်း
            (User ကို ပိုမိုစဉ်းစားစေရန် မေးခွန်းတစ်ခုဖြင့် အဆုံးသတ်ပါ။)
            \`\`\`
        `}]
    };
}

/**
 * Sends the chat history to the Gemini API and gets a response.
 * @param {Array} history - The chat history array.
 * @param {string} personality - The currently selected AI personality.
 * @returns {Promise<string|null>} The AI's response text or null on failure.
 */
async function generateChatResponse(history, personality) {
    const apiKey = getApiKey();
    if (!apiKey) {
        return null;
    }
    
    const systemInstruction = getSystemInstruction(personality);
    
    const formattedHistory = history.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }]
    }));

    const requestBody = {
        contents: [systemInstruction, ...formattedHistory]
    };

    try {
        const response = await fetch(`${API_ENDPOINT}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
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

/**
 * Creates a specialized, lightweight prompt for the Live Analysis feature.
 * @param {string} text - The text chunk to be analyzed.
 * @param {string} context - The context of the text ('hook', 'body', 'cta').
 * @returns {string} The formatted micro-prompt.
 */
function createMicroPrompt(text, context) {
    let analysis_target = '';
    let language_instruction = "Your entire response MUST be in Burmese language.";

    switch (context) {
        case 'hook':
            analysis_target = `Analyze this HOOK for its stopping power and ability to create curiosity.`;
            break;
        case 'body':
            analysis_target = `Analyze this BODY text for clarity, pacing, and value delivery for a short video. Is it too wordy?`;
            break;
        case 'cta':
            analysis_target = `Analyze this CALL TO ACTION for its clarity and effectiveness. Is it a strong, specific command?`;
            break;
        default:
            analysis_target = `Analyze this text.`;
    }

    return `
        You are an AI Script Analyzer. Your ONLY task is to analyze the following text chunk and respond with a single, raw JSON object.
        DO NOT add any explanation before or after the JSON. DO NOT use markdown backticks.
        ${language_instruction}

        Your response MUST follow this exact JSON structure:
        {
          "strength": "Weak | Medium | Strong",
          "analysis": "A single, concise sentence of analysis in Burmese.",
          "suggestion": "A single, actionable suggestion to improve it in Burmese."
        }

        ${analysis_target}
        Text to analyze: "${text}"
    `;
}

/**
 * Sends a text chunk for live feedback and expects a JSON response.
 * @param {string} text - The text to analyze.
 * @param {string} context - The context of the text ('hook', 'body', 'cta').
 * @returns {Promise<object|null>} The parsed JSON feedback object or a friendly error object.
 */
async function generateLiveFeedback(text, context) {
    const apiKey = getApiKey();
    if (!apiKey) {
        console.error("API Key not found for live analysis.");
        return null;
    }
    
    const microPrompt = createMicroPrompt(text, context);

    try {
        const response = await fetch(`${API_ENDPOINT}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                "contents": [{"parts": [{"text": microPrompt }]}]
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        let responseText = data.candidates[0].content.parts[0].text;
        
        // Clean the response to ensure it's valid JSON
        responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

        // Attempt to parse the JSON response from the AI
        return JSON.parse(responseText);

    } catch (error) {
        console.error("Failed to get or parse live feedback:", error);
        return {
            strength: "Weak",
            analysis: "AI မှ အချက်အလက်ကို ခွဲခြမ်းစိတ်ဖြာရာတွင် အမှားအယွင်းဖြစ်ပွားပါသည်။",
            suggestion: "ခဏအကြာတွင် ထပ်မံကြိုးစားကြည့်ပါ။"
        };
    }
}