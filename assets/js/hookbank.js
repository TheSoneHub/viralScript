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
            const response = await fetch(bank.jsonFile);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const categories = await response.json();

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
            bank.listEl.innerHTML = `<p style="color: var(--danger-color);">Inspiration Bank could not be loaded.</p>`;
        }
    };

    // --- Generic function to handle item selection ---
    const handleSelection = (bank, event) => {
        const clickedItem = event.target.closest('.hook-item');
        if (clickedItem) {
            const selectedText = clickedItem.textContent;
            bank.targetTextarea.value = selectedText;
            bank.targetTextarea.focus();
            
            // Close the modal after selection
            bank.modalEl.style.display = 'none';
            
            // Visual feedback
            bank.targetTextarea.style.transition = 'all 0.1s ease-in-out';
            bank.targetTextarea.style.transform = 'scale(1.02)';
            setTimeout(() => {
                bank.targetTextarea.style.transform = 'scale(1)';
            }, 150);
        }
    };

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