# Cotiz - Application Frontend

**Application React/Vite moderne pour la gestion des cotisations communautaires**

Cotiz est une application web progressive (PWA-ready) construite avec **React 19**, **TypeScript**, **Vite** et **Tailwind CSS 4**, connectée à une API Laravel 13 backend. Elle permet aux dahiras, tontines et associations de gérer leurs membres, cotisations, paiements et dépenses de manière transparente et sécurisée.

---

## 📚 Sommaire

- [Prérequis](#-prérequis)
- [Architecture Technique](#-architecture-technique)
- [Structure du Projet](#-structure-du-projet)
- [Configuration et Environnement](#-configuration-et-environnement)
- [Démarrage Local](#-démarrage-local)
- [Client API](#-client-api)
- [Gestion d'État (Context API)](#-gestion-détat-context-api)
  - [AuthContext - Authentification](#authcontext---authentification)
  - [DataContext - Données Métier](#datacontext---données-métier)
  - [PreferencesContext - Préférences Utilisateur](#preferencescontext---préférences-utilisateur)
- [Système de Types](#-système-de-types)
- [Composants UI](#-composants-ui)
  - [Layout & Navigation](#layout--navigation)
  - [Authentification](#authentification)
  - [Tableau de bord](#tableau-de-bord)
  - [Gestion des Cotisations](#gestion-des-cotisations)
  - [Gestion des Paiements](#gestion-des-paiements)
  - [Gestion des Dépenses](#gestion-des-dépenses)
  - [Gestion des Membres](#gestion-des-membres)
  - [Rapports & Bilan](#rapports--bilan)
  - [Administration](#administration)
  - [Parrainage](#parrainage)
  - [Modales et Overlays](#modales-et-overlays)
- [Internationalisation (i18n)](#-internationalisation-i18n)
- [Styling et Design](#-styling-et-design)
- [Sécurité](#-sécurité)
- [Déploiement](#-déploiement)
- [Bonnes Pratiques](#-bonnes-pratiques)
- [Résolution des Problèmes](#-résolution-des-problèmes)

---

## 🎯 Prérequis

| Logiciel | Version | Description |
|----------|---------|-------------|
| Node.js | 20+ | Runtime JavaScript |
| npm | 10+ | Gestionnaire de paquets |
| PHP | 8.3+ | Requise pour l'API backend |
| MongoDB Extension | 1.21.x | `mongodb` PHP extension pour MongoDB Atlas |
| Composer | 2+ | Gestionnaire de dépendances PHP |

**Vérification de l'extension MongoDB :**
```bash
php -r 'printf("mongodb=%s; Manager=%s\n", phpversion("mongodb") ?: "missing", class_exists("MongoDB\\Driver\\Manager") ? "yes" : "no");'
```
Si `missing` ou `no`, suivez les instructions dans [cotiz-api/README.md](./cotiz-api/README.md#installation-locale).

---

## 🏗️ Architecture Technique

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React/Vite)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐    │
│  │  App.tsx        │  │  package.json   │  │  vite.config.ts │    │
│  │  (Entry Point)  │  │  (Dependencies) │  │  (Vite Config)  │    │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘    │
│           │                  │                   │              │
│  ┌────────▼────────┐  ┌─────▼─────┐  ┌─────────▼─────────┐        │
│  │  context/        │  │  api/    │  │  components/      │        │
│  │  ├── AuthContext │  │  └─ client.ts │  │  ├── layout/     │        │
│  │  ├── DataContext │  │  (API Client)│  │  │   ├── MainLayout│        │
│  │  └── Preferences │  │               │  │  │   ├── Sidebar  │        │
│  │     Context      │  │               │  │  │   └── Header   │        │
│  └─────────────────┘  └───────────────┘  │  ├── auth/        │        │
│                                           │  │   └── AuthView │        │
│  ┌─────────────────┐  ┌─────────────────┐  │  ├── dashboard/   │        │
│  │  types/         │  │  utils/         │  │  │   ├── AdminDash │        │
│  │  ├── index.ts   │  │  ├── formatters │  │  │   └── MemberDash│        │
│  │  ├── auth.ts    │  │  └── helpers.ts │  │  ├── contributions/│      │
│  │  ├── organization│  │                 │  │  ├── payments/   │        │
│  │  ├── member.ts  │  │                 │  │  ├── expenses/   │        │
│  │  ├── contribution│  │                 │  │  ├── members/    │        │
│  │  ├── payment.ts │  │                 │  │  ├── admin/      │        │
│  │  └── expense.ts │  │                 │  │  └── reports/    │        │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  public/ - Assets statiques                                   │  │
│  │  ├── index.html                                              │  │
│  │  ├── assets/ (images, icons)                                 │  │
│  │  └── favicon                                                 │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Laravel 13)                        │
│  https://github.com/.../cotiz-api                               │
│  API REST JSON @ /api/v1                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Structure du Projet

```
cotiz/
├── .env.example              # Variables d'environnement frontend
├── .gitignore                # Fichiers ignorés par Git
├── index.html                # Point d'entrée HTML
├── metadata.json             # Métadonnées de l'application
├── package.json              # Dépendances et scripts npm
├── render.yaml               # Configuration de déploiement Render
├── tsconfig.json             # Configuration TypeScript
├── vite.config.ts            # Configuration Vite
├── 
├── public/                   # Assets statiques
│   └── assets/               # Images et ressources
│
├── src/                      # Code source principal
│   ├── main.tsx              # Point d'entrée React
│   ├── App.tsx                # Composant racine
│   ├── index.css             # Styles globaux (Tailwind)
│   │
│   ├── api/                  # Client API
│   │   └── client.ts         # Configuration et appels API
│   │
│   ├── context/              # Contextes React
│   │   ├── AuthContext.tsx   # Gestion de l'authentification
│   │   ├── DataContext.tsx   # Gestion des données métier
│   │   └── PreferencesContext.tsx # Préférences utilisateur
│   │
│   ├── types/                # Définitions TypeScript
│   │   ├── index.ts           # Types communs
│   │   ├── auth.ts            # Types utilisateur
│   │   ├── organization.ts   # Types organisation
│   │   ├── member.ts          # Types membre
│   │   ├── contribution.ts  # Types cotisation
│   │   ├── payment.ts         # Types paiement
│   │   └── expense.ts         # Types dépense
│   │
│   ├── components/           # Composants React
│   │   ├── common/            # Composants réutilisables
│   │   │   ├── Badge.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── ConfirmModal.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── Select.tsx
│   │   │
│   │   ├── layout/            # Layout et navigation
│   │   │   ├── MainLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── BottomTabBar.tsx
│   │   │   ├── GlobalSearchModal.tsx
│   │   │   └── NotificationsModal.tsx
│   │   │
│   │   ├── auth/              # Authentification
│   │   │   └── AuthView.tsx
│   │   │
│   │   ├── dashboard/         # Tableaux de bord
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── MemberDashboard.tsx
│   │   │   └── RevenueExpenseChart.tsx
│   │   │
│   │   ├── contributions/    # Cotisations
│   │   │   ├── ContributionsList.tsx
│   │   │   ├── CreateContributionModal.tsx
│   │   │   └── ContributionDetailsModal.tsx
│   │   │
│   │   ├── payments/          # Paiements
│   │   │   ├── PaymentHistoryTable.tsx
│   │   │   ├── MakePaymentModal.tsx
│   │   │   └── PaymentValidationModal.tsx
│   │   │
│   │   ├── expenses/          # Dépenses
│   │   │   ├── ExpensesList.tsx
│   │   │   └── CreateExpenseModal.tsx
│   │   │
│   │   ├── members/           # Membres
│   │   │   ├── MembersList.tsx
│   │   │   ├── AddMemberModal.tsx
│   │   │   ├── MemberDetailsModal.tsx
│   │   │   └── InviteLinkModal.tsx
│   │   │
│   │   ├── admin/             # Administration
│   │   │   ├── OrganizationSettings.tsx
│   │   │   ├── CreateOrganizationModal.tsx
│   │   │   └── SuperAdminConsole.tsx
│   │   │
│   │   ├── reports/           # Rapports
│   │   │   └── ReportsDashboard.tsx
│   │   │
│   │   ├── referrals/         # Parrainage
│   │   │   └── ReferralDashboard.tsx
│   │   │
│   │   └── profile/           # Profil
│   │       └── UserProfileModal.tsx
│   │
│   └── utils/                 # Fonctions utilitaires
│       ├── formatters.ts      # Formatage (dates, nombres)
│       └── helpers.ts          # Helpers divers
│
└── dist/                      # Build de production (généré)
```

---

## ⚙️ Configuration et Environnement

### Variables d'Environnement

| Variable | Description | Valeur par défaut | Obligatoire |
|----------|-------------|------------------|-------------|
| `VITE_API_URL` | URL de base de l'API backend | `https://cotiz-api.onrender.com/api/v1` | Non |

**Fichier `.env.local` (recommandé pour le développement local) :**
```env
# Pour un backend local
VITE_API_URL=http://localhost:8000/api/v1

# Pour un déploiement personnalisé
# VITE_API_URL=https://votre-api.cotiz.com/api/v1
```

> ⚠️ **Important :** Les variables doivent être préfixées par `VITE_` pour être accessibles dans le code. Ne commitez jamais de fichiers `.env.local` contenant des URLs de production ou des secrets.

### Configuration Vite

Le fichier `vite.config.ts` configure :
- Le port de développement (3000)
- Le host (0.0.0.0 pour accès réseau)
- Le plugin React
- Le plugin Tailwind CSS

### Configuration TypeScript

`tsconfig.json` configure :
- Target ECMAScript 2020
- Module ESNext
- Strict mode activé
- JSX préservé
- Résolution de modules Node16

---

## 🚀 Démarrage Local

### 1. Installer les dépendances frontend
```bash
npm install
```

### 2. Démarrer le backend (Laravel API)
Dans un terminal séparé :
```bash
cd cotiz-api
composer install
cp .env.example .env
# Configurer DB_DSN avec votre URI MongoDB Atlas
php artisan key:generate
php artisan migrate --force
php artisan serve --host=127.0.0.1 --port=8000
```

### 3. Démarrer le planificateur Laravel
Dans un autre terminal :
```bash
cd cotiz-api
php artisan schedule:work
```

### 4. Démarrer le frontend
À la racine du projet :
```bash
# Pour le développement
npm run dev

# Pour un build de production
npm run build

# Pour prévisualiser le build
npm run preview
```

L'application sera accessible à : `http://localhost:3000`

> 💡 **Astuce :** Si vous utilisez l'API locale, assurez-vous que `VITE_API_URL=http://localhost:8000/api/v1` est défini dans `.env.local`.

---

## 🌐 Client API

Le client API centralisé (`src/api/client.ts`) gère toutes les communications avec le backend.

### Fonctionnalités clés :

1. **Configuration de base**
   - Base URL configurable via `VITE_API_URL`
   - Gestion automatique des tokens d'authentification
   - En-têtes HTTP standardisés

2. **Transformation des données**
   - `toClient()` : Convertit snake_case → camelCase pour le frontend
   - `toServer()` : Convertit camelCase → snake_case pour le backend
   - Gestion automatique des IDs MongoDB (conversion en strings)

3. **Gestion des erreurs**
   - Classe `ApiError` personnalisée avec status HTTP et messages
   - Interception et formatage des erreurs API

4. **Méthodes de requête**
   - Requêtes GET, POST, PATCH, DELETE
   - Support JSON automatique
   - Typage fort avec TypeScript

### Exemple d'utilisation :

```typescript
import { api, ApiError, getApiErrorMessage } from '../api/client';

// Appel API avec gestion d'erreur
try {
  const data = await api.auth.login('email@example.com', 'password123');
  console.log('Challenge:', data.challenge);
} catch (error) {
  if (error instanceof ApiError) {
    console.error('Status:', error.status);
    console.error('Message:', error.message);
    console.error('Errors:', error.errors);
  }
}
```

### Méthodes disponibles :

#### Authentification
```typescript
api.auth.login(email, password)                    // POST /auth/login
api.auth.verifyLoginOtp(challenge, code)          // POST /auth/login/verify
api.auth.resendLoginOtp(challenge)                // POST /auth/login/resend
api.auth.register(data)                           // POST /auth/register
api.auth.me()                                     // GET /auth/me
api.auth.logout()                                 // POST /auth/logout
api.auth.updateProfile(data)                      // PATCH /auth/profile
api.auth.forgotPassword(email)                    // POST /auth/forgot-password
api.auth.resetPassword(email, token, password)    // POST /auth/reset-password
```

#### Bootstrap (Chargement initial)
```typescript
api.bootstrap(organizationId?)                      // GET /bootstrap
```

#### Organisations
```typescript
api.organizations.list()                           // GET /organizations
api.organizations.create(data)                     // POST /organizations
api.organizations.update(id, data)                // PATCH /organizations/{id}
api.organizations.delete(id)                      // DELETE /organizations/{id}
api.organizations.restore(id)                     // POST /organizations/{id}/restore
api.organizations.updatePlan(id, plan)            // PATCH /organizations/{id}/subscription
api.organizations.updateStatus(id, status)        // PATCH /admin/organizations/{id}/status
```

#### Invitations
```typescript
api.invitations.create(orgId)                      // POST /organizations/{orgId}/invitations
api.invitations.preview(token)                    // GET /invitations/{token}
```

#### Parrainage
```typescript
api.referrals.show()                              // GET /referrals
api.referrals.rotate()                            // POST /referrals/rotate
```

#### Membres
```typescript
api.members.add(orgId, data)                       // POST /organizations/{orgId}/members
api.members.update(orgId, id, data)               // PATCH /organizations/{orgId}/members/{id}
api.members.archive(orgId, id)                    // DELETE /organizations/{orgId}/members/{id}
api.members.accept(orgId, id)                     // POST /organizations/{orgId}/members/{id}/accept
api.members.reject(orgId, id)                     // POST /organizations/{orgId}/members/{id}/reject
api.members.toggleTransactionAccess(orgId, id)     // PATCH /organizations/{orgId}/members/{id}/transaction-access
api.members.transferAdmin(orgId, id)              // POST /organizations/{orgId}/members/{id}/transfer-admin
```

#### Cotisations
```typescript
api.contributions.create(orgId, data)            // POST /organizations/{orgId}/contributions
api.contributions.update(orgId, id, data)        // PATCH /organizations/{orgId}/contributions/{id}
api.contributions.closeCycle(orgId, id)          // POST /organizations/{orgId}/cycles/{id}/close
```

#### Paiements
```typescript
api.payments.create(orgId, data)                  // POST /organizations/{orgId}/payments
api.payments.validate(orgId, id, notes?)         // POST /organizations/{orgId}/payments/{id}/validate
api.payments.reject(orgId, id, reason)            // POST /organizations/{orgId}/payments/{id}/reject
api.payments.cancel(orgId, id)                   // POST /organizations/{orgId}/payments/{id}/cancel
```

#### Dépenses
```typescript
api.expenses.create(orgId, data)                  // POST /organizations/{orgId}/expenses
api.expenses.cancel(orgId, id)                   // POST /organizations/{orgId}/expenses/{id}/cancel
```

#### Notifications
```typescript
api.notifications.markRead(orgId, id)             // POST /organizations/{orgId}/notifications/{id}/read
api.notifications.markAllRead(orgId)             // POST /organizations/{orgId}/notifications/read-all
```

#### Audit
```typescript
api.audit.undo(orgId, id)                         // POST /organizations/{orgId}/audit-logs/{id}/undo
```

---

## 🔄 Gestion d'État (Context API)

L'application utilise **React Context API** pour la gestion d'état globale, évitant ainsi des bibliothèques externes comme Redux.

---

### AuthContext - Authentification

**Fichier :** `src/context/AuthContext.tsx`

Gère l'état de l'utilisateur et les opérations d'authentification.

#### État géré :
```typescript
interface AuthContextType {
  user: User | null;              // Utilisateur authentifié
  isAuthenticated: boolean;        // Statut de connexion
  isLoading: boolean;              // Chargement en cours
  authError: string | null;        // Erreur d'authentification
  login: (email, password) => Promise<LoginChallenge>;
  verifyLoginOtp: (challenge, code, rememberMe?) => Promise<void>;
  resendLoginOtp: (challenge) => Promise<LoginChallenge>;
  signup: (data) => Promise<boolean>;
  logout: () => Promise<void>;
  updateCurrentUserProfile: (data) => Promise<void>;
}
```

#### Utilisation :
```typescript
import { useAuth } from '../../context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <button onClick={() => login('email@test.com', 'password')}>Connexion</button>;
  }
  
  return <div>Bonjour {user.firstName}!</div>;
}
```

#### Persistance du token :
- **`rememberMe: true`** → Token stocké dans `localStorage` (persistant)
- **`rememberMe: false`** → Token stocké dans `sessionStorage` (session uniquement)
- Clé de stockage : `cotiz_api_token`

---

### DataContext - Données Métier

**Fichier :** `src/context/DataContext.tsx`

Gère toutes les données métier de l'application et les opérations CRUD.

#### État géré :
```typescript
interface DataContextType {
  // Organisation
  currentOrg: Organization;
  organizations: Organization[];
  setCurrentOrgId: (id) => void;
  createOrganization: (data) => Promise<Organization | undefined>;
  updateOrganization: (id, updates) => Promise<void>;
  deleteOrganization: (id) => Promise<void>;
  
  // Membres
  members: Member[];
  orgMembers: Member[];  // Filtrés par organisation actuelle
  addMember: (data) => Promise<Member | undefined>;
  updateMember: (id, updates) => Promise<void>;
  deleteMember: (id) => Promise<void>;
  acceptPendingMember: (id) => Promise<void>;
  rejectPendingMember: (id) => Promise<void>;
  toggleTransactionAccess: (memberId) => Promise<void>;
  transferAdminRole: (newAdminMemberId) => Promise<void>;
  
  // Cotisations
  contributions: Contribution[];
  orgContributions: Contribution[];  // Filtrés par organisation
  createContribution: (data) => Promise<Contribution | undefined>;
  updateContribution: (id, updates) => Promise<void>;
  
  // Cycles
  cycles: ContributionCycle[];
  orgCycles: ContributionCycle[];
  closeCycle: (cycleId) => Promise<void>;
  
  // Paiements
  payments: Payment[];
  orgPayments: Payment[];
  recordPayment: (data) => Promise<Payment | undefined>;
  validatePayment: (paymentId, notes?) => Promise<boolean>;
  rejectPayment: (paymentId, reason) => Promise<boolean>;
  cancelPayment: (paymentId) => Promise<boolean>;
  
  // Dépenses
  expenses: Expense[];
  orgExpenses: Expense[];
  createExpense: (data) => Promise<Expense | undefined>;
  cancelExpense: (expenseId) => Promise<boolean>;
  
  // Notifications
  notifications: AppNotification[];
  markNotificationAsRead: (id) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  
  // Audit
  auditLogs: AuditLog[];
  orgAuditLogs: AuditLog[];
  undoAuditAction: (logId) => Promise<boolean>;
  
  // Abonnement
  updateSubscriptionPlan: (orgId, plan) => Promise<void>;
}
```

#### Fonctionnement :
1. **Chargement initial** : Au montage, charge toutes les données via `api.bootstrap()`
2. **Rafraîchissement** : `refresh()` recharge toutes les données pour une organisation
3. **Exécution des opérations** : `execute()` enveloppe les appels API avec gestion d'erreur et rafraîchissement automatique
4. **Filtrage par organisation** : Les données sont automatiquement filtrées par `currentOrgId`

#### Pattern d'utilisation :
```typescript
import { useData } from '../../context/DataContext';

function PaymentList() {
  const { orgPayments, validatePayment, rejectPayment } = useData();
  
  const handleValidate = async (paymentId: string) => {
    await validatePayment(paymentId, 'Validation manuelle');
    // Rafraîchissement automatique via DataContext
  };
  
  return (
    <div>
      {orgPayments.map(payment => (
        <div key={payment.id}>
          {payment.amount} FCFA - {payment.status}
          {payment.status === 'pending' && (
            <>
              <button onClick={() => handleValidate(payment.id)}>Valider</button>
              <button onClick={() => rejectPayment(payment.id, 'Montant incorrect')}>Rejeter</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

### PreferencesContext - Préférences Utilisateur

**Fichier :** `src/context/PreferencesContext.tsx`

Gère les préférences utilisateur locales (langue, thème).

#### État géré :
```typescript
interface PreferencesContextType {
  language: AppLanguage;        // fr, en, wo, es, pt
  setLanguage: (lang) => void;
  theme: AppTheme;              // light, dark
  toggleTheme: () => void;
  t: (key: string) => string;   // Fonction de traduction
}
```

#### Langues supportées :
| Code | Nom | Nom Natif |
|------|-----|-----------|
| fr | Français | Français |
| en | Anglais | English |
| wo | Wolof | Wolof |
| es | Espagnol | Español |
| pt | Portugais | Português |

#### Thèmes supportés :
- **light** : Thème clair
- **dark** : Thème sombre

#### Utilisation :
```typescript
import { usePreferences } from '../../context/PreferencesContext';

function SettingsPage() {
  const { language, setLanguage, theme, toggleTheme, t } = usePreferences();
  
  return (
    <div>
      <h1>{t('Sécurité & Langue')}</h1>
      
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option value="fr">Français</option>
        <option value="en">English</option>
        <option value="wo">Wolof</option>
      </select>
      
      <button onClick={toggleTheme}>
        {theme === 'dark' ? t('Thème clair') : t('Thème sombre')}
      </button>
    </div>
  );
}
```

---

## 🏷️ Système de Types

TypeScript est utilisé pour un typage fort de toutes les données de l'application.

### Types Principaux :

#### User (Utilisateur)
```typescript
interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: Gender;          // 'M' | 'F'
  avatar?: string;
  role: UserRole;          // 'admin' | 'member' | 'superadmin'
  currentOrgId: string;
  accessibleOrgIds: string[];
  createdAt: string;
}

type Gender = 'M' | 'F';
type UserRole = 'admin' | 'member' | 'superadmin';
```

#### Organization (Organisation)
```typescript
interface Organization {
  id: string;
  name: string;
  type: OrganizationType;      // 'dahira' | 'tontine' | 'association'
  description?: string;
  logoUrl?: string;
  location: string;
  memberEstimate: number;
  adminId: string;
  adminName: string;
  waveNumber: string;
  orangeMoneyNumber: string;
  subscriptionPlan: SubscriptionTier;  // 'free' | 'basic' | 'premium'
  subscriptionRenewalDate: string;
  status: 'active' | 'suspended' | 'pending_deletion';
  deletionScheduledAt?: string;
  createdAt: string;
}

type OrganizationType = 'dahira' | 'tontine' | 'association';
type SubscriptionTier = 'free' | 'basic' | 'premium';
```

#### Member (Membre)
```typescript
interface Member {
  id: string;
  userId?: string;              // Si lié à un utilisateur Cotiz
  orgId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  gender: Gender;               // 'M' | 'F'
  role: MemberRole;             // 'admin' | 'member'
  status: MemberStatus;         // 'active' | 'pending' | 'archived'
  isGhost: boolean;            // Membre sans compte utilisateur
  hasTransactionAccess: boolean; // Accès aux données financières
  joinDate: string;
  avatar?: string;
}

type MemberRole = 'admin' | 'member';
type MemberStatus = 'active' | 'pending' | 'archived';
```

#### Contribution (Cotisation)
```typescript
interface Contribution {
  id: string;
  orgId: string;
  title: string;
  amountType: ContributionAmountType;  // 'fixed' | 'minimum'
  amount: number;
  amountFemale?: number;        // Pour targetType = 'by_gender'
  frequency: ContributionFrequency;    // 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual'
  dayOfMonth?: number;
  startDate: string;
  targetType: ContributionTargetType;   // 'all' | 'custom' | 'by_gender'
  targetMemberIds?: string[];
  status: ContributionStatus;    // 'active' | 'inactive' | 'archived'
  createdAt: string;
}

type ContributionAmountType = 'fixed' | 'minimum';
type ContributionFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual';
type ContributionTargetType = 'all' | 'custom' | 'by_gender';
type ContributionStatus = 'active' | 'inactive' | 'archived';
```

#### ContributionCycle (Échéance)
```typescript
interface ContributionCycle {
  id: string;
  contributionId: string;
  contributionTitle: string;
  orgId: string;
  cycleNumber: number;
  periodLabel: string;           // Ex: "Novembre 2026"
  dueDate: string;
  expectedAmount: number;
  totalCollected: number;
  status: CycleStatus;           // 'open' | 'closed'
}

type CycleStatus = 'open' | 'closed';
```

#### Payment (Paiement)
```typescript
interface Payment {
  id: string;
  orgId: string;
  contributionId: string;
  contributionTitle: string;
  cycleId?: string;
  memberId: string;
  memberName: string;
  memberPhone?: string;
  amount: number;
  method: PaymentMethod;         // 'wave' | 'orange_money' | 'cash'
  transactionId: string;
  status: PaymentStatus;        // 'pending' | 'validated' | 'rejected' | 'cancelled'
  notes?: string;
  rejectReason?: string;
  paymentDate: string;
  validatedAt?: string;
  validatedBy?: string;
}

type PaymentMethod = 'wave' | 'orange_money' | 'cash';
type PaymentStatus = 'pending' | 'validated' | 'rejected' | 'cancelled';
```

#### Expense (Dépense)
```typescript
interface Expense {
  id: string;
  orgId: string;
  amount: number;
  description: string;
  date: string;
  category: ExpenseCategory;     // 'Nourriture' | 'Transport' | 'Santé' | 'Autres'
  createdByAdminId: string;
  createdByAdminName: string;
  status: ExpenseStatus;         // 'active' | 'cancelled'
  createdAt: string;
  cancelledAt?: string;
}

type ExpenseCategory = 'Nourriture' | 'Transport' | 'Santé' | 'Autres';
type ExpenseStatus = 'active' | 'cancelled';
```

#### AppNotification (Notification)
```typescript
interface AppNotification {
  id: string;
  orgId: string;
  targetUserId?: string;        // Si spécifique à un utilisateur
  title: string;
  message: string;
  type: NotificationType;       // 'payment' | 'contribution' | 'member' | 'expense' | 'system'
  read: boolean;
  date: string;
  linkAction?: string;
}

type NotificationType = 'payment' | 'contribution' | 'member' | 'expense' | 'system';
```

#### AuditLog (Journal d'Audit)
```typescript
interface AuditLog {
  id: string;
  orgId: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  resourceType: 'payment' | 'expense' | 'contribution' | 'member' | 'organization';
  resourceId: string;
  timestamp: string;
  canUndoUntil?: string;         // Dans 1 heure
  isUndone?: boolean;
}
```

#### ReferralData (Parrainage)
```typescript
interface ReferralData {
  code: string;
  creatorName: string;
  totalUses: number;
  totalCommission: number;
  paidCommission: number;
  pendingCommission: number;
  convertedOrgs: Array<{
    orgName: string;
    date: string;
    plan: string;
    commissionAmount: number;
  }>;
  payouts: Array<{
    id: string;
    date: string;
    amount: number;
    status: 'paid' | 'pending';
    method: 'Wave';
    waveNumber: string;
  }>;
}
```

---

## 🎨 Composants UI

L'application utilise une architecture de composants React bien structurée avec une séparation claire des responsabilités.

---

### Layout & Navigation

#### MainLayout
**Fichier :** `src/components/layout/MainLayout.tsx`

Composant principal qui gère :
- La disposition responsive (desktop vs mobile)
- La navigation entre les différentes sections
- L'affichage des modales

**Structure :**
```
┌─────────────────────────────────────────────────────┐
│  Header (Barre supérieure avec recherche et notifs)  │
├─────────────────────────────┬────────────────────────┤
│  Sidebar (Desktop uniquement) │   Main Content Area   │
│  - Navigation               │   - Dashboard           │
│  - Préférences (langue/thème)│   - Cotisations         │
│  - Lien d'invitation        │   - Paiements           │
│  - Info abonnement          │   - Membres             │
│                              │   - Dépenses            │
│                              │   - Rapports            │
│                              │   - etc.                │
├─────────────────────────────┴────────────────────────┤
│  BottomTabBar (Mobile uniquement)                    │
└─────────────────────────────────────────────────────┘
```

#### Sidebar
**Fichier :** `src/components/layout/Sidebar.tsx`

Barre latérale avec :
- Logo et branding Cotiz
- Navigation par onglets
- Badge de notifications pour les paiements en attente
- Sélecteur de langue
- Bouton de bascule thème sombre/clair
- Card d'invitation rapide
- Info sur le plan actuel

**Onglets de navigation :**
| ID | Libellé | Icône | Badge | Rôle requis |
|----|---------|-------|-------|-------------|
| dashboard | Tableau de bord | LayoutDashboard | - | Tous |
| contributions | Cotisations | Wallet | - | Tous |
| payments | Paiements | ArrowLeftRight | Pending count | Admin |
| members | Membres | Users | - | Tous |
| expenses | Dépenses | Receipt | - | Accès transaction |
| reports | Rapports & Bilan | BarChart3 | - | Admin |
| settings | Administration | Settings | - | Admin |
| referrals | Parrainage & Gains | Gift | - | Tous |
| superadmin | Console Super Admin | ShieldCheck | - | Superadmin |

#### Header
**Fichier :** `src/components/layout/Header.tsx`

Barre supérieure avec :
- Bouton de menu mobile
- Barre de recherche globale
- Bouton de notifications
- Avatar utilisateur et menu profil

#### BottomTabBar
**Fichier :** `src/components/layout/BottomTabBar.tsx`

Barre de navigation inférieure pour mobile avec les onglets principaux.

#### GlobalSearchModal
**Fichier :** `src/components/layout/GlobalSearchModal.tsx`

Modal de recherche globale permettant de trouver :
- Membres
- Cotisations
- Paiements

#### NotificationsModal
**Fichier :** `src/components/layout/NotificationsModal.tsx`

Modal d'affichage des notifications avec :
- Liste des notifications
- Filtre par organisation
- Bouton "Marquer tout comme lu"

---

### Authentification

#### AuthView
**Fichier :** `src/components/auth/AuthView.tsx`

Composant complet de gestion de l'authentification avec :

**Modes disponibles :**
- `signin` - Connexion (email + mot de passe)
- `otp` - Vérification OTP
- `signup` - Inscription
- `forgot` - Mot de passe oublié
- `reset` - Réinitialisation du mot de passe

**Fonctionnalités :**
- Carousel de présentation avec 3 slides
- Formulaires valides et accessibles
- Gestion des erreurs en temps réel
- Compteurs de temps pour OTP
- Support des invitations (token dans l'URL)
- Support du parrainage (code dans l'URL)

**Slides de présentation :**
1. **Solidarité & Confiance** - Gestion des cotisations en transparence
2. **Suivi des Paiements** - Wave, Orange Money et Espèces
3. **Gouvernance & Bilan** - Clarté financière

---

### Tableau de bord

#### AdminDashboard
**Fichier :** `src/components/dashboard/AdminDashboard.tsx`

Tableau de bord pour les administrateurs avec :

**Section "En un coup d'œil" :**
- Nombre de membres enregistrés
- Total collecté (avec nombre de paiements validés)
- Total des dépenses
- Solde net en caisse

**Section "Actions Rapides" :**
- Créer une cotisation
- Créer une dépense
- Ajouter un membre
- Générer un lien d'invitation

**Section "Suivi des Paiements" :**
- Paiements en attente de validation
- Demandes d'adhésion en attente
- Cotisations en retard

**Graphique :**
- Graphique de revenus/dépenses (RevenueExpenseChart)

**Activité récente :**
- Dernières actions (paiements, cotisations, etc.)

#### MemberDashboard
**Fichier :** `src/components/dashboard/MemberDashboard.tsx`

Tableau de bord pour les membres avec :

**Section "Espace Membre" :**
- Message de bienvenue personnalisé
- Bouton "Payer une cotisation"

**Section "Cotisations Dues" :**
- État des cotisations (à jour ou en retard)
- Prochaine échéance
- Montant total dû

**Section "Mes Cotisations" :**
- Liste des cotisations avec statut
- Taux de complétude
- Dernier versement

**Section "Total payé (Lifetime)" :**
- Montant total payé depuis l'adhésion

#### RevenueExpenseChart
**Fichier :** `src/components/dashboard/RevenueExpenseChart.tsx`

Graphique de visualisation des revenus et dépenses avec :
- Sélection de période (semaine, mois, année)
- Affichage des tendances
- Comparaison revenus/dépenses

---

### Gestion des Cotisations

#### ContributionsList
**Fichier :** `src/components/contributions/ContributionsList.tsx`

Liste des cotisations avec :
- Filtres : Actives, Toutes, Archivées
- Recherche par titre
- Affichage des informations :
  - Titre
  - Montant (avec différenciation par genre si applicable)
  - Fréquence
  - Date de début
  - Type de cible
  - Statut
- Actions :
  - Voir les détails
  - Modifier
  - Clôturer le cycle
  - Payer (pour les membres)

#### CreateContributionModal
**Fichier :** `src/components/contributions/CreateContributionModal.tsx`

Formulaire de création de cotisation avec :
- **Informations de base** :
  - Titre
  - Type de montant (fixe ou minimum)
  - Montant
  - Montant pour les femmes (optionnel)
- **Fréquence** :
  - Hebdomadaire, bi-hebdomadaire, mensuelle, trimestrielle, annuelle
  - Jour du mois (pour mensuel)
- **Cible** :
  - Tous les membres
  - Par genre
  - Personnalisé (sélection de membres spécifiques)
- **Date de début**

#### ContributionDetailsModal
**Fichier :** `src/components/contributions/ContributionDetailsModal.tsx`

Affichage détaillé d'une cotisation avec :
- Informations de base
- Liste des cycles/échéances
- Taux de collecte actuel
- Options de gestion des cycles

---

### Gestion des Paiements

#### PaymentHistoryTable
**Fichier :** `src/components/payments/PaymentHistoryTable.tsx`

Tableau d'historique des paiements avec :

**Filtres :**
- Période (date de début/fin)
- Statut (Tous, Validés, En attente, Rejetés, Annulés)
- Méthode de paiement (Wave, Orange Money, Espèces, Toutes)

**Colonnes :**
- Date & Référence
- Membre
- Méthode
- Montant
- Statut
- Actions

**Actions par statut :**
- **Pending** : Valider, Rejeter, Annuler
- **Validated** : Annuler (dans les 1h)
- **Rejected** : (Aucune action)
- **Cancelled** : (Aucune action)

**Fonctionnalités :**
- Recherche par membre ou transaction
- Export CSV
- Pagination

#### MakePaymentModal
**Fichier :** `src/components/payments/MakePaymentModal.tsx`

Formulaire de déclaration de paiement avec :
- Sélection de la cotisation
- Sélection du cycle/échéance (optionnel)
- Sélection du membre (pré-sélectionné pour le membre actuel)
- Montant
- Méthode de paiement (Wave, Orange Money, Espèces)
- ID de transaction (optionnel, généré automatiquement)
- Notes

#### PaymentValidationModal
**Fichier :** `src/components/payments/PaymentValidationModal.tsx`

Modal de validation de paiement avec :
- Confirmation du montant
- Sélection du cycle
- Champ de notes optionnel
- Bouton de validation

---

### Gestion des Dépenses

#### ExpensesList
**Fichier :** `src/components/expenses/ExpensesList.tsx`

Liste des dépenses avec :

**Filtres :**
- Catégorie (Nourriture, Transport, Santé, Autres, Toutes)
- Statut (Actives, Annulées)
- Période

**Colonnes :**
- Date
- Description
- Catégorie
- Montant
- Enregistré par
- Statut
- Actions

**Actions :**
- Annuler une dépense

#### CreateExpenseModal
**Fichier :** `src/components/expenses/CreateExpenseModal.tsx`

Formulaire de création de dépense avec :
- Montant
- Description
- Date
- Catégorie (Nourriture, Transport, Santé, Autres)

---

### Gestion des Membres

#### MembersList
**Fichier :** `src/components/members/MembersList.tsx`

Liste des membres avec :

**Filtres :**
- Statut (Actifs, Archivés, Tous)
- Genre (Tous, Hommes, Femmes)
- Rôle (Tous, Admin, Membre)
- Accès transactions

**Colonnes :**
- Nom complet
- Téléphone
- Email
- Genre
- Rôle
- Statut
- Adhésion
- Actions

**Actions :**
- Voir les détails
- Modifier
- Accepter (pour les demandes en attente)
- Rejeter (pour les demandes en attente)
- Archiver
- Basculer l'accès aux transactions
- Transférer le rôle admin

#### AddMemberModal
**Fichier :** `src/components/members/AddMemberModal.tsx`

Formulaire d'ajout de membre avec :
- Prénom
- Nom
- Téléphone
- Email (optionnel)
- Genre
- Rôle (Admin ou Membre)
- Membre fantôme (sans compte utilisateur)

#### MemberDetailsModal
**Fichier :** `src/components/members/MemberDetailsModal.tsx`

Affichage détaillé d'un membre avec :
- Informations personnelles
- Informations d'adhésion
- Historique des paiements
- Statut
- Permissions
- Actions disponibles

#### InviteLinkModal
**Fichier :** `src/components/members/InviteLinkModal.tsx`

Génération de lien d'invitation avec :
- Génération automatique du token
- URL complète vers le frontend
- QR Code (à venir)
- Copie dans le presse-papiers
- Date d'expiration (72 heures)
- Partage via WhatsApp

---

### Rapports & Bilan

#### ReportsDashboard
**Fichier :** `src/components/reports/ReportsDashboard.tsx`

Tableau de bord analytique avec :

**Section "Indicateurs Clés" :**
- Revenus de la période
- Collectes Wave & Orange Money
- Dépenses de la période
- Bilan net de caisse

**Section "Score de Santé Financière" :**
- Note globale (0-100)
- Interprétation (Excellente, Bonne, Moyenne, À améliorer)
- Recommandations

**Section "Statistiques Individuelles par Membre" :**
- Tableau des membres avec :
  - Total versé (Lifetime)
  - Taux de complétude
  - Dernier versement
  - Régularité

**Fonctionnalités :**
- Sélection de période (Cette semaine, Ce mois, Cette année)
- Export du bilan
- Tri et filtrage des données

---

### Administration

#### OrganizationSettings
**Fichier :** `src/components/admin/OrganizationSettings.tsx`

Paramètres de l'organisation avec :

**Section "Informations Générales" :**
- Nom
- Type (Dahira, Tontine, Association)
- Description
- Logo
- Localisation

**Section "Paramètres Financiers" :**
- Numéro Wave
- Numéro Orange Money
- Forfait d'abonnement (Free, Basic, Premium)

**Section "Gestion de l'Organisation" :**
- Statut (Actif, Suspendu)
- Suppression (programmée ou immédiate)
- Restauration

**Section "Membres" :**
- Liste des membres avec actions rapides
- Ajout de membre

#### CreateOrganizationModal
**Fichier :** `src/components/admin/CreateOrganizationModal.tsx`

Création d'une nouvelle organisation avec :
- Nom
- Type
- Description
- Logo
- Localisation
- Numéro Wave (optionnel)
- Numéro Orange Money (optionnel)

#### SuperAdminConsole
**Fichier :** `src/components/admin/SuperAdminConsole.tsx`

Console d'administration superadmin avec :

**Section "Utilisateurs" :**
- Liste de tous les utilisateurs
- Filtre par rôle
- Modification du rôle global
- Statistiques

**Section "Organisations" :**
- Liste de toutes les organisations
- Filtre par statut
- Modification du statut
- Suppression

**Section "Statistiques Global" :**
- Nombre total d'utilisateurs
- Nombre total d'organisations
- Activité récente

---

### Parrainage

#### ReferralDashboard
**Fichier :** `src/components/referrals/ReferralDashboard.tsx`

Tableau de bord du programme de parrainage avec :

**Section "Mon Code de Parrainage" :**
- Code unique (format: COTIZ-XXXXXXXX)
- Bouton de régénération
- Bouton de copie
- Partage via WhatsApp

**Section "Statistiques" :**
- Nombre total d'utilisations
- Commissions cumulées (actuellement à 0)
- Commissions versées (actuellement à 0)
- En attente de versement (actuellement à 0)

**Section "Organisations Référées" :**
- Liste des organisations créées avec ce code
- Date d'inscription
- Forfait choisi
- Montant de la commission

**Section "Historique des Versements" :**
- Liste des versements de commissions (vide pour l'instant)

---

### Modales et Overlays

#### Modal
**Fichier :** `src/components/common/Modal.tsx`

Composant de base pour les modales avec :
- Titre
- Contenu
- Pied de page avec boutons
- Fermeture par clic extérieur ou touche Échap
- Animation d'ouverture/fermeture

#### ConfirmModal
**Fichier :** `src/components/common/ConfirmModal.tsx`

Modal de confirmation avec :
- Titre
- Message
- Bouton de confirmation
- Bouton d'annulation
- Style (danger, warning, info)

#### EmptyState
**Fichier :** `src/components/common/EmptyState.tsx`

Affichage d'état vide avec :
- Icône
- Titre
- Description
- Bouton d'action optionnel

---

## 🌍 Internationalisation (i18n)

L'application supporte **5 langues** : Français, Anglais, Wolof, Espagnol et Portugais.

### Implémentation

La traduction est gérée via le **PreferencesContext** qui fournit :
- Une liste des langues disponibles
- Une fonction de traduction `t(key)` 
- La possibilité de changer de langue

**Fichier :** `src/context/PreferencesContext.tsx`

### Structure des traductions

Les traductions sont organisées dans un objet `translations` :
```typescript
const translations: Record<Exclude<AppLanguage, 'fr'>, Record<string, string>> = {
  en: { 'Tableau de bord': 'Dashboard', ... },
  wo: { 'Tableau de bord': 'Xët wi', ... },
  es: { 'Tableau de bord': 'Panel', ... },
  pt: { 'Tableau de bord': 'Painel', ... },
};
```

### Utilisation dans les composants

```typescript
import { usePreferences } from '../../context/PreferencesContext';

function MyComponent() {
  const { t } = usePreferences();
  
  return (
    <div>
      <h1>{t('Tableau de bord')}</h1>
      <p>{t('Gérez vos cotisations en toute transparence')}</p>
    </div>
  );
}
```

### Sélecteur de langue

Un sélecteur de langue est disponible dans :
- Le Sidebar (desktop)
- Le Header (mobile)

---

## 🎭 Styling et Design

### Tailwind CSS 4

L'application utilise **Tailwind CSS v4** avec le plugin Vite officiel.

**Fichier de configuration :** `vite.config.ts`

**Styles globaux :** `src/index.css`

### Design System

#### Couleurs

**Palettes principales :**
- **Emerald** : Couleur primaire (#065f46, #047857, etc.)
- **Slate** : Couleurs neutres (#64748b, #475569, etc.)
- **Amber** : Couleurs d'avertissement (#f59e0b, #d97706, etc.)
- **Rose** : Couleurs d'erreur (#f43f5e, #e11d48, etc.)
- **Orange** : Accents (#f97316, #ea580c, etc.)

**Classes utilitaires personnalisées :**
- `.auth-*` : Styles pour les pages d'authentification
- `.cotiz-*` : Styles spécifiques à Cotiz

#### Typographie

- Famille de police : `font-sans` (par défaut du navigateur)
- Taille de base : 16px
- Interlignage : normal

#### Espacement

Utilisation systématique des classes Tailwind :
- `p-*` : Padding
- `m-*` : Margin
- `gap-*` : Gap

#### Composants réutilisables

**Button :**
```typescript
// src/components/common/Button.tsx
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
```

**Input :**
```typescript
// src/components/common/Input.tsx
interface InputProps {
  label?: string;
  type?: string;
  value?: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  [key: string]: any;
}
```

**Select :**
```typescript
// src/components/common/Select.tsx
interface SelectProps {
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
  [key: string]: any;
}
```

#### Icônes

L'application utilise **Lucide React** pour les icônes :

```typescript
import { LayoutDashboard, Wallet, Users, ArrowLeftRight, Receipt } from 'lucide-react';

function SidebarItem() {
  return (
    <button>
      <LayoutDashboard className="w-4 h-4" />
      <span>Tableau de bord</span>
    </button>
  );
}
```

### Thème Sombre/Clair

Le thème est géré via le **PreferencesContext** :
- **Thème clair** : Arrière-plans blancs, texte sombre
- **Thème sombre** : Arrière-plans sombres, texte clair

**Classes de base :**
- Thème clair : `bg-white`, `text-slate-900`
- Thème sombre : `bg-slate-900`, `text-slate-100`

---

## 🔒 Sécurité

### Stockage des Tokens

- **Clé :** `cotiz_api_token`
- **Localisation :** 
  - `localStorage` si "Se souvenir de moi" est coché
  - `sessionStorage` sinon
- **Sécurité :** Les tokens sont supprimés automatiquement lors de la déconnexion

### Gestion des Erreurs API

- Interception des erreurs 401 (Unauthorized) → Déconnexion automatique
- Interception des erreurs 422 (Validation) → Affichage des messages
- Interception des erreurs 500 (Server) → Message générique

### Protection des Routes

- Toutes les routes authentifiées nécessitent un token valide
- Vérification côté serveur du token Sanctum
- Les données sensibles sont protégées par :
  - Rôle global (superadmin)
  - Rôle dans l'organisation (admin, member)
  - Permission d'accès aux transactions

### Chiffrement

- HTTPS obligatoire en production
- Tous les tokens sont transmis via headers `Authorization: Bearer`
- Les mots de passe sont hachés côté backend (Laravel Hash)

---

## 🚀 Déploiement

### Déploiement Frontend (Vercel, Netlify, etc.)

#### Configuration de base :

1. **Variables d'environnement :**
   ```
   VITE_API_URL=https://votre-api.cotiz.com/api/v1
   ```

2. **Build :**
   ```bash
   npm run build
   ```

3. **Déploiement du dossier `dist/`**

#### Exemple avec Vercel :

1. Créer un nouveau projet Vercel
2. Lier au dépôt Git
3. Configurer la variable d'environnement `VITE_API_URL`
4. Déployer

#### Exemple avec Netlify :

1. Créer un nouveau site Netlify
2. Lier au dépôt Git
3. Configurer les variables d'environnement
4. Déployer

### Déploiement Full-Stack avec Render

Le fichier `render.yaml` configure un service Docker pour l'API :

```yaml
services:
  - type: web
    name: cotiz-api
    runtime: docker
    rootDir: cotiz-api
    dockerfilePath: ./Dockerfile
    envVars:
      - key: VITE_API_URL
        value: https://votre-frontend.vercel.app/api/v1
      # ... autres variables
```

### CORS

L'API est configurée pour autoriser :
- `FRONTEND_URL` (variable d'environnement)
- `CORS_ALLOWED_ORIGINS` (variable d'environnement)

En production, configurez ces variables avec l'URL exacte de votre frontend.

---

## ✅ Bonnes Pratiques

### Développement

1. **Typage fort :** Toujours typer les props, states et retours de fonctions
2. **Composants réutilisables :** Créer des composants génériques dans `common/`
3. **Séparation des responsabilités :** Un composant = une responsabilité
4. **Gestion d'état :** Utiliser les Contexts existants plutôt que de créer du state local
5. **Traduction :** Toujours utiliser `t('key')` pour les textes affichés

### Performance

1. **Memoization :** Utiliser `useMemo` et `useCallback` pour éviter les re-renders inutiles
2. **Lazy loading :** Importer dynamiquement les composants lourds
3. **Images :** Optimiser les images avant de les ajouter
4. **API calls :** Éviter les appels API inutiles, utiliser le cache quand possible

### Sécurité

1. **Ne jamais stocker de secrets dans le code frontend**
2. **Valider toutes les entrées utilisateur** (même si le backend valide aussi)
3. **Sanitizer les données avant affichage** pour éviter XSS
4. **Utiliser HTTPS en production**

### Accessibilité

1. **Labels :** Toujours associer un label à un input
2. **ARIA :** Utiliser les attributs ARIA appropriés
3. **Focus :** Gérer correctement le focus pour les modales
4. **Contraste :** Vérifier le contraste des couleurs

---

## 🐛 Résolution des Problèmes

### Problèmes courants

#### 1. "Class MongoDB\Driver\Manager not found"

**Solution :** Installer l'extension MongoDB PHP :
```bash
# Sur macOS avec Homebrew
pecl install mongodb-1.21.5
```

Vérifier que l'extension est chargée :
```bash
php -r 'echo class_exists("MongoDB\\Driver\\Manager") ? "OK" : "MISSING";'
```

#### 2. Erreur de connexion à l'API

**Vérifications :**
- L'API est-elle démarrée ?
- L'URL dans `.env.local` est-elle correcte ?
- Le token est-il valide ?
- Y a-t-il des erreurs CORS ?

**Solution :**
```bash
# Vérifier que l'API répond
curl http://localhost:8000/api/v1/up

# Vérifier les logs Laravel
cd cotiz-api
tail -f storage/logs/laravel.log
```

#### 3. Les données ne se rafraîchissent pas

**Solution :**
- Vérifier que le DataContext est bien utilisé
- Forcer un rafraîchissement manuel :
```typescript
const { refresh } = useData();
await refresh();
```

#### 4. Problème de traduction manquante

**Solution :**
- Vérifier que la clé existe dans `translations`
- Si la clé est en français, elle est utilisée par défaut
- Ajouter la traduction manquante dans le fichier approprié

#### 5. Style qui ne s'applique pas

**Vérifications :**
- Le fichier CSS est-il importé ?
- Y a-t-il une erreur dans la console du navigateur ?
- La classe Tailwind existe-t-elle ?

---

## 📝 Changelog

| Version | Date | Changements |
|---------|------|-------------|
| 1.0.0 | Novembre 2026 | Version initiale complète |

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Forker le dépôt
2. Créer une branche de feature (`git checkout -b feature/ma-fonctionnalité`)
3. Commiter vos changements (`git commit -m 'Ajout de ma fonctionnalité'`)
4. Pousser vers la branche (`git push origin feature/ma-fonctionnalité`)
5. Ouvrir une Pull Request

---

## 📄 Licence

Ce projet est propriétaire. Tous droits réservés.

---

## 🙏 Remerciements

- **Laravel** - Framework PHP élégant
- **React** - Bibliothèque JavaScript moderne
- **Vite** - Bundler ultra-rapide
- **Tailwind CSS** - Framework CSS utility-first
- **Lucide React** - Icônes élégantes
- **MongoDB** - Base de données NoSQL

---

## 📞 Support

Pour toute question ou problème, veuillez consulter :
1. La documentation ci-dessus
2. Les issues GitHub
3. Le fichier [cotiz-api/README.md](./cotiz-api/README.md) pour les questions backend

---

**Cotiz - Finance Solidaire, Transparence et Confiance** 💚
