// Met l'URL de prod par défaut, et localhost si local
window.API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "https://efrei-and-decouverte-back-production.up.railway.app";