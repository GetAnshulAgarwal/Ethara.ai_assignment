// ─────────────────────────────────────────────────────────────
// General utility helpers
// ─────────────────────────────────────────────────────────────

/**
 * Escapes a string for safe HTML insertion.
 * Use on all user-supplied content before injecting into innerHTML.
 */
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}
