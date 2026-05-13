// ─────────────────────────────────────────────────────────────
// Display formatters
// ─────────────────────────────────────────────────────────────

/**
 * Formats an ISO date string as "12 Jan 2025" (en-GB style).
 */
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-GB', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  });
}
