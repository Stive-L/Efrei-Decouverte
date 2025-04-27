-- Schema SQL pour le projet « EFREI & Découverte »
-- Base de données MySQL optimisée, charset utf8mb4, engine InnoDB

-- Création de la base et sélection
CREATE DATABASE IF NOT EXISTS efrei_decouverte
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE efrei_decouverte;

-- Table des rôles utilisateurs
CREATE TABLE Role (
  id_role TINYINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identifiant du rôle',
  nom_role VARCHAR(50) NOT NULL COMMENT 'Nom du rôle (Admin, Utilisateur, Invité)',
  PRIMARY KEY (id_role),
  UNIQUE KEY uq_nom_role (nom_role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Table des rôles utilisateurs';

-- Table des utilisateurs EFREI
CREATE TABLE Utilisateur (
  id_utilisateur BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identifiant unique de l’utilisateur',
  myefrei_id VARCHAR(100) NOT NULL COMMENT 'Identifiant myEfrei associé',
  nom VARCHAR(100) NOT NULL COMMENT 'Nom de famille',
  prenom VARCHAR(100) NOT NULL COMMENT 'Prénom',
  email VARCHAR(150) NOT NULL COMMENT 'Adresse email',
  mot_de_passe VARCHAR(255) NOT NULL COMMENT 'Mot de passe',
  id_role TINYINT UNSIGNED NOT NULL COMMENT 'Référence au rôle utilisateur',
  date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création du compte',
  PRIMARY KEY (id_utilisateur),
  UNIQUE KEY uq_email (email),
  UNIQUE KEY uq_myefrei (myefrei_id),
  KEY idx_id_role (id_role),
  CONSTRAINT fk_utilisateur_role FOREIGN KEY (id_role)
    REFERENCES Role (id_role)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Table des comptes utilisateurs';

-- Table des destinations de mobilité
CREATE TABLE Destination (
  id_destination INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identifiant unique de la destination',
  pays VARCHAR(100) NOT NULL COMMENT 'Pays',
  universite VARCHAR(255) NOT NULL COMMENT 'Université partenaire',
  ville VARCHAR(100) NOT NULL COMMENT 'Ville de la destination',
  langue VARCHAR(100) NOT NULL COMMENT 'Langue(s) d’enseignement',
  cout_vie_moyen DECIMAL(10,2) NOT NULL COMMENT 'Coût de la vie moyen en EUR',
  url_universite VARCHAR(255) COMMENT 'Lien vers le site officiel',
  empreinte_carbone DECIMAL(10,2) COMMENT 'Empreinte carbone estimée (kg CO2)',
  nombre_etudiants INT UNSIGNED COMMENT 'Nombre d’étudiants dans l’université partenaire',
  PRIMARY KEY (id_destination),
  KEY idx_pays (pays),
  KEY idx_ville (ville)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Informations officielles sur les destinations';

-- Table des types de mobilité (I1, I2, etc.)
CREATE TABLE MobiliteType (
  code_type CHAR(5) NOT NULL COMMENT 'Code du type de mobilité',
  description VARCHAR(100) NOT NULL COMMENT 'Libellé du type de mobilité',
  PRIMARY KEY (code_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Catalogue des types de mobilité';

-- Table des avis étudiants
CREATE TABLE Avis (
  id_avis BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identifiant unique de l’avis',
  id_utilisateur BIGINT UNSIGNED NOT NULL COMMENT 'Auteur de l’avis',
  id_destination INT UNSIGNED NOT NULL COMMENT 'Destination évaluée',
  code_type CHAR(5) NOT NULL COMMENT 'Type de mobilité (réf. MobiliteType)',
  annee_mobilite YEAR NOT NULL COMMENT 'Année de la mobilité',
  commentaire TEXT COMMENT 'Texte détaillé de l’avis',
  date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Date de création de l’avis',
  PRIMARY KEY (id_avis),
  KEY idx_avis_utilisateur (id_utilisateur),
  KEY idx_avis_destination (id_destination),
  CONSTRAINT fk_avis_utilisateur FOREIGN KEY (id_utilisateur)
    REFERENCES Utilisateur (id_utilisateur)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_avis_destination FOREIGN KEY (id_destination)
    REFERENCES Destination (id_destination)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_avis_type FOREIGN KEY (code_type)
    REFERENCES MobiliteType (code_type)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Avis des étudiants sur les destinations';

-- Table des notations multi-critères
CREATE TABLE Notation (
  id_notation BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identifiant de la notation',
  id_avis BIGINT UNSIGNED NOT NULL COMMENT 'Avis concerné',
  critere ENUM('qualite_cours','encadrement','vie_locale','logement','accessibilite','climat') NOT NULL COMMENT 'Critère évalué',
  note TINYINT UNSIGNED NOT NULL COMMENT 'Note (1-5)',
  PRIMARY KEY (id_notation),
  KEY idx_notation_avis (id_avis),
  CONSTRAINT fk_notation_avis FOREIGN KEY (id_avis)
    REFERENCES Avis (id_avis)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Notes détaillées par critère pour chaque avis';

-- Table des médias liés aux avis
CREATE TABLE Media (
  id_media BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identifiant du média',
  id_avis BIGINT UNSIGNED NOT NULL COMMENT 'Avis associé',
  type_media ENUM('photo','video') NOT NULL COMMENT 'Type de média',
  url_media_comprime VARCHAR(255) NOT NULL COMMENT 'URL du média compressé',
  PRIMARY KEY (id_media),
  KEY idx_media_avis (id_avis),
  CONSTRAINT fk_media_avis FOREIGN KEY (id_avis)
    REFERENCES Avis (id_avis)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Photos et vidéos associées aux avis';

-- Table des favoris
CREATE TABLE Favori (
  id_utilisateur BIGINT UNSIGNED NOT NULL COMMENT 'Utilisateur',
  id_destination INT UNSIGNED NOT NULL COMMENT 'Destination favorisée',
  date_ajout DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Date d’ajout',
  PRIMARY KEY (id_utilisateur, id_destination),
  CONSTRAINT fk_favori_utilisateur FOREIGN KEY (id_utilisateur)
    REFERENCES Utilisateur (id_utilisateur)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_favori_destination FOREIGN KEY (id_destination)
    REFERENCES Destination (id_destination)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Liste des destinations ajoutées aux favoris';

-- Table des likes (« retours utiles »)
CREATE TABLE LikeAvis (
  id_utilisateur BIGINT UNSIGNED NOT NULL COMMENT 'Utilisateur',
  id_avis BIGINT UNSIGNED NOT NULL COMMENT 'Avis liké',
  date_like DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Date du like',
  PRIMARY KEY (id_utilisateur, id_avis),
  CONSTRAINT fk_likeavis_utilisateur FOREIGN KEY (id_utilisateur)
    REFERENCES Utilisateur (id_utilisateur)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_likeavis_avis FOREIGN KEY (id_avis)
    REFERENCES Avis (id_avis)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Mentions utiles pour chaque avis';

-- Table des signalements d’avis
CREATE TABLE SignalementAvis (
  id_signalement BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identifiant du signalement',
  id_avis BIGINT UNSIGNED NOT NULL COMMENT 'Avis signalé',
  id_utilisateur BIGINT UNSIGNED NOT NULL COMMENT 'Utilisateur ayant signalé',
  motif TEXT NOT NULL COMMENT 'Motif du signalement',
  statut ENUM('en_attente','en_cours','resolu','rejete') NOT NULL DEFAULT 'en_attente' COMMENT 'Statut du signalement',
  date_signalement DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Date du signalement',
  PRIMARY KEY (id_signalement),
  KEY idx_signal_avis (id_avis),
  KEY idx_signal_utilisateur (id_utilisateur),
  CONSTRAINT fk_signal_avis FOREIGN KEY (id_avis)
    REFERENCES Avis (id_avis)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_signal_utilisateur FOREIGN KEY (id_utilisateur)
    REFERENCES Utilisateur (id_utilisateur)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Signalements d’avis problématiques';

-- Table de forum/discussion par destination
CREATE TABLE ForumDestination (
  id_message BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identifiant du message de forum',
  id_utilisateur BIGINT UNSIGNED NOT NULL COMMENT 'Auteur du message',
  id_destination INT UNSIGNED NOT NULL COMMENT 'Destination concernée',
  contenu TEXT NOT NULL COMMENT 'Contenu du message',
  date_message DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Date du message',
  PRIMARY KEY (id_message),
  KEY idx_forum_dest (id_destination),
  KEY idx_forum_user (id_utilisateur),
  CONSTRAINT fk_forum_user FOREIGN KEY (id_utilisateur)
    REFERENCES Utilisateur (id_utilisateur)
    ON UPDATE CASCADE
    ON DELETE CASCADE,
  CONSTRAINT fk_forum_destination FOREIGN KEY (id_destination)
    REFERENCES Destination (id_destination)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Espace de discussion par destination';

CREATE TABLE forum_reponse (
  id_reponse INT AUTO_INCREMENT PRIMARY KEY,
  id_message BIGINT UNSIGNED NOT NULL,
  id_utilisateur BIGINT UNSIGNED NOT NULL,
  contenu TEXT NOT NULL,
  date_reponse DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_message) REFERENCES ForumDestination(id_message),
  FOREIGN KEY (id_utilisateur) REFERENCES Utilisateur(id_utilisateur)
)ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Réponses aux forums';

-- Table des statistiques écologiques et d’activité du site
CREATE TABLE StatistiquesEco (
  id_stat INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Identifiant statistique',
  date_stat DATE NOT NULL COMMENT 'Date du relevé',
  empreinte_carbone_page DECIMAL(10,2) NOT NULL COMMENT 'Empreinte carbone cumulée du site (kg CO2)',
  visites_total BIGINT UNSIGNED NOT NULL COMMENT 'Nombre total de visites',
  avis_total BIGINT UNSIGNED NOT NULL COMMENT 'Nombre total d’avis publiés',
  PRIMARY KEY (id_stat),
  UNIQUE KEY uq_date_stat (date_stat)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Statistiques sur l’impact écologique et l’activité du site';

ALTER TABLE Utilisateur ADD COLUMN is_hashed BOOLEAN NOT NULL DEFAULT 0;
