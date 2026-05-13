// ─────────────────────────────────────────────────────────────
// Stat card renderer
// ─────────────────────────────────────────────────────────────

/**
 * Renders a single stat card.
 * @param {number} value     - The number to display
 * @param {string} label     - The label below the number
 * @param {string} [color]   - Optional CSS color for the number (e.g. 'var(--danger)')
 */
function statCard(value, label, color = '') {
  const style = color ? `style="color:${color}"` : '';
  return `
    <div class="stat-card">
      <div class="number" ${style}>${value}</div>
      <div class="label">${label}</div>
    </div>`;
}
