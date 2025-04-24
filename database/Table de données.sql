USE efrei_decouverte;

-- Autoriser la colonne cout_vie_moyen à accepter les NULL
ALTER TABLE Destination
  MODIFY cout_vie_moyen DECIMAL(10,2) NULL;

-- Autoriser la colonne empreinte_carbone à accepter les NULL
ALTER TABLE Destination
  MODIFY empreinte_carbone DECIMAL(10,2) NULL;

-- 1. Rôles utilisateurs
INSERT INTO Role (nom_role) VALUES
  ('Admin'),
  ('Utilisateur'),
  ('Invité');

-- 2. Types de mobilité
INSERT INTO MobiliteType (code_type, description) VALUES
  ('I1',  'Semestre international'),
  ('I2',  'Stage en entreprise'),
  ('I3',  'Échange universitaire'),
  ('PEX', 'Mobilités Programme PEX');

-- 3. Destinations
INSERT INTO Destination (
  pays,
  universite,
  ville,
  langue,
  cout_vie_moyen,
  url_universite,
  empreinte_carbone,
  nombre_etudiants
) VALUES
  ('Canada',            'Concordia University',                        'Montréal',      'Anglais',           6850.00, 'https://www.concordia.ca/',                       780.50, 50000),
  ('Afrique du Sud',    'Cape Peninsula University of Technology',    'Cape Town',     'Anglais',           600.00, 'http://www.cput.ac.za/',                          1420.00, 35000),
  ('Royaume-Uni',       'Staffordshire University',                    'Stoke-on-Trent','Anglais',          1200.00, 'https://www.staffs.ac.uk/',                        2000.00, 19000),
  ('Malaisie',          'Asia Pacific University (APU)',               'Kuala Lumpur',  'Anglais',           3200.00, 'https://www.apu.edu.my/',                          1584.00, 15000),
  ('Pologne',           'AGH University of Science and Technology',    'Kraków',        'Polonais/Anglais',  700.00, 'https://www.agh.edu.pl/',                          239.00,  18000),
  ('États-Unis',        'University of California, Irvine (UCI)',      'Irvine',        'Anglais',          11000.00, 'https://www.uci.edu',                              1382.00, 38000),
  ('Canada',            'International Language Academy of Canada',    'Toronto',       'Anglais',           5000.00, 'https://www.ilac.com/',                            912.00,  14000),
  ('Hongrie',           'ESSCA School of Management',                  'Budapest',      'Anglais',          4800.00, 'https://www.essca.eu/',                            233.00,   7000),
  ('République tchèque','Technical University of Ostrava (VSB-TUO)', 'Ostrava',       'Tchèque/Anglais',   3200.00, 'https://www.vsb.cz/en/',                           217.00,  22500),
  ('Chine',             'Southeastern University (SEU)',               'Jiangsu',       'Chinois/Anglais',   650.00, 'http://www.seu.edu.cn/',                          1374.00, 31000),
  ('Inde',              'Manipal Academy of Higher Education',         'Manipal',       'Anglais',           3700.00, 'http://www.manipal.edu',                          1157.00, 30000);

-- 4. Utilisateurs
INSERT INTO Utilisateur (
  myefrei_id,
  nom,
  prenom,
  email,
  mot_de_passe, 
  id_role,
  date_creation
) VALUES
  ('efrei001', 'Dupont', 'Alice',  'alice.dupont@efrei.net', 'alice123', 2, '2023-09-01 10:00:00'),
  ('efrei002', 'Martin', 'Bob',    'bob.martin@efrei.net', 'bob123', 2, '2023-10-12 14:30:00'),
  ('efrei003', 'Durand', 'Claire', 'claire.durand@efrei.net', 'admin123', 1, '2024-02-20 09:15:00'),
  ('efrei004', 'Nguyen', 'David',  'david.nguyen@efrei.net', 'david123', 3, '2024-03-05 11:45:00');

-- 5. Avis
INSERT INTO Avis (
  id_utilisateur,
  id_destination,
  code_type,
  annee_mobilite,
  commentaire
) VALUES
  (1, 1, 'I1', 2023, 'Expérience incroyable à Concordia : cours de haute qualité et vie étudiante dynamique.'),
  (2, 3, 'I3', 2022, 'Staffordshire University offre un bon encadrement mais le coût de la vie est élevé.'),
  (1, 5, 'I2', 2024, 'Stage à AGH University très enrichissant, équipe accueillante.'),
  (4, 2, 'PEX', 2023, 'Cape Peninsula agréable mais l’adaptation au climat est difficile.');


-- 6. Notations par critère
INSERT INTO Notation (id_avis, critere, note) VALUES
  /* Avis #1 */
  (1, 'qualite_cours', 5),
  (1, 'encadrement',   4),
  (1, 'vie_locale',    5),
  (1, 'logement',      3),
  (1, 'accessibilite', 4),
  (1, 'climat',        4),
  /* Avis #2 */
  (2, 'qualite_cours', 3),
  (2, 'encadrement',   3),
  (2, 'vie_locale',    2),
  (2, 'logement',      2),
  (2, 'accessibilite', 3),
  (2, 'climat',        3),
  /* Avis #3 */
  (3, 'qualite_cours', 4),
  (3, 'encadrement',   5),
  (3, 'vie_locale',    4),
  (3, 'logement',      4),
  (3, 'accessibilite', 5),
  (3, 'climat',        4),
  /* Avis #4 */
  (4, 'qualite_cours', 4),
  (4, 'encadrement',   3),
  (4, 'vie_locale',    3),
  (4, 'logement',      2),
  (4, 'accessibilite', 3),
  (4, 'climat',        2);

-- 7. Médias associés aux avis
INSERT INTO Media (id_avis, type_media, url_media_comprime) VALUES
  (1, 'photo', 'https://example.com/media/avis1_photo1.jpg'),
  (1, 'video','https://example.com/media/avis1_video1.mp4'),
  (2, 'photo', 'https://example.com/media/avis2_photo1.jpg');

-- 8. Favoris
INSERT INTO Favori (id_utilisateur, id_destination) VALUES
  (1, 2),
  (1, 3),
  (2, 1),
  (3, 5);

-- 9. Mentions “J’aime” sur les avis
INSERT INTO LikeAvis (id_utilisateur, id_avis) VALUES
  (2, 1),
  (3, 1),
  (1, 2),
  (4, 1);

-- 10. Signalements d’avis
INSERT INTO SignalementAvis (id_avis, id_utilisateur, motif, statut) VALUES
  (3, 2, 'Langage inapproprié dans le commentaire', 'en_attente');
  

-- 11. Forum par destination
INSERT INTO ForumDestination (id_utilisateur, id_destination, contenu) VALUES
  (1, 1, 'Quels conseils pour le logement à Montréal pendant le semestre ?'),
  (2, 1, 'Le quartier Plateau est sympa et plus abordable.'),
  (3, 3, 'Quel est le meilleur moyen de transport à Stoke-on-Trent ?');

INSERT INTO forum_reponse (id_message, id_utilisateur, contenu)
VALUES (1, 2, 'Salut ! Pour le logement à Montréal, regarde du côté des résidences universitaires ou des groupes Facebook dédiés.');


-- Vérifier le contenu de la table
SELECT * FROM Destination;
