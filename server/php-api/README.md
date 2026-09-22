# API PHP NutriPass

À déposer sur l'hébergement qui contient la base.

```
Téléphone  --HTTPS-->  cette API (chez l'hébergeur)  --SQL local-->  MySQL
```

## Pourquoi cette version

Le port MySQL 3306 de `bdd-test.f-dufour.com` est fermé de l'extérieur
(vérifié : ports 80 et 443 ouverts, 3306 filtré). Aucun programme tournant
sur un PC ne peut donc atteindre la base.

PHP, lui, tourne **sur la même machine** que MySQL : il s'y connecte en
`localhost`, et aucun pare-feu ne s'interpose.

---

## Installation

**1. Déposer** les fichiers par FTP dans un dossier `api/` de l'espace web.

**2. Renommer** `config.example.php` en `config.php`, et y mettre le mot de
passe de la base. `db_host` reste `localhost` dans la quasi-totalité des
hébergements mutualisés.

**3. Vérifier** dans un navigateur :

```
https://bdd-test.f-dufour.com/api/health.php
```

Réponse attendue : `{"ok":true,"service":"nutripass-php-api","php":"8.x"}`

---

## Découvrir la structure de la base

À faire en premier :

```bash
curl -H "X-Api-Key: LA_CLE" https://bdd-test.f-dufour.com/api/schema.php
```

La réponse liste chaque table avec ses colonnes et ses types. Il suffit
ensuite de reporter les vrais noms dans `mapping.php` — seul fichier à
adapter.

---

## Points d'entrée

| Méthode | Fichier | Rôle | Clé requise |
|---|---|---|---|
| GET | `health.php` | l'API répond-elle ? | non |
| GET | `schema.php` | tables et colonnes | oui |
| GET | `profiles.php` | liste (200 max) | oui |
| GET | `profiles.php?id=XXX` | un profil | oui |
| POST | `profiles.php` | crée ou met à jour | oui |

Un fichier par point d'entrée plutôt qu'un routeur : la réécriture d'URL
n'est pas garantie sur un mutualisé, alors qu'un fichier `.php` appelé
directement fonctionne partout.

---

## Sécurité

- `config.php` contient le mot de passe et n'est **jamais** versionné ni
  embarqué dans l'application.
- Le `.htaccess` interdit l'accès direct à `config.php`, `db.php` et
  `mapping.php` par le navigateur.
- Toutes les valeurs passent par des emplacements `?` — l'injection SQL est
  impossible.
- Les noms de table et de colonne, non paramétrables en SQL, sont validés
  par expression régulière avant usage.
- La clé est comparée avec `hash_equals`, en temps constant, pour qu'on ne
  puisse pas la deviner en mesurant le temps de réponse.

---

## Si la protection anti-bot s'en mêle

Le domaine est derrière un service de vérification. Si l'API renvoie une
page HTML au lieu du JSON attendu, c'est ce service qui intercepte l'appel.
Il faut alors demander une règle exemptant le chemin `/api/`.

Le client de l'application détecte déjà ce cas et le signale comme
`malformed` plutôt que de planter.
