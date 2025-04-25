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
          <button type="button" onclick="closePopupSignalement()" style="margin-right:8px;">Annuler</button>
          <button type="submit" style="background:#ff6d6d;color:white;border:none;padding:6px 18px;border-radius:8px;">Envoyer</button>
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

window.afficherAvisDestination = function(id_destination) {
  fetch(`${window.API_BASE_URL}/api/avis/destination/${id_destination}`)
    .then(res => res.json())
    .then(function(avisList) {
      const ul = document.getElementById("avis-list");
      if (!avisList.length) {
        ul.innerHTML = "<li>Aucun avis pour cette destination.</li>";
        return;
      }
      ul.innerHTML = "";

      const id_utilisateur = localStorage.getItem('id_utilisateur');
      let likeStatusArray = [];
      let nbLikesArray = [];

      if (id_utilisateur) {
        // Récupérer en parallèle tous les statuts "liked"
        Promise.all(avisList.map(avis =>
          fetch(`${window.API_BASE_URL}/api/avis/${avis.id_avis}/like/${id_utilisateur}`)
            .then(res => res.json())
            .then(data => data.liked)
            .catch(() => false)
        )).then(function(_likeStatusArray) {
          likeStatusArray = _likeStatusArray;

          // Récupérer en parallèle tous les nb de likes à jour
          Promise.all(avisList.map(avis =>
            fetch(`${window.API_BASE_URL}/api/avis/${avis.id_avis}/likes`)
              .then(res => res.json())
              .then(data => data.likes)
              .catch(() => 0)
          )).then(function(_nbLikesArray) {
            nbLikesArray = _nbLikesArray;
            // Affichage final
            renderAvisList(avisList, likeStatusArray, nbLikesArray, ul);
          });
        });
      } else {
        likeStatusArray = avisList.map(() => false);
        nbLikesArray = avisList.map(avis => avis.likes || 0);
        renderAvisList(avisList, likeStatusArray, nbLikesArray, ul);
      }
    })
    .catch(() => {
      document.getElementById("avis-list").innerHTML = "<li>Erreur lors du chargement des avis.</li>";
    });
}

// Fonction d'affichage (réutilisable)
function renderAvisList(avisList, likeStatusArray, nbLikesArray, ul) {
  avisList.forEach(function(avis, idx) {
    let liked = likeStatusArray[idx];
    let nbLikes = nbLikesArray[idx];
    ul.innerHTML += `
      <li class="avis-item">
        <div class="avis-header">
          <span class="avis-auteur">${avis.prenom} ${avis.nom}</span>
          <span class="avis-date">${avis.date_creation ? new Date(avis.date_creation).toLocaleDateString('fr-FR') : avis.annee_mobilite || ''}</span>
        </div>
        <div class="avis-type">${avis.code_type} — ${avis.annee_mobilite}</div>
        <div class="avis-commentaire">${avis.commentaire}</div>
        <div class="avis-notes">
          ${buildNoteBar("Qualité cours", avis.qualite_cours)}
          ${buildNoteBar("Logement", avis.logement)}
          ${buildNoteBar("Climat", avis.climat)}
          ${buildNoteBar("Vie locale", avis.vie_locale)}
          ${buildNoteBar("Accessibilité", avis.accessibilite)}
        </div>
        <div class="avis-footer">
          <span class="avis-likes ${liked ? 'liked' : ''}" data-id="${avis.id_avis}" onclick="toggleLikeAvis(this)">
            <svg height="18" width="18" viewBox="0 0 20 20" fill="currentColor" style="vertical-align:middle">
              <path d="M10.001 4.529c2.349-4.101 12.036-2.41 9.979 3.396-1.02 2.674-6.919 8.115-9.272 10.034-.381.304-.927.304-1.308 0C6.94 16.04 1.044 10.599.021 7.925c-2.055-5.806 7.629-7.497 9.98-3.396z"></path>
            </svg>
            <span class="nb-likes">${nbLikes}</span>
          </span>
          <button class="avis-signaler" onclick="signalerAvis(${avis.id_avis})">Signaler</button>
        </div>
      </li>
    `;
  });
}