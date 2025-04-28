// js/authFetch.js
export function authFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Token manquant');
      throw new Error('Token manquant');
    }
    options.headers = {
      ...(options.headers || {}),
      'Authorization': `Bearer ${token}`
    };
    return fetch(url, options);
  }
