// /assets/js/main.js
// This is the main orchestration file for the ViralScript application.
// It handles UI interactions, state management, and coordinates between the storage and AI modules.

document.addEventListener('DOMContentLoaded', () => {
    // === 1. DOM ELEMENT DECLARATIONS ===
    
    // Workspace & Drafts Elements
    const draftsListEl = document.getElementById('drafts-list');
    const newDraftBtn = document.getElementById('new-draft-btn');
    const saveDraftBtn = document.getElementById('save-draft-btn');
    const copyScriptBtn = document.getElementById('copy-script-btn');
    const scriptTitleEl = document.getElementById('script-title');

    // Editor Elements
    const hookInput = document.getElementById('hook-input');
    const bodyInput = document.getElementById('body-input');
    const ctaInput = document.getElementById('cta-input');

    // AI Chat Elements
    const chatHistoryEl = document.getElementById('ai-chat-history');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat-btn');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const aiPersonalitySelect = document.getElementById('ai-personality');

    // Modal & Bank Elements
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    
    const hookBankBtn = document.getElementById('hook-bank-btn');
    const hookBankModal = document.getElementById('hook-bank-modal');
    const closeHookModalBtn = document.getElementById('close-hook-modal-btn');
    const hookBankListEl = document.getElementById('hook-bank-list');
    
    const ctaBankBtn = document.getElementById('cta-bank-btn');
    const ctaBankModal = document.getElementById('cta-bank-modal');
    const closeCtaModalBtn = document.getElementById('close-cta-modal-btn');
    const ctaBankListEl = document.getElementById('cta-bank-list');

    // API Key Management Elements
    const apiKeyInput = document.getElementById('api-key-input');
    const apiStatusLight = document.getElementById('api-status');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    const deleteApiKeyBtn = document.getElementById('delete-api-key-btn');
    const apiKeyEntryState = document.getElementById('api-key-entry-state');
    const apiKeyManageState = document.getElementById('api-key-manage-state');


    // === 2. APPLICATION STATE ===

    let activeDraft = null; // Holds the currently active draft object {id, name, script, chatHistory}
    let appState = 'IDLE'; // Can be 'IDLE', 'DISCOVERY', or 'EDITING'
    let discoveryStep = 0;
    let discoveryData = {}; // Temporarily holds answers during discovery

    const discoveryQuestions = [
        { 
            key: 'topic', 
            question: "သင်ဖန်တီးချင်တဲ့ short content ရဲ့ အဓိကအကြောင်းအရာ (Topic) က ဘာဖြစ်မလဲ?",
            explanation: "ဒါက သင့် video ရဲ့ အဓိက core idea ပါ။ တိကျလေ ကောင်းလေပါပဲ။",
            examples: `ဥပမာ: 'Canva သုံးပြီး logo အလွယ်ဆွဲနည်း', 'အိပ်ရေးဝအောင် အိပ်စက်နည်း', 'Freelancer တစ်ယောက်ရဲ့ တစ်နေ့တာ'`
        },
        { 
            key: 'objective', 
            question: "ဒီ content ကနေ ဘယ်လိုရည်မှန်းချက်မျိုး လိုချင်တာလဲ?",
            explanation: "Video တစ်ခုချင်းစီမှာ တိကျတဲ့ ရည်မှန်းချက်တစ်ခု ရှိသင့်ပါတယ်။",
            examples: `ဥပမာ: 'ပညာပေး (Educate)', 'ရောင်းချ (Sell)', 'ဖျော်ဖြေရေး (Entertain)', 'လှုံ့ဆော် (Inspire)'`
        },
        { 
            key: 'audience', 
            question: "ဒီ content ကို ဘယ်သူတွေ အဓိကကြည့်စေချင်တာလဲ?",
            explanation: "သင်ဘယ်သူ့ကို စကားပြောနေလဲဆိုတာ သိခြင်းက အရေးကြီးဆုံးပါ။",
            examples: `ဥပမာ: 'ကျောင်းသား', 'လုပ်ငန်းရှင်', 'Content Creator', 'အိမ်ထောင်ရှင်မ'`
        },
        { 
            key: 'problem', 
            question: "ဒီ content မှာ ကြည့်ရှုသူရဲ့ ဘယ်လို 'နာကျင်မှု' (Pain Point) ကို ဖြေရှင်းပေးမှာလဲ?",
            explanation: "ကောင်းတဲ့ content တိုင်းက ပြဿနာတစ်ခုကို ဖြေရှင်းပေး ဒါမှမဟုတ် ဆန္ဒတစ်ခုကို ဖြည့်ဆည်းပေးပါတယ်။",
            examples: `ဥပမာ: 'အချိန်မရှိတာ', 'ပိုက်ဆံမစုမိတာ', 'Content idea မစဉ်းစားတတ်တာ'`
        },
        { 
            key: 'value', 
            question: "အဲ့ဒီပြဿနာကို ဖြေရှင်းဖို့ ဘယ်လို 'တန်ဖိုး' ဒါမှမဟုတ် 'ဖြေရှင်းချက်' (Solution) ကို ပေးမှာလဲ?",
            explanation: "ဒါက သင့်ရဲ့ video ရဲ့ အဓိက အနှစ်သာရပါ။",
            examples: `ဥပမာ: 'အချိန်ကို စီမံခန့်ခွဲဖို့ 5-minute rule', 'လစာထဲက 10% ကို အရင်ဆုံးဖယ်ထားတဲ့ နည်းလမ်း'`
        },
        { 
            key: 'hookType', 
            question: "ဘယ်လို Hook အမျိုးအစားကို သုံးချင်ပါသလဲ?",
            explanation: "Hook က ကြည့်ရှုသူကို ဆက်ကြည့်ချင်စိတ်ဖြစ်အောင် ဖမ်းစားရမယ့်အရာပါ။ (Hook Bank ကို ဖွင့်ပြီး idea ယူနိုင်ပါတယ်)",
            examples: `ဥပမာ: 'သိချင်စိတ်နှိုးဆွတဲ့ Hook', 'နာကျင်မှုကို အခြေခံတဲ့ Hook', 'Storytelling Hook'`
        },
        { 
            key: 'cta', 
            question: "Video အဆုံးမှာ ကြည့်ရှုသူကို ဘာလုပ်စေချင်တာလဲ? (Call to Action)",
            explanation: "ကြည့်ရှုသူကို တိကျတဲ့ လမ်းညွှန်မှုတစ်ခုပေးပါ။ (CTA Bank ကို ဖွင့်ပြီး idea ယူနိုင်ပါတယ်)",
            examples: `ဥပမာ: 'Follow လုပ်ခိုင်းတာ', 'Comment မှာ မေးခွန်းမေးခိုင်းတာ', 'Profile က link ကို ဝင်ကြည့်ခိုင်းတာ'`
        },
        {
            key: 'platform',
            question: "Video ကို ဘယ် platform မှာ အဓိကတင်မှာလဲ?",
            explanation: "Platform တစ်ခုချင်းစီရဲ့ ပုံစံက မတူညီတဲ့အတွက် AI က အကြံဉာဏ်ပေးရာမှာ ထည့်သွင်းစဉ်းစားပါလိမ့်မယ်။",
            examples: `"ဥပမာ: 'TikTok', 'Facebook Reels', 'YouTube Shorts'"`
        },
        {
            key: 'duration',
            question: "Video duration ကို ဘယ်လောက်ကြာစေချင်လဲ?",
            explanation: "ဒါက script ရဲ့ အတိုအရှည်နဲ့ အရှိန်အဟုန်ကို သက်ရောက်မှုရှိပါတယ်။",
            examples: `"ဥပမာ: '30 seconds', '60 seconds', '90 seconds'"`
        }
    ];

    // === 3. INITIALIZATION ===

    function initialize() {
        const hasApiKey = !!getApiKey();
        updateApiStatus(hasApiKey);
        updateApiKeySettingsUI(hasApiKey);
        
        renderDraftsList();
        loadInitialDraft();
        
        initializeHookBank();
        initializeCtaBank();
        
        addEventListeners();
    }

    // === 4. DRAFT & WORKSPACE MANAGEMENT ===

    function renderDraftsList() {
        const drafts = getAllDrafts();
        draftsListEl.innerHTML = ''; // Clear the current list
        if (drafts.length === 0) {
            draftsListEl.innerHTML = '<p class="empty-drafts-msg">သင်၏ script idea များကို ဤနေရာတွင် တွေ့ရပါမည်။</p>';
            return;
        }

        drafts.forEach(draft => {
            const draftItem = document.createElement('div');
            draftItem.className = 'draft-item';
            draftItem.dataset.id = draft.id;
            
            const draftNameSpan = document.createElement('span');
            draftNameSpan.textContent = draft.name;
            draftItem.appendChild(draftNameSpan);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-draft-btn';
            deleteBtn.innerHTML = '&times;';
            deleteBtn.title = "Delete this draft";
            deleteBtn.dataset.id = draft.id;
            draftItem.appendChild(deleteBtn);

            if (activeDraft && draft.id === activeDraft.id) {
                draftItem.classList.add('active');
            }
            draftsListEl.appendChild(draftItem);
        });
    }

    function loadInitialDraft() {
        const drafts = getAllDrafts();
        if (drafts.length > 0) {
            // Load the most recent draft first
            loadDraft(drafts[drafts.length - 1].id);
        } else {
            createNewDraft();
        }
    }

    function createNewDraft() {
        activeDraft = {
            id: Date.now(),
            name: "Untitled Script",
            script: { hook: "", body: "", cta: "" },
            chatHistory: []
        };
        saveDraft(activeDraft); // Save it immediately
        renderDraftsList();
        updateUIFromDraft();
        startDiscoverySession();
    }

    function loadDraft(draftId) {
        const draft = getDraftById(draftId);
        if (draft) {
            activeDraft = draft;
            updateUIFromDraft();
            
            // If the script is empty, it's a new draft that needs discovery.
            if (!activeDraft.script.hook && !activeDraft.script.body && !activeDraft.script.cta) {
                startDiscoverySession();
            } else {
                appState = 'EDITING';
                chatInput.placeholder = "Script ကို ပြင်ဆင်ရန် ဤနေရာတွင် ရေးပါ...";
            }
        } else {
            console.error(`Draft with ID ${draftId} not found.`);
            loadInitialDraft(); // Fallback to a safe state
        }
    }

    function saveActiveDraft() {
        if (!activeDraft) return;

        const draftName = prompt("Enter a name for this draft:", activeDraft.name);
        if (draftName && draftName.trim() !== "") {
            activeDraft.name = draftName.trim();
            activeDraft.script.hook = hookInput.value;
            activeDraft.script.body = bodyInput.value;
            activeDraft.script.cta = ctaInput.value;
            // activeDraft.chatHistory is already kept up-to-date
            
            saveDraft(activeDraft);
            renderDraftsList();
            updateUIFromDraft();
            alert(`'${activeDraft.name}' ကို သိမ်းဆည်းပြီးပါပြီ။`);
        }
    }
    
    function handleDeleteDraft(draftId) {
        const draftToDelete = getDraftById(draftId);
        if (confirm(`'${draftToDelete.name}' ကို တကယ်ဖျက်မှာလား?`)) {
            deleteDraftById(draftId);
            // If the deleted draft was the active one, load the initial/next draft
            if (activeDraft && activeDraft.id === draftId) {
                loadInitialDraft();
            }
            renderDraftsList();
        }
    }

    // === 5. AI CONSULTATION & SCRIPTING LOGIC ===
    
    function startDiscoverySession() {
        if (appState === 'DISCOVERY' && activeDraft.chatHistory.length > 0) return; // Don't restart if already in progress

        appState = 'DISCOVERY';
        discoveryStep = 0;
        discoveryData = {};
        
        // Clear editor but not chat history for context
        hookInput.value = "";
        bodyInput.value = "";
        ctaInput.value = "";
        activeDraft.script = { hook: "", body: "", cta: "" };

        const firstQuestion = discoveryQuestions[discoveryStep];
        const firstMessage = { 
            role: 'model', 
            text: `${firstQuestion.question}\n\n*${firstQuestion.explanation}*\n\n**${firstQuestion.examples}**`
        };

        // Start with a clean slate for discovery chat
        activeDraft.chatHistory = [firstMessage];
        renderChatHistory(activeDraft.chatHistory);
        chatInput.placeholder = "AI ၏ မေးခွန်းကို ဖြေကြားပါ...";
    }

    async function handleSendMessage() {
        const userMessageText = chatInput.value.trim();
        if (!userMessageText) return;

        toggleSendButton(false);
        addMessageToChat({ role: 'user', text: userMessageText });
        chatInput.value = '';
        chatInput.style.height = 'auto';

        if (appState === 'DISCOVERY') {
            // Store the answer
            discoveryData[discoveryQuestions[discoveryStep].key] = userMessageText;
            discoveryStep++;

            if (discoveryStep < discoveryQuestions.length) {
                // Ask the next question
                const nextQuestion = discoveryQuestions[discoveryStep];
                const nextMessage = { 
                    role: 'model', 
                    text: `${nextQuestion.question}\n\n*${nextQuestion.explanation}*\n\n**${nextQuestion.examples}**`
                };
                addMessageToChat(nextMessage);
            } else {
                // All questions answered, generate the script
                await generateFinalScript();
            }
        } else if (appState === 'EDITING') {
            await handleEditRequest(userMessageText);
        }
        
        toggleSendButton(true);
    }
    
    async function generateFinalScript() {
        const generatingMessage = { role: 'model', text: 'အချက်အလက်များ ရရှိပါပြီ။ သင်၏ script ကို ခဏအကြာ ဖန်တီးပေးနေပါသည်... 🚀' };
        addMessageToChat(generatingMessage);
        setInputsReadOnly(true);

        const scriptJSON = await generateScriptFromDiscovery(discoveryData);
        
        if (scriptJSON && scriptJSON.hook) {
            hookInput.value = scriptJSON.hook;
            bodyInput.value = scriptJSON.body;
            ctaInput.value = scriptJSON.cta;
            
            const successMessage = { role: 'model', text: 'Script ဖန်တီးပြီးပါပြီ။ မကြိုက်သည့်နေရာများရှိပါက ဤနေရာတွင် ပြော၍ ပြင်ခိုင်းနိုင်ပါသည်။ (ဥပမာ: "Hook ကို ပိုပြီး aggressive ဖြစ်အောင် ပြောင်းပေး")' };
            addMessageToChat(successMessage);
            
            appState = 'EDITING';
            chatInput.placeholder = "Script ကို ပြင်ဆင်ရန် ဤနေရာတွင် ရေးပါ...";
        } else {
            const errorMessage = { role: 'model', text: 'Script ဖန်တီးရာတွင် အမှားအယွင်းဖြစ်ပွားပါသည်။ API Key ကိုစစ်ဆေးပြီး ထပ်မံကြိုးစားပါ။' };
            addMessageToChat(errorMessage);
        }
        
        setInputsReadOnly(false);
    }

    async function handleEditRequest(instruction) {
        let partToEdit = null;
        let currentText = '';
        const lowerInstruction = instruction.toLowerCase();

        if (lowerInstruction.includes('hook')) {
            partToEdit = 'hook';
            currentText = hookInput.value;
        } else if (lowerInstruction.includes('body')) {
            partToEdit = 'body';
            currentText = bodyInput.value;
        } else if (lowerInstruction.includes('cta') || lowerInstruction.includes('action')) {
            partToEdit = 'cta';
            currentText = ctaInput.value;
        }

        if (partToEdit) {
            const thinkingMessage = { role: 'model', text: `"${partToEdit}" အပိုင်းကို ပြင်ဆင်နေပါသည်...` };
            addMessageToChat(thinkingMessage);
            
            const revisedText = await reviseScriptPart(partToEdit, currentText, instruction);
            
            if (revisedText) {
                document.getElementById(`${partToEdit}-input`).value = revisedText;
                const successMessage = { role: 'model', text: `"${partToEdit}" ကို ပြင်ဆင်ပြီးပါပြီ။` };
                addMessageToChat(successMessage);
            } else {
                const errorMessage = { role: 'model', text: `"${partToEdit}" ကို ပြင်ဆင်ရာတွင် အမှားအယွင်း ဖြစ်ပွားပါသည်။` };
                addMessageToChat(errorMessage);
            }
        } else {
            const clarificationMessage = { role: 'model', text: 'ဘယ်အပိုင်းကို ပြင်လိုသည်ဖြစ်ကြောင်း တိတိကျကျ ပြောပေးပါ။ (Hook, Body, CTA)' };
            addMessageToChat(clarificationMessage);
        }
    }


    // === 6. UI HELPER FUNCTIONS ===

    function updateUIFromDraft() {
        if (!activeDraft) return;
        scriptTitleEl.textContent = activeDraft.name;
        hookInput.value = activeDraft.script.hook;
        bodyInput.value = activeDraft.script.body;
        ctaInput.value = activeDraft.script.cta;
        renderChatHistory(activeDraft.chatHistory);
        renderDraftsList(); // Re-render to update the 'active' class
    }

    function addMessageToChat(message) {
        if (!activeDraft || !message.text) return;

        // Add to state
        activeDraft.chatHistory.push(message);

        // Add to UI
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${message.role === 'user' ? 'user-message' : 'ai-message'}`;
        messageDiv.innerHTML = marked.parse(message.text);
        chatHistoryEl.appendChild(messageDiv);
        chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
    }
    
    function renderChatHistory(history) {
        chatHistoryEl.innerHTML = '';
        if (!history) return;
        history.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `chat-message ${msg.role === 'user' ? 'user-message' : 'ai-message'}`;
            messageDiv.innerHTML = marked.parse(msg.text);
            chatHistoryEl.appendChild(messageDiv);
        });
        chatHistoryEl.scrollTop = chatHistoryEl.scrollHeight;
    }
    
    function setInputsReadOnly(isReadOnly) {
        hookInput.readOnly = isReadOnly;
        bodyInput.readOnly = isReadOnly;
        ctaInput.readOnly = isReadOnly;
        hookInput.style.opacity = isReadOnly ? 0.7 : 1;
        bodyInput.style.opacity = isReadOnly ? 0.7 : 1;
        ctaInput.style.opacity = isReadOnly ? 0.7 : 1;
    }
    
    function toggleSendButton(isEnabled) {
        sendChatBtn.disabled = !isEnabled;
        sendChatBtn.style.opacity = isEnabled ? 1 : 0.5;
    }

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
            apiKeyInput.value = '';
        }
    }

    // === 7. MODAL & BANK INITIALIZERS ===

    async function initializeHookBank() {
        try {
            const response = await fetch('hooks.json');
            const categories = await response.json();
            hookBankListEl.innerHTML = '';
            categories.forEach(cat => {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'hook-category';
                categoryDiv.innerHTML = `<h3>${cat.category}</h3>`;
                cat.hooks.forEach(hook => {
                    const hookItem = document.createElement('div');
                    hookItem.className = 'hook-item';
                    hookItem.textContent = hook;
                    categoryDiv.appendChild(hookItem);
                });
                hookBankListEl.appendChild(categoryDiv);
            });
        } catch (error) { console.error("Failed to load Hook Bank:", error); }
    }

    async function initializeCtaBank() {
        try {
            const response = await fetch('cta_bank.json');
            const categories = await response.json();
            ctaBankListEl.innerHTML = '';
            categories.forEach(cat => {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'hook-category';
                categoryDiv.innerHTML = `<h3>${cat.category}</h3>`;
                cat.ctas.forEach(cta => {
                    const ctaItem = document.createElement('div');
                    ctaItem.className = 'hook-item';
                    ctaItem.textContent = cta;
                    categoryDiv.appendChild(ctaItem);
                });
                ctaBankListEl.appendChild(categoryDiv);
            });
        } catch (error) { console.error("Failed to load CTA Bank:", error); }
    }


    // === 8. EVENT LISTENERS ===

    function addEventListeners() {
        // Workspace & Drafts
        newDraftBtn.addEventListener('click', createNewDraft);
        saveDraftBtn.addEventListener('click', saveActiveDraft);
        copyScriptBtn.addEventListener('click', () => {
            const fullScript = `[Hook]\n${hookInput.value}\n\n[Body]\n${bodyInput.value}\n\n[CTA]\n${ctaInput.value}`;
            navigator.clipboard.writeText(fullScript).then(() => alert('Script Copied!'));
        });
        draftsListEl.addEventListener('click', (e) => {
            const draftItem = e.target.closest('.draft-item');
            const deleteButton = e.target.closest('.delete-draft-btn');
            if (deleteButton) {
                handleDeleteDraft(Number(deleteButton.dataset.id));
            } else if (draftItem) {
                loadDraft(Number(draftItem.dataset.id));
            }
        });

        // Chat
        sendChatBtn.addEventListener('click', handleSendMessage);
        chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
            }
        });
        clearChatBtn.addEventListener('click', () => {
            if (confirm('လက်ရှိ chat history ကို ရှင်းလင်းပြီး discovery session ကို အစမှပြန်စမှာလား?')) {
                startDiscoverySession();
            }
        });

        // Modals & Banks
        settingsBtn.addEventListener('click', () => settingsModal.style.display = 'block');
        closeModalBtn.addEventListener('click', () => settingsModal.style.display = 'none');
        hookBankBtn.addEventListener('click', () => hookBankModal.style.display = 'block');
        closeHookModalBtn.addEventListener('click', () => hookBankModal.style.display = 'none');
        ctaBankBtn.addEventListener('click', () => ctaBankModal.style.display = 'block');
        closeCtaModalBtn.addEventListener('click', () => ctaBankModal.style.display = 'none');
        
        window.addEventListener('click', (event) => {
            if (event.target == settingsModal) settingsModal.style.display = 'none';
            if (event.target == hookBankModal) hookBankModal.style.display = 'none';
            if (event.target == ctaBankModal) ctaBankModal.style.display = 'none';
        });

        const bankClickHandler = (event) => {
            if (event.target.classList.contains('hook-item')) {
                const selectedText = event.target.textContent;
                chatInput.value = selectedText;
                handleSendMessage();
                hookBankModal.style.display = 'none';
                ctaBankModal.style.display = 'none';
            }
        };
        hookBankListEl.addEventListener('click', bankClickHandler);
        ctaBankListEl.addEventListener('click', bankClickHandler);
        
        // API Key Management
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
    }

    // === 9. START THE APPLICATION ===
    initialize();
});