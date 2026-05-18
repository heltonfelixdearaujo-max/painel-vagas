const CREDENTIALS = {
  email: 'heltonfelixaraujo@wayzim.com',
  password: 'Hf@290692010203',
  name: 'Helton Felix',
  role: 'admin',
};

export function login(email, password) {
  if (email.trim().toLowerCase() === CREDENTIALS.email && password === CREDENTIALS.password) {
    const session = { email: CREDENTIALS.email, name: CREDENTIALS.name, role: CREDENTIALS.role, at: Date.now() };
    localStorage.setItem('wayzim-session', JSON.stringify(session));
    return session;
  }
  return null;
}

export function getSession() {
  try {
    const raw = localStorage.getItem('wayzim-session');
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (Date.now() - s.at > 12 * 60 * 60 * 1000) { logout(); return null; }
    return s;
  } catch { return null; }
}

export function logout() {
  localStorage.removeItem('wayzim-session');
}
