// /assets/js/main.js - Definitive Version with Universal JSON Parser

// --- MOBILE KEYBOARD FIX ---
function setAppHeight() {
    const doc = document.documentElement;
    doc.style.setProperty('--app-height', `${window.innerHeight}px`);
}
window.addEventListener('resize', setAppHeight);
setAppHeight();

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

    function setEnterButtonState(state) {
        if (!enterAppBtn) return;
        switch (state) {
            case 'verifying': enterAppBtn.disabled = true; enterAppBtn.textContent = 'Verifying...'; break;
            case 'entering': enterAppBtn.disabled = true; enterAppBtn.textContent = 'Entering...'; break;
            case 'enter': enterAppBtn.disabled = false; enterAppBtn.textContent = 'Enter App'; break;
            case 'continue': default: enterAppBtn.disabled = false; enterAppBtn.textContent = 'Continue'; break;
        }
    }

    async function handleEmailLogin() {
        if (!emailInput || !enterAppBtn || enterAppBtn.disabled) return;
        const email = emailInput.value;
        if (!email) return;
        const storedEmail = localStorage.getItem('approvedUserEmail');
        // Show a slightly different UX when the user is re-entering with a previously stored email
        if (storedEmail && storedEmail.trim().toLowerCase() === email.trim().toLowerCase()) {
            setEnterButtonState('entering');
        } else {
            setEnterButtonState('verifying');
        }
        if (errorMessage) errorMessage.classList.add('hidden');
        const isApproved = await validateEmail(email);
        if (isApproved) {
            localStorage.setItem('approvedUserEmail', email);
            grantAccessAndInitialize();
        } else {
            emailInput.classList.add('shake');
            if (errorMessage) errorMessage.textContent = 'Access Denied.';
            setTimeout(() => emailInput.classList.remove('shake'), 820);
            setEnterButtonState('continue');
        }
    }

    async function checkStoredSession() {
        const storedEmail = localStorage.getItem('approvedUserEmail');
        if (storedEmail) {
            // pre-fill input and give the user a hint they can enter the app
            if (emailInput) emailInput.value = storedEmail;
            setEnterButtonState('enter');
            // verify in background to auto-enter if still valid
            setEnterButtonState('verifying');
            const isStillApproved = await validateEmail(storedEmail);
            if (isStillApproved) { grantAccessAndInitialize(); }
            else {
                localStorage.removeItem('approvedUserEmail');
                setEnterButtonState('continue');
            }
        }
    }

    if (enterAppBtn) {
        enterAppBtn.addEventListener('click', handleEmailLogin);
        emailInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); handleEmailLogin(); } });
    }
    // make sure button shows sensible default when the DOM is ready
    const initialStored = localStorage.getItem('approvedUserEmail');
    if (initialStored && initialStored.trim()) {
        if (emailInput) emailInput.value = initialStored;
        setEnterButtonState('enter');
    } else {
        setEnterButtonState('continue');
    }
    checkStoredSession();
});


// =================================================================
// MAIN APP LOGIC - MOBILE-FIRST
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
        closeWelcomeBtn: document.getElementById('close-welcome-btn'),
    };

    function showView(viewName) {
        state.currentView = viewName;
        if (window.innerWidth < 1024) {
            dom.editorView.classList.toggle('hidden', viewName !== 'editor');
            dom.chatView.classList.toggle('hidden', viewName !== 'chat');
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
        if (dom.chatHistoryEl) dom.chatHistoryEl.innerHTML = '';
        clearEditor();
        const firstQuestion = "Welcome! What is the topic for your new script?";
        addMessageToChat({ role: 'model', text: firstQuestion });
        state.chatHistory.push({ role: 'model', parts: [{ text: firstQuestion }] });
        showView('chat');
    }
    
    function extractJSON(text) {
        if (!text || typeof text !== 'string') return null;
        let candidate = text.trim();
        // Decode HTML and strip tags (handles <pre><code> wrappers or escaped entities)
        try {
            const tmp = document.createElement('div');
            tmp.innerHTML = candidate;
            candidate = (tmp.textContent || tmp.innerText || candidate).trim();
        } catch (e) {
            // ignore DOM parsing errors and continue with original text
        }
        // Remove zero-width and non-printing characters that sometimes wrap model output
        candidate = candidate.replace(/\u200B|\uFEFF/g, '').trim();
        // If JSON is inside triple backticks (```json or ```), extract inner content
        const fenceMatch = candidate.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
        if (fenceMatch && fenceMatch[1]) candidate = fenceMatch[1].trim();
        // Remove any surrounding inline code backticks
        candidate = candidate.replace(/^`|`$/g, '').trim();
        const startIndex = candidate.indexOf('{');
        const endIndex = candidate.lastIndexOf('}');
        if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) return null;
        let jsonString = candidate.substring(startIndex, endIndex + 1);
        try { return JSON.parse(jsonString); }
        catch (error) {
            // Try a relaxed parse: decode HTML entities already done; attempt to fix common issues
            try {
                const relaxed = jsonString.replace(/\n/g, ' ').replace(/\t/g, ' ').replace(/'/g, '"');
                return JSON.parse(relaxed);
            } catch (e) {
                return null;
            }
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
            const aiResponseText = await generateChatResponse(state.chatHistory);
            if (aiResponseText) {
                const scriptJSON = extractJSON(aiResponseText);
                if (scriptJSON) {
                    processAndFillScript(scriptJSON);
                } else {
                    addMessageToChat({ role: 'model', text: aiResponseText });
                    state.chatHistory.push({ role: 'model', parts: [{ text: aiResponseText }] });
                }
            }
        } catch (error) {
            console.error("Critical Error in handleSendMessage:", error);
            const messageText = (error && error.message) ? error.message : String(error);
            // Surface helpful messages for common cases
            let userMessage = `**Error:** ${messageText}`;
            if (messageText.includes('GEN_API_KEY not configured') || messageText.includes('API_KEY_MISSING')) {
                userMessage = "**Error:** API Key not configured. Open Settings and add your Google Gemini API Key.";
            } else if (messageText.includes('Proxy API Error')) {
                userMessage = `**Error:** Server proxy error: ${messageText}`;
            }
            // Update API status indicator
            try { if (dom.apiStatusLight) dom.apiStatusLight.className = 'status-light-red'; } catch (e) {}
            addMessageToChat({ role: 'model', text: userMessage });
        } finally {
            setUiLoading(false);
        }
    }

    function processAndFillScript(scriptJSON) {
        try {
            // Helper: attempt to locate a scenes array inside various shapes of JSON
            function findScenes(obj) {
                if (!obj || typeof obj !== 'object') return null;
                if (Array.isArray(obj.scenes) && obj.scenes.length > 0) return obj.scenes;
                // support objects where scenes is an object with numeric keys
                if (obj.scenes && typeof obj.scenes === 'object' && !Array.isArray(obj.scenes)) {
                    const arr = Object.values(obj.scenes).filter(Boolean);
                    if (arr.length > 0) return arr;
                }
                // search nested properties for an array that looks like scenes
                for (const key of Object.keys(obj)) {
                    const val = obj[key];
                    if (Array.isArray(val) && val.length > 0) return val;
                    if (val && typeof val === 'object') {
                        const found = findScenes(val);
                        if (found) return found;
                    }
                }
                return null;
            }

            let scenes = null;
            if (scriptJSON && Array.isArray(scriptJSON.scenes) && scriptJSON.scenes.length) scenes = scriptJSON.scenes;
            else scenes = findScenes(scriptJSON);

            if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
                throw new Error('Invalid or empty scenes array in JSON.');
            }

            // Helper: normalize scene to text by checking many possible keys
            const getUniversalSceneText = (scene) => {
                if (!scene) return '';
                // If the scene is a plain string
                if (typeof scene === 'string') return scene.trim();
                // Common keys to check
                const candidates = [
                    'script_burmese', 'script', 'script_mm', 'script_bm',
                    'dialogue_burmese', 'dialogue', 'text', 'lines', 'body', 'content'
                ];
                for (const key of candidates) {
                    if (typeof scene[key] === 'string' && scene[key].trim()) return scene[key].trim();
                    if (Array.isArray(scene[key])) {
                        // array of lines or objects
                        return scene[key].map(item => (typeof item === 'string' ? item : (item.line || item.text || '') )).join(' ').trim();
                    }
                }
                // If it's an object with nested dialogue array
                if (Array.isArray(scene.dialogue)) {
                    return scene.dialogue.map(item => (typeof item === 'string' ? item : (item.line || item.text || ''))).join(' ').trim();
                }
                // If it's an object with any string values, join them
                const strings = Object.values(scene).filter(v => typeof v === 'string' && v.trim());
                if (strings.length) return strings.join(' ').trim();
                return '';
            };

            let hook = '', body = '', cta = '';
            if (scenes.length === 1) {
                hook = getUniversalSceneText(scenes[0]);
            } else if (scenes.length === 2) {
                hook = getUniversalSceneText(scenes[0]);
                cta = getUniversalSceneText(scenes[1]);
            } else {
                hook = getUniversalSceneText(scenes[0]);
                cta = getUniversalSceneText(scenes[scenes.length - 1]);
                body = scenes.slice(1, -1).map(getUniversalSceneText).filter(Boolean).join('\n\n').trim();
            }

            // As a fallback, if no parts were extracted, try to locate any large string in the JSON and split
            if (!hook && !body && !cta) {
                // find the longest string value in the object
                function findLongestString(o) {
                    let longest = '';
                    if (typeof o === 'string') return o;
                    if (Array.isArray(o)) {
                        for (const it of o) {
                            const s = findLongestString(it);
                            if (s.length > longest.length) longest = s;
                        }
                        return longest;
                    }
                    if (o && typeof o === 'object') {
                        for (const v of Object.values(o)) {
                            const s = findLongestString(v);
                            if (s && s.length > longest.length) longest = s;
                        }
                    }
                    return longest;
                }
                const long = findLongestString(scriptJSON).trim();
                if (long) {
                    // split into three roughly equal parts as fallback
                    const parts = long.split('\n\n');
                    hook = parts[0] || long.slice(0, 120);
                    body = parts.slice(1, -1).join('\n\n') || long.slice(120, 420);
                    cta = parts.slice(-1)[0] || long.slice(-120);
                }
            }

            if (!hook && !body && !cta) {
                throw new Error('Failed to extract any text from any known key in the scenes.');
            }

            dom.hookInput.value = hook;
            dom.bodyInput.value = body;
            dom.ctaInput.value = cta;

            showView('editor');

            const nextStepMessage = 'The first draft is ready in the Editor.';
            addMessageToChat({ role: 'model', text: nextStepMessage });
            state.chatHistory.push({ role: 'model', parts: [{ text: nextStepMessage }] });
            state.appMode = 'EDITING';

        } catch (error) {
            console.error('Error in processAndFillScript:', error);
            const recoveryMessage = 'It seems there was an error processing the script format. Please try asking again.';
            addMessageToChat({ role: 'model', text: recoveryMessage });
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
        if(dom.hookInput) dom.hookInput.value = '';
        if(dom.bodyInput) dom.bodyInput.value = '';
        if(dom.ctaInput) dom.ctaInput.value = '';
    }
    
    function openModal(modalElement) { if (modalElement) modalElement.style.display = 'block'; }
    function closeModal(modalElement) { if (modalElement) modalElement.style.display = 'none'; }

    function updateApiStatus(isKeySet) {
        if (dom.apiStatusLight) { dom.apiStatusLight.className = isKeySet ? 'status-light-green' : 'status-light-red'; }
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
        if (dom.navEditorBtn) dom.navEditorBtn.addEventListener('click', () => showView('editor'));
        if (dom.navChatBtn) dom.navChatBtn.addEventListener('click', () => showView('chat'));
        if (dom.sendChatBtn) dom.sendChatBtn.addEventListener('click', handleSendMessage);
        if (dom.chatInput) dom.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
        });
        if (dom.newScriptBtn) dom.newScriptBtn.addEventListener('click', () => { if (confirm("Start a new script?")) { startNewScriptWorkflow(); } });
        if (dom.saveScriptBtn) dom.saveScriptBtn.addEventListener('click', () => {
             const title = prompt("Script Title:");
            if (title) { saveScript({ id: Date.now(), title, hook: dom.hookInput.value, body: dom.bodyInput.value, cta: dom.ctaInput.value }); }
        });
        if (dom.copyScriptBtn) dom.copyScriptBtn.addEventListener('click', () => {
            const fullScript = `[Hook]\n${dom.hookInput.value}\n\n[Body]\n${dom.bodyInput.value}\n\n[CTA]\n${dom.ctaInput.value}`;
            navigator.clipboard.writeText(fullScript).then(() => alert("Script copied!"));
        });
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
        if (dom.myScriptsBtn) dom.myScriptsBtn.addEventListener('click', () => { renderScriptVault(); openModal(dom.scriptVaultModal); });
        if (dom.saveApiKeyBtn) dom.saveApiKeyBtn.addEventListener('click', () => {
            const key = dom.apiKeyInput.value.trim();
            if (key) { saveApiKey(key); updateApiStatus(true); updateApiKeySettingsUI(true); closeModal(dom.settingsModal); }
        });
        if (dom.deleteApiKeyBtn) dom.deleteApiKeyBtn.addEventListener('click', () => { if (confirm("Delete API Key?")) { deleteApiKey(); updateApiStatus(false); updateApiKeySettingsUI(false); } });
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
        document.querySelectorAll('.close-btn').forEach(btn => { btn.addEventListener('click', () => closeModal(btn.closest('.modal'))); });
        if (dom.closeWelcomeBtn) dom.closeWelcomeBtn.addEventListener('click', () => { closeModal(dom.welcomeModal); setWelcomeGuideSeen(); });
        window.addEventListener('click', (event) => { if (event.target.classList.contains('modal')) { closeModal(event.target); } });
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
                if (confirm('Delete this script?')) { deleteScript(scriptId); renderScriptVault(); }
            }
        });
    }

    function initialize() {
        bindEventListeners();
        bindVaultActions();
        const existingKey = getApiKey();
        updateApiStatus(!!existingKey);
        updateApiKeySettingsUI(!!existingKey);
        initializeHookBank();
        startNewScriptWorkflow();
        updateNav();
        showWelcomeGuideIfNeeded();
    }

    initialize();
}