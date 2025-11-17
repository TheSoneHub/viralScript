// /assets/js/main.js - Definitive version with all fixes

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ACCESS GATE LOGIC (Runs before the main app) ---
    const accessGate = document.getElementById('access-gate');
    const appContainer = document.querySelector('.app-container');
    const emailInput = document.getElementById('access-email-input');
    const enterAppBtn = document.getElementById('enter-app-btn');
    const errorMessage = document.getElementById('gate-error-message');

    /**
     * Validates an email against the Google Sheet backend.
     * @param {string} email The email to validate.
     * @returns {Promise<boolean>} True if the email is approved.
     */
    async function validateEmail(email) {
        if (!email || !EMAIL_VALIDATION_API_URL) {
            console.error("Email or API URL is missing.");
            return false;
        }
        const url = `${EMAIL_VALIDATION_API_URL}?email=${encodeURIComponent(email.trim().toLowerCase())}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not OK');
            const data = await response.json();
            return data.status === 'success';
        } catch (error) {
            console.error('Email validation fetch failed:', error);
            if (errorMessage) {
                errorMessage.textContent = 'Could not verify email. Check connection.';
                errorMessage.classList.remove('hidden');
            }
            return false;
        }
    }

    /**
     * Hides the access gate and starts the main application.
     */
    function grantAccessAndInitialize() {
        accessGate.style.transition = 'opacity 0.5s ease';
        accessGate.style.opacity = '0';
        setTimeout(() => {
            accessGate.classList.add('hidden');
            appContainer.classList.remove('hidden');
            initializeApp(); // Run the main app logic ONLY after access is granted
        }, 500);
    }

    /**
     * Handles the user clicking the login button.
     */
    async function handleEmailLogin() {
        if (!emailInput || !enterAppBtn) return;
        const email = emailInput.value;
        if (!email || enterAppBtn.disabled) return;

        enterAppBtn.disabled = true;
        enterAppBtn.textContent = 'Verifying...';
        if(errorMessage) errorMessage.classList.add('hidden');

        const isApproved = await validateEmail(email);

        if (isApproved) {
            console.log("Email approved. Storing session:", email);
            localStorage.setItem('approvedUserEmail', email);
            grantAccessAndInitialize();
        } else {
            console.log("Email denied.");
            emailInput.classList.add('shake');
            if (errorMessage) {
                errorMessage.textContent = 'Access Denied. Please check the email.';
                errorMessage.classList.remove('hidden');
            }
            setTimeout(() => emailInput.classList.remove('shake'), 820);
            enterAppBtn.disabled = false;
            enterAppBtn.textContent = 'Continue';
        }
    }

    /**
     * Checks for a saved session on page load. This is the main entry point.
     */
    async function checkStoredSession() {
        const storedEmail = localStorage.getItem('approvedUserEmail');
        console.log("Checking for stored email:", storedEmail);

        if (storedEmail) {
            if(enterAppBtn) {
                enterAppBtn.textContent = 'Checking session...';
                enterAppBtn.disabled = true;
            }
            
            const isStillApproved = await validateEmail(storedEmail);
            if (isStillApproved) {
                console.log("Stored session is valid. Granting access.");
                grantAccessAndInitialize();
            } else {
                console.log("Stored session is no longer valid. Removing.");
                localStorage.removeItem('approvedUserEmail');
                if(enterAppBtn) {
                    enterAppBtn.textContent = 'Continue';
                    enterAppBtn.disabled = false;
                }
            }
        } else {
            console.log("No stored session found. Awaiting login.");
        }
    }

    // Bind login events
    if (enterAppBtn && emailInput) {
        enterAppBtn.addEventListener('click', handleEmailLogin);
        emailInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleEmailLogin();
            }
        });
    }

    // Start the process
    checkStoredSession();
});


// =================================================================
// The Main Application Logic - Initialized ONLY after access is granted
// =================================================================
function initializeApp() {
    let state = {
        appMode: 'DISCOVERY',
        chatHistory: [],
        isAwaitingResponse: false,
    };

    const dom = {
        hookInput: document.getElementById('hook-input'),
        bodyInput: document.getElementById('body-input'),
        ctaInput: document.getElementById('cta-input'),
        copyScriptBtn: document.getElementById('copy-script-btn'),
        saveScriptBtn: document.getElementById('save-script-btn'),
        newScriptBtn: document.getElementById('new-script-btn'),
        chatHistoryEl: document.getElementById('ai-chat-history'),
        chatInput: document.getElementById('chat-input'),
        sendChatBtn: document.getElementById('send-chat-btn'),
        clearChatBtn: document.getElementById('clear-chat-btn'),
        settingsBtn: document.getElementById('settings-btn'),
        settingsModal: document.getElementById('settings-modal'),
        closeModalBtn: document.getElementById('close-modal-btn'),
        myScriptsBtn: document.getElementById('my-scripts-btn'),
        scriptVaultModal: document.getElementById('script-vault-modal'),
        closeVaultModalBtn: document.getElementById('close-vault-modal-btn'),
        scriptVaultList: document.getElementById('script-vault-list'),
        apiKeyInput: document.getElementById('api-key-input'),
        saveApiKeyBtn: document.getElementById('save-api-key-btn'),
        deleteApiKeyBtn: document.getElementById('delete-api-key-btn'),
        apiKeyEntryState: document.getElementById('api-key-entry-state'),
        apiKeyManageState: document.getElementById('api-key-manage-state'),
        apiStatusLight: document.getElementById('api-status'),
        hookBankBtn: document.getElementById('hook-bank-btn'),
        hookBankModal: document.getElementById('hook-bank-modal'),
        closeHookModalBtn: document.getElementById('close-hook-modal-btn'),
        ctaBankBtn: document.getElementById('cta-bank-btn'),
        ctaBankModal: document.getElementById('cta-bank-modal'),
        closeCtaModalBtn: document.getElementById('close-cta-modal-btn'),
    };

    function startNewScriptWorkflow() {
        state.appMode = 'DISCOVERY';
        state.chatHistory = [];
        dom.chatHistoryEl.innerHTML = '';
        clearEditor();
        const firstQuestion = "ကြိုဆိုပါတယ်။ ဒီနေ့ ဘယ်လို short video content မျိုး ဖန်တီးချင်ပါသလဲ? Topic ဒါမှမဟုတ် ခေါင်းထဲရှိနေတဲ့ idea လေးကို ပြောပြပေးပါ။";
        addMessageToChat({ role: 'model', text: firstQuestion });
        state.chatHistory.push({ role: 'model', parts: [{ text: firstQuestion }] });
    }

async function handleSendMessage() {
        const userMessageText = dom.chatInput.value.trim();
        if (!userMessageText || state.isAwaitingResponse) return;

        addMessageToChat({ role: 'user', text: userMessageText });
        state.chatHistory.push({ role: 'user', parts: [{ text: userMessageText }] });
        dom.chatInput.value = '';
        setUiLoading(true);
        
        try {
            let aiResponseText;
            const urlRegex = /^(https?:\/\/)/i;
            const analysisTriggers = ["script သုံးသပ်ပေး", "full analysis", "အားလုံးကိုစစ်ပေး", "review script", "analyze script"];
            
            // --- NEW LOGIC: Check if the user is choosing an angle ---
            const angleChoiceTriggers = ["angle", "နံပါတ်", "number", "၁", "၂", "၃", "1", "2", "3", "တစ်ခု", "ဒုတိယ", "တတိယ"];
            const isChoosingAngle = angleChoiceTriggers.some(t => userMessageText.toLowerCase().includes(t));

            if (isChoosingAngle && state.appMode !== 'GENERATING') {
                // If the user chose an angle, trigger the final script generation directly.
                await generateFinalScript();
                aiResponseText = null; // Prevent any other message from being shown.

            } else if (analysisTriggers.some(t => userMessageText.toLowerCase().includes(t))) {
                aiResponseText = await handleFullScriptAnalysis(); 
            
            } else if (urlRegex.test(userMessageText)) {
                aiResponseText = await deconstructViralVideo(userMessageText);
            
            } else if (userMessageText.toLowerCase().includes('final check')) {
                aiResponseText = await handleFinalCheck();
            
            } else {
                // If it's none of the above, proceed with the normal workflow
                switch (state.appMode) {
                    case 'DISCOVERY': // This will now mostly handle the initial topic submission
                        const discoveryResponse = await generateChatResponse(state.chatHistory);
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
                        aiResponseText = await generateChatResponse(state.chatHistory);
                        break;
                }
            }

            if (aiResponseText) {
                addMessageToChat({ role: 'model', text: aiResponseText });
                state.chatHistory.push({ role: 'model', parts: [{ text: aiResponseText }] });
            }
        } catch (error) {
            console.error("Error during AI response:", error);
            addMessageToChat({ role: 'model', text: 'An error occurred. Please try again.' });
        } finally {
            setUiLoading(false);
        }
    }

    async function generateFinalScript() {
        state.appMode = 'GENERATING';
        addMessageToChat({ role: 'model', text: 'အချက်အလက်များ ပြည့်စုံပါပြီ။ Script ကို ခဏအကြာ ဖန်တီးပေးနေပါသည်...' });
        setInputsReadOnly(true);

        const scriptJSON = await generateScriptFromHistory(state.chatHistory);
        
        if (scriptJSON && scriptJSON.scenes && scriptJSON.scenes.length > 0) {
            const scenes = scriptJSON.scenes;
            const hook = scenes[0].script_burmese || '';
            const cta = scenes.length > 1 ? scenes[scenes.length - 1].script_burmese : '';
            const bodyScenes = scenes.slice(1, scenes.length - 1);
            const body = bodyScenes.map(scene => scene.script_burmese).join('\n\n').trim();

            dom.hookInput.value = (scenes.length === 1) ? hook : hook;
            dom.bodyInput.value = (scenes.length === 1) ? '' : body;
            dom.ctaInput.value = (scenes.length === 1) ? '' : cta;
            
            const nextStepMessage = "Script အကြမ်းကို ဖန်တီးပြီးပါပြီ။ ဘယ်အပိုင်းကိုမဆို (Hook, Body, CTA) ရွေးပြီး ပြင်ခိုင်းနိုင်ပါတယ်။ 'final check' လို့ရိုက်ပြီး နောက်ဆုံးအဆင့်စစ်ဆေးမှု ပြုလုပ်နိုင်ပါတယ်။";
            addMessageToChat({ role: 'model', text: nextStepMessage });
            state.chatHistory.push({ role: 'model', parts: [{ text: nextStepMessage }] });
            state.appMode = 'EDITING';
        } else {
            const errorMessage = 'Script ဖန်တီးရာတွင် အမှားအယွင်းဖြစ်ပွားပါသည်။ ကျေးဇူးပြု၍ စကားဆက်ပြောပါ သို့မဟုတ် ပြန်လည်ကြိုးစားပါ။';
            addMessageToChat({ role: 'model', text: errorMessage });
            state.appMode = 'DISCOVERY';
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
            const revisedText = await reviseScriptPart(partToEdit, currentText, instruction);
            document.getElementById(`${partToEdit}-input`).value = revisedText;
            return `${partToEdit} ကို ပြင်ဆင်ပြီးပါပြီ။ နောက်ထပ် ဘာများ ပြင်ဆင်လိုပါသေးလဲ?`;
        }
        return await generateChatResponse(state.chatHistory);
    }

    async function handleFinalCheck() {
        state.appMode = 'FINAL_CHECK';
        addMessageToChat({ role: 'model', text: "Script ကို နောက်ဆုံးအဆင့် စစ်ဆေးနေပါသည်..." });
        const fullScript = `[Hook]\n${dom.hookInput.value}\n\n[Body]\n${dom.bodyInput.value}\n\n[CTA]\n${dom.ctaInput.value}`;
        const finalCheckText = await performFinalCheck(fullScript);
        addMessageToChat({ role: 'model', text: "Script အသစ်တစ်ခု ထပ်မံဖန်တီးလိုပါက 'New Script' ခလုတ်ကို နှိပ်နိုင်ပါသည်။" });
        return finalCheckText;
    }

    async function handleFullScriptAnalysis() {
        state.appMode = 'ANALYZING';
        addMessageToChat({ role: 'model', text: "ကောင်းပါပြီ။ Script တစ်ခုလုံးရဲ့ Cohesion ကို သုံးသပ်ပါမယ်။" });
        const fullScript = `[Hook]\n${dom.hookInput.value}\n\n[Body]\n${dom.bodyInput.value}\n\n[CTA]\n${dom.ctaInput.value}`;
        const analysisReport = await performFullAnalysis(fullScript);
        state.appMode = 'EDITING';
        return analysisReport;
    }

    function addMessageToChat({ role, text }) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role === 'user' ? 'user-message' : 'ai-message'}`;
        messageDiv.innerHTML = marked.parse(text);
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
            if (!skeleton) {
                const skeletonDiv = document.createElement('div');
                skeletonDiv.className = 'chat-message skeleton-message';
                skeletonDiv.innerHTML = `<div class="skeleton-line"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div>`;
                dom.chatHistoryEl.appendChild(skeletonDiv);
            }
        } else {
            if (skeleton) skeleton.remove();
            dom.chatInput.placeholder = "AI နှင့် စကားပြောပါ...";
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

    function openModal(modalElement) { modalElement.style.display = 'block'; }
    function closeModal(modalElement) { modalElement.style.display = 'none'; }
    
    function updateApiStatus(isKeySet) {
        dom.apiStatusLight.className = isKeySet ? 'status-light-green' : 'status-light-red';
        dom.apiStatusLight.title = isKeySet ? 'API Key set' : 'API Key needed';
    }

    function updateApiKeySettingsUI(isKeySet) {
        dom.apiKeyEntryState.classList.toggle('hidden', isKeySet);
        dom.apiKeyManageState.classList.toggle('hidden', !isKeySet);
    }

    function renderScriptVault() {
        const scripts = getSavedScripts();
        dom.scriptVaultList.innerHTML = '';
        if (scripts.length === 0) {
            dom.scriptVaultList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No saved scripts yet.</p>';
            return;
        }
        scripts.forEach(script => {
            const item = document.createElement('div');
            item.className = 'vault-item';
            item.innerHTML = `
                <span class="vault-item-title">${script.title}</span>
                <div class="vault-item-actions">
                    <button class="load-btn" data-id="${script.id}">Load</button>
                    <button class="delete-btn" data-id="${script.id}">Delete</button>
                </div>`;
            dom.scriptVaultList.appendChild(item);
        });
    }

function bindEventListeners() {
        // Chat functionality
        dom.sendChatBtn.addEventListener('click', handleSendMessage);
        dom.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey && !state.isAwaitingResponse) {
                e.preventDefault();
                handleSendMessage();
            }
        });

        // Header controls
        dom.clearChatBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the chat and start a new script?')) {
                deleteChatHistory();
                startNewScriptWorkflow();
            }
        });
        dom.newScriptBtn.addEventListener('click', () => {
            if (confirm('Start a new script? Any unsaved changes will be lost.')) {
                startNewScriptWorkflow();
            }
        });

        // Settings Modal & Profile Functionality
        dom.settingsBtn.addEventListener('click', () => {
            // Load existing profile data when modal is opened
            const userProfile = getUserProfile();
            const brandInfoEl = document.getElementById('profile-brand-info');
            const audienceInfoEl = document.getElementById('profile-audience-info');

            if (userProfile) {
                if(brandInfoEl) brandInfoEl.value = userProfile.brand || '';
                if(audienceInfoEl) audienceInfoEl.value = user.audience || '';
            }
            openModal(dom.settingsModal);
        });

        const saveProfileBtn = document.getElementById('save-profile-btn');
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => {
                const brandInfo = document.getElementById('profile-brand-info').value.trim();
                const audienceInfo = document.getElementById('profile-audience-info').value.trim();
                saveUserProfile({ brand: brandInfo, audience: audienceInfo });
                alert('Profile saved successfully!');
                closeModal(dom.settingsModal);
            });
        }
        
        // API Key Functionality
        dom.saveApiKeyBtn.addEventListener('click', () => {
            const key = dom.apiKeyInput.value.trim();
            if (key) {
                saveApiKey(key);
                updateApiStatus(true);
                updateApiKeySettingsUI(true);
                alert('API Key saved successfully!');
                closeModal(dom.settingsModal);
            } else {
                alert('Please enter a valid API Key.');
            }
        });
        dom.deleteApiKeyBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete your API Key?')) {
                deleteApiKey();
                updateApiStatus(false);
                updateApiKeySettingsUI(false);
                alert('API Key deleted.');
            }
        });

        // Script Editor Actions
        dom.saveScriptBtn.addEventListener('click', () => {
            const hook = dom.hookInput.value.trim();
            const body = dom.bodyInput.value.trim();
            const cta = dom.ctaInput.value.trim();
            if (!hook && !body && !cta) {
                alert("Script is empty. Nothing to save.");
                return;
            }
            const title = prompt("Enter a title for this script:", "Untitled Script");
            if (title) {
                saveScript({ id: Date.now(), title, hook, body, cta });
                alert(`Script '${title}' saved successfully!`);
            }
        });

        // All Modal Open/Close Buttons
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
        
        // Global listener to close modals when clicking on the background
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                closeModal(event.target);
            }
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
                    const loadMessage = `Script "${scriptToLoad.title}" has been loaded.`;
                    addMessageToChat({role: 'model', text: loadMessage});
                    state.chatHistory.push({ role: 'model', parts: [{ text: loadMessage }] });
                    state.appMode = 'EDITING';
                    closeModal(dom.scriptVaultModal);
                }
            } else if (button.classList.contains('delete-btn')) {
                if (confirm(`Are you sure you want to delete this script?`)) {
                    deleteScript(scriptId);
                    renderScriptVault();
                }
            }
        });
    }
    
    function initialize() {
        const existingKey = getApiKey();
        updateApiStatus(!!existingKey);
        updateApiKeySettingsUI(!!existingKey);
        initializeHookBank();
        bindEventListeners();
        bindVaultActions();
        startNewScriptWorkflow();
    }

    initialize();
}