import { state } from '../state.js';

const API = '/api';

export async function api(method, path, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (state.accessToken) {
    options.headers.Authorization = `Bearer ${state.accessToken}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(API + path, options);
  const data = await response.json();

  if (!response.ok) {
    throw data;
  }

  return data;
}