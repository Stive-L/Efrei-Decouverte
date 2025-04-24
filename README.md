# 🌳 EFREI & Découverte 🌍

Site d’avis et de retours d’expérience sur les mobilités internationales de l’EFREI (semestres I1, I2, I3, PEX…).  
Projet Green IT – minimisation de l’empreinte carbone web.

---

## Lien du site

- **Front-end :** https://efrei-and-decouverte-front-production.up.railway.app  
- **Back-end (API) :** https://efrei-and-decouverte-back-production.up.railway.app

---

## Endpoints pour lire les données

- **Destinations**  
  - `GET /api/destinations`  
    → Retourne la liste de toutes les destinations  
  - `GET /api/destinations/:id`  
    → Retourne la fiche détaillée d’une destination (par `id`)

- **Avis**  
  - `GET /api/avis`  
    → Retourne tous les avis  
  - `GET /api/avis/destination/:id`  
    → Retourne les avis pour une destination donnée

- **Utilisateurs**  
  - `GET /api/mes-avis/:id_utilisateur`  
    → Retourne les avis postés par un utilisateur

- **Favoris**  
  - `GET /api/favoris/:id_utilisateur`  
    → Retourne la liste des destinations favorites d’un utilisateur

---

## Objectif

- **Aider les étudiants EFREI** à choisir leur destination de mobilité avec des retours d’expérience.
- **Informer** sur la vie à l’étranger (conseils, avis, forum, favoris).
- **Réduire l’empreinte carbone** du site par l’éco-conception (images compressées, etc.).

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
- **Déploiement :** Railway (Cloud) — compatible Vercel/Render
- **Autres :** Vite (optionnel pour build front)

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

## 5. Équipe projet

- LEE Zhuo Chan Stive
- TEILLET Paul
- SHANG Jacky
- GERMANY Nathan

---


