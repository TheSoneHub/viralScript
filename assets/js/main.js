document.addEventListener('DOMContentLoaded', () => {
    // =================================================================
    // DOM ELEMENT SELECTORS
    // =================================================================
    
    // --- Settings & API ---
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const apiKeyInput = document.getElementById('api-key-input');
    const apiStatusLight = document.getElementById('api-status');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    const deleteApiKeyBtn = document.getElementById('delete-api-key-btn');
    const apiKeyEntryState = document.getElementById('api-key-entry-state');
    const apiKeyManageState = document.getElementById('api-key-manage-state');

    // --- Editor Panel ---
    const hookInput = document.getElementById('hook-input');
    const bodyInput = document.getElementById('body-input');
    const ctaInput = document.getElementById('cta-input');
    const contentGoalSelect = document.getElementById('content-goal');
    const targetAudienceSelect = document.getElementById('target-audience');
    const platformFitSelect = document.getElementById('platform-fit');
    const copyScriptBtn = document.getElementById('copy-script-btn');

    // --- Chat Panel ---
    const aiChatHistory = document.getElementById('ai-chat-history');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat-btn');
    const quickActionBtns = document.querySelectorAll('.quick-action-btn');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const aiPersonalitySelect = document.getElementById('ai-personality');

    // --- Hook Bank ---
    const hookBankBtn = document.getElementById('hook-bank-btn');
    const hookBankModal = document.getElementById('hook-bank-modal');
    const closeHookModalBtn = document.getElementById('close-hook-modal-btn');
    const hookBankList = document.getElementById('hook-bank-list');

    // --- Live Analysis ---
    const liveAnalysisBox = document.getElementById('live-analysis-box');
    const analysisStatus = document.getElementById('analysis-status');
    const analysisContent = document.getElementById('analysis-content');
    
    // =================================================================
    // APP STATE & CONFIGURATION
    // =================================================================

    let chatHistory = [];
    let debounceTimer;
    const welcomeMsg = {
        role: 'model',
        text: 'ကြိုဆိုပါတယ်။ ကျွန်တော်က **ViralScript Creative Coach** ပါ။ သင့် short-form content script တွေ viral ဖြစ်အောင် ကူညီဖို့ အဆင်သင့်ပါပဲ။ Script တစ်ခုလုံးကို သုံးသပ်ခိုင်းမလား၊ ဒါမှမဟုတ် Hook idea အသစ်တွေ တောင်းမလား?'
    };

    // =================================================================
    // INITIALIZATION
    // =================================================================

    function initialize() {
        // 1. API Key Setup
        const existingKey = getApiKey();
        updateApiStatus(!!existingKey);
        updateApiKeySettingsUI(!!existingKey);

        // 2. Chat History Setup
        const savedHistory = getChatHistory();
        if (savedHistory && savedHistory.length > 0) {
            chatHistory = savedHistory;
            renderChatHistory();
        } else {
            resetChat();
        }

        // 3. Hook Bank Setup
        initializeHookBank();
    }

    // =================================================================
    // UI MANAGEMENT FUNCTIONS
    // =================================================================

    function updateApiStatus(isKeySet) {
        apiStatusLight.className = isKeySet ? 'status-light-green' : 'status-light-red';
        apiStatusLight.title = isKeySet ? 'API Key ထည့်သွင်းပြီး' : 'API Key မထည့်ရသေးပါ';
    }

    function updateApiKeySettingsUI(isKeySet) {
        if (isKeySet) {
            apiKeyEntryState.classList.add('hidden');
            apiKeyManageState.classList.remove('hidden');
        } else {
            apiKeyEntryState.classList.remove('hidden');
            apiKeyManageState.classList.add('hidden');
            apiKeyInput.value = ''; // Ensure input is always clear when in entry state
        }
    }

    function addMessageToChat({ role, text }) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role === 'user' ? 'user-message' : 'ai-message'}`;
        messageDiv.innerHTML = marked.parse(text); // Use marked.js for Markdown
        aiChatHistory.appendChild(messageDiv);
        scrollToBottom();
    }

    function renderChatHistory() {
        aiChatHistory.innerHTML = '';
        chatHistory.forEach(msg => addMessageToChat(msg));
    }
    
    function resetChat() {
        chatHistory = [welcomeMsg];
        renderChatHistory();
        saveChatHistory(chatHistory);
    }

    function showLoadingIndicator() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'chat-message ai-message loading-indicator';
        loadingDiv.innerHTML = '<span>●</span><span>●</span><span>●</span>';
        aiChatHistory.appendChild(loadingDiv);
        scrollToBottom();
    }
    
    function removeLoadingIndicator() {
        const indicator = aiChatHistory.querySelector('.loading-indicator');
        if (indicator) indicator.remove();
    }

    function scrollToBottom() {
        aiChatHistory.scrollTop = aiChatHistory.scrollHeight;
    }

    // =================================================================
    // HOOK BANK LOGIC
    // =================================================================

    function initializeHookBank() {
        fetch('hooks.json')
            .then(response => response.json())
            .then(categories => {
                hookBankList.innerHTML = ''; // Clear existing list
                categories.forEach(category => {
                    const categoryDiv = document.createElement('div');
                    categoryDiv.className = 'hook-category';
                    categoryDiv.innerHTML = `<h3>${category.category}</h3>`;
                    category.hooks.forEach(hookText => {
                        const hookItem = document.createElement('div');
                        hookItem.className = 'hook-item';
                        hookItem.textContent = hookText;
                        categoryDiv.appendChild(hookItem);
                    });
                    hookBankList.appendChild(categoryDiv);
                });
            })
            .catch(error => {
                console.error("Failed to load hook bank:", error);
                hookBankList.innerHTML = "<p>Hook Bank ကို ဖွင့်ရာတွင် အမှားအယွင်း ဖြစ်ပွားပါသည်။</p>";
            });
    }

    // =================================================================
    // CORE AI & SCRIPTING LOGIC
    // =================================================================

    function getPreWritingContext() {
        const goal = contentGoalSelect.value;
        const audience = targetAudienceSelect.value;
        const platform = platformFitSelect.value;
        return `\n--- Content Context ---\n- **Content Goal:** ${goal}\n- **Target Audience:** ${audience}\n- **Platform:** ${platform}\n--------------------\n`;
    }

    async function handleSendMessage() {
        let userMessageText = chatInput.value.trim();
        if (!userMessageText) return;

        const preWritingContext = getPreWritingContext();
        let fullUserMessage = userMessageText;
        const currentPersonality = aiPersonalitySelect.value;

        // Automatically include script context for certain keywords
        if (userMessageText.includes('script') || userMessageText.includes('Hook') || userMessageText.includes('Body') || userMessageText.includes('CTA')) {
            const hook = hookInput.value.trim();
            const body = bodyInput.value.trim();
            const cta = ctaInput.value.trim();
            const scriptContext = `\n--- လက်ရှိ Script ---\n🎯 Hook: ${hook || '(မရှိပါ)'}\n📝 Body: ${body || '(မရှိပါ)'}\n📣 CTA: ${cta || '(မရှိပါ)'}\n---`;
            fullUserMessage = `${preWritingContext}\n${userMessageText}\n${scriptContext}`;
        } else {
            fullUserMessage = `${preWritingContext}\n${userMessageText}`;
        }
        
        // Add user message to UI (displaying original text) and history (with full context)
        addMessageToChat({ role: 'user', text: userMessageText });
        chatHistory.push({ role: 'user', text: fullUserMessage });
        
        chatInput.value = '';
        chatInput.style.height = 'auto';
        
        showLoadingIndicator();

        const aiResponseText = await generateChatResponse(chatHistory, currentPersonality);
        removeLoadingIndicator();
        
        if (aiResponseText) {
            const aiMessage = { role: 'model', text: aiResponseText };
            addMessageToChat(aiMessage);
            chatHistory.push(aiMessage);
        } else {
            addMessageToChat({ role: 'model', text: 'တောင်းပန်ပါတယ်။ အမှားအယွင်းတစ်ခု ဖြစ်ပွားနေပါတယ်။ API Key မှန်မမှန် သို့မဟုတ် အင်တာနက်ချိတ်ဆက်မှုကို စစ်ဆေးပေးပါ။' });
        }
        
        saveChatHistory(chatHistory);
    }

    async function handleLiveAnalysis(text, context) {
        analysisStatus.textContent = 'သုံးသပ်နေသည်...';
        analysisStatus.classList.add('analyzing');
        analysisContent.innerHTML = '';

        const feedback = await generateLiveFeedback(text, context);

        analysisStatus.classList.remove('analyzing');

        if (feedback) {
            analysisStatus.textContent = 'Ready';
            analysisContent.innerHTML = `
                <div class="analysis-item">
                    <span class="analysis-label">Strength</span>
                    <span class="analysis-strength strength-${feedback.strength}">${feedback.strength}</span>
                </div>
                <div class="analysis-item">
                    <span class="analysis-label">Analysis</span>
                    <span>${feedback.analysis}</span>
                </div>
                <div class="analysis-item">
                    <span class="analysis-label">Suggestion</span>
                    <span>${feedback.suggestion}</span>
                </div>
            `;
        } else {
            analysisStatus.textContent = 'Error';
            analysisContent.innerHTML = '<p>Could not get analysis. Please check API key or try again.</p>';
        }
    }

    // =================================================================
    // EVENT LISTENERS
    // =================================================================

    // --- Settings Modal ---
    settingsBtn.addEventListener('click', () => settingsModal.style.display = 'block');
    closeModalBtn.addEventListener('click', () => settingsModal.style.display = 'none');

    // --- API Key Management ---
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

    // --- Hook Bank Modal ---
    hookBankBtn.addEventListener('click', () => hookBankModal.style.display = 'block');
    closeHookModalBtn.addEventListener('click', () => hookBankModal.style.display = 'none');
    hookBankList.addEventListener('click', (event) => {
        if (event.target.classList.contains('hook-item')) {
            hookInput.value = event.target.textContent;
            hookInput.focus();
            hookBankModal.style.display = 'none';
        }
    });

    // --- Close Modals on Outside Click ---
    window.addEventListener('click', (event) => {
        if (event.target == settingsModal) settingsModal.style.display = 'none';
        if (event.target == hookBankModal) hookBankModal.style.display = 'none';
    });

    // --- Chat Functionality ---
    sendChatBtn.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    quickActionBtns.forEach(btn => {
       btn.addEventListener('click', () => {
           chatInput.value = btn.getAttribute('data-prompt');
           chatInput.focus();
           handleSendMessage();
       });
    });
    clearChatBtn.addEventListener('click', () => {
        if (confirm('Chat history တစ်ခုလုံးကို တကယ်ဖျက်မှာလား?')) {
            deleteChatHistory();
            resetChat();
        }
    });
    chatInput.addEventListener('input', () => { // Auto-resize textarea
        chatInput.style.height = 'auto';
        chatInput.style.height = (chatInput.scrollHeight) + 'px';
    });

    // --- Script Editor ---
    copyScriptBtn.addEventListener('click', () => {
        const fullScript = `[Hook]\n${hookInput.value.trim()}\n\n[Body]\n${bodyInput.value.trim()}\n\n[CTA]\n${ctaInput.value.trim()}`;
        navigator.clipboard.writeText(fullScript).then(() => {
            const originalText = copyScriptBtn.querySelector('span').textContent;
            copyScriptBtn.querySelector('span').textContent = 'Copied!';
            copyScriptBtn.style.backgroundColor = '#1dd1a1';
            setTimeout(() => {
                copyScriptBtn.querySelector('span').textContent = originalText;
                copyScriptBtn.style.backgroundColor = 'var(--accent-color)';
            }, 2000);
        });
    });

    // --- Live Analysis ---
    [hookInput, bodyInput, ctaInput].forEach(textarea => {
        textarea.addEventListener('input', (event) => {
            clearTimeout(debounceTimer);
            const text = event.target.value.trim();
            const context = event.target.id.replace('-input', '');
            
            if (text.length < 20) {
                liveAnalysisBox.classList.remove('active');
                return;
            }

            liveAnalysisBox.classList.add('active');
            analysisStatus.textContent = 'စာရိုက်နေဆဲ...';
            analysisStatus.classList.remove('analyzing');
            
            debounceTimer = setTimeout(() => {
                handleLiveAnalysis(text, context);
            }, 4000);
        });
    });

    // =================================================================
    // START THE APP
    // =================================================================
    
    initialize();
});