# 🚀 NutriPass

**NutriPass** est une application de borne de cantine destinée aux astronautes.

Elle permet à un astronaute de :

- 🧑‍🚀 s'identifier ;

- 🍽️ choisir un repas, un snack et une boisson ;

- 🔥 adapter sa portion à ses besoins caloriques ;

- ⚠️ détecter les aliments contenant ses allergènes ;

- 📦 consulter les disponibilités du stock ;

- ✅ valider sa commande ;

- 🗄️ enregistrer la commande et mettre à jour le stock.
---
# 🏗️ Architecture
```
┌─────────────────────┐
│   Application Web   │
│   React / Expo      │
└──────────┬──────────┘
           │ HTTPS
           ▼
┌─────────────────────┐
│       API PHP       │
└──────────┬──────────┘
           │ SQL
           ▼
┌─────────────────────┐
│       MySQL         │
└─────────────────────┘
```

L'application communique avec l'API PHP.
L'API gère les échanges avec la base MySQL.

---
# 🛠️ Technologies

- Frontend : React / Expo / TypeScript

- Backend : PHP 8+

- Base de données : MySQL

- Communication : API REST / HTTPS

- Déploiement : serveur web Apache ou Nginx
--- 
# ⚡ Installation rapide
## 1. Installer les dépendances

Dans le dossier du projet :

`npm install`

## 2. Configurer l'API

Modifier :

`src/config/api.ts` avec l'adresse de votre API :
```
export const API_BASE_URL = 'https://VOTRE-DOMAINE';
export const API_KEY = 'VOTRE_CLE_API';
```
## 3. Installer la base de données

Importer le fichier :

`bdd.sql` dans MySQL.

## 4. Configurer l'API PHP

Puis renseigner les identifiants MySQL et la même clé API que dans l'application dans `server/php-api/config.php`

## 5. Lancer l'application

Pour le développement :

`npx expo start`


Pour générer la version web :

`npx expo export --platform web`


Les fichiers générés se trouvent dans :

`dist/`

---
# 🍽️ Utilisation

Une fois l'application lancée :

1. Toucher l'écran d'accueil.

2. Sélectionner un repas.

3. Choisir la quantité de calories.

4. Ajouter éventuellement un snack et une boisson.

5. Vérifier le récapitulatif.

6. Valider la commande.

L'application vérifie automatiquement les allergies et la disponibilité des aliments.

📁 Structure du projet
```
NutriPass/
├── src/
│   ├── components/       # Interfaces et écrans
│   ├── services/         # Communication avec l'API et logique métier
│   ├── config/           # Configuration de l'API
│   ├── constants/        # Constantes et thème
│   └── types/            # Types TypeScript
│
├── server/
│   └── php-api/          # API PHP
│
├── bdd.sql               # Structure et données de la base
├── App.tsx               # Point d'entrée de l'application
└── package.json
```
---
# 📚 Documentation

Pour comprendre le fonctionnement interne, la configuration complète, le déploiement et le dépannage :

👉 **Voir la Documentation Technique.**

--- 
# 👥 Contributeurs

Projet NutriPass — développé dans le cadre d'un projet de développement logiciel.

