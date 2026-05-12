import { signup } from '../api/authApi.js';

export async function submitSignup(data) {
  return await signup(data);
}