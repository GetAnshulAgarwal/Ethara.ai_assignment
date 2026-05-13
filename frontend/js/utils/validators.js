// ─────────────────────────────────────────────────────────────
// Client-side validators
// Must stay in sync with the server-side PASSWORD_POLICY in auth.js
// ─────────────────────────────────────────────────────────────

const PASSWORD_POLICY = {
  minLength:  11,
  minLetters: 6,
  minNumbers: 3,
  minSpecial: 2,
};

/**
 * Returns true if the password satisfies the policy, false otherwise.
 * @param {string} password
 */
function meetsPasswordPolicy(password) {
  if (!password || password.length < PASSWORD_POLICY.minLength) return false;
  const letters  = (password.match(/[a-zA-Z]/g)    || []).length;
  const numbers  = (password.match(/[0-9]/g)        || []).length;
  const specials = (password.match(/[^a-zA-Z0-9]/g) || []).length;
  return (
    letters  >= PASSWORD_POLICY.minLetters &&
    numbers  >= PASSWORD_POLICY.minNumbers &&
    specials >= PASSWORD_POLICY.minSpecial
  );
}

/**
 * Returns a human-readable error string, or null if the password is valid.
 * @param {string} password
 */
function passwordPolicyError(password) {
  if (!password) return 'Password is required.';
  const letters  = (password.match(/[a-zA-Z]/g)    || []).length;
  const numbers  = (password.match(/[0-9]/g)        || []).length;
  const specials = (password.match(/[^a-zA-Z0-9]/g) || []).length;

  if (password.length < PASSWORD_POLICY.minLength) return `Password must be at least ${PASSWORD_POLICY.minLength} characters.`;
  if (letters  < PASSWORD_POLICY.minLetters)       return `Password must contain at least ${PASSWORD_POLICY.minLetters} letters.`;
  if (numbers  < PASSWORD_POLICY.minNumbers)       return `Password must contain at least ${PASSWORD_POLICY.minNumbers} numbers.`;
  if (specials < PASSWORD_POLICY.minSpecial)       return `Password must contain at least ${PASSWORD_POLICY.minSpecial} special characters.`;
  return null;
}
