// /assets/js/main.js - Definitive version with all fixes and correct scope

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ACCESS GATE LOGIC (Runs before the main app) ---
    const accessGate = document.getElementById('access-gate');
    const appContainer = document.querySelector('.app-container');
    const emailInput = document.getElementById('access-email-input');
    const enterAppBtn = document.getElementById('enter-app-btn');
    const errorMessage = document.getElementById('gate-error-message');

    async function validateEmail(email) {
        if (!email || !EMAIL_VALIDATION_API_URL) { return false; }
        const url = `${EMAIL_VALIDATION_API_URL}?email=${encodeURIComponent(email.trim().toLowerCase())}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not OK');
            const data = await response.json();
            return data.status === 'success';
        } catch (error) {
            console.error('Email validation fetch failed:', error);
            if (errorMessage) { errorMessage.textContent = 'Could not verify email. Check connection.'; }
            return false;
        }
    }

    function grantAccessAndInitialize() {
        accessGate.style.transition = 'opacity 0.5s ease';
        accessGate.style.opacity = '0';
        setTimeout(() => {
            accessGate.classList.add('hidden');
            appContainer.classList.remove('hidden');
            initializeApp();
        }, 500);
    }

    async function handleEmailLogin() {
        if (!emailInput || !enterAppBtn || enterAppBtn.disabled) return;
        const email = emailInput.value;
        if (!email) return;
        enterAppBtn.disabled = true;
        enterAppBtn.textContent = 'Verifying...';
        if(errorMessage) errorMessage.classList.add('hidden');
        const isApproved = await validateEmail(email);
        if (isApproved) {
            localStorage.setItem('approvedUserEmail', email);
            grantAccessAndInitialize();
        } else {
            emailInput.classList.add('shake');
            if (errorMessage) { errorMessage.textContent = 'Access Denied. Please check the email.'; }
            setTimeout(() => emailInput.classList.remove('shake'), 820);
            enterAppBtn.disabled = false;
            enterAppBtn.textContent = 'Continue';
        }
    }

    async function checkStoredSession() {
        const storedEmail = localStorage.getItem('approvedUserEmail');
        if (storedEmail) {
            if(enterAppBtn) { enterAppBtn.disabled = true; }
            const isStillApproved = await validateEmail(storedEmail);
            if (isStillApproved) {
                grantAccessAndInitialize();
            } else {
                localStorage.removeItem('approvedUserEmail');
                if(enterAppBtn) { enterAppBtn.disabled = false; }
            }
        }
    }

    if (enterAppBtn && emailInput) {
        enterAppBtn.addEventListener('click', handleEmailLogin);
        emailInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); handleEmailLogin(); }
        });
    }
    checkStoredSession();
});

// =================================================================
// MAIN APP LOGIC - ALL HELPER FUNCTIONS MUST BE INSIDE THIS
// =================================================================
function initializeApp() {
    let state = { appMode: 'DISCOVERY', chatHistory: [], isAwaitingResponse: false };
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
        welcomeModal: document.getElementById('welcome-modal'),
        closeWelcomeBtn: document.getElementById('close-welcome-btn'),
    };

    function showWelcomeGuideIfNeeded() {
        if (!hasSeenWelcomeGuide() && dom.welcomeModal) {
            openModal(dom.welcomeModal);
        }
    }

    function startNewScriptWorkflow() {
        state.appMode = 'DISCOVERY';
        state.chatHistory = [];
        dom.chatHistoryEl.innerHTML = '';
        clearEditor();
        const firstQuestion = hasSeenWelcomeGuide()
            ? "Welcome back! What is the topic for your next viral script?"
            : "Welcome! To get started, type the topic for your video below.";
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
            const angleChoiceTriggers = ["angle", "နံပါတ်", "number", "၁", "၂", "၃", "1", "2", "3", "တစ်ခု", "ဒုတိယ", "တတိယ"];
            const isChoosingAngle = angleChoiceTriggers.some(t => userMessageText.toLowerCase().includes(t));

            if (isChoosingAngle && state.appMode !== 'GENERATING') {
                await generateFinalScript();
                aiResponseText = null;
            } else if (analysisTriggers.some(t => userMessageText.toLowerCase().includes(t))) {
                aiResponseText = await handleFullScriptAnalysis(); 
            } else if (urlRegex.test(userMessageText)) {
                aiResponseText = await deconstructViralVideo(userMessageText);
            } else if (userMessageText.toLowerCase().includes('final check')) {
                aiResponseText = await handleFinalCheck();
            } else {
                aiResponseText = await generateChatResponse(state.chatHistory);
            }

            if (aiResponseText) {
                addMessageToChat({ role: 'model', text: aiResponseText });
                state.chatHistory.push({ role: 'model', parts: [{ text: aiResponseText }] });
            }
        } catch (error) {
            console.error("Critical Error in handleSendMessage:", error);
            let userFriendlyError = "An unexpected error occurred. Please try again.";
            if (error.message === "API_KEY_MISSING") { userFriendlyError = "Your API Key is missing. Please add it in Settings (⚙️)."; } 
            else if (error.message === "API_KEY_INVALID") { userFriendlyError = "Your API Key is invalid. Please check it in Settings (⚙️)."; }
            addMessageToChat({ role: 'model', text: `**Error:** ${userFriendlyError}` });
        } finally {
            setUiLoading(false);
        }
    }

async function generateFinalScript() {
        state.appMode = 'GENERATING';
        addMessageToChat({ role: 'model', text: 'Excellent choice. Generating the full script...' });
        setInputsReadOnly(true);

        const MAX_RETRIES = 2; // Try a total of 2 times
        let success = false;
        let attempt = 1;

        while (attempt <= MAX_RETRIES && !success) {
            try {
                console.log(`Attempting to generate script, try #${attempt}...`);
                const scriptJSON = await generateScriptFromHistory(state.chatHistory);

                if (scriptJSON && (scriptJSON.scenes || scriptJSON.script)) {
                    const scenes = scriptJSON.scenes || scriptJSON.script;
                    if (Array.isArray(scenes) && scenes.length > 0) {
                        const getLine = (scene) => scene.script_burmese || scene.dialogue_burmese || (scene.dialogue && Array.isArray(scene.dialogue) ? scene.dialogue.map(d => d.line).join(' ') : '') || '';
                        
                        const hook = getLine(scenes[0]);
                        const cta = (scenes.length > 1) ? getLine(scenes[scenes.length - 1]) : '';
                        const body = scenes.slice(1, -1).map(getLine).join('\n\n').trim();

                        dom.hookInput.value = hook;
                        dom.bodyInput.value = body;
                        dom.ctaInput.value = cta;

                        let nextStepMessage = "The first draft is ready. You can now edit the text or ask me for revisions.";
                        if (!cta.trim()) {
                            nextStepMessage += "\n\nI noticed the CTA is empty. What action do you want your viewers to take?";
                        }

                        addMessageToChat({ role: 'model', text: nextStepMessage });
                        state.chatHistory.push({ role: 'model', parts: [{ text: nextStepMessage }] });
                        state.appMode = 'EDITING';
                        success = true; // Mark as successful to exit the loop
                    } else {
                        throw new Error("Generated JSON has an empty 'scenes' array.");
                    }
                } else {
                    throw new Error("Generated JSON is not in the expected format.");
                }
            } catch (error) {
                console.error(`Attempt #${attempt} failed:`, error);
                attempt++; // Increment attempt and loop again if possible
                if (attempt > MAX_RETRIES) {
                    // This is the final failure after all retries
                    const recoveryMessage = "**တောင်းပန်ပါသည်။ Script ဖန်တီးရာတွင် ယာယီအမှားအယွင်းတစ်ခု ဖြစ်ပွားနေပါသည်။**\n\nခဏအကြာတွင် အောက်ပါစာကြောင်းကို copy ကူးပြီး ပြန်လည်ကြိုးစားကြည့်နိုင်ပါသည်:\n`'generate the script for the chosen angle again'`";
                    addMessageToChat({ role: 'model', text: recoveryMessage });
                    state.appMode = 'DISCOVERY'; // Reset mode to allow user to try again
                }
            }
        }
        setInputsReadOnly(false);
    }
    
async function handleEditRequest(instruction) {
        let partToEdit = null, currentText = '';
        if (instruction.toLowerCase().includes('hook')) { partToEdit = 'hook'; currentText = dom.hookInput.value; } 
        else if (instruction.toLowerCase().includes('body')) { partToEdit = 'body'; currentText = dom.bodyInput.value; } 
        else if (instruction.toLowerCase().includes('cta')) { partToEdit = 'cta'; currentText = dom.ctaInput.value; }

        if (partToEdit) {
            addMessageToChat({ role: 'model', text: `Revising the ${partToEdit}...` });
            const revisedText = await reviseScriptPart(partToEdit, currentText, instruction);
            document.getElementById(`${partToEdit}-input`).value = revisedText;
            return `The ${partToEdit} has been revised as requested. What's next?`;
        }
        // If it's not a specific edit, treat it as a general continuation of the conversation
        return await generateChatResponse(state.chatHistory);
    }

    async function handleFinalCheck() {
        addMessageToChat({ role: 'model', text: "Performing the final pre-flight check on the script..." });
        const fullScript = `[Hook]\n${dom.hookInput.value}\n\n[Body]\n${dom.bodyInput.value}\n\n[CTA]\n${dom.ctaInput.value}`;
        return await performFinalCheck(fullScript);
    }

    async function handleFullScriptAnalysis() {
        addMessageToChat({ role: 'model', text: "Analyzing the entire script for strategic alignment..." });
        const fullScript = `[Hook]\n${dom.hookInput.value}\n\n[Body]\n${dom.bodyInput.value}\n\n[CTA]\n${dom.ctaInput.value}`;
        return await performFullScriptAnalysis(fullScript);
    }

    function addMessageToChat({ role, text }) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role === 'user' ? 'user-message' : 'ai-message'}`;
        // Ensure that if text is null or undefined, it doesn't cause an error
        messageDiv.innerHTML = marked.parse(text || '');
        dom.chatHistoryEl.appendChild(messageDiv);
        dom.chatHistoryEl.scrollTop = dom.chatHistoryEl.scrollHeight;
    }

    function setUiLoading(isLoading) {
        state.isAwaitingResponse = isLoading;
        dom.chatInput.disabled = isLoading;
        dom.sendChatBtn.disabled = isLoading;

        const skeleton = dom.chatHistoryEl.querySelector('.skeleton-message');
        if (isLoading) {
            dom.chatInput.placeholder = "AI is thinking...";
            if (!skeleton) {
                const skeletonDiv = document.createElement('div');
                skeletonDiv.className = 'chat-message skeleton-message';
                skeletonDiv.innerHTML = `<div class="skeleton-line"></div><div class="skeleton-line short"></div>`;
                dom.chatHistoryEl.appendChild(skeletonDiv);
                dom.chatHistoryEl.scrollTop = dom.chatHistoryEl.scrollHeight;
            }
        } else {
            dom.chatInput.placeholder = "Chat with the AI Director...";
            if (skeleton) {
                skeleton.remove();
            }
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
        if (modalElement) {
            modalElement.style.display = 'block';
        }
    }

    function closeModal(modalElement) {
        if (modalElement) {
            modalElement.style.display = 'none';
        }
    }

    function updateApiStatus(isKeySet) {
        if (dom.apiStatusLight) {
            dom.apiStatusLight.className = isKeySet ? 'status-light-green' : 'status-light-red';
            dom.apiStatusLight.title = isKeySet ? 'API Key is set' : 'API Key is required';
        }
    }

    function updateApiKeySettingsUI(isKeySet) {
        if (dom.apiKeyEntryState && dom.apiKeyManageState) {
            dom.apiKeyEntryState.classList.toggle('hidden', isKeySet);
            dom.apiKeyManageState.classList.toggle('hidden', !isKeySet);
        }
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

    
    // Re-pasting inner functions for absolute clarity
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
            if (!skeleton) {
                const skeletonDiv = document.createElement('div');
                skeletonDiv.className = 'chat-message skeleton-message';
                skeletonDiv.innerHTML = `<div class="skeleton-line"></div><div class="skeleton-line short"></div>`;
                dom.chatHistoryEl.appendChild(skeletonDiv);
            }
        } else {
            if (skeleton) skeleton.remove();
        }
    }
    function clearEditor() { dom.hookInput.value = ''; dom.bodyInput.value = ''; dom.ctaInput.value = ''; }
    function setInputsReadOnly(isReadOnly) { dom.hookInput.readOnly = isReadOnly; dom.bodyInput.readOnly = isReadOnly; dom.ctaInput.readOnly = isReadOnly; }
    function openModal(modalElement) { if(modalElement) modalElement.style.display = 'block'; }
    function closeModal(modalElement) { if(modalElement) modalElement.style.display = 'none'; }
    function updateApiStatus(isKeySet) { dom.apiStatusLight.className = isKeySet ? 'status-light-green' : 'status-light-red'; }
    function updateApiKeySettingsUI(isKeySet) { dom.apiKeyEntryState.classList.toggle('hidden', isKeySet); dom.apiKeyManageState.classList.toggle('hidden', !isKeySet); }
    function renderScriptVault() {
        const scripts = getSavedScripts();
        dom.scriptVaultList.innerHTML = '';
        if (scripts.length === 0) { dom.scriptVaultList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No saved scripts yet.</p>'; return; }
        scripts.forEach(script => {
            const item = document.createElement('div');
            item.className = 'vault-item';
            item.innerHTML = `<span class="vault-item-title">${script.title}</span><div class="vault-item-actions"><button class="load-btn" data-id="${script.id}">Load</button><button class="delete-btn" data-id="${script.id}">Delete</button></div>`;
            dom.scriptVaultList.appendChild(item);
        });
    }

    function bindEventListeners() {
        dom.sendChatBtn.addEventListener('click', handleSendMessage);
        dom.chatInput.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey && !state.isAwaitingResponse) { e.preventDefault(); handleSendMessage(); } });
        dom.clearChatBtn.addEventListener('click', () => { if (confirm('Clear chat and start over?')) { startNewScriptWorkflow(); } });
        dom.newScriptBtn.addEventListener('click', () => { if (confirm('Start a new script?')) { startNewScriptWorkflow(); } });
        dom.settingsBtn.addEventListener('click', () => {
            const userProfile = getUserProfile();
            const brandInfoEl = document.getElementById('profile-brand-info');
            const audienceInfoEl = document.getElementById('profile-audience-info');
            if (userProfile) {
                if (brandInfoEl) brandInfoEl.value = userProfile.brand || '';
                if (audienceInfoEl) audienceInfoEl.value = userProfile.audience || '';
            }
            openModal(dom.settingsModal);
        });
        const saveProfileBtn = document.getElementById('save-profile-btn');
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', () => {
                const brandInfo = document.getElementById('profile-brand-info').value.trim();
                const audienceInfo = document.getElementById('profile-audience-info').value.trim();
                saveUserProfile({ brand: brandInfo, audience: audienceInfo });
                alert('Profile saved!');
                closeModal(dom.settingsModal);
            });
        }
        dom.saveApiKeyBtn.addEventListener('click', () => {
            const key = dom.apiKeyInput.value.trim();
            if (key) { saveApiKey(key); updateApiStatus(true); updateApiKeySettingsUI(true); alert('API Key saved!'); closeModal(dom.settingsModal); }
        });
        dom.deleteApiKeyBtn.addEventListener('click', () => { if (confirm('Delete API Key?')) { deleteApiKey(); updateApiStatus(false); updateApiKeySettingsUI(false); } });
        dom.saveScriptBtn.addEventListener('click', () => {
            const title = prompt("Script Title:", "Untitled Script");
            if (title) { saveScript({ id: Date.now(), title, hook: dom.hookInput.value, body: dom.bodyInput.value, cta: dom.ctaInput.value }); alert(`Script '${title}' saved!`); }
        });
        dom.closeModalBtn.addEventListener('click', () => closeModal(dom.settingsModal));
        dom.hookBankBtn.addEventListener('click', () => openModal(dom.hookBankModal));
        dom.closeHookModalBtn.addEventListener('click', () => closeModal(dom.hookBankModal));
        dom.ctaBankBtn.addEventListener('click', () => openModal(dom.ctaBankModal));
        dom.closeCtaModalBtn.addEventListener('click', () => closeModal(dom.ctaBankModal));
        dom.myScriptsBtn.addEventListener('click', () => { renderScriptVault(); openModal(dom.scriptVaultModal); });
        dom.closeVaultModalBtn.addEventListener('click', () => closeModal(dom.scriptVaultModal));
        if(dom.closeWelcomeBtn) { dom.closeWelcomeBtn.addEventListener('click', () => { closeModal(dom.welcomeModal); setWelcomeGuideSeen(); }); }
        window.addEventListener('click', (event) => { if (event.target.classList.contains('modal')) { closeModal(event.target); } });
    }

    function bindVaultActions() {
        dom.scriptVaultList.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;
            const scriptId = parseInt(button.dataset.id);
            if (button.classList.contains('load-btn')) {
                const scriptToLoad = getSavedScripts().find(s => s.id === scriptId);
                if (scriptToLoad) { dom.hookInput.value = scriptToLoad.hook; dom.bodyInput.value = scriptToLoad.body; dom.ctaInput.value = scriptToLoad.cta; state.appMode = 'EDITING'; closeModal(dom.scriptVaultModal); }
            } else if (button.classList.contains('delete-btn')) {
                if (confirm('Delete this script?')) { deleteScript(scriptId); renderScriptVault(); }
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
        showWelcomeGuideIfNeeded();
    }

    initialize();
}