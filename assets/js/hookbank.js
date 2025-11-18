// /assets/js/hookbank.js

/**
 * Initializes the inspiration bank modals (Hook Bank, CTA Bank).
 * This function fetches the corresponding JSON data and sets up the necessary
 * event listeners for populating the script editor.
 */
function initializeHookBank() {
    // --- Configuration for all inspiration banks ---
    const banks = [
        {
            listEl: document.getElementById('hook-bank-list'),
            targetTextarea: document.getElementById('hook-input'),
            modalEl: document.getElementById('hook-bank-modal'),
            jsonFile: 'hooks.json',
            dataKey: 'hooks',
        },
        {
            listEl: document.getElementById('cta-bank-list'),
            targetTextarea: document.getElementById('cta-input'),
            modalEl: document.getElementById('cta-bank-modal'),
            jsonFile: 'cta_bank.json',
            dataKey: 'ctas',
        }
    ];

    // --- Generic function to fetch and render data ---
    const fetchAndRender = async (bank) => {
        try {
            // Try flexible fetch paths to support file:// and subpath hosting
            const tryPaths = async (fileName) => {
                const candidates = [fileName, `./${fileName}`, `/${fileName}`];
                try {
                    const baseDir = location.origin + location.pathname.replace(/\/[^\/]*$/, '/');
                    candidates.push(baseDir + fileName);
                } catch (e) {}
                for (const p of candidates) {
                    try {
                        const r = await fetch(p);
                        if (!r.ok) continue;
                        return await r.json();
                    } catch (e) {
                        // continue to next
                    }
                }
                throw new Error(`Could not fetch ${fileName}`);
            };

            const categories = await tryPaths(bank.jsonFile);

            bank.listEl.innerHTML = ''; // Clear previous content
            
            categories.forEach(category => {
                const categoryDiv = document.createElement('div');
                categoryDiv.className = 'hook-category';
                categoryDiv.innerHTML = `<h3>${category.category}</h3>`;
                
                category[bank.dataKey].forEach(itemText => {
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'hook-item';
                    itemDiv.textContent = itemText;
                    categoryDiv.appendChild(itemDiv);
                });
                bank.listEl.appendChild(categoryDiv);
            });

        } catch (error) {
            console.error(`Failed to load inspiration bank from ${bank.jsonFile}:`, error);
            bank.listEl.innerHTML = `<p style="color: var(--danger-color);">Inspiration Bank could not be loaded. Ensure you are running a local server or that ${bank.jsonFile} is reachable.</p>`;
        }
    };

    // /assets/js/hookbank.js

// ... (The top part of the file remains the same) ...

    // --- Generic function to handle item selection ---
    const handleSelection = (bank, event) => {
        const clickedItem = event.target.closest('.hook-item');
        if (clickedItem) {
            const selectedText = clickedItem.textContent;
            
            // --- NEW LOGIC: Target the main chat input instead ---
            const mainChatInput = document.getElementById('chat-input');
            
            // Construct a command-like message for the AI
            mainChatInput.value = `Use this as the new ${bank.dataKey.replace('s', '')}: "${selectedText}"`;
            mainChatInput.focus();
            
            // Close the modal after selection
            bank.modalEl.style.display = 'none';
            
            // Visual feedback for the chat input
            mainChatInput.style.transition = 'all 0.1s ease-in-out';
            mainChatInput.style.transform = 'scale(1.02)';
            setTimeout(() => {
                mainChatInput.style.transform = 'scale(1)';
            }, 150);
        }
    };
    
// ... (The rest of the file remains the same) ...
    // --- Initialize each bank ---
    banks.forEach(bank => {
        if (bank.listEl && bank.targetTextarea && bank.modalEl) {
            fetchAndRender(bank);
            bank.listEl.addEventListener('click', (event) => handleSelection(bank, event));
        } else {
            console.error(`Elements for an inspiration bank are missing. Check IDs in index.html.`);
        }
    });
}