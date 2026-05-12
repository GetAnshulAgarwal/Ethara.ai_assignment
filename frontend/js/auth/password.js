export function validatePassword(password) {
  const letters = (password.match(/[a-zA-Z]/g) || []).length;
  const numbers = (password.match(/[0-9]/g) || []).length;
  const specials = (password.match(/[^a-zA-Z0-9]/g) || []).length;

  return (
    letters >= 6 &&
    numbers >= 3 &&
    specials >= 2 &&
    password.length >= 11
  );
}