// /assets/js/main.js - Definitive, Corrected Access Gate Logic

document.addEventListener('DOMContentLoaded', () => {
    // --- 1. ACCESS GATE LOGIC (Runs before the main app) ---
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
            if (errorMessage) {
                errorMessage.textContent = 'Could not verify email.';
                errorMessage.classList.remove('hidden');
            }
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
            if (errorMessage) {
                errorMessage.textContent = 'Access Denied.';
                errorMessage.classList.remove('hidden');
            }
            setTimeout(() => emailInput.classList.remove('shake'), 820);
            enterAppBtn.disabled = false;
            enterAppBtn.textContent = 'Continue';
        }
    }

    async function checkStoredSession() {
        const storedEmail = localStorage.getItem('approvedUserEmail');
        if (storedEmail) {
            if(enterAppBtn) {
                enterAppBtn.disabled = true;
                enterAppBtn.textContent = 'Checking session...';
            }
            const isStillApproved = await validateEmail(storedEmail);
            if (isStillApproved) {
                grantAccessAndInitialize();
            } else {
                localStorage.removeItem('approvedUserEmail');
                if(enterAppBtn) {
                    enterAppBtn.disabled = false;
                    enterAppBtn.textContent = 'Continue';
                }
            }
        }
    }

    if (enterAppBtn && emailInput) {
        enterAppBtn.addEventListener('click', handleEmailLogin);
        emailInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleEmailLogin();
            }
        });
    }

    checkStoredSession();
});

// =================================================================
// MAIN APP LOGIC - MOBILE-FIRST
// =================================================================
function initializeApp() {
    let state = {
        currentView: 'chat',
        isAwaitingResponse: false,
        chatHistory: [],
    };

    const dom = {
        // Views & Nav
        editorView: document.getElementById('editor-view'),
        chatView: document.getElementById('chat-view'),
        navEditorBtn: document.getElementById('nav-editor-btn'),
        navChatBtn: document.getElementById('nav-chat-btn'),
        // Editor
        hookInput: document.getElementById('hook-input'),
        bodyInput: document.getElementById('body-input'),
        ctaInput: document.getElementById('cta-input'),
        newScriptBtn: document.getElementById('new-script-btn'),
        saveScriptBtn: document.getElementById('save-script-btn'),
        copyScriptBtn: document.getElementById('copy-script-btn'),
        // Chat
        chatHistoryEl: document.getElementById('ai-chat-history'),
        chatInput: document.getElementById('chat-input'),
        sendChatBtn: document.getElementById('send-chat-btn'),
        // Shared Header Controls
        settingsBtn: document.getElementById('settings-btn'),
        myScriptsBtn: document.getElementById('my-scripts-btn'),
        apiStatusLight: document.getElementById('api-status'),
        // Modals
        settingsModal: document.getElementById('settings-modal'),
        scriptVaultModal: document.getElementById('script-vault-modal'),
        hookBankModal: document.getElementById('hook-bank-modal'),
        ctaBankModal: document.getElementById('cta-bank-modal'),
        welcomeModal: document.getElementById('welcome-modal'),
        // Modal Content
        scriptVaultList: document.getElementById('script-vault-list'),
        // Modal Controls
        closeModalBtn: document.getElementById('close-modal-btn'),
        closeVaultModalBtn: document.getElementById('close-vault-modal-btn'),
        closeHookModalBtn: document.getElementById('close-hook-modal-btn'),
        closeCtaModalBtn: document.getElementById('close-cta-modal-btn'),
        closeWelcomeBtn: document.getElementById('close-welcome-btn'),
        // Settings specific
        apiKeyInput: document.getElementById('api-key-input'),
        saveApiKeyBtn: document.getElementById('save-api-key-btn'),
        deleteApiKeyBtn: document.getElementById('delete-api-key-btn'),
        apiKeyEntryState: document.getElementById('api-key-entry-state'),
        apiKeyManageState: document.getElementById('api-key-manage-state'),
    };

    function showView(viewName) {
        if (state.currentView === viewName && window.innerWidth < 1024) return;
        state.currentView = viewName;

        if (window.innerWidth < 1024) { // Only perform swaps on mobile
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
        if (dom.navEditorBtn && dom.navChatBtn) {
            dom.navEditorBtn.classList.toggle('active', state.currentView === 'editor');
            dom.navChatBtn.classList.toggle('active', state.currentView === 'chat');
        }
    }

    function showWelcomeGuideIfNeeded() {
        if (!hasSeenWelcomeGuide() && dom.welcomeModal) {
            openModal(dom.welcomeModal);
        }
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
        if(dom.chatInput) dom.chatInput.disabled = isLoading;
        if(dom.sendChatBtn) dom.sendChatBtn.disabled = isLoading;

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
        dom.hookInput.value = '';
        dom.bodyInput.value = '';
        dom.ctaInput.value = '';
    }
    
    function openModal(modalElement) { if (modalElement) modalElement.style.display = 'block'; }
    function closeModal(modalElement) { if (modalElement) modalElement.style.display = 'none'; }

    function updateApiStatus(isKeySet) {
        if (dom.apiStatusLight) {
            dom.apiStatusLight.className = isKeySet ? 'status-light-green' : 'status-light-red';
        }
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
        if (scripts.length === 0) {
            dom.scriptVaultList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No saved scripts yet.</p>';
            return;
        }
        scripts.forEach(script => {
            const item = document.createElement('div');
            item.className = 'vault-item';
            item.innerHTML = `<span class="vault-item-title">${script.title}</span><div class="vault-item-actions"><button class="load-btn" data-id="${script.id}">Load</button><button class="delete-btn" data-id="${script.id}">Delete</button></div>`;
            dom.scriptVaultList.appendChild(item);
        });
    }

    function bindEventListeners() {
        // Navigation
        if (dom.navEditorBtn) dom.navEditorBtn.addEventListener('click', () => showView('editor'));
        if (dom.navChatBtn) dom.navChatBtn.addEventListener('click', () => showView('chat'));

        // Chat
        if (dom.sendChatBtn) dom.sendChatBtn.addEventListener('click', handleSendMessage);
        if (dom.chatInput) dom.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
        });

        // Editor actions
        if (dom.newScriptBtn) dom.newScriptBtn.addEventListener('click', () => {
            if (confirm("Start a new script?")) { startNewScriptWorkflow(); }
        });
        if (dom.saveScriptBtn) dom.saveScriptBtn.addEventListener('click', () => {
             const title = prompt("Script Title:");
            if (title) { saveScript({ id: Date.now(), title, hook: dom.hookInput.value, body: dom.bodyInput.value, cta: dom.ctaInput.value }); }
        });
        if (dom.copyScriptBtn) dom.copyScriptBtn.addEventListener('click', () => {
            const fullScript = `[Hook]\n${dom.hookInput.value}\n\n[Body]\n${dom.bodyInput.value}\n\n[CTA]\n${dom.ctaInput.value}`;
            navigator.clipboard.writeText(fullScript).then(() => alert("Script copied!"));
        });

        // Header controls (shared)
        if (dom.settingsBtn) dom.settingsBtn.addEventListener('click', () => {
             const userProfile = getUserProfile();
            const brandInfoEl = document.getElementById('profile-brand-info');
            const audienceInfoEl = document.getElementById('profile-audience-info');
            if (userProfile) {
                if (brandInfoEl) brandInfoEl.value = userProfile.brand || '';
                if (audienceInfoEl) audienceInfoEl.value = userProfile.audience || '';
            }
            openModal(dom.settingsModal);
        });
        if (dom.myScriptsBtn) dom.myScriptsBtn.addEventListener('click', () => {
            renderScriptVault();
            openModal(dom.scriptVaultModal);
        });

        // API Key & Profile Saving
        if (dom.saveApiKeyBtn) dom.saveApiKeyBtn.addEventListener('click', () => {
            const key = dom.apiKeyInput.value.trim();
            if (key) {
                saveApiKey(key);
                updateApiStatus(true);
                updateApiKeySettingsUI(true);
                closeModal(dom.settingsModal);
            }
        });
        if (dom.deleteApiKeyBtn) dom.deleteApiKeyBtn.addEventListener('click', () => {
            if (confirm("Delete API Key?")) {
                deleteApiKey();
                updateApiStatus(false);
                updateApiKeySettingsUI(false);
            }
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
        
        // Modal Closing Logic
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => closeModal(btn.closest('.modal')));
        });
        if (dom.closeWelcomeBtn) dom.closeWelcomeBtn.addEventListener('click', () => {
            closeModal(dom.welcomeModal);
            setWelcomeGuideSeen();
        });
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                closeModal(event.target);
            }
        });
    }

    function bindVaultActions() {
        if (!dom.scriptVaultList) return;
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
                    showView('editor');
                    closeModal(dom.scriptVaultModal);
                }
            } else if (button.classList.contains('delete-btn')) {
                if (confirm('Delete this script?')) {
                    deleteScript(scriptId);
                    renderScriptVault();
                }
            }
        });
    }

    function initialize() {
        bindEventListeners();
        bindVaultActions();
        
        // Load data and set initial states
        const existingKey = getApiKey();
        updateApiStatus(!!existingKey);
        updateApiKeySettingsUI(!!existingKey);
        
        // Start the user workflow
        startNewScriptWorkflow();
        updateNav();
        showWelcomeGuideIfNeeded();
    }

    initialize();
}