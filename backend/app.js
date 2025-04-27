const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // Ajoute bien ce require en haut !

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

const JWT_SECRET = process.env.JWT_SECRET || 'vrai_mot_de_passe_de_bonhomme';

app.use(cors({
  origin: 'https://efrei-test.up.railway.app'
}));
app.use(express.json());

// ==========================
//   Connexion à la BDD
// ==========================
const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  waitForConnections: true,
  connectionLimit: 10,   
  queueLimit: 0
});

function sendJwt(res, user) {
  const payload = {
    id_utilisateur: user.id_utilisateur,
    nom: user.nom,
    prenom: user.prenom,
    email: user.email,
    id_role: user.id_role
  };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
  res.json({
    success: true,
    token,
    user: payload
  });
}

// Pour vérifier que ça marche (optionnel)
db.getConnection((err, connection) => {
  if (err) {
    console.error('Erreur de connexion à MySQL :', err.message);
  } else {
    console.log('✅ Pool MySQL prêt !');
    connection.release();
  }
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token manquant' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token invalide' });
    req.user = user; // user = { id_utilisateur, id_role, ... }
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user.id_role !== 1) {
    return res.status(403).json({ error: "Accès réservé à l'admin" });
  }
  next();
}
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
app.post('/api/favoris', authenticateToken, (req, res) => {
  const id_utilisateur = req.user.id_utilisateur; // Prend l'id du token
  const { id_destination } = req.body;
  // Vérifier si déjà favori
  db.query("SELECT * FROM Favori WHERE id_utilisateur=? AND id_destination=?", [id_utilisateur, id_destination], (err, results) => {
    if (err) return res.status(500).json({ success: false });
    if (results.length) {
      db.query("DELETE FROM Favori WHERE id_utilisateur=? AND id_destination=?", [id_utilisateur, id_destination], (err2) => {
        if (err2) return res.status(500).json({ success: false });
        res.json({ success: true, removed: true });
      });
    } else {
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
  const sql = `SELECT id_utilisateur, nom, prenom, email, mot_de_passe, id_role, is_hashed FROM Utilisateur WHERE email = ? LIMIT 1`;

  db.query(sql, [email], (err, results) => {
    if (err) return res.status(500).json({ success: false, error: "Erreur MySQL" });
    if (results.length === 0) return res.json({ success: false, error: "Email ou mot de passe incorrect" });

    const user = results[0];

    // Mot de passe déjà hashé
    if (user.is_hashed == 1) {
      bcrypt.compare(password, user.mot_de_passe, (errCompare, isMatch) => {
        if (errCompare) return res.status(500).json({ success: false, error: "Erreur serveur" });
        if (!isMatch) return res.json({ success: false, error: "Email ou mot de passe incorrect" });
        return sendJwt(res, user);
      });
    } else {
      // Ancien mot de passe (en clair)
      if (password !== user.mot_de_passe) {
        return res.json({ success: false, error: "Email ou mot de passe incorrect" });
      }
      // Migrer ce compte à bcrypt (en asynchrone)
      bcrypt.hash(password, SALT_ROUNDS, (errHash, hashedPassword) => {
        if (errHash) return res.status(500).json({ success: false, error: "Erreur de hash" });
        db.query(
          "UPDATE Utilisateur SET mot_de_passe = ?, is_hashed = 1 WHERE id_utilisateur = ?",
          [hashedPassword, user.id_utilisateur],
          (errUpdate) => {
            if (errUpdate) return res.status(500).json({ success: false, error: "Erreur MySQL" });
            // La connexion réussit, le compte est migré ! :)
            return sendJwt(res, user);
          }
        );
      });
    }
  });
});

// ==========================
//   ROUTE FAVORIS 
//   (favoris.html)
// ==========================
app.get('/api/favoris/:id_utilisateur', authenticateToken, (req, res) => {
    const idUtilisateur = parseInt(req.params.id_utilisateur, 10);
    if (idUtilisateur !== req.user.id_utilisateur) {
      return res.status(403).json({ error: "Accès interdit" });
    }
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
app.post('/api/avis', authenticateToken, (req, res) => {
    const id_utilisateur = req.user.id_utilisateur;
    const { id_destination, code_type, annee_mobilite, commentaire, notes } = req.body;
  
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
app.get('/api/mes-avis/:id_utilisateur', authenticateToken, (req, res) => {
    const idUtilisateur = parseInt(req.params.id_utilisateur, 10);
    if (idUtilisateur !== req.user.id_utilisateur) {
      return res.status(403).json({ error: "Accès interdit" });
    }
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
app.delete('/api/avis/:id_avis', authenticateToken, (req, res) => {
  const id_avis = req.params.id_avis;
  const id_utilisateur = req.user.id_utilisateur;
  // Vérifie que le user est bien l'auteur
  db.query('SELECT * FROM Avis WHERE id_avis = ?', [id_avis], (err, results) => {
    if (err) return res.status(500).json({ error: 'Erreur MySQL' });
    if (!results.length || results[0].id_utilisateur !== id_utilisateur) {
      return res.status(403).json({ error: 'Action non autorisée' });
    }
    db.query("DELETE FROM Avis WHERE id_avis = ?", [id_avis], (err2) => {
      if (err2) return res.status(500).json({ error: 'Erreur MySQL lors de la suppression.' });
      res.json({ success: true });
    });
  });
});

// ========== Détail d'une destination ==========
app.get('/api/destinations/:id', (req, res) => {
  const id = req.params.id;
  db.query('SELECT * FROM Destination WHERE id_destination = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Erreur MySQL' });
    if (!results.length) return res.status(404).json({ error: 'Destination introuvable' });
    res.json(results[0]);
  });
});

// --- Avis pour une destination ---
app.get('/api/avis/destination/:id_destination', (req, res) => {
  const id = req.params.id_destination;
  const sql = `
    SELECT 
      a.id_avis, a.commentaire, a.annee_mobilite, a.code_type, a.date_creation,
      u.nom, u.prenom,
      (SELECT note FROM Notation WHERE id_avis=a.id_avis AND critere='qualite_cours') AS qualite_cours,
      (SELECT note FROM Notation WHERE id_avis=a.id_avis AND critere='logement') AS logement,
      (SELECT note FROM Notation WHERE id_avis=a.id_avis AND critere='climat') AS climat,
      (SELECT note FROM Notation WHERE id_avis=a.id_avis AND critere='vie_locale') AS vie_locale,
      (SELECT note FROM Notation WHERE id_avis=a.id_avis AND critere='accessibilite') AS accessibilite
    FROM Avis a
      JOIN Utilisateur u ON a.id_utilisateur = u.id_utilisateur
    WHERE a.id_destination = ?
    ORDER BY a.date_creation DESC
  `;
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Erreur MySQL' });
    res.json(results);
  });
});

app.get('/api/avis/:id_avis/like/:id_utilisateur', authenticateToken, (req, res) => {
  const { id_avis, id_utilisateur } = req.params;
  db.query(
    "SELECT * FROM LikeAvis WHERE id_avis=? AND id_utilisateur=?",
    [id_avis, id_utilisateur],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Erreur MySQL' });
      res.json({ liked: results.length > 0 });
    }
  );
});

app.post('/api/avis/:id_avis/like', authenticateToken, (req, res) => {
  const id_utilisateur = req.user.id_utilisateur;
  const id_avis = req.params.id_avis;

  // Vérifie si déjà liké
  db.query(
    "SELECT * FROM LikeAvis WHERE id_avis=? AND id_utilisateur=?",
    [id_avis, id_utilisateur],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Erreur MySQL' });

      if (results.length > 0) {
        // Déjà liké, alors UNLIKE
        db.query(
          "DELETE FROM LikeAvis WHERE id_avis=? AND id_utilisateur=?",
          [id_avis, id_utilisateur],
          (err2) => {
            if (err2) return res.status(500).json({ error: 'Erreur suppression' });
            res.json({ liked: false }); // Maintenant n’est plus liké
          }
        );
      } else {
        // Pas encore liké, alors LIKE
        db.query(
          "INSERT INTO LikeAvis (id_avis, id_utilisateur) VALUES (?, ?)",
          [id_avis, id_utilisateur],
          (err3) => {
            if (err3) return res.status(500).json({ error: 'Erreur ajout' });
            res.json({ liked: true }); // Maintenant c’est liké
          }
        );
      }
    }
  );
});

app.get('/api/avis/:id_avis/likes', (req, res) => {
  const id_avis = req.params.id_avis;
  db.query(
    'SELECT COUNT(*) AS nb FROM LikeAvis WHERE id_avis=?',
    [id_avis],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Erreur MySQL' });
      res.json({ likes: results[0].nb });
    }
  );
});

app.post('/api/avis/signaler', authenticateToken, (req, res) => {
  const id_utilisateur = req.user.id_utilisateur;
  const { id_avis, motif } = req.body;
  if (!id_avis || !motif) {
    return res.status(400).json({ success: false, error: "Données manquantes." });
  }
  db.query(
    `INSERT INTO SignalementAvis (id_avis, id_utilisateur, motif, statut, date_signalement)
     VALUES (?, ?, ?, 'en_attente', NOW())`,
    [id_avis, id_utilisateur, motif],
    (err) => {
      if (err) return res.status(500).json({ success: false, error: "Erreur MySQL" });
      res.json({ success: true });
    }
  );
});


app.get('/api/forum', (req, res) => {
  db.query(
    `SELECT f.*, d.universite, d.ville, d.pays, u.prenom, u.nom, u.id_role
    FROM ForumDestination f
    LEFT JOIN Destination d ON f.id_destination = d.id_destination
    LEFT JOIN Utilisateur u ON f.id_utilisateur = u.id_utilisateur
    ORDER BY f.date_message DESC`,
    (err, rows) => {
      if (err) {
        console.error('Erreur /api/forum :', err);
        return res.status(500).json({ error: 'Erreur serveur forum' });
      }
      res.json(rows);
    }
  );
});

app.post('/api/forum', authenticateToken, (req, res) => {
  const id_utilisateur = req.user.id_utilisateur;
  const { id_destination, contenu } = req.body;
  if (!id_destination || !contenu) {
    return res.status(400).json({ error: "Champs manquants" });
  }
  db.query(
    "INSERT INTO ForumDestination (id_utilisateur, id_destination, contenu, date_message) VALUES (?, ?, ?, NOW())",
    [id_utilisateur, id_destination, contenu],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({error: "Erreur serveur"});
      }
      res.json({ success: true });
    }
  );
});

app.get('/api/forum/:id_message/reponses', (req, res) => {
  const id = req.params.id_message;
  db.query(`
    SELECT r.*, u.prenom, u.nom, u.id_role
    FROM forum_reponse r
    JOIN Utilisateur u ON r.id_utilisateur = u.id_utilisateur
    WHERE r.id_message = ?
    ORDER BY r.date_reponse ASC
  `, [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Erreur MySQL' });
    res.json(results);
  });
});

app.post('/api/forum/:id_message/reponses', authenticateToken, (req, res) => {
  const id_utilisateur = req.user.id_utilisateur;
  const { contenu } = req.body;
  const id_message = req.params.id_message;
  if (!contenu) {
    return res.status(400).json({ error: "Champs manquants" });
  }
  db.query(
    "INSERT INTO forum_reponse (id_message, id_utilisateur, contenu) VALUES (?, ?, ?)",
    [id_message, id_utilisateur, contenu],
    (err) => {
      if (err) return res.status(500).json({ error: "Erreur MySQL" });
      res.json({ success: true });
    }
  );
});

app.delete('/api/forum/:id_message', authenticateToken, (req, res) => {
  const id_message = req.params.id_message;
  const id_utilisateur = req.user.id_utilisateur;
  // On vérifie si l'utilisateur est l'auteur
  db.query(
    'SELECT * FROM ForumDestination WHERE id_message = ? AND id_utilisateur = ?',
    [id_message, id_utilisateur],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Erreur MySQL' });
      if (results.length === 0)
        return res.status(403).json({ error: 'Action non autorisée' });
      db.query('DELETE FROM forum_reponse WHERE id_message = ?', [id_message], () => {
        db.query('DELETE FROM ForumDestination WHERE id_message = ?', [id_message], (err2) => {
          if (err2) return res.status(500).json({ error: 'Erreur MySQL' });
          res.json({ success: true });
        });
      });
    }
  );
});

app.delete('/api/forum/reponse/:id_reponse', authenticateToken, (req, res) => {
  const id_reponse = req.params.id_reponse;
  const id_utilisateur = req.user.id_utilisateur;
  db.query(
    'SELECT * FROM forum_reponse WHERE id_reponse = ? AND id_utilisateur = ?',
    [id_reponse, id_utilisateur],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Erreur MySQL' });
      if (results.length === 0)
        return res.status(403).json({ error: 'Action non autorisée' });
      db.query('DELETE FROM forum_reponse WHERE id_reponse = ?', [id_reponse], (err2) => {
        if (err2) return res.status(500).json({ error: 'Erreur MySQL' });
        res.json({ success: true });
      });
    }
  );
});

// Récupérer tous les avis signalés (pour admin)
app.get('/api/signalements', authenticateToken, requireAdmin, (req, res) => {
  const sql = `
    SELECT s.*, a.commentaire, a.id_avis, u.prenom, u.nom, d.universite, d.ville, d.pays
    FROM SignalementAvis s
    JOIN Avis a ON s.id_avis = a.id_avis
    JOIN Utilisateur u ON a.id_utilisateur = u.id_utilisateur
    JOIN Destination d ON a.id_destination = d.id_destination
    ORDER BY s.date_signalement DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({error: "Erreur MySQL"});
    res.json(results);
  });
});

// Valider un signalement (supprimer l'avis et marquer traité)
app.post('/api/admin/signalement/valider', authenticateToken, requireAdmin, (req, res) => {
  const { id_signalement, id_avis } = req.body;
  // Suppression de l'avis + update du signalement
  db.query("DELETE FROM Avis WHERE id_avis = ?", [id_avis], (err) => {
    if (err) return res.status(500).json({ success: false, error: "Erreur suppression avis" });
    db.query("UPDATE SignalementAvis SET statut = 'traite' WHERE id_signalement = ?", [id_signalement], (err2) => {
      if (err2) return res.status(500).json({ success: false, error: "Erreur statut signalement" });
      res.json({ success: true });
    });
  });
});

// Ignorer un signalement (marquer traité mais garder l'avis)
app.post('/api/admin/signalement/ignorer', authenticateToken, requireAdmin, (req, res) => {
  const { id_signalement } = req.body;
  db.query("UPDATE SignalementAvis SET statut = 'traite' WHERE id_signalement = ?", [id_signalement], (err) => {
    if (err) return res.status(500).json({ success: false, error: "Erreur statut signalement" });
    res.json({ success: true });
  });
});




// === Ajout d’une nouvelle destination ===
app.post('/api/destinations', authenticateToken, requireAdmin, (req, res) => {
  const { pays, universite, ville, langue, cout_vie_moyen,
          url_universite, empreinte_carbone, nombre_etudiants } = req.body;
  // validation basique...
  if (!pays || !universite || !ville || !langue || cout_vie_moyen == null || !url_universite) {
    return res.status(400).json({ success:false, error:"Champs manquants" });
  }
  const sql = `
    INSERT INTO Destination
    (pays, universite, ville, langue, cout_vie_moyen, url_universite, empreinte_carbone, nombre_etudiants)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [
    pays, universite, ville, langue, cout_vie_moyen,
    url_universite, empreinte_carbone, nombre_etudiants
  ], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ success:false, error:"Erreur MySQL" });
    }
    res.json({ success:true, id_destination: result.insertId });
  });
});


app.post('/api/register', (req, res) => {
  const { prenom, nom, email, password } = req.body;
  if (!prenom || !nom || !email || !password) {
    return res.status(400).json({ success: false, error: "Tous les champs sont requis." });
  }
  if (!email.endsWith("@efrei.net")) {
    return res.status(400).json({ success: false, error: "Seuls les mails @efrei.net sont autorisés." });
  }
  // Vérifie si déjà existant
  db.query('SELECT * FROM Utilisateur WHERE email = ?', [email], (err, rows) => {
    if (err) return res.status(500).json({ success: false, error: "Erreur MySQL" });
    if (rows.length) return res.json({ success: false, error: "Email déjà utilisé." });

    // Hash le mot de passe AVANT insertion !
    bcrypt.hash(password, SALT_ROUNDS, (errHash, hash) => {
      if (errHash) {
        console.error(errHash);
        return res.status(500).json({ success: false, error: "Erreur lors du hash du mot de passe" });
      }
      // Récupère le dernier myefrei_id pour incrémenter
      db.query('SELECT myefrei_id FROM Utilisateur ORDER BY id_utilisateur DESC LIMIT 1', (err2, rows2) => {
        let newId = 1;
        if (!err2 && rows2.length > 0) {
          const lastId = parseInt(rows2[0].myefrei_id.replace('efrei', ''), 10);
          newId = lastId + 1;
        }
        const myefrei_id = `efrei${String(newId).padStart(3, '0')}`;
        db.query(
          'INSERT INTO Utilisateur (myefrei_id, prenom, nom, email, mot_de_passe, id_role, is_hashed) VALUES (?, ?, ?, ?, ?, 2, 1)',
          [myefrei_id, prenom, nom, email, hash],
          (err3) => {
            if (err3) {
              console.error("Erreur MySQL (insert):", err3);
              return res.status(500).json({ success: false, error: "Erreur MySQL (insert): " + err3.sqlMessage });
            }
            res.json({ success: true });
          }
        );
      });
    });
  });
});

app.put('/api/avis/:id', authenticateToken, (req, res) => {
  const id_avis = req.params.id;
  const id_utilisateur = req.user.id_utilisateur;
  const { commentaire, notes } = req.body;
  // Vérifie que le user est bien l'auteur
  db.query('SELECT * FROM Avis WHERE id_avis = ?', [id_avis], (err, results) => {
    if (err) return res.status(500).json({ success: false, error: "Erreur SQL (avis)" });
    if (!results.length || results[0].id_utilisateur !== id_utilisateur) {
      return res.status(403).json({ error: "Action non autorisée" });
    }

    // 1. Mise à jour du commentaire dans Avis
    db.query('UPDATE Avis SET commentaire = ? WHERE id_avis = ?', [commentaire, id_avis], (err, result) => {
      if (err) return res.status(500).json({ success: false, error: "Erreur SQL (avis)" });

      // 2. Mise à jour des notes (notation) pour chaque critère
      const criteres = ['qualite_cours', 'logement', 'climat', 'vie_locale', 'accessibilite'];
      let done = 0;
      let erreur = false;

      criteres.forEach(critere => {
        db.query(
          'UPDATE Notation SET note = ? WHERE id_avis = ? AND critere = ?',
          [notes[critere], id_avis, critere],
          (err2, result2) => {
            if (err2) erreur = true;
            done++;
            if (done === criteres.length) {
              if (erreur) return res.status(500).json({ success: false, error: "Erreur SQL (notation)" });
              return res.json({ success: true });
            }
          }
        );
      });
    });
  });
});


// ==========================
//   DÉMARRAGE DU SERVEUR
// ==========================
app.listen(PORT, () => {
  console.log(`Serveur backend lancé sur http://localhost:${PORT}`);
});
