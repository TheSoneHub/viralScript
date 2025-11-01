// /assets/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // ===================================================================
    //  1. DOM ELEMENT SELECTION
    // ===================================================================
    // All interactive elements on the page are selected here for easy access.

    // --- Settings & API ---
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    const deleteApiKeyBtn = document.getElementById('delete-api-key-btn');
    const apiStatusLight = document.getElementById('api-status');

    // --- Editor Panel ---
    const copyScriptBtn = document.getElementById('copy-script-btn');
    const hookInput = document.getElementById('hook-input');
    const bodyInput = document.getElementById('body-input');
    const ctaInput = document.getElementById('cta-input');

    // --- Pre-Writing Setup ---
    const contentGoalSelect = document.getElementById('content-goal');
    const targetAudienceSelect = document.getElementById('target-audience');
    const platformFitSelect = document.getElementById('platform-fit');

    // --- Hook Bank ---
    const hookBankBtn = document.getElementById('hook-bank-btn');
    const hookBankModal = document.getElementById('hook-bank-modal');
    const closeHookModalBtn = document.getElementById('close-hook-modal-btn');
    const hookBankList = document.getElementById('hook-bank-list');

    // --- AI Chat Panel ---
    const aiChatHistory = document.getElementById('ai-chat-history');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat-btn');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const aiPersonalitySelect = document.getElementById('ai-personality');
    const quickActionBtns = document.querySelectorAll('.quick-action-btn');

    // --- Live Analysis Engine ---
    const liveAnalysisBox = document.getElementById('live-analysis-box');
    const analysisStatus = document.getElementById('analysis-status');
    const analysisContent = document.getElementById('analysis-content');
    let debounceTimer;

    // ===================================================================
    //  2. APPLICATION STATE
    // ===================================================================
    // Variables that hold the application's "memory".

    let chatHistory = [];
    const welcomeMsg = {
        role: 'model',
        text: 'ကြိုဆိုပါတယ်။ ကျွန်တော်က **ViralScript Creative Coach** ပါ။ သင့် short-form content script တွေ viral ဖြစ်အောင် ကူညီဖို့ အဆင်သင့်ပါပဲ။ Script တစ်ခုလုံးကို သုံးသပ်ခိုင်းမလား၊ ဒါမှမဟုတ် Hook idea အသစ်တွေ တောင်းမလား?'
    };

    // ===================================================================
    //  3. INITIALIZATION
    // ===================================================================
    // Functions that run once when the app is loaded.

    function initialize() {
        initializeApiKey();
        initializeChat();
        initializeHookBank();
        attachEventListeners();
        populateSelectOptions(); // Populate dropdowns
    }
    
    function initializeApiKey() {
        const existingKey = getApiKey();
        updateApiStatus(!!existingKey);
        if (existingKey) {
            apiKeyInput.placeholder = "API Key ထည့်သွင်းပြီးဖြစ်သည်";
        }
    }

    function initializeChat() {
        const savedHistory = getChatHistory();
        if (savedHistory && savedHistory.length > 0) {
            chatHistory = savedHistory;
            renderChatHistory();
        } else {
            chatHistory.push(welcomeMsg);
            addMessageToChat(welcomeMsg);
            saveChatHistory(chatHistory);
        }
    }

    function populateSelectOptions() {
        // This makes it easier to add more options in the future
        const options = {
            'content-goal': ['ပညာပေး', 'ဖျော်ဖြေရေး', 'ရောင်းချ', 'လှုံ့ဆော်'],
            'target-audience': ['ကျောင်းသား', 'လုပ်ငန်းရှင်', 'Content Creator', 'ဝန်ထမ်း', 'အမျိုးသမီး', 'ယေဘုယျ'],
            'platform-fit': ['TikTok', 'Facebook Reels', 'YouTube Shorts', 'အားလုံးနှင့်ကိုက်ညီ']
        };
        for (const id in options) {
            const selectElement = document.getElementById(id);
            options[id].forEach(optionText => {
                const option = document.createElement('option');
                option.value = optionText;
                option.textContent = optionText;
                selectElement.appendChild(option);
            });
        }
    }

    // ===================================================================
    //  4. UI & DOM MANIPULATION
    // ===================================================================
    // Functions focused on updating what the user sees.

    function updateApiStatus(isKeySet) {
        apiStatusLight.className = isKeySet ? 'status-light-green' : 'status-light-red';
        apiStatusLight.title = isKeySet ? 'API Key ထည့်သွင်းပြီး' : 'API Key မထည့်ရသေးပါ';
    }

    function addMessageToChat({ role, text }) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role === 'user' ? 'user-message' : 'ai-message'}`;
        messageDiv.innerHTML = marked.parse(text);
        aiChatHistory.appendChild(messageDiv);
        scrollToBottom();
    }
    
    function renderChatHistory() {
        aiChatHistory.innerHTML = '';
        chatHistory.forEach(msg => addMessageToChat(msg));
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

    // ===================================================================
    //  5. EVENT LISTENERS
    // ===================================================================
    // Centralized place for all user interaction event bindings.

    function attachEventListeners() {
        // --- Settings Modal ---
        settingsBtn.addEventListener('click', () => settingsModal.style.display = 'block');
        closeModalBtn.addEventListener('click', () => settingsModal.style.display = 'none');
        saveApiKeyBtn.addEventListener('click', handleSaveApiKey);
        deleteApiKeyBtn.addEventListener('click', handleDeleteApiKey);

        // --- Hook Bank Modal ---
        hookBankBtn.addEventListener('click', () => hookBankModal.style.display = 'block');
        closeHookModalBtn.addEventListener('click', () => hookBankModal.style.display = 'none');

        // --- Close Modals on outside click ---
        window.addEventListener('click', (event) => {
            if (event.target == settingsModal) settingsModal.style.display = 'none';
            if (event.target == hookBankModal) hookBankModal.style.display = 'none';
        });

        // --- Main Actions ---
        copyScriptBtn.addEventListener('click', handleCopyScript);
        clearChatBtn.addEventListener('click', handleClearChat);

        // --- Chat Input ---
        sendChatBtn.addEventListener('click', handleSendMessage);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
        
        // --- Live Analysis ---
        const textareas = [hookInput, bodyInput, ctaInput];
        textareas.forEach(textarea => {
            textarea.addEventListener('input', handleTextareaInput);
        });
    }

    // ===================================================================
    //  6. EVENT HANDLERS & CORE LOGIC
    // ===================================================================
    // The functions that do the actual work when an event occurs.

    function handleSaveApiKey() {
        const key = apiKeyInput.value.trim();
        if (key && key.length > 10) {
            saveApiKey(key);
            updateApiStatus(true);
            apiKeyInput.value = '';
            apiKeyInput.placeholder = "API Key အသစ်ထည့်သွင်းပြီး";
            alert('API Key ကို အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ!');
            settingsModal.style.display = 'none';
        } else {
            alert('ကျေးဇူးပြု၍ API Key အမှန်ကို ထည့်သွင်းပါ။');
        }
    }

    function handleDeleteApiKey() {
        if (confirm('API Key ကို တကယ်ဖျက်မှာလား?')) {
            deleteApiKey();
            apiKeyInput.value = '';
            apiKeyInput.placeholder = "သင်၏ API key ကို ဤနေရာတွင် ထည့်ပါ";
            updateApiStatus(false);
            alert('API Key ကို ဖယ်ရှားပြီးပါပြီ။');
        }
    }
    
    function handleClearChat() {
        if (confirm('Chat history တစ်ခုလုံးကို တကယ်ဖျက်မှာလား?')) {
            deleteChatHistory();
            chatHistory = [welcomeMsg];
            renderChatHistory();
            saveChatHistory(chatHistory);
        }
    }

    function handleCopyScript() {
        const hook = hookInput.value.trim();
        const body = bodyInput.value.trim();
        const cta = ctaInput.value.trim();
        const fullScript = `[Hook]\n${hook}\n\n[Body]\n${body}\n\n[CTA]\n${cta}`;
        
        navigator.clipboard.writeText(fullScript).then(() => {
            const buttonSpan = copyScriptBtn.querySelector('span');
            const originalText = buttonSpan.textContent;
            buttonSpan.textContent = 'Copied!';
            copyScriptBtn.style.backgroundColor = '#1dd1a1';
            setTimeout(() => {
                buttonSpan.textContent = originalText;
                copyScriptBtn.style.backgroundColor = 'var(--accent-color)';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy script: ', err);
            alert('Script ကို copy ကူးမရပါ');
        });
    }

    async function handleSendMessage() {
        const userMessageText = chatInput.value.trim();
        if (!userMessageText) return;

        const preWritingContext = `--- Content Context ---\n- Goal: ${contentGoalSelect.value}\n- Audience: ${targetAudienceSelect.value}\n- Platform: ${platformFitSelect.value}\n---`;
        const scriptContext = `\n\n--- လက်ရှိ Script ---\n🎯 Hook: ${hookInput.value.trim() || '(မရှိပါ)'}\n📝 Body: ${bodyInput.value.trim() || '(မရှိပါ)'}\n📣 CTA: ${ctaInput.value.trim() || '(မရှိပါ)'}\n---`;
        const fullUserMessage = `${preWritingContext}\n${userMessageText}\n${scriptContext}`;
        
        addMessageToChat({ role: 'user', text: userMessageText });
        chatHistory.push({ role: 'user', text: fullUserMessage });
        
        chatInput.value = '';
        chatInput.style.height = 'auto';
        showLoadingIndicator();

        const currentPersonality = aiPersonalitySelect.value;
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

    // --- Live Analysis Logic ---
    function handleTextareaInput(event) {
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
        }, 3000); // 3-second delay
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
                <div class="analysis-item"><span class="analysis-label">Strength</span> <span class="analysis-strength strength-${feedback.strength}">${feedback.strength}</span></div>
                <div class="analysis-item"><span class="analysis-label">Analysis</span> <span>${feedback.analysis}</span></div>
                <div class="analysis-item"><span class="analysis-label">Suggestion</span> <span>${feedback.suggestion}</span></div>
            `;
        } else {
            analysisStatus.textContent = 'Error';
            analysisContent.innerHTML = '<p>သုံးသပ်ချက်မရရှိနိုင်ပါ။ API key ကိုစစ်ဆေးပါ သို့မဟုတ် နောက်တစ်ကြိမ်ကြိုးစားပါ။</p>';
        }
    }

    // --- Hook Bank Logic ---
    async function initializeHookBank() {
        try {
            const response = await fetch('hooks.json');
            const categories = await response.json();
            hookBankList.innerHTML = '';
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
        } catch (error) {
            console.error("Failed to load hook bank:", error);
            hookBankList.innerHTML = "<p>Hook Bank ကို ဖွင့်ရာတွင် အမှားအယွင်း ဖြစ်ပွားပါသည်။</p>";
        }
        
        hookBankList.addEventListener('click', (event) => {
            if (event.target.classList.contains('hook-item')) {
                hookInput.value = event.target.textContent;
                hookInput.focus();
                hookBankModal.style.display = 'none';
            }
        });
    }

    // ===================================================================
    //  7. START THE APPLICATION
    // ===================================================================
    initialize();
});