// js/authFetch.js
window.authFetch = function(url, options = {}) {
    // Copie les options pour ne pas les modifier globalement
    const opts = Object.assign({}, options);

    // Ajoute les headers s'ils n'existent pas déjà
    opts.headers = opts.headers || {};

    // Ajoute le token s'il existe
    const token = localStorage.getItem('token');
    if (token) {
        opts.headers['Authorization'] = 'Bearer ' + token;
    }
    // Pour du JSON
    if (!opts.headers['Content-Type']) {
        opts.headers['Content-Type'] = 'application/json';
    }

    return fetch(url, opts);
}
