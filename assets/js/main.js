// /assets/js/main.js - Definitive, Final Version with all features reintegrated

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ACCESS GATE LOGIC ---
    const accessGate = document.getElementById('access-gate');
    const mobileAppWrapper = document.querySelector('.mobile-app-wrapper');
    const mobileNav = document.querySelector('.mobile-nav');
    const emailInput = document.getElementById('access-email-input');
    const enterAppBtn = document.getElementById('enter-app-btn');
    const errorMessage = document.getElementById('gate-error-message');

    async function validateEmail(email) {
        if (!email || !EMAIL_VALIDATION_API_URL) return false;
        const url = `${EMAIL_VALIDATION_API_URL}?email=${encodeURIComponent(email.trim().toLowerCase())}`;
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network error');
            const data = await response.json();
            return data.status === 'success';
        } catch (error) {
            console.error('Email validation failed:', error);
            if (errorMessage) errorMessage.textContent = 'Could not verify email.';
            return false;
        }
    }

    function grantAccessAndInitialize() {
        accessGate.style.opacity = '0';
        setTimeout(() => {
            accessGate.classList.add('hidden');
            if (mobileAppWrapper) mobileAppWrapper.classList.remove('hidden');
            if (mobileNav) mobileNav.classList.remove('hidden');
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
            if (errorMessage) errorMessage.textContent = 'Access Denied.';
            setTimeout(() => emailInput.classList.remove('shake'), 820);
            enterAppBtn.disabled = false;
            enterAppBtn.textContent = 'Continue';
        }
    }

    async function checkStoredSession() {
        const storedEmail = localStorage.getItem('approvedUserEmail');
        if (storedEmail) {
            if(enterAppBtn) enterAppBtn.disabled = true;
            const isStillApproved = await validateEmail(storedEmail);
            if (isStillApproved) { grantAccessAndInitialize(); } 
            else {
                localStorage.removeItem('approvedUserEmail');
                if(enterAppBtn) enterAppBtn.disabled = false;
            }
        }
    }

    if (enterAppBtn) {
        enterAppBtn.addEventListener('click', handleEmailLogin);
        emailInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleEmailLogin(); } });
    }
    checkStoredSession();
});

// =================================================================
// MAIN APP LOGIC - MOBILE-FIRST & FULLY-FEATURED
// =================================================================
function initializeApp() {
    let state = { currentView: 'chat', isAwaitingResponse: false, chatHistory: [] };
    const dom = {
        editorView: document.getElementById('editor-view'),
        chatView: document.getElementById('chat-view'),
        navEditorBtn: document.getElementById('nav-editor-btn'),
        navChatBtn: document.getElementById('nav-chat-btn'),
        hookInput: document.getElementById('hook-input'),
        bodyInput: document.getElementById('body-input'),
        ctaInput: document.getElementById('cta-input'),
        newScriptBtn: document.getElementById('new-script-btn'),
        saveScriptBtn: document.getElementById('save-script-btn'),
        copyScriptBtn: document.getElementById('copy-script-btn'),
        chatHistoryEl: document.getElementById('ai-chat-history'),
        chatInput: document.getElementById('chat-input'),
        sendChatBtn: document.getElementById('send-chat-btn'),
        settingsBtn: document.getElementById('settings-btn'),
        myScriptsBtn: document.getElementById('my-scripts-btn'),
        apiStatusLight: document.getElementById('api-status'),
        settingsModal: document.getElementById('settings-modal'),
        scriptVaultModal: document.getElementById('script-vault-modal'),
        hookBankModal: document.getElementById('hook-bank-modal'),
        ctaBankModal: document.getElementById('cta-bank-modal'),
        welcomeModal: document.getElementById('welcome-modal'),
        scriptVaultList: document.getElementById('script-vault-list'),
        apiKeyInput: document.getElementById('api-key-input'),
        saveApiKeyBtn: document.getElementById('save-api-key-btn'),
        deleteApiKeyBtn: document.getElementById('delete-api-key-btn'),
        apiKeyEntryState: document.getElementById('api-key-entry-state'),
        apiKeyManageState: document.getElementById('api-key-manage-state'),
    };

    function showView(viewName) {
        if (state.currentView === viewName && window.innerWidth < 1024) return;
        state.currentView = viewName;
        if (window.innerWidth < 1024) {
            if (viewName === 'editor') {
                dom.editorView.classList.remove('hidden');
                dom.chatView.classList.add('hidden');
            } else {
                dom.chatView.classList.remove('hidden');
                dom.editorView.classList.add('hidden');
            }
        }
        updateNav();
    }

    function updateNav() {
        dom.navEditorBtn.classList.toggle('active', state.currentView === 'editor');
        dom.navChatBtn.classList.toggle('active', state.currentView === 'chat');
    }

    function startNewScriptWorkflow() {
        state.chatHistory = [];
        dom.chatHistoryEl.innerHTML = '';
        clearEditor();
        const firstQuestion = "Welcome! What is the topic for your new script?";
        addMessageToChat({ role: 'model', text: firstQuestion });
        state.chatHistory.push({ role: 'model', parts: [{ text: firstQuestion }] });
        showView('chat');
    }

    async function handleSendMessage() {
        const userMessageText = dom.chatInput.value.trim();
        if (!userMessageText || state.isAwaitingResponse) return;
        addMessageToChat({ role: 'user', text: userMessageText });
        state.chatHistory.push({ role: 'user', parts: [{ text: userMessageText }] });
        dom.chatInput.value = '';
        setUiLoading(true);
        try {
            const angleChoiceTriggers = ["angle", "နံပါတ်", "number", "1", "2", "3"];
            if (angleChoiceTriggers.some(t => userMessageText.toLowerCase().includes(t))) {
                await generateFinalScript();
            } else {
                const aiResponseText = await generateChatResponse(state.chatHistory);
                if (aiResponseText) {
                    addMessageToChat({ role: 'model', text: aiResponseText });
                    state.chatHistory.push({ role: 'model', parts: [{ text: aiResponseText }] });
                }
            }
        } catch (error) {
            console.error("Error in handleSendMessage:", error);
            addMessageToChat({ role: 'model', text: `**Error:** An unexpected error occurred.` });
        } finally {
            setUiLoading(false);
        }
    }

    async function generateFinalScript() {
        addMessageToChat({ role: 'model', text: 'Great choice. Generating script...' });
        try {
            const scriptJSON = await generateScriptFromHistory(state.chatHistory);
            if (scriptJSON && scriptJSON.scenes) {
                const scenes = scriptJSON.scenes;
                const hook = scenes[0]?.script_burmese || '';
                const cta = scenes[scenes.length - 1]?.script_burmese || '';
                const body = scenes.slice(1, -1).map(s => s.script_burmese).join('\n\n').trim();
                dom.hookInput.value = hook; dom.bodyInput.value = body; dom.ctaInput.value = cta;
                showView('editor');
            } else { throw new Error("Invalid JSON format from AI."); }
        } catch(error) {
            console.error("Error in generateFinalScript:", error);
            addMessageToChat({ role: 'model', text: 'There was an error generating the script. Please try again.' });
        }
    }

    function addMessageToChat({ role, text }) {
        if (!dom.chatHistoryEl) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role === 'user' ? 'user-message' : 'ai-message'}`;
        messageDiv.innerHTML = marked.parse(text || '');
        dom.chatHistoryEl.appendChild(messageDiv);
        dom.chatHistoryEl.scrollTop = dom.chatHistoryEl.scrollHeight;
    }

    function setUiLoading(isLoading) {
        state.isAwaitingResponse = isLoading;
        if (dom.chatInput) dom.chatInput.disabled = isLoading;
        if (dom.sendChatBtn) dom.sendChatBtn.disabled = isLoading;
        const skeleton = dom.chatHistoryEl.querySelector('.skeleton-message');
        if (isLoading && !skeleton) {
            const skeletonDiv = document.createElement('div');
            skeletonDiv.className = 'chat-message skeleton-message';
            skeletonDiv.innerHTML = `<div class="skeleton-line"></div>`;
            dom.chatHistoryEl.appendChild(skeletonDiv);
        } else if (!isLoading && skeleton) {
            skeleton.remove();
        }
    }

    function clearEditor() {
        if (dom.hookInput) dom.hookInput.value = '';
        if (dom.bodyInput) dom.bodyInput.value = '';
        if (dom.ctaInput) dom.ctaInput.value = '';
    }
    
    function openModal(modalElement) { if (modalElement) modalElement.style.display = 'block'; }
    function closeModal(modalElement) { if (modalElement) modalElement.style.display = 'none'; }
    
    function updateApiStatus(isKeySet) {
        if (dom.apiStatusLight) dom.apiStatusLight.className = isKeySet ? 'status-light-green' : 'status-light-red';
    }

    function updateApiKeySettingsUI(isKeySet) {
        if (dom.apiKeyEntryState && dom.apiKeyManageState) {
            dom.apiKeyEntryState.classList.toggle('hidden', isKeySet);
            dom.apiKeyManageState.classList.toggle('hidden', !isKeySet);
        }
    }
    
    function renderScriptVault() {
        if (!dom.scriptVaultList) return;
        const scripts = getSavedScripts();
        dom.scriptVaultList.innerHTML = '';
        if (scripts.length === 0) { dom.scriptVaultList.innerHTML = '<p style="text-align: center;">No saved scripts.</p>'; return; }
        scripts.forEach(script => {
            const item = document.createElement('div');
            item.className = 'vault-item';
            item.innerHTML = `<span class="vault-item-title">${script.title}</span><div class="vault-item-actions"><button class="load-btn" data-id="${script.id}">Load</button><button class="delete-btn" data-id="${script.id}">Delete</button></div>`;
            dom.scriptVaultList.appendChild(item);
        });
    }

    function showWelcomeGuideIfNeeded() {
        if (!hasSeenWelcomeGuide() && dom.welcomeModal) {
            openModal(dom.welcomeModal);
        }
    }

    function bindEventListeners() {
        // Navigation
        dom.navEditorBtn.addEventListener('click', () => showView('editor'));
        dom.navChatBtn.addEventListener('click', () => showView('chat'));

        // Chat
        dom.sendChatBtn.addEventListener('click', handleSendMessage);
        dom.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
        });

        // Editor actions
        dom.newScriptBtn.addEventListener('click', () => { if (confirm("Start a new script?")) { startNewScriptWorkflow(); } });
        dom.saveScriptBtn.addEventListener('click', () => {
             const title = prompt("Script Title:");
            if (title) { saveScript({ id: Date.now(), title, hook: dom.hookInput.value, body: dom.bodyInput.value, cta: dom.ctaInput.value }); }
        });
        dom.copyScriptBtn.addEventListener('click', () => {
            const fullScript = `[Hook]\n${dom.hookInput.value}\n\n[Body]\n${dom.bodyInput.value}\n\n[CTA]\n${dom.ctaInput.value}`;
            navigator.clipboard.writeText(fullScript).then(() => alert("Script copied!"));
        });

        // Header controls (shared)
        dom.settingsBtn.addEventListener('click', () => {
            const userProfile = getUserProfile();
            const brandInfoEl = document.getElementById('profile-brand-info');
            const audienceInfoEl = document.getElementById('profile-audience-info');
            if (userProfile) {
                if(brandInfoEl) brandInfoEl.value = userProfile.brand || '';
                if(audienceInfoEl) audienceInfoEl.value = userProfile.audience || '';
            }
            openModal(dom.settingsModal);
        });
        dom.myScriptsBtn.addEventListener('click', () => { renderScriptVault(); openModal(dom.scriptVaultModal); });
        
        // Modal-specific listeners from within their HTML (e.g., Settings)
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
        if (dom.saveApiKeyBtn) {
            dom.saveApiKeyBtn.addEventListener('click', () => {
                const key = dom.apiKeyInput.value.trim();
                if (key) { saveApiKey(key); updateApiStatus(true); updateApiKeySettingsUI(true); alert('API Key saved!'); closeModal(dom.settingsModal); }
            });
        }
        if (dom.deleteApiKeyBtn) {
            dom.deleteApiKeyBtn.addEventListener('click', () => { if (confirm('Delete API Key?')) { deleteApiKey(); updateApiStatus(false); updateApiKeySettingsUI(false); } });
        }
        
        // All close buttons inside modals
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => closeModal(btn.closest('.modal')));
        });
        const closeWelcomeBtn = document.getElementById('close-welcome-btn');
        if (closeWelcomeBtn) {
            closeWelcomeBtn.addEventListener('click', () => { closeModal(dom.welcomeModal); setWelcomeGuideSeen(); });
        }

        // Global click to close modals
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) { closeModal(event.target); }
        });
    }

    function initialize() {
        const existingKey = getApiKey();
        updateApiStatus(!!existingKey);
        updateApiKeySettingsUI(!!existingKey);
        
        // This function is in hookbank.js, ensure it's loaded
        if (typeof initializeHookBank === 'function') {
            initializeHookBank();
        }

        bindEventListeners();
        // You would also bind vault actions here if needed
        // bindVaultActions(); 
        
        startNewScriptWorkflow();
        updateNav();
        showWelcomeGuideIfNeeded();
    }

    initialize();
}