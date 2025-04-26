/**
 * Rendu barre de note pour un critère
 * Usage : buildNoteBar("Qualité cours", note)
 */
window.API_BASE_URL =
  window.location.hostname.includes("railway.app")
    ? "https://ton-back-railway-production.up.railway.app"
    : "http://localhost:3000";

function buildNoteBar(label, value) {
  value = value || 0;
  return `
    <div class="avis-note">
      <span class="avis-note-label">${label}</span>
      <span class="avis-note-bar">
        <span class="avis-note-bar-inner" style="width:${(value/5)*100}%"></span>
      </span>
      <span class="avis-note-val">${value}/5</span>
    </div>
  `;
}

// ========== LIKE AVIS ==========

// Événement de like
window.toggleLikeAvis = function(el) {
  const id_utilisateur = localStorage.getItem('id_utilisateur');
  if (!id_utilisateur) {
    alert("Connecte-toi pour liker un avis !");
    return;
  }
  const id_avis = el.dataset.id;
  fetch(`${window.API_BASE_URL}/api/avis/${id_avis}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_utilisateur })
  })
  .then(res => res.json())
  .then(data => {
    fetch(`${window.API_BASE_URL}/api/avis/${id_avis}/likes`)
      .then(res => res.json())
      .then(({ likes }) => {
        el.querySelector('.nb-likes').textContent = likes;
        el.classList.toggle('liked', data.liked);
      });
  });
};

// ========== SIGNALEMENT AVIS ==========

let avisASignaler = null;

// Appelée sur le bouton "Signaler"
window.signalerAvis = function(id_avis) {
  const id_utilisateur = localStorage.getItem('id_utilisateur');
  if (!id_utilisateur) {
    alert("Connecte-toi pour signaler un avis !");
    return;
  }
  avisASignaler = id_avis;
  if (!document.getElementById('popup-signalement')) showPopupSignalementHTML();
  document.getElementById('motif-signalement').value = '';
  document.getElementById('popup-signalement').style.display = 'flex';
  document.getElementById('motif-signalement').focus();
};

window.closePopupSignalement = function() {
  document.getElementById('popup-signalement').style.display = 'none';
  avisASignaler = null;
};

// Création/ajout dynamique du HTML du popup s'il n'existe pas déjà
function showPopupSignalementHTML() {
  const popup = document.createElement('div');
  popup.id = "popup-signalement";
  popup.style = "display:none; position:fixed; left:0;top:0;width:100vw;height:100vh;background:#0004;z-index:1000;align-items:center;justify-content:center;";
  popup.innerHTML = `
    <div class="popup-content" style="background:#fff;padding:30px 20px;border-radius:18px;min-width:300px;box-shadow:0 8px 48px #0003;position:relative;">
      <h3>Signaler un avis</h3>
      <form id="form-signalement">
        <label for="motif-signalement">Motif :</label>
        <textarea id="motif-signalement" required style="width:100%;min-height:60px;margin:10px 0 18px 0;"></textarea>
        <div style="text-align:right;">
          <button type="button" onclick="closePopupSignalement()" style="margin-right:8px;background:#f3f3f3;color:#333;border:none;padding:6px 18px;border-radius:8px;font-weight:500;cursor:pointer;transition:background 0.17s;">Annuler</button>
          <button type="submit" style="background:#ff6d6d;color:white;border:none;padding:6px 18px;border-radius:8px;cursor:pointer;">Envoyer</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(popup);

  document.getElementById('form-signalement').onsubmit = function(e) {
    e.preventDefault();
    const motif = document.getElementById('motif-signalement').value.trim();
    const id_utilisateur = localStorage.getItem('id_utilisateur');
    if (!motif) {
      alert("Merci d'indiquer un motif.");
      return;
    }
    fetch(`${window.API_BASE_URL}/api/avis/signaler`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_avis: avisASignaler,
        id_utilisateur,
        motif
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert("Merci, votre signalement a bien été envoyé.");
        closePopupSignalement();
      } else {
        alert(data.error || "Erreur lors du signalement.");
      }
    });
  };
}
