window.addEventListener('DOMContentLoaded', function() {
    const loginLink = document.getElementById('user-menu-link');
    const userMenu = document.getElementById('user-menu-container');
    const dropdown = document.getElementById('user-dropdown');
    const nom = localStorage.getItem('nom');
    const prenom = localStorage.getItem('prenom');
    const role = localStorage.getItem('id_role'); 

    
    if (!loginLink) return;

    // Fonction pour obtenir le bon chemin selon la page courante
    function linkTo(page) {
        const isInHtmlFolder = window.location.pathname.includes('/html/');
        return isInHtmlFolder ? page : 'html/' + page;
    }

    if (nom && prenom) {
        loginLink.textContent = prenom + " " + nom + (role === "1" ? " (Admin)" : "");
        loginLink.href = "#";

        let menuHtml = '';
        if (role !== "1") {
            menuHtml += `
                <a href="${linkTo('favoris.html')}">Consulter les favoris</a>
                <a href="${linkTo('poster_avis.html')}">Poster un avis</a>
                <a href="#" id="logout-link">Déconnexion</a>
            `;
        } else {
            menuHtml += `
                <a href="${linkTo('favoris.html')}">Consulter les favoris</a>
                <a href="${linkTo('poster_avis.html')}">Poster un avis</a>
                <a href="${linkTo('admin_signalements.html')}">Avis signalés</a>
                <a href="${linkTo('ajouter_destination.html')}">Ajouter une destination</a>
                <a href="#" id="logout-link">Déconnexion</a>
            `;
        }
        dropdown.innerHTML = menuHtml;

        // Gestion ouverture/fermeture par clic
        loginLink.addEventListener('click', function(e) {
            e.preventDefault();
            dropdown.style.display = (dropdown.style.display === "block") ? "none" : "block";
        });

        // Clique hors menu => ferme le dropdown
        document.addEventListener('mousedown', function(event) {
            if (!userMenu.contains(event.target)) {
                dropdown.style.display = "none";
            }
        });

        // Déconnexion
        document.getElementById('logout-link').addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.clear();
            window.location.href = linkTo('login.html');
        });

    } else {
        loginLink.textContent = "SE CONNECTER";
        loginLink.href = linkTo('login.html');
        dropdown.style.display = "none";
    }
});
