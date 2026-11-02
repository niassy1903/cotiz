# Cotiz API

API REST JSON construite avec Laravel 13, Sanctum et MongoDB Atlas.

## Installation locale

### Courriel et codes de connexion

Chaque connexion par mot de passe demande ensuite un code à 6 chiffres envoyé par courriel. Le code est à usage unique, expire après 15 minutes et est limité à cinq tentatives. Le renvoi invalide le code précédent.

Configurez SMTP dans le `.env` local ignoré par Git. Pour Gmail, utilisez l’adresse du compte et un mot de passe d’application Google (pas le mot de passe normal du compte) :

```dotenv
MAIL_MAILER=smtp
MAIL_SCHEME=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=adresse@gmail.com
MAIL_PASSWORD=mot-de-passe-application
MAIL_FROM_ADDRESS="${MAIL_USERNAME}"
MAIL_FROM_NAME="${APP_NAME}"
```

Le code source et `.env.example` ne contiennent aucun secret. En production, configurez le secret dans le gestionnaire de secrets de la plateforme et assurez-vous que `FRONTEND_URL` pointe vers l’URL publique de Cotiz.

Le projet utilise `mongodb/mongodb:^1.20` avec `mongodb/laravel-mongodb:^5.12`; Composer résout actuellement la bibliothèque en 1.21.5. L’image Render utilise PHP 8.4, également requis par les versions Symfony enregistrées dans `composer.lock`. Vérifiez que l’extension native MongoDB 1.21.x est chargée par le même PHP CLI utilisé pour Composer et Artisan :

```sh
php -r '$version = phpversion("mongodb"); if (! $version || version_compare($version, "1.21.0", "<") || version_compare($version, "2.0.0", ">=") || ! class_exists("MongoDB\\Driver\\Manager")) { fwrite(STDERR, "Extension MongoDB PHP 1.21.x requise\n"); exit(1); } echo "Extension PHP mongodb $version active\n";'
```

Sur macOS avec Homebrew, sélectionnez PHP 8.4 et installez l’extension native si nécessaire :

```sh
export PATH="/opt/homebrew/opt/php@8.4/bin:$PATH"
pecl install mongodb-1.21.5
php -v
php -r 'printf("mongodb=%s; Manager=%s\n", phpversion("mongodb") ?: "missing", class_exists("MongoDB\\Driver\\Manager") ? "yes" : "no");'
```

```sh
cp .env.example .env
composer install
# Renseigner DB_DSN avec l’URI privée fournie par MongoDB Atlas.
php artisan key:generate
php artisan migrate --force
php artisan serve --host=127.0.0.1 --port=8000
```

Dans un autre terminal, lancez `php artisan schedule:work` pour exécuter les échéances récurrentes et les suppressions différées. En production, configurez le cron Laravel Scheduler.

Les comptes et jeux de données fictifs ont été supprimés. Inscrivez un premier compte depuis le frontend.
Pour attribuer le rôle global après l’inscription, exécutez `php artisan cotiz:promote-superadmin adresse@example.com`.

## Déploiement sur Render

Le fichier `../render.yaml` déclare un service Web Docker. Dans Render, créez un Blueprint depuis le dépôt contenant ce fichier et renseignez les valeurs marquées comme secrètes/non synchronisées :

- `APP_KEY` : générez une clé avec `php artisan key:generate --show` dans `cotiz-api`.
- `APP_URL` : URL publique du service API sur Render.
- `FRONTEND_URL` et `CORS_ALLOWED_ORIGINS` : URL publique du frontend (sans slash final).
- `DB_DSN` : URI de connexion MongoDB Atlas; ne la commitez jamais.
- `MAIL_USERNAME`, `MAIL_PASSWORD` et `MAIL_FROM_ADDRESS` : compte et identifiants SMTP.

Après le premier déploiement, exécutez `php artisan migrate --force` une seule fois depuis un shell du service. Le contrôle de santé utilise `/up`. Les services gratuits Render peuvent s'endormir après une période d'inactivité; MongoDB Atlas reste la base de données persistante.

La découverte des paquets pendant le build utilise temporairement SQLite en mémoire et des pilotes cache/session/queue sans base de données; la configuration MongoDB Atlas reste celle du runtime. Le service Web ne lance pas automatiquement le planificateur Laravel. Pour les tâches récurrentes (génération des échéances et purge), configurez un Cron Job Render qui exécute `php artisan schedule:run` chaque minute, ou utilisez un worker de fond.

## Contrat et sécurité

- Préfixe des routes : `/api/v1`.
- Authentification par jeton Sanctum : inscription, connexion, profil, révocation, réinitialisation de mot de passe.
- Les données du frontend sont chargées via `GET /bootstrap?organization_id=<id>`.
- Chaque route d’organisation vérifie l’adhésion active et le rôle minimum.
- Les données financières sont limitées selon le rôle et la permission d’accès aux transactions.
- Les validations métier et les mutations financières sont exécutées côté serveur; la validation d’un paiement met à jour son échéance dans une transaction MongoDB.
- Les invitations sont à usage unique et expirent après 72 heures; les codes de parrainage suivent les nouvelles inscriptions.
- Les échéances récurrentes sont générées quotidiennement; les suppressions différées sont purgées après 30 jours.
- Le CORS est limité à `CORS_ALLOWED_ORIGINS`; configurez les origines exactes au déploiement.
- Pour la production, configurez une base durable, `APP_DEBUG=false`, HTTPS, un fournisseur de courriel et des secrets opérateur.

Wave et Orange Money ne sont pas connectés à leurs API de paiement : le backend gère les déclarations, références et validations manuelles. Les commissions d’affiliation restent à zéro tant qu’un système de facturation réel n’est pas branché.

## Tests

Les tests Feature utilisent exclusivement une base MongoDB locale `cotiz_test` sur un replica set `rs0` au port `27018`; PHPUnit force cette configuration et n’utilise pas l’URI Atlas de `.env`. Ils exécutent `migrate:fresh` sur cette base : ne configurez jamais l’URI Atlas ou une base contenant des données à conserver pour les tests.

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
