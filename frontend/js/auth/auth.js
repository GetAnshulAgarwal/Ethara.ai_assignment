import { state } from '../state.js';

export function saveSession() {
  sessionStorage.setItem('user', JSON.stringify(state.user));
}

export function loadSession() {
  const user = sessionStorage.getItem('user');

  if (user) {
    state.user = JSON.parse(user);
  }
}

export function logout() {
  sessionStorage.clear();
  location.reload();
}