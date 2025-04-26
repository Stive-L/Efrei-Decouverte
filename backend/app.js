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

// Pour vérifier que ça marche (optionnel)
db.getConnection((err, connection) => {
  if (err) {
    console.error('Erreur de connexion à MySQL :', err.message);
  } else {
    console.log('✅ Pool MySQL prêt !');
    connection.release();
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

app.get('/api/avis/:id_avis/like/:id_utilisateur', (req, res) => {
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

app.post('/api/avis/:id_avis/like', (req, res) => {
  const { id_utilisateur } = req.body;
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

app.post('/api/avis/signaler', (req, res) => {
  const { id_avis, id_utilisateur, motif } = req.body;
  if (!id_avis || !id_utilisateur || !motif) {
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
    `SELECT f.*, d.universite, d.ville, d.pays, u.prenom, u.nom
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

app.post('/api/forum', (req, res) => {
  const { id_utilisateur, id_destination, contenu } = req.body;
  if (!id_utilisateur || !id_destination || !contenu) {
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
    SELECT r.*, u.prenom, u.nom
    FROM forum_reponse r
    JOIN Utilisateur u ON r.id_utilisateur = u.id_utilisateur
    WHERE r.id_message = ?
    ORDER BY r.date_reponse ASC
  `, [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Erreur MySQL' });
    res.json(results);
  });
});

app.post('/api/forum/:id_message/reponses', (req, res) => {
  const { id_utilisateur, contenu } = req.body;
  const id_message = req.params.id_message;
  if (!id_utilisateur || !contenu) {
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

app.delete('/api/forum/:id_message', (req, res) => {
  const id_message = req.params.id_message;
  const id_utilisateur = req.body.id_utilisateur; // doit être envoyé côté client
  // On vérifie si l'utilisateur est l'auteur
  db.query(
    'SELECT * FROM ForumDestination WHERE id_message = ? AND id_utilisateur = ?',
    [id_message, id_utilisateur],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Erreur MySQL' });
      if (results.length === 0)
        return res.status(403).json({ error: 'Action non autorisée' });
      // Supprime d'abord les réponses associées
      db.query('DELETE FROM forum_reponse WHERE id_message = ?', [id_message], () => {
        // Puis supprime le message principal
        db.query('DELETE FROM ForumDestination WHERE id_message = ?', [id_message], (err2) => {
          if (err2) return res.status(500).json({ error: 'Erreur MySQL' });
          res.json({ success: true });
        });
      });
    }
  );
});

app.delete('/api/forum/reponse/:id_reponse', (req, res) => {
  const id_reponse = req.params.id_reponse;
  const id_utilisateur = req.body.id_utilisateur;
  // Vérifie si l'utilisateur est l'auteur de la réponse
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
app.get('/api/signalements', (req, res) => {
  const sql = `
    SELECT s.*, a.commentaire, a.id_avis, u.prenom, u.nom, d.universite, d.ville, d.pays
    FROM SignalementAvis s
    JOIN avis a ON s.id_avis = a.id_avis
    JOIN utilisateur u ON a.id_utilisateur = u.id_utilisateur
    JOIN destination d ON a.id_destination = d.id_destination
    ORDER BY s.date_signalement DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({error: "Erreur MySQL"});
    res.json(results);
  });
});

// Valider un signalement (supprimer l'avis et marquer traité)
app.post('/api/admin/signalement/valider', (req, res) => {
  const { id_signalement, id_avis } = req.body;
  // Suppression de l'avis + update du signalement
  db.query("DELETE FROM avis WHERE id_avis = ?", [id_avis], (err) => {
    if (err) return res.status(500).json({ success: false, error: "Erreur suppression avis" });
    db.query("UPDATE SignalementAvis SET statut = 'traite' WHERE id_signalement = ?", [id_signalement], (err2) => {
      if (err2) return res.status(500).json({ success: false, error: "Erreur statut signalement" });
      res.json({ success: true });
    });
  });
});

// Ignorer un signalement (marquer traité mais garder l'avis)
app.post('/api/admin/signalement/ignorer', (req, res) => {
  const { id_signalement } = req.body;
  db.query("UPDATE SignalementAvis SET statut = 'traite' WHERE id_signalement = ?", [id_signalement], (err) => {
    if (err) return res.status(500).json({ success: false, error: "Erreur statut signalement" });
    res.json({ success: true });
  });
});




// === Ajout d’une nouvelle destination ===
app.post('/api/destinations', (req, res) => {
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

    // Récupère le dernier myefrei_id pour incrémenter
    db.query('SELECT myefrei_id FROM Utilisateur ORDER BY id_utilisateur DESC LIMIT 1', (err2, rows2) => {
      let newId = 1;
      if (!err2 && rows2.length > 0) {
        const lastId = parseInt(rows2[0].myefrei_id.replace('efrei', ''), 10);
        newId = lastId + 1;
      }
      const myefrei_id = `efrei${String(newId).padStart(3, '0')}`;
      db.query(
        'INSERT INTO Utilisateur (myefrei_id, prenom, nom, email, mot_de_passe, id_role) VALUES (?, ?, ?, ?, ?, 2)',
        [myefrei_id, prenom, nom, email, password],
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




// ==========================
//   DÉMARRAGE DU SERVEUR
// ==========================
app.listen(PORT, () => {
  console.log(`Serveur backend lancé sur http://localhost:${PORT}`);
});
