// /assets/js/main.js - Definitive, Final, Corrected Version

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
// MAIN APP LOGIC - ALL FUNCTIONS ARE CONTAINED WITHIN THIS SCOPE
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
    };

    function showView(viewName) {
        if (state.currentView === viewName && window.innerWidth < 1024) return;
        state.currentView = viewName;
        if (window.innerWidth < 1024) {
            dom.editorView.classList.toggle('hidden', viewName !== 'editor');
            dom.chatView.classList.toggle('hidden', viewName !== 'chat');
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

    function extractJSON(text) {
        const startIndex = text.indexOf('{');
        const endIndex = text.lastIndexOf('}');
        if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) return null;
        const jsonString = text.substring(startIndex, endIndex + 1);
        try {
            return JSON.parse(jsonString);
        } catch (error) {
            console.error("Failed to parse extracted JSON string:", jsonString);
            return null;
        }
    }

    function processAndFillScript(rawText) {
        const scriptJSON = extractJSON(rawText);
        if (scriptJSON && (scriptJSON.scenes || scriptJSON.script)) {
            const scenes = scriptJSON.scenes || scriptJSON.script;
            const getLine = (scene) => scene.script_burmese || scene.dialogue_burmese || (scene.dialogue && Array.isArray(scene.dialogue) ? scene.dialogue.map(d => d.line).join(' ') : '') || '';
            
            const hook = getLine(scenes[0]);
            const cta = (scenes.length > 1) ? getLine(scenes[scenes.length - 1]) : '';
            const body = scenes.slice(1, -1).map(getLine).join('\n\n').trim();

            dom.hookInput.value = hook; 
            dom.bodyInput.value = body; 
            dom.ctaInput.value = cta;

            showView('editor');

            const nextStepMessage = "The first draft is ready in the Editor.";
            addMessageToChat({ role: 'model', text: nextStepMessage });
            state.chatHistory.push({ role: 'model', parts: [{ text: nextStepMessage }] });
            state.appMode = 'EDITING';
        } else {
            console.error("Janitor function failed to find valid JSON in the response:", rawText);
            const recoveryMessage = "There was an error generating the script format. Please try asking for the angle again.";
            addMessageToChat({ role: 'model', text: recoveryMessage });
        }
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
            const isChoosingAngle = angleChoiceTriggers.some(t => userMessageText.toLowerCase().includes(t));

            if (isChoosingAngle) {
                const hiddenPrompt = `The user chose an angle. Now, execute Phase 2: SCRIPT PRODUCTION. Respond with the JSON object.`;
                const tempHistory = [...state.chatHistory, { role: 'user', parts: [{ text: hiddenPrompt }] }];
                const rawAiResponse = await generateChatResponse(tempHistory);
                processAndFillScript(rawAiResponse);
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
        if (dom.hookInput) dom.hookInput.value = '';
        if (dom.bodyInput) dom.bodyInput.value = '';
        if (dom.ctaInput) dom.ctaInput.value = '';
    }
    
    function openModal(modalElement) {
        if (modalElement) modalElement.style.display = 'block';
    }

    function closeModal(modalElement) {
        if (modalElement) modalElement.style.display = 'none';
    }

    function bindEventListeners() {
        if (dom.navEditorBtn) dom.navEditorBtn.addEventListener('click', () => showView('editor'));
        if (dom.navChatBtn) dom.navChatBtn.addEventListener('click', () => showView('chat'));
        if (dom.sendChatBtn) dom.sendChatBtn.addEventListener('click', handleSendMessage);
        if (dom.chatInput) dom.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
        });
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
        if (dom.settingsBtn) dom.settingsBtn.addEventListener('click', () => openModal(dom.settingsModal));
        if (dom.myScriptsBtn) dom.myScriptsBtn.addEventListener('click', () => openModal(dom.scriptVaultModal));
        
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                closeModal(event.target);
            }
        });
        
        document.querySelectorAll('.close-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                if (modal) closeModal(modal);
            });
        });
    }

    function initialize() {
        bindEventListeners();
        startNewScriptWorkflow();
        updateNav();
        // Additional initializations (API key status, welcome guide, etc.)
        // would go here. For now, this is the core.
    }

    initialize();
}