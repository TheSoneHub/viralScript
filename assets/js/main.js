// /assets/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    const accessGate = document.getElementById('access-gate');
    const appContainer = document.querySelector('.app-container');
    const enterAppBtn = document.getElementById('enter-app-btn');
    const errorMessage = document.getElementById('error-message');
    const emailInput = document.getElementById('access-email-input'); // CORRECT ID
    // --- 1. ACCESS GATE & AUTHENTICATION ---

    /**
     * Validates an email against the Google Sheet backend.
     * @param {string} email The email to validate.
     * @returns {Promise<boolean>} True if the email is approved, false otherwise.
     */
    async function validateEmail(email) {
        if (!email || !EMAIL_VALIDATION_API_URL) return false;
        const url = `${EMAIL_VALIDATION_API_URL}?email=${encodeURIComponent(email.trim().toLowerCase())}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Network response was not ok: ${response.statusText}`);
            const data = await response.json();
            return data.status === 'success';
        } catch (error) {
            console.error('Email validation failed:', error);
            errorMessage.textContent = 'Could not verify email. Please check your connection.';
            errorMessage.classList.remove('hidden');
            return false;
        }
    }

    /**
     * Hides the access gate, shows the app, and starts the main application logic.
     */
    function grantAccessAndInitialize() {
        accessGate.style.transition = 'opacity 0.5s ease';
        accessGate.style.opacity = '0';
        setTimeout(() => {
            accessGate.classList.add('hidden');
            appContainer.classList.remove('hidden');
            initializeApp(); // The main app starts ONLY after access is granted
        }, 500);
    }
    
    /**
     * Handles the user clicking the login button.
     */
    async function handleEmailLogin() {
        const email = emailInput.value;
        if (!email) return;

        enterAppBtn.disabled = true;
        enterAppBtn.textContent = 'Verifying...';
        errorMessage.classList.add('hidden');

        const isApproved = await validateEmail(email);

        if (isApproved) {
            localStorage.setItem('approvedUserEmail', email);
            grantAccessAndInitialize();
        } else {
            emailInput.classList.add('shake');
            errorMessage.textContent = 'Access Denied. Please check the email and try again.';
            errorMessage.classList.remove('hidden');
            setTimeout(() => emailInput.classList.remove('shake'), 820);
        }

        enterAppBtn.disabled = false;
        enterAppBtn.textContent = 'Enter';
    }
    
    /**
     * Checks for a saved email on page load to allow automatic login.
     */
    async function checkStoredSession() {
        const storedEmail = localStorage.getItem('approvedUserEmail');
        if (storedEmail) {
            const isStillApproved = await validateEmail(storedEmail);
            if (isStillApproved) {
                grantAccessAndInitialize();
            } else {
                localStorage.removeItem('approvedUserEmail'); // Clean up invalid stored email
            }
        }
    }

    // Bind login events
    enterAppBtn.addEventListener('click', handleEmailLogin);
    emailInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleEmailLogin();
    });

    // Start the authentication check
    checkStoredSession();
});


// =================================================================
// The Main Application Logic - Initialized ONLY after access is granted
// =================================================================
function initializeApp() {
    // --- 2. APPLICATION STATE ---
    let state = {
        appMode: 'DISCOVERY', // DISCOVERY, GENERATING, EDITING, ANALYZING, FINAL_CHECK
        chatHistory: [],
        isAwaitingResponse: false,
        stopGenerationController: null,
    };

    // --- 3. DOM ELEMENT CONNECTIONS ---
    const dom = {
        // Editor Panel
        hookInput: document.getElementById('hook-input'),
        bodyInput: document.getElementById('body-input'),
        ctaInput: document.getElementById('cta-input'),
        copyScriptBtn: document.getElementById('copy-script-btn'),
        saveScriptBtn: document.getElementById('save-script-btn'),
        newScriptBtn: document.getElementById('new-script-btn'), // Assuming new button exists

        // Chat Panel
        chatHistoryEl: document.getElementById('ai-chat-history'),
        chatInput: document.getElementById('chat-input'),
        sendChatBtn: document.getElementById('send-chat-btn'),
        clearChatBtn: document.getElementById('clear-chat-btn'),
        
        // Modals & Banks
        hookBankBtn: document.getElementById('hook-bank-btn'),
        hookBankModal: document.getElementById('hook-bank-modal'),
        closeHookModalBtn: document.getElementById('close-hook-modal-btn'),
        hookBankList: document.getElementById('hook-bank-list'),
        ctaBankBtn: document.getElementById('cta-bank-btn'),
        ctaBankModal: document.getElementById('cta-bank-modal'),
        closeCtaModalBtn: document.getElementById('close-cta-modal-btn'),
        ctaBankList: document.getElementById('cta-bank-list'),
        settingsBtn: document.getElementById('settings-btn'),
        settingsModal: document.getElementById('settings-modal'),
        closeModalBtn: document.getElementById('close-modal-btn'),
        myScriptsBtn: document.getElementById('my-scripts-btn'),
        scriptVaultModal: document.getElementById('script-vault-modal'),
        closeVaultModalBtn: document.getElementById('close-vault-modal-btn'),
        scriptVaultList: document.getElementById('script-vault-list'),
        
        // API Key Management
        apiKeyInput: document.getElementById('api-key-input'),
        saveApiKeyBtn: document.getElementById('save-api-key-btn'),
        deleteApiKeyBtn: document.getElementById('delete-api-key-btn'),
        apiKeyEntryState: document.getElementById('api-key-entry-state'),
        apiKeyManageState: document.getElementById('api-key-manage-state'),
        apiStatusLight: document.getElementById('api-status'),
    };

    // --- 4. CORE WORKFLOW FUNCTIONS ---

    /**
     * Resets the application to its initial discovery state for a new script.
     */
    function startNewScriptWorkflow() {
        state.appMode = 'DISCOVERY';
        state.chatHistory = [];
        dom.chatHistoryEl.innerHTML = '';
        clearEditor();

        const firstQuestion = "ကြိုဆိုပါတယ်။ ဒီနေ့ ဘယ်လို short video content မျိုး ဖန်တီးချင်ပါသလဲ? Topic ဒါမှမဟုတ် ခေါင်းထဲရှိနေတဲ့ idea လေးကို ပြောပြပေးပါ။";
        addMessageToChat({ role: 'model', text: firstQuestion });
        state.chatHistory.push({ role: 'model', parts: [{ text: firstQuestion }] });
    }

    /**
     * Handles sending a message, routing it based on the current app state.
     */
    async function handleSendMessage() {
        const userMessageText = dom.chatInput.value.trim();
        if (!userMessageText || state.isAwaitingResponse) return;

        addMessageToChat({ role: 'user', text: userMessageText });
        state.chatHistory.push({ role: 'user', parts: [{ text: userMessageText }] });
        dom.chatInput.value = '';
        setUiLoading(true);

        state.stopGenerationController = new AbortController();
        
        try {
            let aiResponseText;
            const urlRegex = /^(https?:\/\/)/i;
            const analysisTriggers = ["script သုံးသပ်ပေး", "full analysis", "အားလုံးကိုစစ်ပေး", "review script"];
            
            if (urlRegex.test(userMessageText)) {
                aiResponseText = await deconstructViralVideo(userMessageText, state.stopGenerationController.signal);
            } else if (analysisTriggers.some(t => userMessageText.toLowerCase().includes(t))) {
                aiResponseText = await handleFullScriptAnalysis();
            } else if (userMessageText.toLowerCase().includes('final check')) {
                aiResponseText = await handleFinalCheck();
            } else {
                switch (state.appMode) {
                    case 'DISCOVERY':
                        const discoveryResponse = await generateChatResponse(state.chatHistory, state.stopGenerationController.signal);
                        if (discoveryResponse && discoveryResponse.includes("[PROCEED_TO_GENERATION]")) {
                            await generateFinalScript();
                            aiResponseText = null; 
                        } else {
                            aiResponseText = discoveryResponse;
                        }
                        break;
                    case 'EDITING':
                        aiResponseText = await handleEditRequest(userMessageText);
                        break;
                    default:
                        aiResponseText = await generateChatResponse(state.chatHistory, state.stopGenerationController.signal);
                        break;
                }
            }

            if (aiResponseText) {
                addMessageToChat({ role: 'model', text: aiResponseText });
                state.chatHistory.push({ role: 'model', parts: [{ text: aiResponseText }] });
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error("Error during AI response generation:", error);
                addMessageToChat({ role: 'model', text: 'An error occurred. Please try again.' });
            }
        } finally {
            setUiLoading(false);
        }
    }

    async function generateFinalScript() {
        state.appMode = 'GENERATING';
        addMessageToChat({ role: 'model', text: 'အချက်အလက်များ ပြည့်စုံပါပြီ။ Script ကို ခဏအကြာ ဖန်တီးပေးနေပါသည်...' });
        setInputsReadOnly(true);

        const scriptJSON = await generateScriptFromHistory(state.chatHistory, state.stopGenerationController.signal);
        
        if (scriptJSON && scriptJSON.hook && scriptJSON.body && scriptJSON.cta) {
            dom.hookInput.value = scriptJSON.hook;
            dom.bodyInput.value = scriptJSON.body;
            dom.ctaInput.value = scriptJSON.cta;
            
            const nextStepMessage = "Script အကြမ်းကို ဖန်တီးပြီးပါပြီ။ ဘယ်အပိုင်းကိုမဆို (Hook, Body, CTA) ရွေးပြီး ပြင်ခိုင်းနိုင်ပါတယ်။ 'final check' လို့ရိုက်ပြီး နောက်ဆုံးအဆင့်စစ်ဆေးမှု ပြုလုပ်နိုင်ပါတယ်။";
            addMessageToChat({ role: 'model', text: nextStepMessage });
            state.chatHistory.push({ role: 'model', parts: [{ text: nextStepMessage }] });
            state.appMode = 'EDITING';
        } else {
            const errorMessage = 'Script ဖန်တီးရာတွင် အမှားအယွင်းဖြစ်ပွားပါသည်။ ကျေးဇူးပြု၍ စကားဆက်ပြောပါ သို့မဟုတ် ပြန်လည်ကြိုးစားပါ။';
            addMessageToChat({ role: 'model', text: errorMessage });
            state.chatHistory.push({ role: 'model', parts: [{ text: errorMessage }] });
            state.appMode = 'DISCOVERY'; // Revert to discovery on failure
        }
        setInputsReadOnly(false);
    }
    
    async function handleEditRequest(instruction) {
        let partToEdit = null, currentText = '';
        if (instruction.toLowerCase().includes('hook')) { partToEdit = 'hook'; currentText = dom.hookInput.value; } 
        else if (instruction.toLowerCase().includes('body')) { partToEdit = 'body'; currentText = dom.bodyInput.value; } 
        else if (instruction.toLowerCase().includes('cta')) { partToEdit = 'cta'; currentText = dom.ctaInput.value; }

        if (partToEdit) {
            addMessageToChat({ role: 'model', text: `${partToEdit} ကို ပြင်ဆင်နေပါသည်...` });
            const revisedText = await reviseScriptPart(partToEdit, currentText, instruction, state.stopGenerationController.signal);
            document.getElementById(`${partToEdit}-input`).value = revisedText;
            return `${partToEdit} ကို ပြင်ဆင်ပြီးပါပြီ။ နောက်ထပ် ဘာများ ပြင်ဆင်လိုပါသေးလဲ?`;
        }
        // If not a specific edit request, treat as a general chat continuation
        return await generateChatResponse(state.chatHistory, state.stopGenerationController.signal);
    }

    async function handleFinalCheck() {
        state.appMode = 'FINAL_CHECK';
        addMessageToChat({ role: 'model', text: "Script ကို နောက်ဆုံးအဆင့် စစ်ဆေးနေပါသည်..." });
        const fullScript = `[Hook]\n${dom.hookInput.value}\n\n[Body]\n${dom.bodyInput.value}\n\n[CTA]\n${dom.ctaInput.value}`;
        const finalCheckText = await performFinalCheck(fullScript, state.stopGenerationController.signal);
        addMessageToChat({ role: 'model', text: "Script အသစ်တစ်ခု ထပ်မံဖန်တီးလိုပါက 'New Script' ခလုတ်ကို နှိပ်နိုင်ပါသည်။" });
        return finalCheckText;
    }

    async function handleFullScriptAnalysis() {
        state.appMode = 'ANALYZING';
        addMessageToChat({ role: 'model', text: "ကောင်းပါပြီ။ Script တစ်ခုလုံးရဲ့ Cohesion ကို သုံးသပ်ပါမယ်။" });
        const fullScript = `[Hook]\n${dom.hookInput.value}\n\n[Body]\n${dom.bodyInput.value}\n\n[CTA]\n${dom.ctaInput.value}`;
        const analysisReport = await performFullAnalysis(fullScript, state.stopGenerationController.signal);
        state.appMode = 'EDITING'; // Return to editing after analysis
        return analysisReport;
    }

    // --- 5. UI HELPER FUNCTIONS ---

    function addMessageToChat({ role, text }) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role === 'user' ? 'user-message' : 'ai-message'}`;
        messageDiv.innerHTML = marked.parse(text); // Assumes 'marked' library is loaded
        dom.chatHistoryEl.appendChild(messageDiv);
        dom.chatHistoryEl.scrollTop = dom.chatHistoryEl.scrollHeight;
    }

    function setUiLoading(isLoading) {
        state.isAwaitingResponse = isLoading;
        dom.chatInput.disabled = isLoading;
        dom.sendChatBtn.disabled = isLoading;

        const skeleton = dom.chatHistoryEl.querySelector('.skeleton-message');
        if (isLoading) {
            dom.chatInput.placeholder = "AI စဉ်းစားနေပါသည်...";
            if (!skeleton) { // Add skeleton only if it doesn't exist
                const skeletonDiv = document.createElement('div');
                skeletonDiv.className = 'chat-message skeleton-message';
                skeletonDiv.innerHTML = `<div class="skeleton-line"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div>`;
                dom.chatHistoryEl.appendChild(skeletonDiv);
                dom.chatHistoryEl.scrollTop = dom.chatHistoryEl.scrollHeight;
            }
        } else {
            if (skeleton) skeleton.remove();
            dom.chatInput.placeholder = "AI နှင့် စကားပြောပါ...";
            state.stopGenerationController = null;
        }
    }

    function clearEditor() {
        dom.hookInput.value = '';
        dom.bodyInput.value = '';
        dom.ctaInput.value = '';
    }

    function setInputsReadOnly(isReadOnly) {
        dom.hookInput.readOnly = isReadOnly;
        dom.bodyInput.readOnly = isReadOnly;
        dom.ctaInput.readOnly = isReadOnly;
    }

    function openModal(modalElement) {
        modalElement.style.display = 'block';
    }

    function closeModal(modalElement) {
        modalElement.style.display = 'none';
    }
    
    function updateApiStatus(isKeySet) {
        dom.apiStatusLight.className = isKeySet ? 'status-light-green' : 'status-light-red';
        dom.apiStatusLight.title = isKeySet ? 'API Key ထည့်သွင်းပြီး' : 'API Key မထည့်ရသေးပါ';
    }

    function updateApiKeySettingsUI(isKeySet) {
        dom.apiKeyEntryState.classList.toggle('hidden', isKeySet);
        dom.apiKeyManageState.classList.toggle('hidden', !isKeySet);
    }

    // --- 6. EVENT LISTENERS BINDING ---
    
    function bindEventListeners() {
        dom.sendChatBtn.addEventListener('click', handleSendMessage);
        dom.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && !state.isAwaitingResponse) {
                e.preventDefault();
                handleSendMessage();
            }
        });

        dom.clearChatBtn.addEventListener('click', () => {
            if (confirm('Chat history တစ်ခုလုံးကို ဖျက်ပြီး အစကပြန်စမှာလား?')) {
                deleteChatHistory(); // From storage.js
                startNewScriptWorkflow();
            }
        });

        // New Script Button
        if (dom.newScriptBtn) {
            dom.newScriptBtn.addEventListener('click', () => {
                if (confirm('လက်ရှိ script ကိုမသိမ်းရသေးပါက ပျောက်သွားပါမည်။ Script အသစ် စတင်မှာလား?')) {
                    startNewScriptWorkflow();
                }
            });
        }
        
        // API Key Management
        dom.saveApiKeyBtn.addEventListener('click', () => {
            const key = dom.apiKeyInput.value.trim();
            if (key) {
                saveApiKey(key);
                updateApiStatus(true);
                updateApiKeySettingsUI(true);
                alert('API Key ကို အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ!');
                closeModal(dom.settingsModal);
            } else {
                alert('ကျေးဇူးပြု၍ API Key အမှန်ကို ထည့်သွင်းပါ။');
            }
        });
        
        dom.deleteApiKeyBtn.addEventListener('click', () => {
            if (confirm('API Key ကို တကယ်ဖျက်မှာလား?')) {
                deleteApiKey();
                updateApiStatus(false);
                updateApiKeySettingsUI(false);
                alert('API Key ကို ဖယ်ရှားပြီးပါပြီ။');
            }
        });

        // Script Saving
        dom.saveScriptBtn.addEventListener('click', () => {
            const hook = dom.hookInput.value.trim();
            const body = dom.bodyInput.value.trim();
            const cta = dom.ctaInput.value.trim();

            if (!hook && !body && !cta) {
                alert("Script is empty. Nothing to save.");
                return;
            }
            const title = prompt("Script အတွက် ခေါင်းစဉ်တစ်ခုပေးပါ။", "Untitled Script");
            if (title) {
                saveScript({ id: Date.now(), title, hook, body, cta });
                alert(`'${title}' ကို အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ။`);
            }
        });
        
        // Modal Open/Close
        dom.settingsBtn.addEventListener('click', () => openModal(dom.settingsModal));
        dom.closeModalBtn.addEventListener('click', () => closeModal(dom.settingsModal));
        dom.hookBankBtn.addEventListener('click', () => openModal(dom.hookBankModal));
        dom.closeHookModalBtn.addEventListener('click', () => closeModal(dom.hookBankModal));
        dom.ctaBankBtn.addEventListener('click', () => openModal(dom.ctaBankModal));
        dom.closeCtaModalBtn.addEventListener('click', () => closeModal(dom.ctaBankModal));
        dom.myScriptsBtn.addEventListener('click', () => {
            renderScriptVault();
            openModal(dom.scriptVaultModal);
        });
        dom.closeVaultModalBtn.addEventListener('click', () => closeModal(dom.scriptVaultModal));

        // Global click to close modals
        window.addEventListener('click', (event) => {
            if (event.target == dom.settingsModal) closeModal(dom.settingsModal);
            if (event.target == dom.hookBankModal) closeModal(dom.hookBankModal);
            if (event.target == dom.ctaBankModal) closeModal(dom.ctaBankModal);
            if (event.target == dom.scriptVaultModal) closeModal(dom.scriptVaultModal);
        });
    }
    
    // --- 7. SCRIPT VAULT & INSPIRATION BANK LOGIC ---
    
    function renderScriptVault() {
        const scripts = getSavedScripts(); // from storage.js
        dom.scriptVaultList.innerHTML = '';
        if (scripts.length === 0) {
            dom.scriptVaultList.innerHTML = '<p class="empty-vault-message">သင်သိမ်းဆည်းထားသော script များ မရှိသေးပါ။</p>';
            return;
        }
        scripts.forEach(script => {
            const item = document.createElement('div');
            item.className = 'vault-item';
            item.innerHTML = `
                <span class="vault-item-title">${script.title}</span>
                <div class="vault-item-actions">
                    <button class="load-btn" data-id="${script.id}">Load</button>
                    <button class="delete-btn danger" data-id="${script.id}">Delete</button>
                </div>`;
            dom.scriptVaultList.appendChild(item);
        });
    }

    function bindVaultActions() {
        dom.scriptVaultList.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            const scriptId = parseInt(button.dataset.id);
            if (button.classList.contains('load-btn')) {
                const scriptToLoad = getSavedScripts().find(s => s.id === scriptId);
                if (scriptToLoad) {
                    dom.hookInput.value = scriptToLoad.hook;
                    dom.bodyInput.value = scriptToLoad.body;
                    dom.ctaInput.value = scriptToLoad.cta;
                    const loadMessage = `Script "${scriptToLoad.title}" ကို ပြန်လည်ဖွင့်ပြီးပါပြီ။`;
                    addMessageToChat({role: 'model', text: loadMessage});
                    state.chatHistory.push({ role: 'model', parts: [{ text: loadMessage }] });
                    state.appMode = 'EDITING';
                    closeModal(dom.scriptVaultModal);
                }
            } else if (button.classList.contains('delete-btn')) {
                if (confirm(`'${button.parentElement.previousElementSibling.textContent}' ကို တကယ်ဖျက်မှာလား?`)) {
                    deleteScript(scriptId);
                    renderScriptVault(); // Re-render the vault list
                }
            }
        });
    }
    
    // --- 8. INITIALIZATION ---

    function initialize() {
        const existingKey = getApiKey();
        updateApiStatus(!!existingKey);
        updateApiKeySettingsUI(!!existingKey);
        
        initializeHookBank(); // from hookbank.js
        // Logic from hookbank.js for CTA bank can be reused or abstracted
        
        bindEventListeners();
        bindVaultActions();
        
        startNewScriptWorkflow();
    }

    // Start the application
    initialize();
}