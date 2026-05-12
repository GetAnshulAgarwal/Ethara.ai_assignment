import { loadSession } from './auth/auth.js';
import { navigate } from './router.js';

function init() {
  loadSession();
  navigate('dashboard');
}

init();