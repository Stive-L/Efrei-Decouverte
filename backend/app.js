const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// ==========================
//   Connexion à la BDD
// ==========================
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',        
  password: '12345',        
  database: 'efrei_decouverte'
});

db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à MySQL :', err.message);
  } else {
    console.log('✅ Connecté à la base MySQL efrei_decouverte !');
  }
});

// ==========================
//   ROUTES DESTINATIONS
//   (destinations.html)
// ==========================
app.get('/api/destinations', (req, res) => {
  db.query('SELECT * FROM Destination', (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Erreur MySQL' });
    } else {
      res.json(results);
    }
  });
});

// Ajout ou suppression favori (toggle)
app.post('/api/favoris', (req, res) => {
    const { id_utilisateur, id_destination } = req.body;
    // Vérifier si déjà favori
    db.query("SELECT * FROM Favori WHERE id_utilisateur=? AND id_destination=?", [id_utilisateur, id_destination], (err, results) => {
      if (err) return res.status(500).json({ success: false });
      if (results.length) {
        // Si existe, supprimer (toggle off)
        db.query("DELETE FROM Favori WHERE id_utilisateur=? AND id_destination=?", [id_utilisateur, id_destination], (err2) => {
          if (err2) return res.status(500).json({ success: false });
          res.json({ success: true, removed: true });
        });
      } else {
        // Sinon, ajouter (toggle on)
        db.query("INSERT INTO Favori (id_utilisateur, id_destination) VALUES (?, ?)", [id_utilisateur, id_destination], (err3) => {
          if (err3) return res.status(500).json({ success: false });
          res.json({ success: true, added: true });
        });
      }
    });
  });

// ==========================
//   ROUTES AVIS
//   (avis.html)
// ==========================
app.get('/api/avis', (req, res) => {
    const sql = `
      SELECT 
        a.id_avis, a.commentaire, a.annee_mobilite, a.code_type, a.date_creation,
        u.nom, u.prenom,
        d.universite, d.ville, d.pays,
        -- Les sous-requêtes pour chaque critère de notation
        (SELECT note FROM Notation WHERE id_avis=a.id_avis AND critere='qualite_cours') AS qualite_cours,
        (SELECT note FROM Notation WHERE id_avis=a.id_avis AND critere='logement') AS logement,
        (SELECT note FROM Notation WHERE id_avis=a.id_avis AND critere='climat') AS climat,
        (SELECT note FROM Notation WHERE id_avis=a.id_avis AND critere='vie_locale') AS vie_locale,
        (SELECT note FROM Notation WHERE id_avis=a.id_avis AND critere='accessibilite') AS accessibilite
      FROM Avis a
        JOIN Utilisateur u ON a.id_utilisateur = u.id_utilisateur
        JOIN Destination d ON a.id_destination = d.id_destination
      ORDER BY a.date_creation DESC
    `;
    db.query(sql, (err, results) => {
      if (err) {
        res.status(500).json({ error: 'Erreur MySQL' });
      } else {
        res.json(results);
      }
    });
  });


// ==========================
//   ROUTES AUTH (LOGIN)
//   (login.html)
// ==========================

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
  
    // On vérifie que l’email existe et que le mot de passe correspond
    const sql = `
      SELECT id_utilisateur, nom, prenom, email, mot_de_passe, id_role
      FROM Utilisateur
      WHERE email = ?
      LIMIT 1
    `;
  
    db.query(sql, [email], (err, results) => {
      if (err) {
        return res.status(500).json({ success: false, error: "Erreur MySQL" });
      }
      if (results.length === 0) {
        // Aucun utilisateur trouvé
        return res.json({ success: false, error: "Email ou mot de passe incorrect" });
      }
  
      const user = results[0];
      // Ici, pour l’exemple, on compare le mot de passe en clair (dev only)
      if (user.mot_de_passe !== password) {
        return res.json({ success: false, error: "Email ou mot de passe incorrect" });
      }
  
      // Auth OK, on renvoie les infos utiles (NE JAMAIS renvoyer le mdp)
      res.json({
        success: true,
        id_utilisateur: user.id_utilisateur,
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        id_role: user.id_role // 1 = admin
      });
    });
  });

// ==========================
//   ROUTE FAVORIS 
//   (favoris.html)
// ==========================
app.get('/api/favoris/:id_utilisateur', (req, res) => {
    const idUtilisateur = req.params.id_utilisateur;
    const sql = `
      SELECT f.id_utilisateur, f.id_destination, f.date_ajout, d.*
      FROM Favori f
      JOIN Destination d ON f.id_destination = d.id_destination
      WHERE f.id_utilisateur = ?
    `;
    db.query(sql, [idUtilisateur], (err, results) => {
      if (err) {
        console.error(err); // Pour debug
        res.status(500).json({ error: 'Erreur MySQL' });
      } else {
        res.json(results);
      }
    });
});

// ==========================
//   ROUTE AJOUT AVIS (POST)
//   (poster_avis.html)
// ==========================
app.post('/api/avis', (req, res) => {
    const { id_utilisateur, id_destination, code_type, annee_mobilite, commentaire, notes } = req.body;
  
    // 1. Ajouter l'avis principal
    const insertAvis = `
      INSERT INTO Avis (id_utilisateur, id_destination, code_type, annee_mobilite, commentaire)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(
      insertAvis,
      [id_utilisateur, id_destination, code_type, annee_mobilite, commentaire],
      (err, result) => {
        if (err) return res.status(500).json({ success: false, error: "Erreur MySQL (avis)" });
        const id_avis = result.insertId;
  
        const criteres = ['qualite_cours', 'logement', 'climat', 'vie_locale', 'accessibilite'];
        const values = criteres.map(crit => [id_avis, crit, notes[crit]]);
        db.query(
          "INSERT INTO Notation (id_avis, critere, note) VALUES ?",
          [values],
          (err2) => {
            if (err2) return res.status(500).json({ success: false, error: "Erreur MySQL (notations)" });
            res.json({ success: true });
          }
        );
      }
    );
  });


// --- Récupérer tous les avis d’un utilisateur ---
app.get('/api/mes-avis/:id_utilisateur', (req, res) => {
    const idUtilisateur = req.params.id_utilisateur;
    const sql = `
      SELECT 
        a.id_avis, a.commentaire, a.annee_mobilite, a.code_type, a.date_creation,
        d.universite, d.ville, d.pays
      FROM Avis a
        JOIN Destination d ON a.id_destination = d.id_destination
      WHERE a.id_utilisateur = ?
      ORDER BY a.date_creation DESC
    `;
    db.query(sql, [idUtilisateur], (err, results) => {
      if (err) {
        res.status(500).json({ error: 'Erreur MySQL' });
      } else {
        res.json(results);
      }
    });
  });

// --- Supprimer un avis par son id ---
app.delete('/api/avis/:id_avis', (req, res) => {
    const idAvis = req.params.id_avis;
    db.query("DELETE FROM Avis WHERE id_avis = ?", [idAvis], (err, result) => {
        if (err) {
            res.status(500).json({ error: 'Erreur MySQL lors de la suppression.' });
        } else {
            res.json({ success: true });
        }
    });
});
// ==========================
//   ROUTES ADMIN (EXEMPLES)
//   (admin.html, ajouter_destination.html, etc.)
// ==========================
// !! À compléter pour les routes admin plus tard !!


// ==========================
//   DÉMARRAGE DU SERVEUR
// ==========================
app.listen(PORT, () => {
  console.log(`Serveur backend lancé sur http://localhost:${PORT}`);
});
