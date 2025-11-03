// /assets/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // === 1. DOM Element Connections ===
    // Editor Panel Elements
    const hookInput = document.getElementById('hook-input');
    const bodyInput = document.getElementById('body-input');
    const ctaInput = document.getElementById('cta-input');
    const copyScriptBtn = document.getElementById('copy-script-btn');
    const saveScriptBtn = document.getElementById('save-script-btn');

    // Chat Panel Elements
    const chatHistoryEl = document.getElementById('ai-chat-history');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat-btn');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    
    // Inspiration Bank Elements
    const hookBankBtn = document.getElementById('hook-bank-btn');
    const hookBankModal = document.getElementById('hook-bank-modal');
    const closeHookModalBtn = document.getElementById('close-hook-modal-btn');
    const hookBankList = document.getElementById('hook-bank-list');
    const ctaBankBtn = document.getElementById('cta-bank-btn');
    const ctaBankModal = document.getElementById('cta-bank-modal');
    const closeCtaModalBtn = document.getElementById('close-cta-modal-btn');
    const ctaBankList = document.getElementById('cta-bank-list');

    // Settings & Script Vault Modal Elements
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const myScriptsBtn = document.getElementById('my-scripts-btn');
    const scriptVaultModal = document.getElementById('script-vault-modal');
    const closeVaultModalBtn = document.getElementById('close-vault-modal-btn');
    const scriptVaultList = document.getElementById('script-vault-list');
    
    // API Key Management Elements
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    const deleteApiKeyBtn = document.getElementById('delete-api-key-btn');
    const apiKeyEntryState = document.getElementById('api-key-entry-state');
    const apiKeyManageState = document.getElementById('api-key-manage-state');
    const apiStatusLight = document.getElementById('api-status');

    // === 2. Application State Management ===
    let appState = 'DISCOVERY'; // 'DISCOVERY', 'GENERATING', 'EDITING', 'FINAL_CHECK'
    let chatHistory = [];
    let isAwaitingResponse = false;

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

        // URL Detection gets highest priority
        const urlRegex = /^(https?:\/\/)/i;
        if (urlRegex.test(userMessageText)) {
            aiResponseText = await deconstructViralVideo(userMessageText);
        } else {
            const analysisTriggers = ["script သုံးသပ်ပေး", "full analysis", "အားလုံးကိုစစ်ပေး", "review script"];
            const wantsFullAnalysis = analysisTriggers.some(trigger => userMessageText.toLowerCase().includes(trigger));
            
            if (wantsFullAnalysis && (appState === 'EDITING' || appState === 'FINAL_CHECK')) {
                aiResponseText = await handleFullScriptAnalysis();
            } else if (appState === 'DISCOVERY') {
                const discoveryResponse = await generateChatResponse(chatHistory);
                if (discoveryResponse) {
                    if (discoveryResponse.includes("[PROCEED_TO_GENERATION]")) {
                        await generateFinalScript();
                        aiResponseText = null; 
                    } else {
                        aiResponseText = discoveryResponse;
                    }
                }
            } else if (appState === 'EDITING') {
                if (userMessageText.toLowerCase().includes('final check')) {
                    appState = 'FINAL_CHECK';
                    aiResponseText = await handleFinalCheck();
                } else {
                    aiResponseText = await handleEditRequest(userMessageText);
                }
            } else if (appState === 'FINAL_CHECK') {
                aiResponseText = await handleFinalCheck();
            }
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
             // If no specific part is mentioned, treat it as a continuing conversation
            const aiResponse = await generateChatResponse(chatHistory);
            return aiResponse;
        }
    }

    async function handleFinalCheck() {
        addMessageToChat({ role: 'model', text: "Script ကို နောက်ဆုံးအဆင့် စစ်ဆေးနေပါသည်..." });
        const fullScript = `[Hook]\n${hookInput.value}\n\n[Body]\n${bodyInput.value}\n\n[CTA]\n${ctaInput.value}`;
        const finalCheckText = await performFinalCheck(fullScript);
        addMessageToChat({ role: 'model', text: "Script အသစ်တစ်ခု ထပ်မံဖန်တီးလိုပါက 'new script' ဟု ရိုက်ထည့်နိုင်ပါသည်။" });
        return finalCheckText;
    }

    async function handleFullScriptAnalysis() {
        appState = 'ANALYZING';
        addMessageToChat({ role: 'model', text: "ကောင်းပါပြီ။ Script တစ်ခုလုံးရဲ့ Cohesion ကို သုံးသပ်ပါမယ်။" });
        const fullScript = `[Hook]\n${hookInput.value}\n\n[Body]\n${bodyInput.value}\n\n[CTA]\n${ctaInput.value}`;
        
        const analysisReport = await performFullAnalysis(fullScript);
        
        appState = 'EDITING';
        return analysisReport;
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
        chatInput.placeholder = isLoading ? "AI စဉ်းစားနေပါသည်..." : "AI နှင့် စကားပြောပါ...";
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

    function openScriptVault() {
        const scripts = getSavedScripts();
        scriptVaultList.innerHTML = '';

        if (scripts.length === 0) {
            scriptVaultList.innerHTML = '<p class="empty-vault-message">သင်သိမ်းဆည်းထားသော script များ မရှိသေးပါ။</p>';
        } else {
            scripts.forEach(script => {
                const item = document.createElement('div');
                item.className = 'vault-item';
                item.innerHTML = `
                    <span class="vault-item-title">${script.title}</span>
                    <div class="vault-item-actions">
                        <button class="load-btn" data-id="${script.id}">Load</button>
                        <button class="delete-btn danger" data-id="${script.id}">Delete</button>
                    </div>
                `;
                scriptVaultList.appendChild(item);
            });
        }
        scriptVaultModal.style.display = 'block';
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

    clearChatBtn.addEventListener('click', () => {
        if (confirm('Chat history တစ်ခုလုံးကို ဖျက်ပြီး အစကပြန်စမှာလား?')) {
            deleteChatHistory(); 
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
    myScriptsBtn.addEventListener('click', openScriptVault);
    closeVaultModalBtn.addEventListener('click', () => scriptVaultModal.style.display = 'none');

    hookBankList.addEventListener('click', (e) => {
        if (e.target.classList.contains('hook-item')) {
            chatInput.value = e.target.textContent;
            chatInput.focus();
            hookBankModal.style.display = 'none';
        }
    });

    ctaBankList.addEventListener('click', (e) => {
        if (e.target.classList.contains('hook-item')) {
            chatInput.value = e.target.textContent;
            chatInput.focus();
            ctaBankModal.style.display = 'none';
        }
    });

    scriptVaultList.addEventListener('click', (e) => {
        const target = e.target;
        if (!target.hasAttribute('data-id')) return;
        const scriptId = parseInt(target.getAttribute('data-id'));

        if (target.classList.contains('load-btn')) {
            const scripts = getSavedScripts();
            const scriptToLoad = scripts.find(s => s.id === scriptId);
            if (scriptToLoad) {
                hookInput.value = scriptToLoad.hook;
                bodyInput.value = scriptToLoad.body;
                ctaInput.value = scriptToLoad.cta;
                scriptVaultModal.style.display = 'none';
                const loadMessage = `Script "${scriptToLoad.title}" ကို ပြန်လည်ဖွင့်ပြီးပါပြီ။ သုံးသပ်ခိုင်းနိုင်ပါပြီ သို့မဟုတ် ပြင်ဆင်မှုများ ဆက်လုပ်နိုင်ပါသည်။`;
                addMessageToChat({role: 'model', text: loadMessage});
                chatHistory.push({ role: 'model', parts: [{ text: loadMessage }] });
                appState = 'EDITING';
            }
        }

        if (target.classList.contains('delete-btn')) {
            if (confirm("ဤ script ကို တကယ်ဖျက်မှာလား?")) {
                if (deleteScript(scriptId)) {
                    const itemToRemove = target.closest('.vault-item');
                    if(itemToRemove) itemToRemove.remove();
                    if (scriptVaultList.children.length === 0) {
                         scriptVaultList.innerHTML = '<p class="empty-vault-message">သင်သိမ်းဆည်းထားသော script များ မရှိသေးပါ။</p>';
                    }
                }
            }
        }
    });

    copyScriptBtn.addEventListener('click', () => {
        const fullScript = `[Hook]\n${hookInput.value}\n\n[Body]\n${bodyInput.value}\n\n[CTA]\n${ctaInput.value}`;
        navigator.clipboard.writeText(fullScript).then(() => {
            const btnSpan = copyScriptBtn.querySelector('span');
            const originalText = btnSpan.textContent;
            btnSpan.textContent = 'Copied!';
            copyScriptBtn.style.backgroundColor = '#1dd1a1';
            setTimeout(() => {
                btnSpan.textContent = originalText;
                copyScriptBtn.style.backgroundColor = 'var(--accent-color)';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert('Script ကို copy ကူးမရပါ');
        });
    });

    window.addEventListener('click', (event) => {
        if (event.target == settingsModal) settingsModal.style.display = "none";
        if (event.target == hookBankModal) hookBankModal.style.display = "none";
        if (event.target == ctaBankModal) ctaBankModal.style.display = "none";
        if (event.target == scriptVaultModal) scriptVaultModal.style.display = "none";
    });

    // === 7. Start The Application ===
    initialize();
});