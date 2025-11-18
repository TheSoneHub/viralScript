// UI helper module: safely render chat messages and provide loading state helper
export function addMessageToChat(dom, { role, text }) {
    if (!dom || !dom.chatHistoryEl) return;
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message ${role === 'user' ? 'user-message' : 'ai-message'}`;
    // Use marked to convert markdown -> HTML, then sanitize with DOMPurify
    try {
        const rawHtml = (typeof marked !== 'undefined') ? marked.parse(text || '') : (text || '');
        // DOMPurify should be loaded globally via a script tag
        if (typeof DOMPurify !== 'undefined') {
            messageDiv.innerHTML = DOMPurify.sanitize(rawHtml);
        } else {
            // Fallback: escape HTML (very conservative)
            messageDiv.textContent = text || '';
        }
    } catch (e) {
        messageDiv.textContent = text || '';
    }
    dom.chatHistoryEl.appendChild(messageDiv);
    dom.chatHistoryEl.scrollTop = dom.chatHistoryEl.scrollHeight;
}

export function setUiLoading(state, dom, isLoading) {
    if (state) state.isAwaitingResponse = isLoading;
    if (dom && dom.chatInput) dom.chatInput.disabled = isLoading;
    if (dom && dom.sendChatBtn) dom.sendChatBtn.disabled = isLoading;
    if (!dom || !dom.chatHistoryEl) return;
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
