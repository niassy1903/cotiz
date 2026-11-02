Cotiz — Réinitialisation de votre mot de passe

Bonjour {{ $recipientName }},

Vous avez demandé à réinitialiser le mot de passe de votre compte Cotiz.
Ouvrez ce lien pour en choisir un nouveau :
{!! html_entity_decode($resetUrl, ENT_QUOTES | ENT_HTML5, 'UTF-8') !!}

Ce lien est valable {{ $expiresMinutes }} minutes et ne peut être utilisé qu’une seule fois. Ne le transférez à personne.

Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail. Votre mot de passe actuel restera inchangé.
