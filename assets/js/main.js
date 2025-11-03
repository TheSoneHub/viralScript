// /assets/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // === 1. DOM Element Connections ===
    // Editor Panel Elements
    const hookInput = document.getElementById('hook-input');
    const bodyInput = document.getElementById('body-input');
    const ctaInput = document.getElementById('cta-input');
    const copyScriptBtn = document.getElementById('copy-script-btn');

    // Chat Panel Elements
    const chatHistoryEl = document.getElementById('ai-chat-history');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat-btn');
    const clearChatBtn = document.getElementById('clear-chat-btn'); // 👈 ADD THIS LINE

    
    // Inspiration Bank Elements
    const hookBankBtn = document.getElementById('hook-bank-btn');
    const hookBankModal = document.getElementById('hook-bank-modal');
    const closeHookModalBtn = document.getElementById('close-hook-modal-btn');
    const hookBankList = document.getElementById('hook-bank-list');
    const ctaBankBtn = document.getElementById('cta-bank-btn');
    const ctaBankModal = document.getElementById('cta-bank-modal');
    const closeCtaModalBtn = document.getElementById('close-cta-modal-btn');
    const ctaBankList = document.getElementById('cta-bank-list');

    // Settings Modal Elements
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    const deleteApiKeyBtn = document.getElementById('delete-api-key-btn');
    const apiKeyEntryState = document.getElementById('api-key-entry-state');
    const apiKeyManageState = document.getElementById('api-key-manage-state');
    const apiStatusLight = document.getElementById('api-status');

    // === 2. Application State Management ===
    let appState = 'DISCOVERY'; // 'DISCOVERY', 'GENERATING', 'EDITING', 'FINAL_CHECK'
    let chatHistory = []; // Stores the conversation for the AI
    let isAwaitingResponse = false; // Prevents spamming the send button

    // === 3. Initialization ===
    function initialize() {
        const existingKey = getApiKey();
        updateApiStatus(!!existingKey);
        updateApiKeySettingsUI(!!existingKey);
        loadInspirationBank('hooks.json', hookBankList, 'hooks');
        loadInspirationBank('cta_bank.json', ctaBankList, 'ctas');
        startDiscovery();
    }

    // === 4. Core Workflow Functions ===

    function startDiscovery() {
        appState = 'DISCOVERY';
        clearEditor();
        chatHistory = [];
        chatHistoryEl.innerHTML = '';
        const firstQuestion = "ကြိုဆိုပါတယ်။ ဒီနေ့ ဘယ်လို short video content မျိုး ဖန်တီးချင်ပါသလဲ? Topic ဒါမှမဟုတ် ခေါင်းထဲရှိနေတဲ့ idea လေးကို ပြောပြပေးပါ။";
        addMessageToChat({ role: 'model', text: firstQuestion });
        chatHistory.push({ role: 'model', parts: [{ text: firstQuestion }] });
    }

    async function handleSendMessage() {
        const userMessageText = chatInput.value.trim();
        if (!userMessageText || isAwaitingResponse) return;

        addMessageToChat({ role: 'user', text: userMessageText });
        chatHistory.push({ role: 'user', parts: [{ text: userMessageText }] });
        chatInput.value = '';
        setUiLoading(true);
        
        // Special command to restart
        if (userMessageText.toLowerCase() === 'new script') {
            startDiscovery();
            setUiLoading(false);
            return;
        }

        // --- State Machine ---
        let aiResponseText;
        if (appState === 'EDITING' && (userMessageText.toLowerCase().includes('အဆင်သင့်ဖြစ်ပြီ') || userMessageText.toLowerCase().includes('final check'))) {
            appState = 'FINAL_CHECK';
        }

        if (appState === 'DISCOVERY') {
            aiResponseText = await generateChatResponse(chatHistory);
            if (aiResponseText) {
                if (aiResponseText.includes("[PROCEED_TO_GENERATION]")) {
                    await generateFinalScript();
                    aiResponseText = null; // Prevent double messaging
                }
            }
        } else if (appState === 'EDITING') {
            aiResponseText = await handleEditRequest(userMessageText);
        } else if (appState === 'FINAL_CHECK') {
            aiResponseText = await handleFinalCheck();
        }

        if (aiResponseText) {
            addMessageToChat({ role: 'model', text: aiResponseText });
            chatHistory.push({ role: 'model', parts: [{ text: aiResponseText }] });
        }
        
        setUiLoading(false);
    }

    async function generateFinalScript() {
        appState = 'GENERATING';
        addMessageToChat({ role: 'model', text: 'အချက်အလက်များ ပြည့်စုံပါပြီ။ Script ကို ခဏအကြာ ဖန်တီးပေးနေပါသည်...' });
        setInputsReadOnly(true);

        const scriptJSON = await generateScriptFromHistory(chatHistory);
        
        if (scriptJSON && scriptJSON.hook && scriptJSON.body && scriptJSON.cta) {
            hookInput.value = scriptJSON.hook;
            bodyInput.value = scriptJSON.body;
            ctaInput.value = scriptJSON.cta;
            
            const nextStepMessage = "Script အကြမ်းကို ဖန်တီးပြီးပါပြီ။ ဘယ်အပိုင်းကိုမဆို (Hook, Body, CTA) ရွေးပြီး ပြင်ခိုင်းနိုင်ပါတယ်။ 'final check' လို့ရိုက်ပြီး နောက်ဆုံးအဆင့်စစ်ဆေးမှု ပြုလုပ်နိုင်ပါတယ်။";
            addMessageToChat({ role: 'model', text: nextStepMessage });
            chatHistory.push({ role: 'model', parts: [{ text: nextStepMessage }] });
            appState = 'EDITING';
        } else {
            const errorMessage = 'Script ဖန်တီးရာတွင် အမှားအယွင်းဖြစ်ပွားပါသည်။ ကျေးဇူးပြု၍ စကားဆက်ပြောပါ သို့မဟုတ် ပြန်လည်ကြိုးစားပါ။';
            addMessageToChat({ role: 'model', text: errorMessage });
            chatHistory.push({ role: 'model', parts: [{ text: errorMessage }] });
            appState = 'DISCOVERY';
        }
        setInputsReadOnly(false);
    }

    async function handleEditRequest(instruction) {
        let partToEdit = null;
        let currentText = '';

        if (instruction.toLowerCase().includes('hook')) { partToEdit = 'hook'; currentText = hookInput.value; } 
        else if (instruction.toLowerCase().includes('body')) { partToEdit = 'body'; currentText = bodyInput.value; } 
        else if (instruction.toLowerCase().includes('cta')) { partToEdit = 'cta'; currentText = ctaInput.value; }

        if (partToEdit) {
            addMessageToChat({ role: 'model', text: `${partToEdit} ကို ပြင်ဆင်နေပါသည်...` });
            const revisedText = await reviseScriptPart(partToEdit, currentText, instruction);
            if (revisedText) {
                document.getElementById(`${partToEdit}-input`).value = revisedText;
                return `${partToEdit} ကို ပြင်ဆင်ပြီးပါပြီ။ နောက်ထပ် ဘာများ ပြင်ဆင်လိုပါသေးလဲ?`;
            } else {
                return `တောင်းပန်ပါသည်။ ${partToEdit} ကို ပြင်ဆင်ရာတွင် အမှားအယွင်းဖြစ်ပွားပါသည်။`;
            }
        } else {
            return "ဘယ်အပိုင်းကို ပြင်လိုသည်ဖြစ်ကြောင်း တိတိကျကျ ပြောပေးပါ။ (ဥပမာ: 'Hook ကို ပြင်ပေးပါ')";
        }
    }

    async function handleFinalCheck() {
        addMessageToChat({ role: 'model', text: "Script ကို နောက်ဆုံးအဆင့် စစ်ဆေးနေပါသည်..." });
        const fullScript = `[Hook]\n${hookInput.value}\n\n[Body]\n${bodyInput.value}\n\n[CTA]\n${ctaInput.value}`;
        const finalCheckText = await performFinalCheck(fullScript);
        addMessageToChat({ role: 'model', text: "Script အသစ်တစ်ခု ထပ်မံဖန်တီးလိုပါက 'new script' ဟု ရိုက်ထည့်နိုင်ပါသည်။" });
        return finalCheckText;
    }

    // === 5. UI Helper Functions ===
    function addMessageToChat({ role, text }) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role === 'user' ? 'user-message' : 'ai-message'}`;
        messageDiv.innerHTML = marked.parse(text);
        chatHistoryEl.appendChild(messageDiv);
        chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
    }

    async function loadInspirationBank(jsonFile, listElement, dataKey = 'hooks') {
        try {
            const response = await fetch(jsonFile);
            const categories = await response.json();
            listElement.innerHTML = '';
            categories.forEach(category => {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'hook-category';
                categoryDiv.innerHTML = `<h3>${category.category}</h3>`;
                category[dataKey].forEach(itemText => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'hook-item';
                    itemDiv.textContent = itemText;
                    categoryDiv.appendChild(itemDiv);
                });
                listElement.appendChild(categoryDiv);
            });
        } catch (error) {
            console.error(`Failed to load ${jsonFile}:`, error);
            listElement.innerHTML = `<p>Error loading bank.</p>`;
        }
    }
    
    function setUiLoading(isLoading) {
        isAwaitingResponse = isLoading;
        chatInput.disabled = isLoading;
        sendChatBtn.disabled = isLoading;
        chatInput.placeholder = isLoading ? "AI စဉ်းစားနေပါသည်..." : "AI ၏ မေးခွန်းကို ဖြေကြားပါ...";
    }

    function setInputsReadOnly(isReadOnly) {
        hookInput.readOnly = isReadOnly;
        bodyInput.readOnly = isReadOnly;
        ctaInput.readOnly = isReadOnly;
    }

    function clearEditor() {
        hookInput.value = '';
        bodyInput.value = '';
        ctaInput.value = '';
    }
    
    function updateApiStatus(isKeySet) {
        apiStatusLight.className = isKeySet ? 'status-light-green' : 'status-light-red';
        apiStatusLight.title = isKeySet ? 'API Key ထည့်သွင်းပြီး' : 'API Key မထည့်ရသေးပါ';
    }

    function updateApiKeySettingsUI(isKeySet) {
        apiKeyEntryState.classList.toggle('hidden', isKeySet);
        apiKeyManageState.classList.toggle('hidden', !isKeySet);
    }

    // === 6. Event Listeners ===
    sendChatBtn.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });

        // 👇 ADD THIS ENTIRE BLOCK 👇
    // Clear Chat Button
    clearChatBtn.addEventListener('click', () => {
        // 1. Ask for user confirmation because this is a destructive action.
        if (confirm('Chat history တစ်ခုလုံးကို ဖျက်ပြီး အစကပြန်စမှာလား?')) {
            // 2. Clear the saved history from the browser's local storage.
            deleteChatHistory(); 
            
            // 3. Call startDiscovery() to completely reset the application state.
            // This handles clearing the UI, the chatHistory array, and asking the first question.
            startDiscovery();
        }
    });


    saveApiKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key && key.length > 10) {
            saveApiKey(key);
            updateApiStatus(true);
            updateApiKeySettingsUI(true);
            alert('API Key ကို အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ!');
            settingsModal.style.display = 'none';
        } else {
            alert('ကျေးဇူးပြု၍ API Key အမှန်ကို ထည့်သွင်းပါ။');
        }
    });
    
    deleteApiKeyBtn.addEventListener('click', () => {
        if (confirm('API Key ကို တကယ်ဖျက်မှာလား?')) {
            deleteApiKey();
            updateApiStatus(false);
            updateApiKeySettingsUI(false);
            alert('API Key ကို ဖယ်ရှားပြီးပါပြီ။');
        }
    });
    
    settingsBtn.addEventListener('click', () => settingsModal.style.display = 'block');
    closeModalBtn.addEventListener('click', () => settingsModal.style.display = 'none');
    hookBankBtn.addEventListener('click', () => hookBankModal.style.display = 'block');
    closeHookModalBtn.addEventListener('click', () => hookBankModal.style.display = 'none');
    ctaBankBtn.addEventListener('click', () => ctaBankModal.style.display = 'block');
    closeCtaModalBtn.addEventListener('click', () => ctaBankModal.style.display = 'none');

    hookBankList.addEventListener('click', (e) => {
        if (e.target.classList.contains('hook-item')) {
            chatInput.value = `"${e.target.textContent}" 라는 hook 유형을 사용하고 싶습니다.`;
            handleSendMessage();
            hookBankModal.style.display = 'none';
        }
    });

    ctaBankList.addEventListener('click', (e) => {
        if (e.target.classList.contains('hook-item')) {
            chatInput.value = `"${e.target.textContent}" 와 같은 CTA를 사용하고 싶습니다.`;
            handleSendMessage();
            ctaBankModal.style.display = 'none';
        }
    });

    copyScriptBtn.addEventListener('click', () => {
        const fullScript = `[Hook]\n${hookInput.value}\n\n[Body]\n${bodyInput.value}\n\n[CTA]\n${ctaInput.value}`;
        navigator.clipboard.writeText(fullScript).then(() => {
            const btnSpan = copyScriptBtn.querySelector('span');
            const originalText = btnSpan.textContent;
            btnSpan.textContent = 'Copied!';
            copyScriptBtn.style.backgroundColor = '#1dd1a1'; // Green feedback
            setTimeout(() => {
                btnSpan.textContent = originalText;
                copyScriptBtn.style.backgroundColor = 'var(--accent-color)';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert('Script ကို copy ကူးမရပါ');
        });
    });

    // Close modals if clicked outside
    window.addEventListener('click', (event) => {
        if (event.target == settingsModal) settingsModal.style.display = "none";
        if (event.target == hookBankModal) hookBankModal.style.display = "none";
        if (event.target == ctaBankModal) ctaBankModal.style.display = "none";
    });

    // === 7. Start The Application ===
    initialize();
});