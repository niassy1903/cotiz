# Cotiz API

API REST JSON construite avec Laravel 13, Sanctum et MongoDB Atlas.

## Sommaire

- [Installation locale](#installation-locale)
- [Déploiement sur Render](#déploiement-sur-render)
- [Contrat et sécurité](#contrat-et-sécurité)
- [Documentation complète de l'API](#documentation-complète-de-lapi)
  - [Base URL et en-têtes](#base-url-et-en-têtes)
  - [Authentification](#authentification)
  - [Routes publiques](#routes-publiques)
  - [Routes authentifiées](#routes-authentifiées)
  - [Gestion des organisations](#gestion-des-organisations)
  - [Gestion des membres](#gestion-des-membres)
  - [Gestion des cotisations et échéances](#gestion-des-cotisations-et-échéances)
  - [Gestion des paiements](#gestion-des-paiements)
  - [Gestion des dépenses](#gestion-des-dépenses)
  - [Notifications](#notifications)
  - [Journal d'audit](#journal-daudit)
  - [Administration globale (Superadmin)](#administration-globale-superadmin)
  - [Programme de parrainage](#programme-de-parrainage)
  - [Route Bootstrap](#route-bootstrap)
  - [Codes HTTP et gestion des erreurs](#codes-http-et-gestion-des-erreurs)
  - [Modèles de données](#modèles-de-données)
- [Tests](#tests)

---

## Installation locale

### Courriel et codes de connexion

Chaque connexion par mot de passe demande ensuite un code à 6 chiffres envoyé par courriel. Le code est à usage unique, expire après 15 minutes et est limité à cinq tentatives. Le renvoi invalide le code précédent.

Le déploiement Render utilise Resend via son API HTTPS, car les ports SMTP sortants sont bloqués sur les services gratuits. Les comptes Resend non configurés ne peuvent envoyer des e-mails qu'à l'adresse du propriétaire du compte. Pour envoyer des codes de connexion et des liens de mot de passe aux membres, vérifiez un domaine que vous possédez dans [Resend Domains](https://resend.com/domains), puis configurez `RESEND_API_KEY` et `MAIL_FROM_ADDRESS` avec une adresse de ce domaine (par exemple `connexion@votre-domaine.tld`) dans les variables d'environnement Render. Une adresse Gmail ne peut pas servir d'expéditeur sans vérification de son domaine.

```dotenv
MAIL_MAILER=resend
RESEND_API_KEY=re_xxxxxxxxx
MAIL_FROM_ADDRESS=connexion@votre-domaine.tld
MAIL_FROM_NAME="${APP_NAME}"
```

Le code source et `.env.example` ne contiennent aucun secret. En local, `MAIL_MAILER=log` écrit les messages dans les logs sans les envoyer. Après avoir vérifié le domaine, redéployez ou videz le cache de configuration Laravel pour prendre en compte la nouvelle adresse expéditeur.

Le projet utilise `mongodb/mongodb:^1.20` avec `mongodb/laravel-mongodb:^5.12`; Composer résout actuellement la bibliothèque en 1.21.5. L'image Render utilise PHP 8.4, également requis par les versions Symfony enregistrées dans `composer.lock`. Vérifiez que l'extension native MongoDB 1.21.x est chargée par le même PHP CLI utilisé pour Composer et Artisan :

```sh
php -r '$version = phpversion("mongodb"); if (! $version || version_compare($version, "1.21.0", "<") || version_compare($version, "2.0.0", ">=") || ! class_exists("MongoDB\\Driver\\Manager")) { fwrite(STDERR, "Extension MongoDB PHP 1.21.x requise\n"); exit(1); } echo "Extension PHP mongodb $version active\n";'
```

Sur macOS avec Homebrew, sélectionnez PHP 8.4 et installez l'extension native si nécessaire :

```sh
export PATH="/opt/homebrew/opt/php@8.4/bin:$PATH"
pecl install mongodb-1.21.5
php -v
php -r 'printf("mongodb=%s; Manager=%s\n", phpversion("mongodb") ?: "missing", class_exists("MongoDB\\Driver\\Manager") ? "yes" : "no");'
```

```sh
cp .env.example .env
composer install
# Renseigner DB_DSN avec l'URI privée fournie par MongoDB Atlas.
php artisan key:generate
php artisan migrate --force
php artisan serve --host=127.0.0.1 --port=8000
```

Dans un autre terminal, lancez `php artisan schedule:work` pour exécuter les échéances récurrentes et les suppressions différées. En production, configurez le cron Laravel Scheduler.

Les comptes et jeux de données fictifs ont été supprimés. Inscrivez un premier compte depuis le frontend.
Pour attribuer le rôle global après l'inscription, exécutez `php artisan cotiz:promote-superadmin adresse@example.com`.

## Déploiement sur Render

Le fichier `../render.yaml` déclare un service Web Docker. Dans Render, créez un Blueprint depuis le dépôt contenant ce fichier et renseignez les valeurs marquées comme secrètes/non synchronisées :

- `APP_KEY` : générez une clé avec `php artisan key:generate --show` dans `cotiz-api`.
- `APP_URL` : URL publique du service API sur Render.
- `FRONTEND_URL` et `CORS_ALLOWED_ORIGINS` : URL publique du frontend. Les slashs finaux sont normalisés pour éviter les erreurs de correspondance CORS.
- `DB_DSN` : URI de connexion MongoDB Atlas; ne la commitez jamais.
- `RESEND_API_KEY` : clé API créée dans Resend, à saisir comme secret Render.
- `MAIL_FROM_ADDRESS` : adresse d'expédition sur un domaine vérifié dans Resend.

Après le premier déploiement, exécutez `php artisan migrate --force` une seule fois depuis un shell du service. Le contrôle de santé utilise `/up`. Les services gratuits Render peuvent s'endormir après une période d'inactivité; MongoDB Atlas reste la base de données persistante.

La découverte des paquets pendant le build utilise temporairement SQLite en mémoire et des pilotes cache/session/queue sans base de données; la configuration MongoDB Atlas reste celle du runtime. Le service Web ne lance pas automatiquement le planificateur Laravel. Pour les tâches récurrentes (génération des échéances et purge), configurez un Cron Job Render qui exécute `php artisan schedule:run` chaque minute, ou utilisez un worker de fond.

## Contrat et sécurité

- Préfixe des routes : `/api/v1`.
- Authentification par jeton Sanctum : inscription, connexion, profil, révocation, réinitialisation de mot de passe.
- Les données du frontend sont chargées via `GET /bootstrap?organization_id=<id>`.
- Chaque route d'organisation vérifie l'adhésion active et le rôle minimum.
- Les données financières sont limitées selon le rôle et la permission d'accès aux transactions.
- Les validations métier et les mutations financières sont exécutées côté serveur; la validation d'un paiement met à jour son échéance dans une transaction MongoDB.
- Les invitations sont à usage unique et expirent après 72 heures; les codes de parrainage suivent les nouvelles inscriptions.
- Les échéances récurrentes sont générées quotidiennement; les suppressions différées sont purgées après 30 jours.
- Le CORS est limité à `CORS_ALLOWED_ORIGINS` et `FRONTEND_URL`; configurez les origines publiques exactes au déploiement.
- Pour la production, configurez une base durable, `APP_DEBUG=false`, HTTPS, un fournisseur de courriel et des secrets opérateur.

Wave et Orange Money ne sont pas connectés à leurs API de paiement : le backend gère les déclarations, références et validations manuelles. Les commissions d'affiliation restent à zéro tant qu'un système de facturation réel n'est pas branché.

---

## Documentation complète de l'API

### Base URL et en-têtes

```
Base URL: https://votre-api.cotiz.com/api/v1
```

**En-têtes requis pour toutes les requêtes authentifiées :**
```
Authorization: Bearer {votre_token_sanctum}
Accept: application/json
Content-Type: application/json
```

### Authentification

L'API utilise Laravel Sanctum pour l'authentification par jeton Bearer. Toutes les routes authentifiées nécessitent un token valide dans l'en-tête `Authorization`.

#### 📋 **POST /auth/register** - Inscription d'un nouvel utilisateur

Crée un nouvel utilisateur et éventuellement une organisation. Si un `invite_token` est fourni, l'utilisateur rejoint l'organisation associée. Si un `referral_code` est fourni, la conversion est enregistrée.

**Requête :**
```json
{
  "first_name": "Jean",
  "last_name": "Dupont",
  "email": "jean.dupont@example.com",
  "phone": "+221770000000",
  "gender": "M",
  "password": "motdepasse123",
  "password_confirmation": "motdepasse123",
  "organization_name": "Mon Association",
  "invite_token": null,
  "referral_code": null
}
```

**Champs requis :**
- `first_name` (string, max:100)
- `last_name` (string, max:100)
- `email` (email, unique, max:255)
- `phone` (string, max:40)
- `gender` (enum: M, F)
- `password` (string, min:8, confirmed)
- `organization_name` (requis si `invite_token` non fourni, string, min:2, max:150)

**Champs optionnels :**
- `invite_token` (string, size:48) - Token d'invitation d'une organisation
- `referral_code` (string, doit exister dans referral_profiles)

**Réponse (201 Created) :**
```json
{
  "data": {
    "token": "1|abcdefghijklmnopqrstuvwxyz...",
    "user": {
      "id": "662d3f4d5b8c7e9a0f123456",
      "first_name": "Jean",
      "last_name": "Dupont",
      "email": "jean.dupont@example.com",
      "phone": "+221770000000",
      "gender": "M",
      "avatar": null,
      "role": "admin",
      "current_org_id": "662d3f4d5b8c7e9a0f123457",
      "accessible_org_ids": ["662d3f4d5b8c7e9a0f123457"],
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

#### 🔑 **POST /auth/login** - Connexion (étape 1/2)

Initiie la connexion et envoie un code OTP par email.

**Requête :**
```json
{
  "email": "jean.dupont@example.com",
  "password": "motdepasse123"
}
```

**Réponse (202 Accepted) :**
```json
{
  "data": {
    "challenge": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
    "expires_at": "2024-01-15T10:45:00.000Z"
  }
}
```

---

#### ✅ **POST /auth/login/verify** - Vérification du code OTP

Valide le code OTP reçu par email pour finaliser la connexion.

**Requête :**
```json
{
  "challenge": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4",
  "code": "123456"
}
```

**Réponse (200 OK) :**
```json
{
  "data": {
    "token": "1|abcdefghijklmnopqrstuvwxyz...",
    "user": {
      "id": "662d3f4d5b8c7e9a0f123456",
      "first_name": "Jean",
      "last_name": "Dupont",
      "email": "jean.dupont@example.com",
      "phone": "+221770000000",
      "gender": "M",
      "avatar": null,
      "role": "admin",
      "current_org_id": "662d3f4d5b8c7e9a0f123457",
      "accessible_org_ids": ["662d3f4d5b8c7e9a0f123457"],
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Erreurs possibles :**
- `422` : Code invalide, expiré ou trop de tentatives (5 max)
- `401` : Identifiants incorrects

---

#### 🔄 **POST /auth/login/resend** - Renvoyer le code OTP

Invalide le code précédent et envoie un nouveau code.

**Requête :**
```json
{
  "challenge": "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4"
}
```

**Réponse (200 OK) :**
```json
{
  "data": {
    "challenge": "nouveau_challenge_hash",
    "expires_at": "2024-01-15T10:45:00.000Z"
  }
}
```

---

#### 👤 **GET /auth/me** - Obtenir le profil utilisateur

**Réponse (200 OK) :**
```json
{
  "data": {
    "id": "662d3f4d5b8c7e9a0f123456",
    "first_name": "Jean",
    "last_name": "Dupont",
    "email": "jean.dupont@example.com",
    "phone": "+221770000000",
    "gender": "M",
    "avatar": null,
    "role": "admin",
    "current_org_id": "662d3f4d5b8c7e9a0f123457",
    "accessible_org_ids": ["662d3f4d5b8c7e9a0f123457"],
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

#### ✏️ **PATCH /auth/profile** - Mettre à jour le profil

**Requête :**
```json
{
  "first_name": "Jean",
  "last_name": "Dupont",
  "phone": "+221771234567",
  "gender": "M",
  "avatar": "https://exemple.com/avatar.jpg"
}
```

**Champs optionnels (au moins un requis) :**
- `first_name` (string, max:100)
- `last_name` (string, max:100)
- `phone` (string, max:40)
- `gender` (enum: M, F)
- `avatar` (url, max:2048)

**Réponse (200 OK) :**
```json
{
  "data": {
    "id": "662d3f4d5b8c7e9a0f123456",
    "first_name": "Jean",
    "last_name": "Dupont",
    "email": "jean.dupont@example.com",
    "phone": "+221771234567",
    "gender": "M",
    "avatar": "https://exemple.com/avatar.jpg",
    "role": "admin",
    "current_org_id": "",
    "accessible_org_ids": [],
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

#### 🔒 **POST /auth/logout** - Déconnexion

Invalide le token actuel.

**Réponse (200 OK) :**
```json
{
  "message": "Déconnexion réussie."
}
```

---

#### 🔐 **POST /auth/forgot-password** - Demander une réinitialisation

**Requête :**
```json
{
  "email": "jean.dupont@example.com"
}
```

**Réponse (200 OK) :**
```json
{
  "message": "Nous avons envoyé par e-mail votre lien de réinitialisation de mot de passe."
}
```

---

#### 🔄 **POST /auth/reset-password** - Réinitialiser le mot de passe

**Requête :**
```json
{
  "email": "jean.dupont@example.com",
  "token": "token_de_reinitialisation",
  "password": "nouveaumotdepasse123",
  "password_confirmation": "nouveaumotdepasse123"
}
```

**Réponse (200 OK) :**
```json
{
  "message": "Le mot de passe a été réinitialisé."
}
```

---

### Routes publiques

Routes accessibles sans authentification.

#### 🎟️ **GET /invitations/{token}** - Prévisualiser une invitation

Permet de vérifier qu'un lien d'invitation est valide avant l'inscription.

**Réponse (200 OK) :**
```json
{
  "data": {
    "organization": {
      "id": "662d3f4d5b8c7e9a0f123457",
      "name": "Mon Association",
      "type": "association"
    },
    "expires_at": "2024-01-18T10:30:00.000Z"
  }
}
```

**Erreurs possibles :**
- `404` : Lien invalide ou expiré

---

### Routes authentifiées

Toutes les routes suivantes nécessitent un token valide dans l'en-tête `Authorization: Bearer {token}`.

#### 📊 **GET /bootstrap?organization_id={id}** - Charger toutes les données du frontend

Route centrale qui charge toutes les données nécessaires pour une organisation en une seule requête. Utilisée par le frontend au chargement initial.

**Paramètres de requête :**
- `organization_id` (optionnel) - ID de l'organisation à charger. Si non fourni, charge la première organisation accessible.

**Réponse (200 OK) :**
```json
{
  "data": {
    "user": {
      "id": "662d3f4d5b8c7e9a0f123456",
      "first_name": "Jean",
      "last_name": "Dupont",
      "email": "jean.dupont@example.com",
      "phone": "+221770000000",
      "gender": "M",
      "avatar": null,
      "role": "admin",
      "current_org_id": "662d3f4d5b8c7e9a0f123457",
      "accessible_org_ids": ["662d3f4d5b8c7e9a0f123457"],
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    "organizations": [
      {
        "id": "662d3f4d5b8c7e9a0f123457",
        "name": "Mon Association",
        "type": "association",
        "description": "Description de l'association",
        "logo_url": null,
        "location": "Dakar, Sénégal",
        "member_estimate": 5,
        "admin_id": "662d3f4d5b8c7e9a0f123456",
        "admin_name": "Jean Dupont",
        "wave_number": "+221770000000",
        "orange_money_number": "+221780000000",
        "subscription_plan": "free",
        "subscription_renewal_date": "2024-02-15",
        "status": "active",
        "deletion_scheduled_at": null,
        "created_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "current_org_id": "662d3f4d5b8c7e9a0f123457",
    "members": [...],
    "contributions": [...],
    "cycles": [...],
    "payments": [...],
    "expenses": [...],
    "notifications": [...],
    "audit_logs": [...]
  }
}
```

---

#### 🎁 **GET /referrals** - Obtenir le profil de parrainage

Affiche le code de parrainage de l'utilisateur et ses statistiques.

**Réponse (200 OK) :**
```json
{
  "data": {
    "code": "COTIZ-ABCD1234",
    "creator_name": "Jean Dupont",
    "total_uses": 3,
    "total_commission": 0,
    "paid_commission": 0,
    "pending_commission": 0,
    "converted_orgs": [
      {
        "org_name": "Nouvelle Org",
        "date": "2024-01-16",
        "plan": "free",
        "commission_amount": 0
      }
    ],
    "payouts": []
  }
}
```

---

#### 🔄 **POST /referrals/rotate** - Générer un nouveau code de parrainage

Crée un nouveau code de parrainage aléatoire.

**Réponse (200 OK) :**
```json
{
  "data": {
    "code": "COTIZ-NOUVEAU5678",
    "creator_name": "Jean Dupont",
    "total_uses": 3,
    "total_commission": 0,
    "paid_commission": 0,
    "pending_commission": 0,
    "converted_orgs": [...],
    "payouts": []
  }
}
```

---

### Gestion des organisations

#### 📋 **GET /organizations** - Lister toutes les organisations de l'utilisateur

**Réponse (200 OK) :**
```json
{
  "data": [
    {
      "id": "662d3f4d5b8c7e9a0f123457",
      "name": "Mon Association",
      "type": "association",
      "description": "Description",
      "logo_url": null,
      "location": "Dakar",
      "member_estimate": 5,
      "admin_id": "662d3f4d5b8c7e9a0f123456",
      "admin_name": "Jean Dupont",
      "wave_number": "+221770000000",
      "orange_money_number": "+221780000000",
      "subscription_plan": "free",
      "subscription_renewal_date": "2024-02-15",
      "status": "active",
      "deletion_scheduled_at": null,
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

#### ✅ **POST /organizations** - Créer une nouvelle organisation

**Requête :**
```json
{
  "name": "Nouvelle Association",
  "type": "association",
  "description": "Description de la nouvelle organisation",
  "logo_url": "https://exemple.com/logo.png",
  "location": "Dakar, Sénégal",
  "member_estimate": 10,
  "wave_number": "+221770000000",
  "orange_money_number": "+221780000000"
}
```

**Champs requis :**
- `name` (string, min:2, max:150)
- `type` (enum: dahira, tontine, association)
- `location` (string, max:255)

**Champs optionnels :**
- `description` (string, max:5000)
- `logo_url` (url, max:2048)
- `member_estimate` (integer, min:0, max:1000000)
- `wave_number` (string, max:40)
- `orange_money_number` (string, max:40)

**Réponse (201 Created) :**
```json
{
  "data": {
    "id": "662d3f4d5b8c7e9a0f123458",
    "name": "Nouvelle Association",
    "type": "association",
    "description": "Description de la nouvelle organisation",
    "logo_url": "https://exemple.com/logo.png",
    "location": "Dakar, Sénégal",
    "member_estimate": 1,
    "admin_id": "662d3f4d5b8c7e9a0f123456",
    "admin_name": "Jean Dupont",
    "wave_number": "+221770000000",
    "orange_money_number": "+221780000000",
    "subscription_plan": "free",
    "subscription_renewal_date": "2024-02-15",
    "status": "active",
    "deletion_scheduled_at": null,
    "created_at": "2024-01-17T10:30:00.000Z"
  }
}
```

**Rôles autorisés :** Tous les utilisateurs authentifiés

---

#### 📄 **GET /organizations/{organization}** - Obtenir une organisation

**Réponse (200 OK) :**
Voir la structure de réponse de `/organizations` ci-dessus.

**Rôles autorisés :** Membre de l'organisation

---

#### ✏️ **PATCH /organizations/{organization}** - Mettre à jour une organisation

**Requête :**
```json
{
  "name": "Association Modifiée",
  "description": "Nouvelle description",
  "location": "Nouvelle localisation"
}
```

**Champs optionnels :**
- `name` (string, min:2, max:150)
- `type` (enum: dahira, tontine, association)
- `description` (nullable, string, max:5000)
- `logo_url` (nullable, url, max:2048)
- `location` (string, max:255)
- `member_estimate` (integer, min:0, max:1000000)
- `wave_number` (nullable, string, max:40)
- `orange_money_number` (nullable, string, max:40)

**Réponse (200 OK) :**
Voir la structure de réponse de `/organizations` ci-dessus.

**Rôles autorisés :** Admin de l'organisation

---

#### 🗑️ **DELETE /organizations/{organization}** - Supprimer une organisation (différée)

Programme la suppression de l'organisation dans 30 jours.

**Réponse (200 OK) :**
```json
{
  "data": {
    "id": "662d3f4d5b8c7e9a0f123458",
    "status": "pending_deletion",
    "deletion_scheduled_at": "2024-02-17T10:30:00.000Z",
    ...
  }
}
```

**Rôles autorisés :** Admin de l'organisation

---

#### 🔄 **POST /organizations/{organization}/restore** - Annuler la suppression différée

**Réponse (200 OK) :**
```json
{
  "data": {
    "id": "662d3f4d5b8c7e9a0f123458",
    "status": "active",
    "deletion_scheduled_at": null,
    ...
  }
}
```

**Rôles autorisés :** Admin de l'organisation

---

#### 💳 **PATCH /organizations/{organization}/subscription** - Changer de forfait

**Requête :**
```json
{
  "subscription_plan": "premium"
}
```

**Valeurs possibles :** free, basic, premium

**Contraintes :**
- free: max 10 membres
- basic: max 75 membres
- premium: illimité

**Réponse (200 OK) :**
Voir la structure de réponse de `/organizations` ci-dessus.

**Rôles autorisés :** Admin de l'organisation

---

#### 📥 **POST /organizations/{organization}/join** - Rejoindre une organisation

Permet à l'utilisateur authentifié de demander à rejoindre une organisation.

**Réponse (201 Created) :**
```json
{
  "data": {
    "id": "662d3f4d5b8c7e9a0f123459",
    "organization_id": "662d3f4d5b8c7e9a0f123457",
    "user_id": "662d3f4d5b8c7e9a0f123456",
    "first_name": "Jean",
    "last_name": "Dupont",
    "phone": "+221770000000",
    "email": "jean.dupont@example.com",
    "gender": "M",
    "role": "member",
    "status": "pending",
    "is_ghost": false,
    "has_transaction_access": false,
    "join_date": "2024-01-17"
  }
}
```

**Rôles autorisés :** Tous les utilisateurs authentifiés

**Erreurs possibles :**
- `403` : Organisation suspendue
- `409` : Demande ou adhésion déjà existante

---

### Gestion des membres

#### 📋 **GET /organizations/{organization}/members** - Lister les membres

**Réponse (200 OK) :**
```json
{
  "data": [
    {
      "id": "662d3f4d5b8c7e9a0f123459",
      "organization_id": "662d3f4d5b8c7e9a0f123457",
      "user_id": "662d3f4d5b8c7e9a0f123456",
      "first_name": "Jean",
      "last_name": "Dupont",
      "phone": "+221770000000",
      "email": "jean.dupont@example.com",
      "gender": "M",
      "role": "admin",
      "status": "active",
      "is_ghost": false,
      "has_transaction_access": true,
      "join_date": "2024-01-15",
      "avatar": null
    }
  ]
}
```

**Rôles autorisés :** Membre de l'organisation

---

#### ✅ **POST /organizations/{organization}/members** - Ajouter un membre

**Requête :**
```json
{
  "first_name": "Marie",
  "last_name": "Martin",
  "phone": "+221760000000",
  "email": "marie.martin@example.com",
  "gender": "F",
  "role": "member",
  "is_ghost": false
}
```

**Champs requis :**
- `first_name` (string, max:100)
- `last_name` (string, max:100)
- `phone` (string, max:40)
- `email` (email, max:254) pour un membre actif
- `gender` (enum: M, F)
- `role` (enum: admin, member)
- `is_ghost` (boolean)

**Champs optionnels :**
- `email` pour un membre fantôme

**Réponse (201 Created) :**
Voir la structure de réponse de `/members` ci-dessus.
Un membre actif créé sans compte Cotiz reçoit automatiquement un compte lié à sa fiche et un lien de réinitialisation pour choisir son mot de passe avant sa première connexion. Si l'envoi échoue, la réponse inclut `access_link_sent: false` et un message explicite; l'utilisateur peut aussi demander un lien depuis « Mot de passe oublié ».

**Rôles autorisés :** Admin de l'organisation

**Erreurs possibles :**
- `422` : Capacité maximale de membres atteinte (selon le forfait)
- `422` : Ce compte est déjà membre de cette organisation

---

#### ✏️ **PATCH /organizations/{organization}/members/{member}** - Mettre à jour un membre

**Requête :**
```json
{
  "first_name": "Marie",
  "last_name": "Martin-Dupont",
  "phone": "+221761234567"
}
```

**Champs optionnels :**
- `first_name` (string, max:100)
- `last_name` (string, max:100)
- `phone` (string, max:40)
- `email` (nullable, email, max:255)
- `gender` (enum: M, F)
- `is_ghost` (boolean)

**Réponse (200 OK) :**
Voir la structure de réponse de `/members` ci-dessus.

**Rôles autorisés :** Admin de l'organisation

---

#### ✅ **POST /organizations/{organization}/members/{member}/accept** - Accepter une demande d'adhésion

Passe le statut du membre de `pending` à `active`.

**Réponse (200 OK) :**
Voir la structure de réponse de `/members` ci-dessus.

**Rôles autorisés :** Admin de l'organisation

**Erreurs possibles :**
- `422` : Cette demande n'est plus en attente
- `422` : Capacité maximale de membres atteinte

---

#### ❌ **POST /organizations/{organization}/members/{member}/reject** - Refuser une demande d'adhésion

Supprime la demande d'adhésion.

**Réponse (200 OK) :**
```json
{
  "message": "Demande refusée."
}
```

**Rôles autorisés :** Admin de l'organisation

**Erreurs possibles :**
- `422` : Cette demande n'est plus en attente

---

#### 🗑️ **DELETE /organizations/{organization}/members/{member}** - Archiver un membre

Passe le statut du membre à `archived`.

**Réponse (200 OK) :**
Voir la structure de réponse de `/members` ci-dessus.

**Rôles autorisés :** Admin de l'organisation

**Erreurs possibles :**
- `422` : Impossible de retirer le dernier administrateur

---

#### 🔄 **PATCH /organizations/{organization}/members/{member}/transaction-access** - Basculer l'accès aux transactions

Active ou désactive l'accès aux données financières pour un membre.

**Réponse (200 OK) :**
Voir la structure de réponse de `/members` ci-dessus.

**Rôles autorisés :** Admin de l'organisation

---

#### 👑 **POST /organizations/{organization}/members/{member}/transfer-admin** - Transférer le rôle admin

Transfère le rôle d'administrateur à un autre membre et retire ce rôle à tous les autres.

**Réponse (200 OK) :**
Voir la structure de réponse de `/members` ci-dessus.

**Rôles autorisés :** Admin de l'organisation

---

### Gestion des cotisations et échéances

#### 📋 **GET /organizations/{organization}/contributions** - Lister les cotisations

**Réponse (200 OK) :**
```json
{
  "data": [
    {
      "id": "662d3f4d5b8c7e9a0f123460",
      "organization_id": "662d3f4d5b8c7e9a0f123457",
      "created_by": "662d3f4d5b8c7e9a0f123456",
      "title": "Cotisation mensuelle",
      "amount_type": "fixed",
      "amount": 1000,
      "amount_female": 500,
      "frequency": "monthly",
      "day_of_month": null,
      "start_date": "2024-01-15",
      "target_type": "all",
      "target_member_ids": [],
      "status": "active",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Rôles autorisés :** Membre de l'organisation

---

#### 📅 **GET /organizations/{organization}/cycles** - Lister les échéances

**Réponse (200 OK) :**
```json
{
  "data": [
    {
      "id": "662d3f4d5b8c7e9a0f123461",
      "organization_id": "662d3f4d5b8c7e9a0f123457",
      "contribution_id": "662d3f4d5b8c7e9a0f123460",
      "contribution_title": "Cotisation mensuelle",
      "cycle_number": 1,
      "period_label": "Janvier 2024",
      "due_date": "2024-01-31",
      "expected_amount": 5000,
      "total_collected": 2000,
      "status": "open",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

**Rôles autorisés :** Membre de l'organisation

---

#### ✅ **POST /organizations/{organization}/contributions** - Créer une cotisation

**Requête :**
```json
{
  "title": "Cotisation mensuelle",
  "amount_type": "fixed",
  "amount": 1000,
  "amount_female": 500,
  "frequency": "monthly",
  "day_of_month": null,
  "start_date": "2024-01-15",
  "target_type": "all",
  "target_member_ids": [],
  "status": "active"
}
```

**Champs requis :**
- `title` (string, max:150)
- `amount_type` (enum: fixed, minimum)
- `amount` (numeric, gt:0, max:9999999999)
- `frequency` (enum: weekly, biweekly, monthly, quarterly, annual)
- `start_date` (date)
- `target_type` (enum: all, custom, by_gender)

**Champs optionnels :**
- `amount_female` (nullable, numeric, gt:0, max:9999999999)
- `day_of_month` (nullable, integer, between:1,31)
- `target_member_ids` (array) - IDs des membres concernés (si target_type=custom)
- `status` (enum: active, inactive, archived)

**Réponse (201 Created) :**
Voir la structure de réponse de `/contributions` ci-dessus.

**Rôles autorisés :** Admin de l'organisation

---

#### ✏️ **PATCH /organizations/{organization}/contributions/{contribution}** - Mettre à jour une cotisation

Mêmes champs que pour la création.

**Réponse (200 OK) :**
Voir la structure de réponse de `/contributions` ci-dessus.

**Rôles autorisés :** Admin de l'organisation

---

#### 📅 **POST /organizations/{organization}/contributions/{contribution}/cycles** - Créer une échéance manuelle

**Requête :**
```json
{
  "period_label": "Janvier 2024",
  "due_date": "2024-01-31",
  "expected_amount": 5000
}
```

**Champs requis :**
- `period_label` (string, max:100)
- `due_date` (date)

**Champs optionnels :**
- `expected_amount` (numeric, min:0)

**Réponse (201 Created) :**
Voir la structure de réponse de `/cycles` ci-dessus.

**Rôles autorisés :** Admin de l'organisation

---

#### 🔒 **POST /organizations/{organization}/cycles/{cycle}/close** - Clôturer une échéance

Passe le statut de l'échéance de `open` à `closed`.

**Réponse (200 OK) :**
Voir la structure de réponse de `/cycles` ci-dessus.

**Rôles autorisés :** Admin de l'organisation

**Erreurs possibles :**
- `422` : Cette échéance est déjà clôturée

---

### Gestion des paiements

#### 📋 **GET /organizations/{organization}/payments** - Lister les paiements

**Paramètres :**
- Les membres sans accès transactionnel ne voient que leurs propres paiements

**Réponse (200 OK) :**
```json
{
  "data": [
    {
      "id": "662d3f4d5b8c7e9a0f123462",
      "organization_id": "662d3f4d5b8c7e9a0f123457",
      "contribution_id": "662d3f4d5b8c7e9a0f123460",
      "cycle_id": "662d3f4d5b8c7e9a0f123461",
      "member_id": "662d3f4d5b8c7e9a0f123459",
      "created_by": "662d3f4d5b8c7e9a0f123456",
      "contribution_title": "Cotisation mensuelle",
      "member_name": "Marie Martin",
      "member_phone": "+221760000000",
      "amount": 1000,
      "method": "cash",
      "transaction_id": "WA-abcdef123456",
      "status": "validated",
      "notes": "Paiement en espèces",
      "reject_reason": null,
      "payment_date": "2024-01-16T10:30:00.000Z",
      "validated_at": "2024-01-16T11:00:00.000Z",
      "validated_by": "Jean Dupont",
      "created_at": "2024-01-16T10:30:00.000Z"
    }
  ]
}
```

**Rôles autorisés :** Membre de l'organisation

---

#### ✅ **POST /organizations/{organization}/payments** - Créer un paiement

**Requête :**
```json
{
  "contribution_id": "662d3f4d5b8c7e9a0f123460",
  "cycle_id": "662d3f4d5b8c7e9a0f123461",
  "member_id": "662d3f4d5b8c7e9a0f123459",
  "amount": 1000,
  "method": "cash",
  "transaction_id": "WA-abcdef123456",
  "notes": "Paiement en espèces"
}
```

**Champs requis :**
- `contribution_id` (string, doit exister dans l'organisation)
- `member_id` (string, doit exister et être actif dans l'organisation)
- `amount` (numeric, gt:0, max:9999999999)
- `method` (enum: wave, orange_money, cash)

**Champs optionnels :**
- `cycle_id` (string, doit exister dans l'organisation) - Si non fourni, utilise la première échéance ouverte
- `transaction_id` (string, max:100, unique dans l'organisation)
- `notes` (nullable, string, max:2000)

**Réponse (201 Created) :**
Voir la structure de réponse de `/payments` ci-dessus (status = "pending")

**Rôles autorisés :** 
- Admin de l'organisation (peut créer pour n'importe quel membre)
- Membre de l'organisation (uniquement pour son propre compte)

**Erreurs possibles :**
- `422` : Cette échéance ne peut pas recevoir de paiement (clôturée ou invalide)
- `403` : Vous ne pouvez déclarer un paiement que pour votre propre compte (si non admin)

---

#### ✅ **POST /organizations/{organization}/payments/{payment}/validate** - Valider un paiement

**Requête :**
```json
{
  "notes": "Validation par l'admin"
}
```

**Champs optionnels :**
- `notes` (nullable, string, max:2000)

**Réponse (200 OK) :**
Voir la structure de réponse de `/payments` ci-dessus (status = "validated")

**Rôles autorisés :** Admin de l'organisation

**Erreurs possibles :**
- `422` : Seul un paiement en attente peut être validé

---

#### ❌ **POST /organizations/{organization}/payments/{payment}/reject** - Rejeter un paiement

**Requête :**
```json
{
  "reason": "Montant incorrect"
}
```

**Champs requis :**
- `reason` (string, min:2, max:1000)

**Réponse (200 OK) :**
Voir la structure de réponse de `/payments` ci-dessus (status = "rejected")

**Rôles autorisés :** Admin de l'organisation

**Erreurs possibles :**
- `422` : Seul un paiement en attente peut être rejeté

---

#### 🚫 **POST /organizations/{organization}/payments/{payment}/cancel** - Annuler un paiement

**Réponse (200 OK) :**
Voir la structure de réponse de `/payments` ci-dessus (status = "cancelled")

**Rôles autorisés :**
- Admin de l'organisation
- Créateur du paiement (si status = "pending")

**Erreurs possibles :**
- `422` : Ce paiement ne peut plus être annulé

---

### Gestion des dépenses

#### 📋 **GET /organizations/{organization}/expenses** - Lister les dépenses

**Réponse (200 OK) :**
```json
{
  "data": [
    {
      "id": "662d3f4d5b8c7e9a0f123463",
      "organization_id": "662d3f4d5b8c7e9a0f123457",
      "amount": 5000,
      "description": "Achat de matériel de bureau",
      "date": "2024-01-16",
      "category": "Autres",
      "status": "active",
      "cancelled_at": null,
      "created_by": "662d3f4d5b8c7e9a0f123456",
      "created_by_admin_name": "Jean Dupont",
      "created_at": "2024-01-16T10:30:00.000Z"
    }
  ]
}
```

**Rôles autorisés :** Membre avec accès transactionnel ou admin

---

#### ✅ **POST /organizations/{organization}/expenses** - Créer une dépense

**Requête :**
```json
{
  "amount": 5000,
  "description": "Achat de matériel de bureau",
  "date": "2024-01-16",
  "category": "Autres"
}
```

**Champs requis :**
- `amount` (numeric, gt:0, max:9999999999)
- `description` (string, max:2000)
- `date` (date)
- `category` (enum: Nourriture, Transport, Santé, Autres)

**Réponse (201 Created) :**
Voir la structure de réponse de `/expenses` ci-dessus (status = "active")

**Rôles autorisés :** Membre avec accès transactionnel ou admin

---

#### 🚫 **POST /organizations/{organization}/expenses/{expense}/cancel** - Annuler une dépense

**Réponse (200 OK) :**
Voir la structure de réponse de `/expenses` ci-dessus (status = "cancelled")

**Rôles autorisés :** Membre avec accès transactionnel ou admin

**Erreurs possibles :**
- `422` : Cette dépense est déjà annulée

---

### Notifications

#### 📬 **GET /organizations/{organization}/notifications** - Lister les notifications

**Paramètres de requête :**
- `per_page` (optionnel, default: 50, max: 100)

**Réponse (200 OK) :**
```json
{
  "data": {
    "data": [
      {
        "id": "662d3f4d5b8c7e9a0f123464",
        "org_id": "662d3f4d5b8c7e9a0f123457",
        "target_user_id": null,
        "title": "Nouveau paiement reçu",
        "message": "Marie Martin a soumis 1000 FCFA via cash.",
        "type": "payment",
        "read": false,
        "date": "2024-01-16T10:30:00.000Z",
        "link_action": null
      }
    ],
    "current_page": 1,
    "first_page_url": "...",
    "from": 1,
    "last_page": 1,
    "last_page_url": "...",
    "next_page_url": null,
    "path": "...",
    "per_page": 50,
    "prev_page_url": null,
    "to": 1,
    "total": 1
  }
}
```

**Rôles autorisés :** Membre de l'organisation

---

#### ✅ **POST /organizations/{organization}/notifications/read-all** - Marquer toutes les notifications comme lues

**Réponse (200 OK) :**
```json
{
  "message": "Notifications marquées comme lues."
}
```

**Rôles autorisés :** Membre de l'organisation

---

#### ✅ **POST /organizations/{organization}/notifications/{notification}/read** - Marquer une notification comme lue

**Réponse (200 OK) :**
```json
{
  "data": {
    "id": "662d3f4d5b8c7e9a0f123464",
    "org_id": "662d3f4d5b8c7e9a0f123457",
    "target_user_id": null,
    "title": "Nouveau paiement reçu",
    "message": "Marie Martin a soumis 1000 FCFA via cash.",
    "type": "payment",
    "read": true,
    "date": "2024-01-16T10:30:00.000Z",
    "link_action": null
  }
}
```

**Rôles autorisés :** Membre de l'organisation ou destinataire de la notification

---

### Journal d'audit

#### 📜 **GET /organizations/{organization}/audit-logs** - Lister les logs d'audit

**Paramètres de requête :**
- `per_page` (optionnel, default: 100)

**Réponse (200 OK) :**
```json
{
  "data": {
    "data": [
      {
        "id": "662d3f4d5b8c7e9a0f123465",
        "organization_id": "662d3f4d5b8c7e9a0f123457",
        "user_id": "662d3f4d5b8c7e9a0f123456",
        "user_name": "Jean Dupont",
        "action": "CREATION_COTISATION",
        "description": "Création de la cotisation : Cotisation mensuelle",
        "resource_type": "contribution",
        "resource_id": "662d3f4d5b8c7e9a0f123460",
        "old_values": null,
        "new_values": null,
        "is_undone": false,
        "can_undo_until": null,
        "created_at": "2024-01-16T10:30:00.000Z"
      }
    ],
    "current_page": 1,
    "first_page_url": "...",
    "from": 1,
    "last_page": 1,
    "last_page_url": "...",
    "next_page_url": null,
    "path": "...",
    "per_page": 100,
    "prev_page_url": null,
    "to": 1,
    "total": 1
  }
}
```

**Rôles autorisés :** Admin de l'organisation

---

#### 🔄 **POST /organizations/{organization}/audit-logs/{auditLog}/undo** - Annuler une action

Annule une action financiers (paiement validé ou dépense).

**Réponse (200 OK) :**
Voir la structure de réponse de `/audit-logs` ci-dessus (is_undone = true)

**Rôles autorisés :** Admin de l'organisation

**Erreurs possibles :**
- `422` : Le délai d'annulation est dépassé
- `422` : Cette action est déjà annulée
- `422` : Cette action ne peut pas être annulée (seulement payment et expense)

---

### Administration globale (Superadmin)

Ces routes sont réservées aux utilisateurs avec le rôle global `superadmin`.

#### 👥 **GET /admin/users** - Lister tous les utilisateurs

**Réponse (200 OK) :**
```json
{
  "data": [
    {
      "id": "662d3f4d5b8c7e9a0f123456",
      "first_name": "Jean",
      "last_name": "Dupont",
      "email": "jean.dupont@example.com",
      "phone": "+221770000000",
      "gender": "M",
      "avatar": null,
      "global_role": "superadmin",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

#### ✏️ **PATCH /admin/users/{user}/role** - Mettre à jour le rôle global d'un utilisateur

**Requête :**
```json
{
  "global_role": "member"
}
```

**Champs requis :**
- `global_role` (enum: member, superadmin)

**Réponse (200 OK) :**
```json
{
  "data": {
    "id": "662d3f4d5b8c7e9a0f123456",
    "first_name": "Jean",
    "last_name": "Dupont",
    "email": "jean.dupont@example.com",
    "phone": "+221770000000",
    "gender": "M",
    "avatar": null,
    "global_role": "member",
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

**Erreurs possibles :**
- `422` : Vous ne pouvez pas modifier votre propre rôle

---

#### 🏢 **GET /admin/organizations** - Lister toutes les organisations

**Paramètres de requête :**
- `page` (optionnel)

**Réponse (200 OK) :**
```json
{
  "data": {
    "data": [
      {
        "id": "662d3f4d5b8c7e9a0f123457",
        "name": "Mon Association",
        "type": "association",
        "description": "Description",
        "logo_url": null,
        "location": "Dakar",
        "member_estimate": 0,
        "status": "active",
        "subscription_plan": "free",
        "subscription_renewal_date": "2024-02-15",
        "created_by": "662d3f4d5b8c7e9a0f123456",
        "creator": {
          "id": "662d3f4d5b8c7e9a0f123456",
          "name": "Jean Dupont"
        },
        "members_count": 5,
        "created_at": "2024-01-15T10:30:00.000Z"
      }
    ],
    "current_page": 1,
    "first_page_url": "...",
    "from": 1,
    "last_page": 1,
    "last_page_url": "...",
    "next_page_url": null,
    "path": "...",
    "per_page": 15,
    "prev_page_url": null,
    "to": 1,
    "total": 1
  }
}
```

---

#### 🔧 **PATCH /admin/organizations/{organization}/status** - Mettre à jour le statut d'une organisation

**Requête :**
```json
{
  "status": "suspended"
}
```

**Champs requis :**
- `status` (enum: active, suspended)

**Réponse (200 OK) :**
Voir la structure de réponse de `/organizations` ci-dessus.

---

### Programme de parrainage

Voir [GET /referrals](#-get-referrals---obtenir-le-profil-de-parrainage) et [POST /referrals/rotate](#-post-referralsrotate---générer-un-nouveau-code-de-parrainage)

---

### Route Bootstrap

Voir [GET /bootstrap](#-get-bootstraporganization_idid---charger-toutes-les-données-du-frontend)

---

### Codes HTTP et gestion des erreurs

| Code | Description | Cause possible |
|------|-------------|----------------|
| 200 | OK | Requête réussie |
| 201 | Created | Ressource créée avec succès |
| 202 | Accepted | Demande acceptée, traitement en cours |
| 400 | Bad Request | Données invalides |
| 401 | Unauthorized | Token manquant ou invalide |
| 403 | Forbidden | Accès interdit (rôle insuffisant) |
| 404 | Not Found | Ressource introuvable |
| 409 | Conflict | Conflit (ex: demande déjà existante) |
| 422 | Unprocessable Entity | Validation échouée |
| 429 | Too Many Requests | Limite de requêtes dépassée |
| 500 | Internal Server Error | Erreur serveur |

**Format des erreurs :**
```json
{
  "message": "Message d'erreur",
  "errors": {
    "champ": ["Le champ est requis."],
    "autre_champ": ["Le format est invalide."]
  }
}
```

---

### Modèles de données

#### User

| Champ | Type | Description |
|-------|------|-------------|
| id | string (MongoDB) | Identifiant unique |
| first_name | string | Prénom |
| last_name | string | Nom de famille |
| name | string | Nom complet (calculé) |
| email | string | Adresse email |
| phone | string | Téléphone |
| gender | enum(M,F) | Genre |
| avatar | url | URL de l'avatar |
| global_role | enum(member,superadmin) | Rôle global |
| password | hashed | Mot de passe |
| created_at | datetime | Date de création |

**Relations :**
- `memberships` - OrganizationMember[]
- `createdOrganizations` - Organization[]
- `referralProfile` - ReferralProfile

---

#### Organization

| Champ | Type | Description |
|-------|------|-------------|
| id | string (MongoDB) | Identifiant unique |
| created_by | string | ID du créateur (User) |
| name | string | Nom de l'organisation |
| type | enum(dahira,tontine,association) | Type d'organisation |
| description | text | Description |
| logo_url | url | URL du logo |
| location | string | Localisation |
| member_estimate | integer | Estimation du nombre de membres |
| wave_number | string | Numéro Wave |
| orange_money_number | string | Numéro Orange Money |
| subscription_plan | enum(free,basic,premium) | Forfait d'abonnement |
| subscription_renewal_date | date | Date de renouvellement |
| status | enum(active,suspended,pending_deletion) | Statut |
| deletion_scheduled_at | datetime | Date de suppression programmée |
| created_at | datetime | Date de création |

**Relations :**
- `creator` - User
- `members` - OrganizationMember[]
- `contributions` - Contribution[]
- `payments` - Payment[]
- `expenses` - Expense[]
- `auditLogs` - AuditLog[]
- `notifications` - AppNotification[]
- `invitations` - OrganizationInvitation[]

---

#### OrganizationMember

| Champ | Type | Description |
|-------|------|-------------|
| id | string (MongoDB) | Identifiant unique |
| organization_id | string | ID de l'organisation |
| user_id | string | ID de l'utilisateur (nullable pour ghost) |
| first_name | string | Prénom |
| last_name | string | Nom de famille |
| phone | string | Téléphone |
| email | string | Adresse email |
| gender | enum(M,F) | Genre |
| role | enum(admin,member) | Rôle dans l'organisation |
| status | enum(active,pending,archived) | Statut de membership |
| is_ghost | boolean | Membre sans compte utilisateur |
| has_transaction_access | boolean | Accès aux données financières |
| join_date | date | Date d'adhésion |
| avatar | url | URL de l'avatar |

**Relations :**
- `organization` - Organization
- `user` - User

---

#### Contribution

| Champ | Type | Description |
|-------|------|-------------|
| id | string (MongoDB) | Identifiant unique |
| organization_id | string | ID de l'organisation |
| created_by | string | ID du créateur |
| title | string | Titre de la cotisation |
| amount_type | enum(fixed,minimum) | Type de montant |
| amount | float | Montant |
| amount_female | float | Montant pour les femmes (si by_gender) |
| frequency | enum(weekly,biweekly,monthly,quarterly,annual) | Fréquence |
| day_of_month | integer | Jour du mois (pour monthly) |
| start_date | date | Date de début |
| target_type | enum(all,custom,by_gender) | Type de cible |
| target_member_ids | array | IDs des membres ciblés (si custom) |
| status | enum(active,inactive,archived) | Statut |

**Relations :**
- `organization` - Organization
- `cycles` - ContributionCycle[]

---

#### ContributionCycle

| Champ | Type | Description |
|-------|------|-------------|
| id | string (MongoDB) | Identifiant unique |
| organization_id | string | ID de l'organisation |
| contribution_id | string | ID de la cotisation |
| contribution_title | string | Titre de la cotisation (dénormalisé) |
| cycle_number | integer | Numéro du cycle |
| period_label | string | Libellé de la période |
| due_date | date | Date d'échéance |
| expected_amount | float | Montant attendu |
| total_collected | float | Total collecté |
| status | enum(open,closed) | Statut |

**Relations :**
- `contribution` - Contribution
- `organization` - Organization

---

#### Payment

| Champ | Type | Description |
|-------|------|-------------|
| id | string (MongoDB) | Identifiant unique |
| organization_id | string | ID de l'organisation |
| contribution_id | string | ID de la cotisation |
| cycle_id | string | ID du cycle (nullable) |
| member_id | string | ID du membre |
| created_by | string | ID du créateur |
| contribution_title | string | Titre de la cotisation (dénormalisé) |
| member_name | string | Nom du membre (dénormalisé) |
| member_phone | string | Téléphone du membre (dénormalisé) |
| amount | float | Montant |
| method | enum(wave,orange_money,cash) | Méthode de paiement |
| transaction_id | string | ID de transaction |
| status | enum(pending,validated,rejected,cancelled) | Statut |
| notes | text | Notes |
| reject_reason | string | Raison du rejet |
| payment_date | datetime | Date de paiement |
| validated_at | datetime | Date de validation |
| validated_by | string | ID du validateur |

**Relations :**
- `organization` - Organization
- `contribution` - Contribution
- `cycle` - ContributionCycle
- `member` - OrganizationMember
- `validator` - User

---

#### Expense

| Champ | Type | Description |
|-------|------|-------------|
| id | string (MongoDB) | Identifiant unique |
| organization_id | string | ID de l'organisation |
| amount | float | Montant |
| description | string | Description |
| date | date | Date de la dépense |
| category | enum(Nourriture,Transport,Santé,Autres) | Catégorie |
| status | enum(active,cancelled) | Statut |
| cancelled_at | datetime | Date d'annulation |
| created_by | string | ID du créateur |
| created_by_admin_name | string | Nom du créateur (dénormalisé) |

**Relations :**
- `organization` - Organization

---

#### AppNotification

| Champ | Type | Description |
|-------|------|-------------|
| id | string (MongoDB) | Identifiant unique |
| organization_id | string | ID de l'organisation |
| target_user_id | string | ID de l'utilisateur cible (nullable) |
| title | string | Titre |
| message | string | Message |
| type | string | Type (payment, expense, etc.) |
| read_at | datetime | Date de lecture |
| link_action | string | Lien d'action |

---

#### AuditLog

| Champ | Type | Description |
|-------|------|-------------|
| id | string (MongoDB) | Identifiant unique |
| organization_id | string | ID de l'organisation |
| user_id | string | ID de l'utilisateur |
| user_name | string | Nom de l'utilisateur (dénormalisé) |
| action | string | Action effectuée |
| description | string | Description |
| resource_type | string | Type de ressource |
| resource_id | string | ID de la ressource |
| old_values | json | Anciennes valeurs |
| new_values | json | Nouvelles valeurs |
| is_undone | boolean | Action annulée |
| can_undo_until | datetime | Date limite d'annulation |

---

#### ReferralProfile

| Champ | Type | Description |
|-------|------|-------------|
| id | string (MongoDB) | Identifiant unique |
| user_id | string | ID de l'utilisateur |
| code | string | Code de parrainage |

**Relations :**
- `user` - User
- `conversions` - ReferralConversion[]

---

#### ReferralConversion

| Champ | Type | Description |
|-------|------|-------------|
| id | string (MongoDB) | Identifiant unique |
| referral_profile_id | string | ID du profil de parrainage |
| organization_id | string | ID de l'organisation créée |

**Relations :**
- `referralProfile` - ReferralProfile
- `organization` - Organization

---

## Tests

Les tests Feature utilisent exclusivement une base MongoDB locale `cotiz_test` sur un replica set `rs0` au port `27018`; PHPUnit force cette configuration et n'utilise pas l'URI Atlas de `.env`. Ils exécutent `migrate:fresh` sur cette base : ne configurez jamais l'URI Atlas ou une base contenant des données à conserver pour les tests.

```sh
mkdir -p /tmp/cotiz-mongodb-test
mongod --dbpath /tmp/cotiz-mongodb-test --port 27018 --bind_ip 127.0.0.1 --replSet rs0
```

Dans un autre terminal, initialisez le replica set une seule fois puis lancez les tests :

```sh
mongosh 'mongodb://127.0.0.1:27018/admin' --eval 'rs.initiate({_id:"rs0",members:[{_id:0,host:"127.0.0.1:27018"}]})'
cd cotiz-api
php artisan test
```
