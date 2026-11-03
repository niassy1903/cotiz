# Cotiz Mobile — Application Flutter 📱

Application mobile moderne de gestion financière et de cotisations pour **Dahiras, Tontines et Associations** en Afrique de l'Ouest.

## 🚀 Connexion Backend Laravel

L'application est connectée au backend Laravel déployé :
- **Base URL API** : `https://cotiz-api.onrender.com/api/v1`
- **Documentation des routes** :
  - `POST /api/v1/auth/login` : Connexion email/mot de passe
  - `POST /api/v1/auth/register` : Inscription nouveau membre & Dahira
  - `GET /api/v1/auth/me` : Profil connecté
  - `GET /api/v1/organizations` : Liste des organisations
  - `POST /api/v1/payments` : Versement Wave / Orange Money / Espèces

## 📂 Architecture du Projet Flutter

```
cotiz-flutter/
├── lib/
│   ├── main.dart                      # Point d'entrée Flutter avec MultiProvider
│   ├── core/
│   │   ├── constants/
│   │   │   ├── api_endpoints.dart     # URLs endpoints Laravel
│   │   │   └── app_colors.dart        # Palette Vert Émeraude, Orange Wave/OM
│   │   ├── network/
│   │   │   └── api_client.dart        # Client HTTP avec JWT Bearer & fallback
│   │   ├── theme/
│   │   │   └── app_theme.dart         # Plus Jakarta Sans & Material 3
│   │   └── utils/
│   │       └── currency_formatter.dart# Formatage strict en FCFA
│   ├── data/
│   │   ├── models/                    # UserModel, OrganizationModel, ContributionModel, PaymentModel
│   │   └── repositories/              # AuthRepository, PaymentRepository, etc.
│   ├── providers/                     # State Management (AuthProvider, CotizProvider)
│   └── presentation/
│       ├── screens/
│       │   ├── splash/                # Écran Splash avec animation logo Cotiz
│       │   ├── onboarding/            # Onboarding 4 étapes avec visuels haute résolution
│       │   ├── auth/                  # Login & Inscription avec comptes démo 1-clic
│       │   ├── home/                  # Bottom Navigation Bar (WhatsApp style)
│       │   ├── dashboard/             # Dashboard Membre & Dashboard Admin
│       │   ├── contributions/         # Suivi des cotisations et progression des cycles
│       │   ├── payments/              # Règlement Wave / OM et reçus horodatés
│       │   └── members/               # Annuaire, membres fantômes et QR code WhatsApp
│       └── widgets/                   # Composants réutilisables
├── assets/
│   └── images/                        # Photographies haute définition et Logo officiel
└── pubspec.yaml                       # Dépendances Flutter (provider, http, intl, etc.)
```

## 🛠️ Lancer l'application en local

```bash
cd cotiz-flutter
flutter pub get
flutter run
```
