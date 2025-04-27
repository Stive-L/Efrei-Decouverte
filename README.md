# 🌳 EFREI & Découverte 🌍

Site d’avis et de retours d’expérience sur les mobilités internationales de l’EFREI (semestres I1, I2, I3, PEX…).  
Projet Green IT – minimisation de l’empreinte carbone web.

---

## Lien du site

- **Site (Cloud):** https://efrei-decouvertee.up.railway.app
- **Back-end (BDD) :** https://efrei-and-decouverte-back-production.up.railway.app

---

## Objectif

- **Aider les étudiants EFREI** à choisir leur destination de mobilité avec des retours d’expérience.
- **Informer** sur la vie à l’étranger (conseils, avis, forum, favoris).
- **Réduire l’empreinte carbone** du site par l’éco-conception (images compressées, etc.).

---

## Fonctionnalités

- **Espace utilisateur**
  - Consulter les destinations (fiches détaillées : université, ville, coût de la vie, langue, etc.)
  - Ajouter/retirer des favoris
  - Lire, poster, liker et signaler des avis étudiants
  - Poster des questions et réponses sur le forum, supprimer ses messages

- **Espace administrateur**
  - Ajouter de nouvelles destinations
  - Gérer les avis signalés (valider, supprimer, ignorer)
  - Accéder à toutes les fonctionnalités utilisateur
 
---

## Architecture du projet

```
backend/         # Node.js + Express (API)
├── app.js
├── package.json
├── package-lock.json
├── node_modules/
└── ...

frontend/        # Front HTML/CSS/JS
├── index.html
├── html/
├── css/
├── js/
├── images/
└── ...

database/
├── BDD Efrei decouverte.sql      # Création BDD
├── Table de données.sql          # Données exemples

README.md
```

## Technologies utilisées

- **Front-end :** HTML5, CSS3, JavaScript (Vanilla)
- **Back-end :** Node.js, Express
- **Base de données :** MySQL
- **Déploiement :** Railway (Cloud)

---

## Installation

### 1. Cloner le dépôt

```bash
git clone [https://github.com/votre-utilisateur/efrei-decouverte.git](https://github.com/Stive-L/Efrei-Decouverte)
cd efrei-decouverte
```

### ⚡ 2. Utilisation recommandée (hébergée)

- **Il n'est plus nécessaire de lancer le back-end ou la base de données en local.**
- **Tout fonctionne déjà** grâce à l’API et la base de données hébergées sur Railway.
- Il suffit d’**ouvrir le fichier `index.html`** du dossier `frontend/html` dans votre navigateur pour utiliser l’application.

### 🛠️ 3. Utilisation avancée (développement local)

> **Pour les développeurs voulant modifier le back-end ou travailler sans accès à Railway** :
  1. Suivez les étapes ci-dessus pour l'installation locale.
  2. **Pensez à modifier les paramètres de connexion à la base de données dans** `backend/app.js`

   
---

## Équipe projet

- LEE Zhuo Chan Stive
- TEILLET Paul
- SHANG Jacky
- GERMANY Nathan

---


