import { api } from './api.js';

export function login(data) {
  return api('POST', '/auth/login', data);
}

export function signup(data) {
  return api('POST', '/auth/signup', data);
}