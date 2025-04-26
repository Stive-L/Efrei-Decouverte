# 🌳 EFREI & Découverte 🌍

Site d’avis et de retours d’expérience sur les mobilités internationales de l’EFREI (semestres I1, I2, I3, PEX…).  
Projet Green IT – minimisation de l’empreinte carbone web.

---

## Lien du site

- **Site (Cloud):** https://efrei-and-decouverte.up.railway.app
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

## Installation locale

### 1. Cloner le dépôt

```bash
git clone https://github.com/votre-utilisateur/efrei-decouverte.git
cd efrei-decouverte
```

### 2. Configurer la base de données MySQL

- Importer **`BDD Efrei decouverte.sql`** dans votre MySQL.
- Importer **`Table de données.sql`** pour pré-remplir avec des exemples.



### 3. Back-end

```bash
cd backend
npm install
```

Lancer l’API :

```bash
npm start
```

Le serveur tourne sur [http://localhost:3000](http://localhost:3000)



### 4. Front-end

Ouvrir `frontend/index.html`  

---

## Équipe projet

- LEE Zhuo Chan Stive
- TEILLET Paul
- SHANG Jacky
- GERMANY Nathan

---


