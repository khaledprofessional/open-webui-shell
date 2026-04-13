/**
 * Utility function to sanitize CSS strings against basic XSS vectors.
 * This is an imperfect solution but mitigates common XSS vectors in CSS properties.
 * @param {string} css - The raw CSS string to sanitize.
 * @returns {string} The sanitized CSS.
 */
function sanitizeCSS(css) {
    if (!css) return '';
    // 1. Remove all script/style tags
    let sanitized = css.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, "");
    sanitized = sanitized.replace(/<\s*\/style\s*>/gim, "");
    // 2. Basic filtering for potentially dangerous URLs (e.g., 'url("javascript:...")')
    sanitized = sanitized.replace(/(url\([\'"]?)(javascript:\s*[^)]+)[\'"]?\)/gi, "url('fallback-value')");
    return sanitized;
}

module.exports = { sanitizeCSS };