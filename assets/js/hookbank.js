// /assets/js/hookbank.js

// This function initializes the entire Hook Bank feature
function initializeHookBank() {
    const hookBankList = document.getElementById('hook-bank-list');
    const hookInput = document.getElementById('hook-input');

    if (!hookBankList || !hookInput) {
        console.error("Hook Bank elements not found in the DOM.");
        return;
    }

    // 1. Fetch and render the hooks
    fetchAndRenderHooks(hookBankList);

    // 2. Add a single event listener to the container (Event Delegation)
    hookBankList.addEventListener('click', (event) => {
        const clickedItem = event.target.closest('.hook-item');
        if (clickedItem) {
            const selectedHook = clickedItem.textContent;
            hookInput.value = selectedHook; // Insert into hook textarea
            hookInput.focus(); // Focus on the textarea
            
            // Add a subtle animation to show it's been copied
            hookInput.style.transition = 'all 0.1s ease-in-out';
            hookInput.style.transform = 'scale(1.02)';
            setTimeout(() => {
                hookInput.style.transform = 'scale(1)';
            }, 100);
        }
    });
}

// Helper function to fetch data from hooks.json and build the HTML
async function fetchAndRenderHooks(container) {
    try {
        const response = await fetch('hooks.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const categories = await response.json();
        
        container.innerHTML = ''; // Clear existing list
        
        categories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'hook-category';
            
            const categoryTitle = document.createElement('h3');
            categoryTitle.textContent = category.category;
            categoryDiv.appendChild(categoryTitle);
            
            category.hooks.forEach(hookText => {
                const hookItem = document.createElement('div');
                hookItem.className = 'hook-item';
                hookItem.textContent = hookText;
                categoryDiv.appendChild(hookItem);
            });
            
            container.appendChild(categoryDiv);
        });
        
    } catch (error) {
        console.error("Failed to load hook bank:", error);
        container.innerHTML = `<p style="color: var(--danger-color);">Hook Bank ကို ဖွင့်မရပါ။ hooks.json file ကို စစ်ဆေးပါ။</p>`;
    }
}