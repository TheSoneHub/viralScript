// Lightweight parser utilities for ViralScript
export function extractJSON(text) {
    if (!text || typeof text !== 'string') return null;
    let candidate = text.trim();
    // Decode HTML and strip tags (handles <pre><code> wrappers or escaped entities)
    try {
        const tmp = typeof document !== 'undefined' ? document.createElement('div') : null;
        if (tmp) {
            tmp.innerHTML = candidate;
            candidate = (tmp.textContent || tmp.innerText || candidate).trim();
        }
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

export function parseScriptJSON(scriptJSON) {
    if (!scriptJSON || typeof scriptJSON !== 'object') return null;
    const scenes = scriptJSON.scenes;
    if (!Array.isArray(scenes) || scenes.length === 0) return null;

    const getUniversalSceneText = (scene) => {
        if (!scene) return '';
        if (typeof scene.script_burmese === 'string') return scene.script_burmese;
        if (typeof scene.dialogue_burmese === 'string') return scene.dialogue_burmese;
        if (Array.isArray(scene.dialogue)) {
            return scene.dialogue.map(item => item.line || '').join(' ').trim();
        }
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
        body = scenes.slice(1, -1).map(getUniversalSceneText).join('\n\n').trim();
    }

    return { hook, body, cta };
}

export function isValidScriptObject(obj) {
    return !!(obj && typeof obj === 'object' && Array.isArray(obj.scenes) && obj.scenes.length > 0);
}
