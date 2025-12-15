# Leuana School - Système de Gestion Scolaire

Système complet de gestion scolaire développé avec React (TypeScript) pour le frontend et Node.js (Express) pour le backend.

## 📋 Table des matières

- [Fonctionnalités](#fonctionnalités)
- [Technologies utilisées](#technologies-utilisées)
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration](#configuration)
- [Démarrage](#démarrage)
- [Structure du projet](#structure-du-projet)
- [API Endpoints](#api-endpoints)
- [Déploiement](#déploiement)

## ✨ Fonctionnalités

### Modules principaux

- **Gestion des élèves** : CRUD complet, génération automatique de matricules (LEU-YYYY-XXXX)
- **Gestion des classes** : Organisation par niveau et année scolaire
- **Gestion des enseignants** : Attribution aux matières et classes
- **Gestion des matières** : Association enseignants/classes
- **Gestion des notes** : Saisie par trimestre, calcul de moyennes
- **Gestion des paiements** : Suivi des frais de scolarité, calcul automatique du reste dû
- **Gestion des présences** : Marquage quotidien présent/absent
- **Gestion des utilisateurs** : Système de rôles (Admin, Secrétaire, Enseignant)

### Sécurité

- Authentification JWT
- Hashage des mots de passe avec bcrypt
- Middleware d'autorisation par rôle

## 🛠 Technologies utilisées

### Frontend

- React 18
- TypeScript
- Vite
- Material UI (MUI)
- Redux Toolkit
- React Router
- React Hook Form + Zod
- Axios
- Day.js

### Backend

- Node.js
- Express
- TypeScript
- Sequelize ORM
- MySQL2
- JWT (jsonwebtoken)
- Bcrypt
- Helmet (sécurité)
- Morgan (logging)

### Base de données

- MySQL

## 📦 Prérequis

- Node.js >= 18.x
- npm >= 9.x
- MySQL >= 8.x

## 🚀 Installation

### 1. Cloner le projet

```bash
cd leuana-school
```

### 2. Installation du Backend

```bash
cd backend
npm install
```

### 3. Installation du Frontend

```bash
cd ../frontend
npm install
```

## ⚙️ Configuration

### 1. Configuration de la base de données

Créer une base de données MySQL :

```bash
mysql -u root -p
```

```sql
CREATE DATABASE leuana_school_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Importer le schéma :

```bash
mysql -u root -p leuana_school_db < database/schema.sql
```

(Optionnel) Importer les données de test :

```bash
mysql -u root -p leuana_school_db < database/seed.sql
```

### 2. Configuration du Backend

Créer un fichier `.env` dans le dossier `backend/` :

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=votre_mot_de_passe
DB_NAME=leuana_school_db
JWT_SECRET=votre_secret_jwt_tres_securise
```

**Créer l'utilisateur admin :**

```bash
cd backend
npm run create-admin
```

Cela créera un utilisateur admin avec :
- Username: `admin`
- Password: `admin123`

### 3. Configuration du Frontend

Si nécessaire, modifier l'URL de l'API dans `frontend/src/services/api.ts` :

```typescript
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});
```

## 🎯 Démarrage

### Mode développement

**Terminal 1 - Backend :**

```bash
cd backend
npm run dev
```

Le serveur démarre sur `http://localhost:5000`

**Terminal 2 - Frontend :**

```bash
cd frontend
npm run dev
```

L'application démarre sur `http://localhost:5173`

### Connexion

Utilisez les identifiants créés avec `npm run create-admin` :

- **Username:** admin
- **Password:** admin123

## 📁 Structure du projet

```
leuana-school/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuration DB
│   │   ├── controllers/     # Logique métier
│   │   ├── middlewares/     # Auth, validation
│   │   ├── models/          # Modèles Sequelize
│   │   ├── routes/          # Routes API
│   │   ├── utils/           # Utilitaires
│   │   ├── app.ts           # Configuration Express
│   │   └── server.ts        # Point d'entrée
│   ├── .env                 # Variables d'environnement
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Composants réutilisables
│   │   ├── layouts/         # Layouts (Dashboard)
│   │   ├── pages/           # Pages de l'app
│   │   ├── redux/           # Store Redux
│   │   ├── services/        # API client
│   │   ├── theme/           # Thème MUI
│   │   ├── App.tsx          # Composant principal
│   │   └── main.tsx         # Point d'entrée
│   ├── package.json
│   └── vite.config.ts
└── database/
    ├── schema.sql           # Schéma de la base
    └── seed.sql             # Données de test
```

## 🔌 API Endpoints

### Authentification

- `POST /api/auth/login` - Connexion
- `POST /api/auth/register` - Inscription (admin)
- `GET /api/auth/me` - Profil utilisateur

### Élèves

- `GET /api/students` - Liste des élèves
- `GET /api/students/:id` - Détails d'un élève
- `POST /api/students` - Créer un élève
- `PUT /api/students/:id` - Modifier un élève
- `DELETE /api/students/:id` - Supprimer un élève

### Classes

- `GET /api/classes` - Liste des classes
- `GET /api/classes/:id` - Détails d'une classe
- `POST /api/classes` - Créer une classe
- `PUT /api/classes/:id` - Modifier une classe
- `DELETE /api/classes/:id` - Supprimer une classe

### Enseignants

- `GET /api/teachers` - Liste des enseignants
- `GET /api/teachers/:id` - Détails d'un enseignant
- `POST /api/teachers` - Créer un enseignant
- `PUT /api/teachers/:id` - Modifier un enseignant
- `DELETE /api/teachers/:id` - Supprimer un enseignant

### Matières

- `GET /api/subjects` - Liste des matières
- `GET /api/subjects/:id` - Détails d'une matière
- `POST /api/subjects` - Créer une matière
- `PUT /api/subjects/:id` - Modifier une matière
- `DELETE /api/subjects/:id` - Supprimer une matière

### Notes

- `GET /api/grades` - Liste des notes
- `GET /api/grades/:id` - Détails d'une note
- `GET /api/grades/student/:studentId` - Notes d'un élève
- `POST /api/grades` - Créer une note
- `PUT /api/grades/:id` - Modifier une note
- `DELETE /api/grades/:id` - Supprimer une note

### Paiements

- `GET /api/payments` - Liste des paiements
- `GET /api/payments/:id` - Détails d'un paiement
- `GET /api/payments/student/:studentId` - Paiements d'un élève
- `POST /api/payments` - Créer un paiement
- `PUT /api/payments/:id` - Modifier un paiement
- `DELETE /api/payments/:id` - Supprimer un paiement

### Présences

- `GET /api/attendance` - Liste des présences
- `GET /api/attendance/:id` - Détails d'une présence
- `GET /api/attendance/student/:studentId` - Présences d'un élève
- `POST /api/attendance` - Créer une présence
- `PUT /api/attendance/:id` - Modifier une présence
- `DELETE /api/attendance/:id` - Supprimer une présence

## 🚀 Déploiement

### Backend

#### 1. Build

```bash
cd backend
npm run build
```

#### 2. Variables d'environnement en production

Configurer les variables d'environnement sur votre serveur :

```env
PORT=5000
DB_HOST=votre_host_production
DB_USER=votre_user_production
DB_PASS=votre_password_production
DB_NAME=leuana_school_db
JWT_SECRET=secret_production_tres_securise
NODE_ENV=production
```

#### 3. Démarrer

```bash
npm start
```

### Frontend

#### 1. Build

```bash
cd frontend
npm run build
```

Les fichiers de production seront dans `frontend/dist/`

#### 2. Déploiement

Déployer le contenu du dossier `dist/` sur :

- **Vercel** : `vercel --prod`
- **Netlify** : Glisser-déposer le dossier `dist/`
- **Serveur web** : Copier dans `/var/www/html/`

### Serveur de production recommandé

- **Backend** : PM2 + Nginx (reverse proxy)
- **Frontend** : Nginx ou CDN
- **Base de données** : MySQL sur serveur dédié

## 📝 Notes importantes

- Tous les noms "marc-school" ont été remplacés par "leuana-school"
- Les matricules sont générés automatiquement au format `LEU-YYYY-XXXX`
- Le système utilise JWT pour l'authentification
- Les mots de passe sont hashés avec bcrypt (10 rounds)

## 🔒 Sécurité

- Toujours utiliser HTTPS en production
- Changer le `JWT_SECRET` en production
- Configurer CORS correctement
- Utiliser des variables d'environnement pour les secrets
- Mettre à jour régulièrement les dépendances

## 📄 Licence

Projet propriétaire - Leuana School © 2024-2025

---

**Développé pour Leuana School** - Système de gestion scolaire moderne et complet
