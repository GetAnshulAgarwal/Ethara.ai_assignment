import { login } from '../api/authApi.js';

export async function submitLogin(email, password) {
  return await login({ email, password });
}