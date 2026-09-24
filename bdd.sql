-- phpMyAdmin SQL Dump
-- version 5.2.1deb1+deb12u1
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost:3306
-- Généré le : jeu. 24 sep. 2026 à 08:39
-- Version du serveur : 10.11.14-MariaDB-0+deb12u2
-- Version de PHP : 8.2.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `foodtech_test`
--

-- --------------------------------------------------------

--
-- Structure de la table `aliment`
--

CREATE TABLE `aliment` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `categorie` varchar(50) DEFAULT NULL,
  `kcal_100g` decimal(6,1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `aliment`
--

INSERT INTO `aliment` (`id`, `nom`, `categorie`, `kcal_100g`) VALUES
(1, 'Eau de recyclage', 'Hydratation', 0.0),
(2, 'Électrolytes & Sel (NaCl)', 'Minéraux', 0.0),
(3, 'Patate douce', 'Tubercules / Glucides', 86.0),
(4, 'Quinoa', 'Céréales / Graines', 368.0),
(5, 'Soja', 'Légumineuses', 446.0),
(6, 'Pois chiches', 'Légumineuses', 364.0),
(7, 'Spiruline', 'Micro-algues', 290.0),
(8, 'Lentilles d\'eau (Wolffia)', 'Plantes aquatiques', 40.0),
(9, 'Champignons (Shiitaké / Pleurote)', 'Fungi', 34.0),
(10, 'Tomate naine (Micro-Tom)', 'Fruits de serre', 18.0),
(11, 'Fraise naine (Saisonnière/LED)', 'Fruits de serre', 32.0),
(12, 'Citron / Agrume nain', 'Fruits de serre', 29.0),
(13, 'Poivron / Piment doux', 'Fruits de serre', 26.0),
(14, 'Piment piquant nain', 'Condiments', 40.0),
(15, 'Ail & Ciboulette', 'Condiments', 110.0);

-- --------------------------------------------------------

--
-- Structure de la table `aliment_allergene`
--

CREATE TABLE `aliment_allergene` (
  `aliment_id` int(11) NOT NULL,
  `allergie_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `aliment_allergie`
--

CREATE TABLE `aliment_allergie` (
  `ID_aliment` int(11) NOT NULL,
  `nom_aliment` varchar(150) NOT NULL,
  `id_allergie` int(11) NOT NULL,
  `nom_allergie` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `aliment_allergie`
--

INSERT INTO `aliment_allergie` (`ID_aliment`, `nom_aliment`, `id_allergie`, `nom_allergie`) VALUES
(3, 'Patate douce', 12, 'Latex'),
(4, 'Quinoa', 19, 'Saponine'),
(5, 'Soja', 20, 'Soja'),
(6, 'Pois chiches', 2, 'Arachides'),
(7, 'Spiruline', 15, 'Phycocyanine'),
(9, 'Champignons (Shiitaké / Pleurote)', 13, 'Lentinan / Spores'),
(10, 'Tomate naine (Micro-Tom)', 9, 'Histamine'),
(11, 'Fraise naine (Saisonnière/LED)', 9, 'Histamine'),
(13, 'Poivron / Piment doux', 9, 'Histamine'),
(14, 'Piment piquant nain', 3, 'Capsaïcine'),
(15, 'Ail & Ciboulette', 6, 'FODMAPs (Fructanes)');

-- --------------------------------------------------------

--
-- Structure de la table `aliment_nutriment`
--

CREATE TABLE `aliment_nutriment` (
  `aliment_id` int(11) NOT NULL,
  `nom_aliment` varchar(150) NOT NULL,
  `nutriment_id` int(11) NOT NULL,
  `nom_nutriment` varchar(100) NOT NULL,
  `quantite_100g` decimal(8,2) NOT NULL,
  `unite` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `aliment_nutriment`
--

INSERT INTO `aliment_nutriment` (`aliment_id`, `nom_aliment`, `nutriment_id`, `nom_nutriment`, `quantite_100g`, `unite`) VALUES
(2, 'Électrolytes & Sel (NaCl)', 5, 'Calcium', 200.00, 'mg'),
(2, 'Électrolytes & Sel (NaCl)', 7, 'Potassium', 1000.00, 'mg'),
(2, 'Électrolytes & Sel (NaCl)', 8, 'Sodium', 38700.00, 'mg'),
(2, 'Électrolytes & Sel (NaCl)', 9, 'Magnésium', 100.00, 'mg'),
(3, 'Patate douce', 1, 'Protéines', 1.60, 'g'),
(3, 'Patate douce', 2, 'Glucides', 20.10, 'g'),
(3, 'Patate douce', 3, 'Lipides', 0.10, 'g'),
(3, 'Patate douce', 4, 'Fibres alimentaires', 3.00, 'g'),
(3, 'Patate douce', 6, 'Fer', 0.60, 'mg'),
(3, 'Patate douce', 7, 'Potassium', 337.00, 'mg'),
(3, 'Patate douce', 11, 'Vitamine A (Bêta-carotène)', 709.00, 'µg'),
(3, 'Patate douce', 12, 'Vitamine C', 2.40, 'mg'),
(4, 'Quinoa', 1, 'Protéines', 14.10, 'g'),
(4, 'Quinoa', 2, 'Glucides', 64.20, 'g'),
(4, 'Quinoa', 3, 'Lipides', 6.10, 'g'),
(4, 'Quinoa', 4, 'Fibres alimentaires', 7.00, 'g'),
(4, 'Quinoa', 6, 'Fer', 4.60, 'mg'),
(4, 'Quinoa', 7, 'Potassium', 563.00, 'mg'),
(4, 'Quinoa', 9, 'Magnésium', 197.00, 'mg'),
(4, 'Quinoa', 10, 'Zinc', 3.10, 'mg'),
(5, 'Soja', 1, 'Protéines', 36.50, 'g'),
(5, 'Soja', 2, 'Glucides', 30.20, 'g'),
(5, 'Soja', 3, 'Lipides', 19.90, 'g'),
(5, 'Soja', 4, 'Fibres alimentaires', 9.30, 'g'),
(5, 'Soja', 5, 'Calcium', 277.00, 'mg'),
(5, 'Soja', 6, 'Fer', 15.70, 'mg'),
(5, 'Soja', 7, 'Potassium', 1797.00, 'mg'),
(5, 'Soja', 9, 'Magnésium', 280.00, 'mg'),
(6, 'Pois chiches', 1, 'Protéines', 19.30, 'g'),
(6, 'Pois chiches', 2, 'Glucides', 60.70, 'g'),
(6, 'Pois chiches', 3, 'Lipides', 6.00, 'g'),
(6, 'Pois chiches', 4, 'Fibres alimentaires', 17.40, 'g'),
(6, 'Pois chiches', 5, 'Calcium', 105.00, 'mg'),
(6, 'Pois chiches', 6, 'Fer', 6.20, 'mg'),
(6, 'Pois chiches', 7, 'Potassium', 875.00, 'mg'),
(7, 'Spiruline', 1, 'Protéines', 57.50, 'g'),
(7, 'Spiruline', 2, 'Glucides', 23.90, 'g'),
(7, 'Spiruline', 3, 'Lipides', 7.70, 'g'),
(7, 'Spiruline', 4, 'Fibres alimentaires', 3.60, 'g'),
(7, 'Spiruline', 6, 'Fer', 28.50, 'mg'),
(7, 'Spiruline', 9, 'Magnésium', 195.00, 'mg'),
(7, 'Spiruline', 11, 'Vitamine A (Bêta-carotène)', 290.00, 'µg'),
(7, 'Spiruline', 14, 'Vitamine B12', 2.50, 'µg'),
(8, 'Lentilles d\'eau (Wolffia)', 1, 'Protéines', 4.20, 'g'),
(8, 'Lentilles d\'eau (Wolffia)', 2, 'Glucides', 3.00, 'g'),
(8, 'Lentilles d\'eau (Wolffia)', 3, 'Lipides', 0.70, 'g'),
(8, 'Lentilles d\'eau (Wolffia)', 4, 'Fibres alimentaires', 2.10, 'g'),
(8, 'Lentilles d\'eau (Wolffia)', 6, 'Fer', 2.10, 'mg'),
(8, 'Lentilles d\'eau (Wolffia)', 14, 'Vitamine B12', 0.80, 'µg'),
(8, 'Lentilles d\'eau (Wolffia)', 15, 'Oméga-3 (EPA/DHA)', 0.20, 'g'),
(9, 'Champignons (Shiitaké / Pleurote)', 1, 'Protéines', 2.20, 'g'),
(9, 'Champignons (Shiitaké / Pleurote)', 2, 'Glucides', 6.80, 'g'),
(9, 'Champignons (Shiitaké / Pleurote)', 3, 'Lipides', 0.30, 'g'),
(9, 'Champignons (Shiitaké / Pleurote)', 4, 'Fibres alimentaires', 2.50, 'g'),
(9, 'Champignons (Shiitaké / Pleurote)', 7, 'Potassium', 304.00, 'mg'),
(9, 'Champignons (Shiitaké / Pleurote)', 10, 'Zinc', 1.00, 'mg'),
(9, 'Champignons (Shiitaké / Pleurote)', 13, 'Vitamine D', 2.10, 'µg'),
(10, 'Tomate naine (Micro-Tom)', 1, 'Protéines', 0.90, 'g'),
(10, 'Tomate naine (Micro-Tom)', 2, 'Glucides', 3.90, 'g'),
(10, 'Tomate naine (Micro-Tom)', 3, 'Lipides', 0.20, 'g'),
(10, 'Tomate naine (Micro-Tom)', 4, 'Fibres alimentaires', 1.20, 'g'),
(10, 'Tomate naine (Micro-Tom)', 7, 'Potassium', 237.00, 'mg'),
(10, 'Tomate naine (Micro-Tom)', 11, 'Vitamine A (Bêta-carotène)', 42.00, 'µg'),
(10, 'Tomate naine (Micro-Tom)', 12, 'Vitamine C', 13.70, 'mg'),
(11, 'Fraise naine (Saisonnière/LED)', 1, 'Protéines', 0.70, 'g'),
(11, 'Fraise naine (Saisonnière/LED)', 2, 'Glucides', 7.70, 'g'),
(11, 'Fraise naine (Saisonnière/LED)', 3, 'Lipides', 0.30, 'g'),
(11, 'Fraise naine (Saisonnière/LED)', 4, 'Fibres alimentaires', 2.00, 'g'),
(11, 'Fraise naine (Saisonnière/LED)', 7, 'Potassium', 153.00, 'mg'),
(11, 'Fraise naine (Saisonnière/LED)', 12, 'Vitamine C', 58.80, 'mg'),
(12, 'Citron / Agrume nain', 1, 'Protéines', 1.10, 'g'),
(12, 'Citron / Agrume nain', 2, 'Glucides', 9.30, 'g'),
(12, 'Citron / Agrume nain', 3, 'Lipides', 0.30, 'g'),
(12, 'Citron / Agrume nain', 4, 'Fibres alimentaires', 2.80, 'g'),
(12, 'Citron / Agrume nain', 7, 'Potassium', 138.00, 'mg'),
(12, 'Citron / Agrume nain', 12, 'Vitamine C', 53.00, 'mg'),
(13, 'Poivron / Piment doux', 1, 'Protéines', 1.00, 'g'),
(13, 'Poivron / Piment doux', 2, 'Glucides', 6.00, 'g'),
(13, 'Poivron / Piment doux', 3, 'Lipides', 0.20, 'g'),
(13, 'Poivron / Piment doux', 4, 'Fibres alimentaires', 2.10, 'g'),
(13, 'Poivron / Piment doux', 7, 'Potassium', 211.00, 'mg'),
(13, 'Poivron / Piment doux', 11, 'Vitamine A (Bêta-carotène)', 157.00, 'µg'),
(13, 'Poivron / Piment doux', 12, 'Vitamine C', 127.70, 'mg'),
(14, 'Piment piquant nain', 1, 'Protéines', 1.90, 'g'),
(14, 'Piment piquant nain', 2, 'Glucides', 8.80, 'g'),
(14, 'Piment piquant nain', 3, 'Lipides', 0.40, 'g'),
(14, 'Piment piquant nain', 4, 'Fibres alimentaires', 1.50, 'g'),
(14, 'Piment piquant nain', 7, 'Potassium', 322.00, 'mg'),
(14, 'Piment piquant nain', 11, 'Vitamine A (Bêta-carotène)', 48.00, 'µg'),
(14, 'Piment piquant nain', 12, 'Vitamine C', 143.70, 'mg'),
(15, 'Ail & Ciboulette', 1, 'Protéines', 6.40, 'g'),
(15, 'Ail & Ciboulette', 2, 'Glucides', 33.10, 'g'),
(15, 'Ail & Ciboulette', 3, 'Lipides', 0.50, 'g'),
(15, 'Ail & Ciboulette', 4, 'Fibres alimentaires', 2.10, 'g'),
(15, 'Ail & Ciboulette', 5, 'Calcium', 181.00, 'mg'),
(15, 'Ail & Ciboulette', 6, 'Fer', 1.70, 'mg'),
(15, 'Ail & Ciboulette', 7, 'Potassium', 401.00, 'mg'),
(15, 'Ail & Ciboulette', 12, 'Vitamine C', 31.20, 'mg');

-- --------------------------------------------------------

--
-- Structure de la table `allergie`
--

CREATE TABLE `allergie` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `allergie`
--

INSERT INTO `allergie` (`id`, `nom`) VALUES
(1, 'Acariens'),
(2, 'Arachides'),
(3, 'Capsaïcine'),
(4, 'Crevettes / Crustacés'),
(5, 'FODMAPs (Fructanes)'),
(6, 'Fruits à coque'),
(7, 'Gluten'),
(8, 'Histamine'),
(9, 'Kiwi'),
(10, 'Lactose'),
(11, 'Latex'),
(12, 'Lentinan / Spores'),
(13, 'Nickel'),
(17, 'Pénicilline'),
(14, 'Phycocyanine'),
(15, 'Poils de chat'),
(16, 'Pollen'),
(18, 'Saponine'),
(19, 'Soja'),
(20, 'Venin d\'abeille');

-- --------------------------------------------------------

--
-- Structure de la table `astronaute`
--

CREATE TABLE `astronaute` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `prenom` varchar(100) NOT NULL,
  `taille_cm` decimal(5,1) NOT NULL,
  `poids_kg` decimal(5,1) NOT NULL,
  `date_naissance` date NOT NULL,
  `sexe` enum('M','F') NOT NULL,
  `niveau_activite_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `astronaute`
--

INSERT INTO `astronaute` (`id`, `nom`, `prenom`, `taille_cm`, `poids_kg`, `date_naissance`, `sexe`, `niveau_activite_id`) VALUES
(1, 'Dupont', 'Camille', 165.0, 62.0, '1988-03-14', 'F', 1),
(2, 'Martin', 'Lucas', 182.0, 78.0, '1995-07-22', 'M', 2),
(3, 'Benali', 'Sofia', 158.0, 51.0, '2001-11-05', 'F', 3),
(4, 'Bernard', 'Thomas', 175.0, 84.0, '1979-01-30', 'M', 4),
(5, 'Petit', 'Emma', 162.0, 49.0, '2010-09-12', 'F', 5),
(6, 'Moreau', 'Antoine', 188.0, 91.0, '1992-04-18', 'M', 6),
(7, 'Roux', 'Chloé', 170.0, 65.0, '1985-06-03', 'F', 7),
(8, 'Lemaire', 'Youssef', 179.0, 72.0, '2004-12-27', 'M', 8),
(9, 'Lefebvre', 'Julie', 160.0, 58.0, '1973-08-09', 'F', 9),
(10, 'Garcia', 'Maxime', 185.0, 80.0, '1998-02-15', 'M', 10),
(11, 'David', 'Manon', 167.0, 55.0, '2007-05-21', 'F', 11),
(12, 'Bertrand', 'Gabriel', 173.0, 86.0, '1968-10-08', 'M', 12),
(13, 'Girard', 'Inès', 171.0, 63.0, '1990-01-19', 'F', 13),
(14, 'Vincent', 'Hugo', 176.0, 69.0, '2002-04-11', 'M', 14),
(15, 'Mercier', 'Sarah', 164.0, 70.0, '1982-02-02', 'F', 15),
(16, 'Trifeu', 'Mouloude', 187.0, 85.0, '1999-09-22', 'M', 16),
(17, 'Lasson', 'Adrien', 185.0, 81.0, '2006-02-07', 'M', 1);

-- --------------------------------------------------------

--
-- Structure de la table `astronaute_allergie`
--

CREATE TABLE `astronaute_allergie` (
  `astronaute_id` int(11) NOT NULL,
  `allergie_id` int(11) NOT NULL,
  `gravite` varchar(255) DEFAULT 'moderee'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `astronaute_allergie`
--

INSERT INTO `astronaute_allergie` (`astronaute_id`, `allergie_id`, `gravite`) VALUES
(1, 1, 'Élevée'),
(1, 19, 'moderee'),
(3, 2, 'Faible'),
(4, 3, 'Critique'),
(5, 4, 'Modérée'),
(6, 5, 'Faible'),
(7, 6, 'Faible'),
(7, 7, 'Élevée'),
(9, 8, 'Élevée'),
(10, 9, 'Modérée'),
(11, 10, 'Modérée'),
(12, 11, 'Élevée'),
(13, 12, 'Faible'),
(15, 13, 'Critique'),
(15, 14, 'Modérée');

-- --------------------------------------------------------

--
-- Structure de la table `catalogue_aliments`
--

CREATE TABLE `catalogue_aliments` (
  `id` int(11) NOT NULL,
  `nom_aliment` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `catalogue_aliments`
--

INSERT INTO `catalogue_aliments` (`id`, `nom_aliment`) VALUES
(1, 'Eau de recyclage'),
(2, 'Électrolytes & Sel (NaCl)'),
(3, 'Patate douce'),
(4, 'Quinoa'),
(5, 'Soja (Allergène majeur)'),
(6, 'Pois chiches'),
(7, 'Spiruline'),
(8, 'Lentilles d\'eau (Wolffia)'),
(9, 'Champignons (Shiitaké / Pleurote)'),
(10, 'Tomate naine (Micro-Tom)'),
(11, 'Fraise naine'),
(12, 'Citron / Agrume nain'),
(13, 'Poivron / Piment doux'),
(14, 'Piment piquant nain'),
(15, 'Ail & Ciboulette');

-- --------------------------------------------------------

--
-- Structure de la table `niveau_activite`
--

CREATE TABLE `niveau_activite` (
  `id` int(11) NOT NULL,
  `libelle` varchar(50) NOT NULL,
  `coefficient` decimal(3,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `niveau_activite`
--

INSERT INTO `niveau_activite` (`id`, `libelle`, `coefficient`) VALUES
(1, 'Commandement & Operations', 1.40),
(2, 'Pilotage & Navigation', 1.40),
(3, 'Medecine & Suivi de santé', 1.50),
(4, 'Maintenance ECLSS & Support de vie', 1.60),
(5, 'Botanique & Serre hydroponique', 1.70),
(6, 'Biotechnologie & Bioreacteurs', 1.50),
(7, 'Nutrition & Preparation des repas', 1.60),
(8, 'Communications & Reseaux', 1.30),
(9, 'Gestion Energie & Panneaux solaires', 1.50),
(10, 'Biochimie & Recyclage des dechets', 1.60),
(11, 'Maintenance mecanique & Impression 3D', 1.70),
(12, 'Surveillance Radiations & Physique', 1.30),
(13, 'Sortie extra-vehiculaire (EVA)', 2.20),
(14, 'Entrainement physique & Coaching', 2.00),
(15, 'Analyse de donnees & Astronomie', 1.30),
(16, 'Admin', 1.00);

-- --------------------------------------------------------

--
-- Structure de la table `nutriment`
--

CREATE TABLE `nutriment` (
  `id` int(11) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `unite` varchar(10) NOT NULL,
  `apport_jour_recommande` decimal(8,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `nutriment`
--

INSERT INTO `nutriment` (`id`, `nom`, `unite`, `apport_jour_recommande`) VALUES
(1, 'Protéines', 'g', 90.00),
(2, 'Glucides', 'g', 300.00),
(3, 'Lipides', 'g', 70.00),
(4, 'Fibres alimentaires', 'g', 30.00),
(5, 'Calcium', 'mg', 1000.00),
(6, 'Fer', 'mg', 15.00),
(7, 'Potassium', 'mg', 3500.00),
(8, 'Sodium', 'mg', 2300.00),
(9, 'Magnésium', 'mg', 400.00),
(10, 'Zinc', 'mg', 11.00),
(11, 'Vitamine A (Bêta-carotène)', 'µg', 800.00),
(12, 'Vitamine C', 'mg', 110.00),
(13, 'Vitamine D', 'µg', 15.00),
(14, 'Vitamine B12', 'µg', 2.50),
(15, 'Oméga-3 (EPA/DHA)', 'g', 2.00);

-- --------------------------------------------------------

--
-- Structure de la table `reclamation`
--

CREATE TABLE `reclamation` (
  `id` int(11) NOT NULL,
  `astronaute_id` int(11) DEFAULT NULL,
  `nom_astronaute` varchar(100) DEFAULT NULL,
  `prenom_astronaute` varchar(100) DEFAULT NULL,
  `repas_id` int(11) DEFAULT NULL,
  `meal_type` varchar(50) NOT NULL,
  `portion_size` int(11) NOT NULL,
  `nom_repas` varchar(255) DEFAULT NULL,
  `date_reclamation` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `reclamation`
--

INSERT INTO `reclamation` (`id`, `astronaute_id`, `nom_astronaute`, `prenom_astronaute`, `repas_id`, `meal_type`, `portion_size`, `nom_repas`, `date_reclamation`) VALUES
(1, NULL, NULL, NULL, 7, 'recommandé', 4, NULL, '2026-09-22 14:28:35'),
(2, NULL, NULL, NULL, 1, 'complet', 3, NULL, '2026-09-23 07:49:22'),
(3, NULL, NULL, NULL, 4, 'modéré', 2, NULL, '2026-09-23 07:53:24'),
(4, NULL, NULL, NULL, 2, 'minimum', 1, NULL, '2026-09-23 07:54:03'),
(5, NULL, NULL, NULL, 3, 'minimum', 1, NULL, '2026-09-23 07:57:31'),
(6, NULL, NULL, NULL, 9, 'minimum', 1, NULL, '2026-09-23 08:32:14'),
(7, NULL, NULL, NULL, 1, 'recommandé', 4, NULL, '2026-09-23 09:33:48'),
(8, NULL, NULL, NULL, 1, 'minimum', 1, NULL, '2026-09-23 09:33:54'),
(9, NULL, NULL, NULL, 2, 'complet', 3, NULL, '2026-09-23 09:48:53'),
(10, NULL, NULL, NULL, 1, 'minimum', 1, NULL, '2026-09-23 09:54:09'),
(11, NULL, NULL, NULL, 1, 'minimum', 1, NULL, '2026-09-23 10:00:57'),
(12, NULL, NULL, NULL, 1, 'minimum', 1, NULL, '2026-09-23 10:06:24'),
(13, NULL, NULL, NULL, 1, 'minimum', 1, NULL, '2026-09-23 10:23:34'),
(14, NULL, NULL, NULL, 3, 'complet', 3, NULL, '2026-09-23 10:30:01'),
(15, NULL, NULL, NULL, 1, 'minimum', 1, NULL, '2026-09-23 11:27:23'),
(16, NULL, NULL, NULL, 10, 'minimum', 1, NULL, '2026-09-23 11:48:35'),
(17, NULL, NULL, NULL, 6, 'minimum', 1, NULL, '2026-09-23 11:48:58'),
(18, NULL, NULL, NULL, 1, 'minimum', 1, 'Salade de Wolffia, Edamames & Tomates naines', '2026-09-23 14:14:32'),
(19, 1, 'Dupont', 'Camille', 1, 'recommandé', 4, 'Salade de Wolffia, Edamames & Tomates naines', '2026-09-23 14:21:12'),
(20, 1, 'Dupont', 'Camille', 1, 'recommandé', 4, 'Salade de Wolffia, Edamames & Tomates naines', '2026-09-23 14:44:24'),
(21, 1, 'Dupont', 'Camille', 1, 'minimum', 1, 'Salade de Wolffia, Edamames & Tomates naines', '2026-09-23 14:45:28'),
(22, 1, 'Dupont', 'Camille', 1, 'minimum', 1, 'Salade de Wolffia, Edamames & Tomates naines', '2026-09-23 14:45:33'),
(23, 1, 'Dupont', 'Camille', 1, 'minimum', 1, 'Salade de Wolffia, Edamames & Tomates naines', '2026-09-23 14:51:21'),
(24, 1, 'Dupont', 'Camille', 1, 'minimum', 1, 'Salade de Wolffia, Edamames & Tomates naines', '2026-09-23 14:51:26'),
(25, 1, 'Dupont', 'Camille', 6, 'minimum', 1, 'Quinoa façon Paëlla spatiale', '2026-09-23 14:51:31'),
(26, 1, 'Dupont', 'Camille', 1, 'minimum', 1, 'Salade de Wolffia, Edamames & Tomates naines', '2026-09-23 14:51:36'),
(27, 1, 'Dupont', 'Camille', 2, 'minimum', 1, 'Taboulé de quinoa, tomates, poivrons & spiruline', '2026-09-23 14:51:42'),
(28, 1, 'Dupont', 'Camille', 2, 'minimum', 1, 'Taboulé de quinoa, tomates, poivrons & spiruline', '2026-09-23 14:51:46'),
(29, 1, 'Dupont', 'Camille', 2, 'minimum', 1, 'Taboulé de quinoa, tomates, poivrons & spiruline', '2026-09-23 14:51:52'),
(30, 1, 'Dupont', 'Camille', 2, 'minimum', 1, 'Taboulé de quinoa, tomates, poivrons & spiruline', '2026-09-23 14:52:16'),
(31, 1, 'Dupont', 'Camille', 2, 'minimum', 1, 'Taboulé de quinoa, tomates, poivrons & spiruline', '2026-09-23 14:52:24'),
(32, 1, 'Dupont', 'Camille', 2, 'minimum', 1, 'Taboulé de quinoa, tomates, poivrons & spiruline', '2026-09-23 14:52:49'),
(33, 1, 'Dupont', 'Camille', 1, 'minimum', 1, 'Salade de Wolffia, Edamames & Tomates naines', '2026-09-23 14:53:36'),
(34, 1, 'Dupont', 'Camille', 1, 'minimum', 1, 'Salade de Wolffia, Edamames & Tomates naines', '2026-09-23 14:53:41'),
(35, 1, 'Dupont', 'Camille', 2, 'minimum', 1, 'Taboulé de quinoa, tomates, poivrons & spiruline', '2026-09-23 14:54:12'),
(36, 1, 'Dupont', 'Camille', 2, 'minimum', 1, 'Taboulé de quinoa, tomates, poivrons & spiruline', '2026-09-23 14:54:24'),
(37, 1, 'Dupont', 'Camille', 2, 'minimum', 1, 'Taboulé de quinoa, tomates, poivrons & spiruline', '2026-09-23 14:54:32'),
(38, 1, 'Dupont', 'Camille', 2, 'minimum', 1, 'Taboulé de quinoa, tomates, poivrons & spiruline', '2026-09-23 14:54:42'),
(39, 1, 'Dupont', 'Camille', 1, 'minimum', 1, 'Salade de Wolffia, Edamames & Tomates naines', '2026-09-23 14:55:45'),
(40, 1, 'Dupont', 'Camille', 1, 'minimum', 1, 'Salade de Wolffia, Edamames & Tomates naines', '2026-09-23 14:56:06'),
(41, 1, 'Dupont', 'Camille', 1, 'minimum', 1, 'Salade de Wolffia, Edamames & Tomates naines', '2026-09-23 14:56:20'),
(42, 1, 'Dupont', 'Camille', 4, 'minimum', 1, 'Salade de jeunes feuilles de patate douce au citron', '2026-09-23 14:56:27'),
(43, 1, 'Dupont', 'Camille', 2, 'minimum', 1, 'Taboulé de quinoa, tomates, poivrons & spiruline', '2026-09-23 14:56:47'),
(44, 1, 'Dupont', 'Camille', 3, 'minimum', 1, 'Salade croquante de poivrons, radis & germes de soja', '2026-09-23 14:57:47'),
(45, 1, 'Dupont', 'Camille', 1, 'minimum', 1, 'Salade de Wolffia, Edamames & Tomates naines', '2026-09-23 14:57:59'),
(46, 1, 'Dupont', 'Camille', 4, 'minimum', 1, 'Salade de jeunes feuilles de patate douce au citron', '2026-09-23 14:59:07'),
(47, 1, 'Dupont', 'Camille', 2, 'minimum', 1, 'Taboulé de quinoa, tomates, poivrons & spiruline', '2026-09-23 14:59:19'),
(48, 1, 'Dupont', 'Camille', 2, 'recommandé', 4, 'Taboulé de quinoa, tomates, poivrons & spiruline', '2026-09-23 15:06:26'),
(49, 1, 'Dupont', 'Camille', 1, 'complet', 3, 'Salade de Wolffia, Edamames & Tomates naines', '2026-09-23 15:06:47'),
(50, 1, 'Dupont', 'Camille', 2, 'recommandé', 4, 'Taboulé de quinoa, tomates, poivrons & spiruline', '2026-09-23 15:13:49'),
(51, 1, 'Dupont', 'Camille', 2, 'minimum', 1, 'Taboulé de quinoa, tomates, poivrons & spiruline', '2026-09-23 15:21:01'),
(52, 1, 'Dupont', 'Camille', 1, 'minimum', 1, 'Salade de Wolffia, Edamames & Tomates naines', '2026-09-23 15:21:09'),
(53, 1, 'Dupont', 'Camille', 3, 'minimum', 1, 'Salade croquante de poivrons, radis & germes de soja', '2026-09-23 15:21:15'),
(54, 1, 'Dupont', 'Camille', 5, 'minimum', 1, 'Dahl spatial de soja & patates douces sur quinoa', '2026-09-23 15:21:19'),
(55, 1, 'Dupont', 'Camille', 5, 'minimum', 1, 'Dahl spatial de soja & patates douces sur quinoa', '2026-09-23 15:21:24'),
(56, 1, 'Dupont', 'Camille', 5, 'minimum', 1, 'Dahl spatial de soja & patates douces sur quinoa', '2026-09-23 15:21:28'),
(57, 1, 'Dupont', 'Camille', 1, 'minimum', 1, 'Salade de Wolffia, Edamames & Tomates naines', '2026-09-23 15:25:52'),
(58, 1, 'Dupont', 'Camille', 1, 'recommandé', 2, 'Salade de Wolffia, Edamames & Tomates naines', '2026-09-23 15:27:14'),
(59, 1, 'Dupont', 'Camille', 1, 'minimum', 1, 'Salade de Wolffia, Edamames & Tomates naines', '2026-09-23 15:28:59'),
(60, 1, 'Dupont', 'Camille', 8, 'recommandé', 4, 'Hummus de pois chiches à l\'ail & Galettes de quinoa', '2026-09-23 16:06:12'),
(61, 1, 'Dupont', 'Camille', 2, 'minimum', 1, 'Taboulé de quinoa, tomates, poivrons & spiruline', '2026-09-23 16:06:47'),
(62, 1, 'Dupont', 'Camille', 15, 'minimum', 1, 'Velouté de pois chiches & ail rôtis', '2026-09-24 09:39:45'),
(63, 1, 'Dupont', 'Camille', 4, 'minimum', 1, 'Salade de jeunes feuilles de patate douce au citron', '2026-09-24 09:40:24'),
(64, 1, 'Dupont', 'Camille', 3, 'recommandé', 2, 'Salade croquante de poivrons, radis & germes de soja', '2026-09-24 09:46:58'),
(65, 1, 'Dupont', 'Camille', 2, 'minimum', 1, 'Taboulé de quinoa, tomates, poivrons & spiruline', '2026-09-24 09:51:17'),
(66, 1, 'Dupont', 'Camille', 3, 'minimum', 1, 'Salade croquante de poivrons, radis & germes de soja', '2026-09-24 09:53:30'),
(67, 1, 'Dupont', 'Camille', 8, 'minimum', 1, 'Hummus de pois chiches à l\'ail & Galettes de quinoa', '2026-09-24 09:53:52'),
(68, 1, 'Dupont', 'Camille', 7, 'minimum', 1, 'Tofu maison sauté aux légumes & piment doux', '2026-09-24 09:54:04'),
(69, 1, 'Dupont', 'Camille', 22, 'minimum', 1, 'Limonade d\'agrumes relevée au piment piquant', '2026-09-24 10:32:10'),
(70, 1, 'Dupont', 'Camille', 2, 'recommandé', 2, 'Taboulé de quinoa, tomates, poivrons & spiruline', '2026-09-24 10:37:28');

-- --------------------------------------------------------

--
-- Structure de la table `repas`
--

CREATE TABLE `repas` (
  `id` int(11) NOT NULL,
  `nom_repas` varchar(150) NOT NULL,
  `Catégorie` varchar(255) NOT NULL,
  `image_repas` mediumblob NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure de la table `repas_aliment`
--

CREATE TABLE `repas_aliment` (
  `repas_id` int(11) NOT NULL,
  `nom_repas` varchar(150) NOT NULL,
  `aliment_id` int(11) NOT NULL,
  `nom_aliment` varchar(150) NOT NULL,
  `quantite_g` decimal(8,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `repas_aliment`
--

INSERT INTO `repas_aliment` (`repas_id`, `nom_repas`, `aliment_id`, `nom_aliment`, `quantite_g`) VALUES
(1, 'Salade de Wolffia, Edamames & Tomates naines', 2, 'Électrolytes & Sel (NaCl)', 2.00),
(1, 'Salade de Wolffia, Edamames & Tomates naines', 5, 'Soja', 100.00),
(1, 'Salade de Wolffia, Edamames & Tomates naines', 8, 'Lentilles d\'eau (Wolffia)', 80.00),
(1, 'Salade de Wolffia, Edamames & Tomates naines', 10, 'Tomate naine (Micro-Tom)', 80.00),
(1, 'Salade de Wolffia, Edamames & Tomates naines', 12, 'Citron / Agrume nain', 15.00),
(1, 'Salade de Wolffia, Edamames & Tomates naines', 15, 'Ail & Ciboulette', 10.00),
(2, 'Taboulé de quinoa, tomates, poivrons & spiruline', 2, 'Électrolytes & Sel (NaCl)', 2.00),
(2, 'Taboulé de quinoa, tomates, poivrons & spiruline', 4, 'Quinoa', 120.00),
(2, 'Taboulé de quinoa, tomates, poivrons & spiruline', 7, 'Spiruline', 10.00),
(2, 'Taboulé de quinoa, tomates, poivrons & spiruline', 10, 'Tomate naine (Micro-Tom)', 80.00),
(2, 'Taboulé de quinoa, tomates, poivrons & spiruline', 12, 'Citron / Agrume nain', 15.00),
(2, 'Taboulé de quinoa, tomates, poivrons & spiruline', 13, 'Poivron / Piment doux', 60.00),
(2, 'Taboulé de quinoa, tomates, poivrons & spiruline', 15, 'Ail & Ciboulette', 10.00),
(3, 'Salade croquante de poivrons, radis & germes de soja', 2, 'Électrolytes & Sel (NaCl)', 2.00),
(3, 'Salade croquante de poivrons, radis & germes de soja', 5, 'Soja', 80.00),
(3, 'Salade croquante de poivrons, radis & germes de soja', 12, 'Citron / Agrume nain', 15.00),
(3, 'Salade croquante de poivrons, radis & germes de soja', 13, 'Poivron / Piment doux', 110.00),
(3, 'Salade croquante de poivrons, radis & germes de soja', 15, 'Ail & Ciboulette', 10.00),
(4, 'Salade de jeunes feuilles de patate douce au citron', 2, 'Électrolytes & Sel (NaCl)', 2.00),
(4, 'Salade de jeunes feuilles de patate douce au citron', 3, 'Patate douce', 150.00),
(4, 'Salade de jeunes feuilles de patate douce au citron', 12, 'Citron / Agrume nain', 20.00),
(4, 'Salade de jeunes feuilles de patate douce au citron', 15, 'Ail & Ciboulette', 10.00),
(5, 'Dahl spatial de soja & patates douces sur quinoa', 2, 'Électrolytes & Sel (NaCl)', 3.00),
(5, 'Dahl spatial de soja & patates douces sur quinoa', 3, 'Patate douce', 150.00),
(5, 'Dahl spatial de soja & patates douces sur quinoa', 4, 'Quinoa', 100.00),
(5, 'Dahl spatial de soja & patates douces sur quinoa', 5, 'Soja', 120.00),
(5, 'Dahl spatial de soja & patates douces sur quinoa', 10, 'Tomate naine (Micro-Tom)', 80.00),
(5, 'Dahl spatial de soja & patates douces sur quinoa', 13, 'Poivron / Piment doux', 50.00),
(5, 'Dahl spatial de soja & patates douces sur quinoa', 14, 'Piment piquant nain', 5.00),
(5, 'Dahl spatial de soja & patates douces sur quinoa', 15, 'Ail & Ciboulette', 15.00),
(6, 'Quinoa façon Paëlla spatiale', 2, 'Électrolytes & Sel (NaCl)', 3.00),
(6, 'Quinoa façon Paëlla spatiale', 4, 'Quinoa', 150.00),
(6, 'Quinoa façon Paëlla spatiale', 6, 'Pois chiches', 100.00),
(6, 'Quinoa façon Paëlla spatiale', 9, 'Champignons (Shiitaké / Pleurote)', 80.00),
(6, 'Quinoa façon Paëlla spatiale', 10, 'Tomate naine (Micro-Tom)', 60.00),
(6, 'Quinoa façon Paëlla spatiale', 13, 'Poivron / Piment doux', 60.00),
(6, 'Quinoa façon Paëlla spatiale', 15, 'Ail & Ciboulette', 15.00),
(7, 'Tofu maison sauté aux légumes & piment doux', 2, 'Électrolytes & Sel (NaCl)', 3.00),
(7, 'Tofu maison sauté aux légumes & piment doux', 5, 'Soja', 180.00),
(7, 'Tofu maison sauté aux légumes & piment doux', 10, 'Tomate naine (Micro-Tom)', 60.00),
(7, 'Tofu maison sauté aux légumes & piment doux', 13, 'Poivron / Piment doux', 90.00),
(7, 'Tofu maison sauté aux légumes & piment doux', 15, 'Ail & Ciboulette', 15.00),
(8, 'Hummus de pois chiches à l\'ail & Galettes de quinoa', 2, 'Électrolytes & Sel (NaCl)', 3.00),
(8, 'Hummus de pois chiches à l\'ail & Galettes de quinoa', 4, 'Quinoa', 100.00),
(8, 'Hummus de pois chiches à l\'ail & Galettes de quinoa', 6, 'Pois chiches', 180.00),
(8, 'Hummus de pois chiches à l\'ail & Galettes de quinoa', 12, 'Citron / Agrume nain', 20.00),
(8, 'Hummus de pois chiches à l\'ail & Galettes de quinoa', 15, 'Ail & Ciboulette', 15.00),
(9, 'Hachis spatial : Purée de patate douce & Tofu égrené', 2, 'Électrolytes & Sel (NaCl)', 3.00),
(9, 'Hachis spatial : Purée de patate douce & Tofu égrené', 3, 'Patate douce', 200.00),
(9, 'Hachis spatial : Purée de patate douce & Tofu égrené', 5, 'Soja', 120.00),
(9, 'Hachis spatial : Purée de patate douce & Tofu égrené', 13, 'Poivron / Piment doux', 50.00),
(9, 'Hachis spatial : Purée de patate douce & Tofu égrené', 14, 'Piment piquant nain', 5.00),
(9, 'Hachis spatial : Purée de patate douce & Tofu égrené', 15, 'Ail & Ciboulette', 15.00),
(10, 'Grand curry spatial de légumineuses & champignons', 2, 'Électrolytes & Sel (NaCl)', 3.00),
(10, 'Grand curry spatial de légumineuses & champignons', 5, 'Soja', 100.00),
(10, 'Grand curry spatial de légumineuses & champignons', 6, 'Pois chiches', 100.00),
(10, 'Grand curry spatial de légumineuses & champignons', 9, 'Champignons (Shiitaké / Pleurote)', 80.00),
(10, 'Grand curry spatial de légumineuses & champignons', 10, 'Tomate naine (Micro-Tom)', 60.00),
(10, 'Grand curry spatial de légumineuses & champignons', 13, 'Poivron / Piment doux', 60.00),
(10, 'Grand curry spatial de légumineuses & champignons', 14, 'Piment piquant nain', 5.00),
(10, 'Grand curry spatial de légumineuses & champignons', 15, 'Ail & Ciboulette', 15.00),
(11, 'Falafels spatiaux de pois chiches & pousses de quinoa', 2, 'Électrolytes & Sel (NaCl)', 3.00),
(11, 'Falafels spatiaux de pois chiches & pousses de quinoa', 4, 'Quinoa', 60.00),
(11, 'Falafels spatiaux de pois chiches & pousses de quinoa', 6, 'Pois chiches', 180.00),
(11, 'Falafels spatiaux de pois chiches & pousses de quinoa', 13, 'Poivron / Piment doux', 40.00),
(11, 'Falafels spatiaux de pois chiches & pousses de quinoa', 15, 'Ail & Ciboulette', 15.00),
(12, 'Velouté chaud de patate douce à la spiruline', 1, 'Eau de recyclage', 250.00),
(12, 'Velouté chaud de patate douce à la spiruline', 2, 'Électrolytes & Sel (NaCl)', 3.00),
(12, 'Velouté chaud de patate douce à la spiruline', 3, 'Patate douce', 180.00),
(12, 'Velouté chaud de patate douce à la spiruline', 7, 'Spiruline', 10.00),
(12, 'Velouté chaud de patate douce à la spiruline', 15, 'Ail & Ciboulette', 10.00),
(13, 'Poêlée & Bouillon de champignons à la ciboulette', 1, 'Eau de recyclage', 300.00),
(13, 'Poêlée & Bouillon de champignons à la ciboulette', 2, 'Électrolytes & Sel (NaCl)', 3.00),
(13, 'Poêlée & Bouillon de champignons à la ciboulette', 9, 'Champignons (Shiitaké / Pleurote)', 150.00),
(13, 'Poêlée & Bouillon de champignons à la ciboulette', 15, 'Ail & Ciboulette', 15.00),
(14, 'Soupe fraîche de Wolffia & dés de patate douce', 1, 'Eau de recyclage', 250.00),
(14, 'Soupe fraîche de Wolffia & dés de patate douce', 2, 'Électrolytes & Sel (NaCl)', 3.00),
(14, 'Soupe fraîche de Wolffia & dés de patate douce', 3, 'Patate douce', 100.00),
(14, 'Soupe fraîche de Wolffia & dés de patate douce', 8, 'Lentilles d\'eau (Wolffia)', 80.00),
(14, 'Soupe fraîche de Wolffia & dés de patate douce', 15, 'Ail & Ciboulette', 15.00),
(15, 'Velouté de pois chiches & ail rôtis', 1, 'Eau de recyclage', 250.00),
(15, 'Velouté de pois chiches & ail rôtis', 2, 'Électrolytes & Sel (NaCl)', 3.00),
(15, 'Velouté de pois chiches & ail rôtis', 6, 'Pois chiches', 150.00),
(15, 'Velouté de pois chiches & ail rôtis', 15, 'Ail & Ciboulette', 20.00),
(16, 'Barres énergétiques Quinoa, Spiruline & Patate douce', 2, 'Électrolytes & Sel (NaCl)', 2.00),
(16, 'Barres énergétiques Quinoa, Spiruline & Patate douce', 3, 'Patate douce', 100.00),
(16, 'Barres énergétiques Quinoa, Spiruline & Patate douce', 4, 'Quinoa', 80.00),
(16, 'Barres énergétiques Quinoa, Spiruline & Patate douce', 7, 'Spiruline', 15.00),
(17, 'Chips de patate douce ou de quinoa au piment', 2, 'Électrolytes & Sel (NaCl)', 3.00),
(17, 'Chips de patate douce ou de quinoa au piment', 3, 'Patate douce', 150.00),
(17, 'Chips de patate douce ou de quinoa au piment', 14, 'Piment piquant nain', 5.00),
(18, 'Edamames frais saupoudrés au sel de saumure', 2, 'Électrolytes & Sel (NaCl)', 4.00),
(18, 'Edamames frais saupoudrés au sel de saumure', 5, 'Soja', 200.00),
(19, 'Bol de fraises naines au jus & zestes de citron', 11, 'Fraise naine (Saisonnière/LED)', 150.00),
(19, 'Bol de fraises naines au jus & zestes de citron', 12, 'Citron / Agrume nain', 20.00),
(20, 'Smoothie protéiné vert (Spiruline & Wolffia)', 1, 'Eau de recyclage', 200.00),
(20, 'Smoothie protéiné vert (Spiruline & Wolffia)', 7, 'Spiruline', 10.00),
(20, 'Smoothie protéiné vert (Spiruline & Wolffia)', 8, 'Lentilles d\'eau (Wolffia)', 50.00),
(20, 'Smoothie protéiné vert (Spiruline & Wolffia)', 11, 'Fraise naine (Saisonnière/LED)', 80.00),
(20, 'Smoothie protéiné vert (Spiruline & Wolffia)', 12, 'Citron / Agrume nain', 15.00),
(21, 'Lait de soja frais réhydraté', 1, 'Eau de recyclage', 250.00),
(21, 'Lait de soja frais réhydraté', 5, 'Soja', 60.00),
(22, 'Limonade d\'agrumes relevée au piment piquant', 1, 'Eau de recyclage', 250.00),
(22, 'Limonade d\'agrumes relevée au piment piquant', 2, 'Électrolytes & Sel (NaCl)', 2.00),
(22, 'Limonade d\'agrumes relevée au piment piquant', 12, 'Citron / Agrume nain', 40.00),
(22, 'Limonade d\'agrumes relevée au piment piquant', 14, 'Piment piquant nain', 2.00),
(23, 'Eau minéralisée réhydratante quotidienne', 1, 'Eau de recyclage', 500.00),
(23, 'Eau minéralisée réhydratante quotidienne', 2, 'Électrolytes & Sel (NaCl)', 3.00);

-- --------------------------------------------------------

--
-- Structure de la table `stock`
--

CREATE TABLE `stock` (
  `id` int(11) NOT NULL,
  `aliment_id` int(11) NOT NULL,
  `quantite_g` decimal(10,1) NOT NULL CHECK (`quantite_g` >= 0),
  `date_peremption` date DEFAULT NULL,
  `date_entree` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `stock`
--

INSERT INTO `stock` (`id`, `aliment_id`, `quantite_g`, `date_peremption`, `date_entree`) VALUES
(32, 1, 500000.0, '2027-09-01', '2026-09-01 08:00:00'),
(33, 2, 15000.0, '2028-09-01', '2026-09-01 08:00:00'),
(34, 3, 45000.0, '2026-10-05', '2026-09-18 10:00:00'),
(35, 4, 60000.0, '2027-09-05', '2026-09-05 08:00:00'),
(36, 5, 35000.0, '2026-10-10', '2026-09-10 08:00:00'),
(37, 6, 40000.0, '2027-03-08', '2026-09-08 08:00:00'),
(38, 7, 12000.0, '2027-06-15', '2026-09-15 08:00:00'),
(39, 8, 18000.0, '2026-09-27', '2026-09-20 08:00:00'),
(40, 9, 22000.0, '2026-10-02', '2026-09-19 08:00:00'),
(41, 10, 25000.0, '2026-10-06', '2026-09-21 08:00:00'),
(42, 11, 5000.0, '2026-10-01', '2026-09-22 08:00:00'),
(43, 12, 10000.0, '2026-11-10', '2026-09-10 08:00:00'),
(44, 13, 20000.0, '2026-10-08', '2026-09-20 08:00:00'),
(45, 14, 3000.0, '2027-09-01', '2026-09-01 08:00:00'),
(46, 15, 8000.0, '2026-11-15', '2026-09-15 08:00:00');

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `v_aliment_allergene`
-- (Voir ci-dessous la vue réelle)
--
CREATE TABLE `v_aliment_allergene` (
`aliment_id` int(11)
,`nom_aliment` varchar(100)
,`allergie_id` int(11)
,`nom_allergie` varchar(100)
);

-- --------------------------------------------------------

--
-- Structure de la vue `v_aliment_allergene`
--
DROP TABLE IF EXISTS `v_aliment_allergene`;

CREATE ALGORITHM=UNDEFINED DEFINER=`foodtech_admin`@`%` SQL SECURITY DEFINER VIEW `v_aliment_allergene`  AS SELECT `aa`.`aliment_id` AS `aliment_id`, `a`.`nom` AS `nom_aliment`, `aa`.`allergie_id` AS `allergie_id`, `al`.`nom` AS `nom_allergie` FROM ((`aliment_allergene` `aa` join `aliment` `a` on(`aa`.`aliment_id` = `a`.`id`)) join `allergie` `al` on(`aa`.`allergie_id` = `al`.`id`)) ;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `aliment`
--
ALTER TABLE `aliment`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nom` (`nom`);

--
-- Index pour la table `aliment_allergene`
--
ALTER TABLE `aliment_allergene`
  ADD PRIMARY KEY (`aliment_id`,`allergie_id`),
  ADD KEY `allergie_id` (`allergie_id`);

--
-- Index pour la table `aliment_allergie`
--
ALTER TABLE `aliment_allergie`
  ADD PRIMARY KEY (`ID_aliment`,`id_allergie`),
  ADD KEY `id_allergie` (`id_allergie`);

--
-- Index pour la table `aliment_nutriment`
--
ALTER TABLE `aliment_nutriment`
  ADD PRIMARY KEY (`aliment_id`,`nutriment_id`),
  ADD KEY `nutriment_id` (`nutriment_id`);

--
-- Index pour la table `allergie`
--
ALTER TABLE `allergie`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nom` (`nom`);

--
-- Index pour la table `astronaute`
--
ALTER TABLE `astronaute`
  ADD PRIMARY KEY (`id`),
  ADD KEY `niveau_activite_id` (`niveau_activite_id`);

--
-- Index pour la table `astronaute_allergie`
--
ALTER TABLE `astronaute_allergie`
  ADD PRIMARY KEY (`astronaute_id`,`allergie_id`),
  ADD KEY `allergie_id` (`allergie_id`);

--
-- Index pour la table `catalogue_aliments`
--
ALTER TABLE `catalogue_aliments`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `niveau_activite`
--
ALTER TABLE `niveau_activite`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `libelle` (`libelle`);

--
-- Index pour la table `nutriment`
--
ALTER TABLE `nutriment`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nom` (`nom`);

--
-- Index pour la table `reclamation`
--
ALTER TABLE `reclamation`
  ADD PRIMARY KEY (`id`),
  ADD KEY `repas_id` (`repas_id`);

--
-- Index pour la table `repas`
--
ALTER TABLE `repas`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `repas_aliment`
--
ALTER TABLE `repas_aliment`
  ADD PRIMARY KEY (`repas_id`,`aliment_id`),
  ADD KEY `aliment_id` (`aliment_id`);

--
-- Index pour la table `stock`
--
ALTER TABLE `stock`
  ADD PRIMARY KEY (`id`),
  ADD KEY `aliment_id` (`aliment_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `aliment`
--
ALTER TABLE `aliment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT pour la table `allergie`
--
ALTER TABLE `allergie`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT pour la table `astronaute`
--
ALTER TABLE `astronaute`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT pour la table `niveau_activite`
--
ALTER TABLE `niveau_activite`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT pour la table `nutriment`
--
ALTER TABLE `nutriment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT pour la table `reclamation`
--
ALTER TABLE `reclamation`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=71;

--
-- AUTO_INCREMENT pour la table `repas`
--
ALTER TABLE `repas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `stock`
--
ALTER TABLE `stock`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `aliment_allergene`
--
ALTER TABLE `aliment_allergene`
  ADD CONSTRAINT `aliment_allergene_ibfk_1` FOREIGN KEY (`aliment_id`) REFERENCES `aliment` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `aliment_allergene_ibfk_2` FOREIGN KEY (`allergie_id`) REFERENCES `allergie` (`id`);

--
-- Contraintes pour la table `aliment_allergie`
--
ALTER TABLE `aliment_allergie`
  ADD CONSTRAINT `aliment_allergie_ibfk_1` FOREIGN KEY (`ID_aliment`) REFERENCES `aliment` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `aliment_allergie_ibfk_2` FOREIGN KEY (`id_allergie`) REFERENCES `allergie` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `aliment_nutriment`
--
ALTER TABLE `aliment_nutriment`
  ADD CONSTRAINT `aliment_nutriment_ibfk_1` FOREIGN KEY (`aliment_id`) REFERENCES `aliment` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `aliment_nutriment_ibfk_2` FOREIGN KEY (`nutriment_id`) REFERENCES `nutriment` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `astronaute`
--
ALTER TABLE `astronaute`
  ADD CONSTRAINT `astronaute_ibfk_1` FOREIGN KEY (`niveau_activite_id`) REFERENCES `niveau_activite` (`id`);

--
-- Contraintes pour la table `astronaute_allergie`
--
ALTER TABLE `astronaute_allergie`
  ADD CONSTRAINT `astronaute_allergie_ibfk_1` FOREIGN KEY (`astronaute_id`) REFERENCES `astronaute` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `astronaute_allergie_ibfk_2` FOREIGN KEY (`allergie_id`) REFERENCES `allergie` (`id`);

--
-- Contraintes pour la table `reclamation`
--
ALTER TABLE `reclamation`
  ADD CONSTRAINT `reclamation_ibfk_1` FOREIGN KEY (`repas_id`) REFERENCES `repas` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `repas_aliment`
--
ALTER TABLE `repas_aliment`
  ADD CONSTRAINT `repas_aliment_ibfk_1` FOREIGN KEY (`aliment_id`) REFERENCES `aliment` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `stock`
--
ALTER TABLE `stock`
  ADD CONSTRAINT `stock_ibfk_1` FOREIGN KEY (`aliment_id`) REFERENCES `aliment` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;