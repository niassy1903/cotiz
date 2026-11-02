# Cotiz

Application React/Vite connectée à une API Laravel 13 et à MongoDB Atlas.

## Prérequis

- Node.js 20+
- PHP 8.3+ avec l’extension MongoDB 1.21.x
- Composer 2+

Vérifiez que l’extension MongoDB est activée dans le PHP CLI avant d’exécuter Composer ou Artisan. Si vous obtenez `Class "MongoDB\Driver\Manager" not found`, suivez les vérifications et la correction macOS indiquées dans [le guide de l’API](./cotiz-api/README.md#installation-locale).

## Démarrage local

1. Installer les dépendances frontend : `npm install`.
2. Dans `cotiz-api`, créer `.env` depuis `.env.example`, renseigner `DB_DSN` avec l’URI Atlas privée et lancer :

   ```sh
   cd cotiz-api
   composer install
   cp .env.example .env
   php artisan key:generate
   php artisan migrate --force
   php artisan serve --host=127.0.0.1 --port=8000
   ```

3. Dans un autre terminal, lancer le planificateur Laravel : `cd cotiz-api && php artisan schedule:work`.
4. Dans un autre terminal à la racine, lancer `npm run dev`.
5. L’URL API par défaut est `https://cotiz-api.onrender.com/api/v1`. Pour utiliser une API locale, définir `VITE_API_URL=http://localhost:8000/api/v1` dans `.env.local`, puis relancer Vite. Pour un autre déploiement frontend, définir `VITE_API_URL` avant le build.

Les données de démonstration ont été supprimées. Créez un compte depuis l’écran d’inscription; les données métier sont persistées dans la base `cotiz`.
Pour initialiser le rôle global, inscrivez le compte puis exécutez `php artisan cotiz:promote-superadmin adresse@example.com` depuis `cotiz-api`.

## API

L’API JSON versionnée est servie sous `/api/v1`. Le frontend charge les données initiales via `GET /bootstrap`, puis effectue les mutations par les routes Laravel authentifiées. Le jeton d’accès reste dans le navigateur et est envoyé avec les requêtes API.

- Authentification : inscription avec création d’organisation ou invitation, connexion, profil, déconnexion et récupération de mot de passe.
- Organisation : paramètres, abonnement, suppression différée et contrôle global.
- Membres : ajout, adhésion, validation/refus, archivage, accès financier et transfert administrateur.
- Finances : cotisations et échéances récurrentes, paiements et validation/rejet/annulation, dépenses et annulation.
- Notifications, journal d’audit, invitations uniques expirant sous 72 heures et codes de parrainage persistés.
- Rôles : `superadmin` global, puis `admin`/`member` par organisation.

Les paiements Wave et Orange Money sont enregistrés pour validation manuelle : aucun encaissement réel, webhook opérateur, envoi SMS ni fournisseur de courriel de production n’est configuré dans ce dépôt. Les commissions d’affiliation restent à zéro jusqu’à l’intégration d’un système de facturation réel.

Le planificateur crée les échéances arrivées à terme et purge les organisations après leur délai de suppression de 30 jours. En production, configurez le cron Laravel Scheduler plutôt que `schedule:work`.

## Vérification

- Frontend : `npm run lint` et `npm run build`.
- API : les tests utilisent une MongoDB locale isolée; voir la procédure et l’avertissement de sécurité dans [cotiz-api/README.md](./cotiz-api/README.md#tests).
