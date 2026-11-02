<!doctype html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>Réinitialisez votre mot de passe Cotiz</title>
</head>
<body style="margin:0;padding:32px 12px;background:#f3f6f2;font-family:Arial,Helvetica,sans-serif;color:#173b2f;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
        Choisissez un nouveau mot de passe pour votre compte Cotiz.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;">
        <tr>
            <td style="padding:0 0 18px;">
                <table role="presentation" cellspacing="0" cellpadding="0">
                    <tr>
                        <td style="width:44px;height:44px;border-radius:14px;background:#087653;color:#fff;text-align:center;vertical-align:middle;font-size:23px;font-weight:800;">C</td>
                        <td style="padding-left:12px;">
                            <div style="font-size:21px;font-weight:800;letter-spacing:-.5px;color:#075a43;">Cotiz</div>
                            <div style="padding-top:2px;font-size:12px;color:#718078;">La solidarité, mieux organisée</div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        <tr>
            <td style="overflow:hidden;border:1px solid #e4ebe4;border-radius:22px;background:#fff;box-shadow:0 18px 50px rgba(15,76,55,.08);">
                <div style="height:7px;background:linear-gradient(90deg,#087653 0%,#087653 72%,#f47721 72%,#f47721 100%);"></div>
                <div style="padding:38px 36px 34px;">
                    <div style="display:inline-block;padding:7px 11px;border-radius:999px;background:#edf7f0;color:#087653;font-size:12px;font-weight:700;letter-spacing:.4px;">
                        SÉCURITÉ DE VOTRE COMPTE
                    </div>
                    <h1 style="margin:22px 0 10px;font-size:27px;line-height:1.25;letter-spacing:-.6px;color:#15372b;">
                        Bonjour {{ $recipientName }},
                    </h1>
                    <p style="margin:0;color:#66766d;font-size:15px;line-height:1.7;">
                        Vous avez demandé à réinitialiser le mot de passe de votre compte Cotiz. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.
                    </p>
                    <div style="margin:28px 0;text-align:center;">
                        <a href="{{ $resetUrl }}" style="display:inline-block;padding:15px 26px;border-radius:12px;background:#087653;color:#fff;text-decoration:none;font-size:14px;font-weight:700;">
                            Réinitialiser mon mot de passe
                        </a>
                    </div>
                    <div style="margin:0 0 22px;padding:18px;border:1px solid #e5eee7;border-radius:16px;background:#f8fbf8;">
                        <div style="margin-bottom:7px;color:#075a43;font-size:13px;font-weight:700;">Ce lien est personnel et sécurisé</div>
                        <p style="margin:0;color:#66766d;font-size:13px;line-height:1.7;">
                            Il est valable pendant <strong style="color:#173b2f;">{{ $expiresMinutes }} minutes</strong> et ne peut être utilisé qu’une seule fois. Ne le transférez à personne.
                        </p>
                    </div>
                    <p style="margin:0 0 18px;color:#87938c;font-size:12px;line-height:1.6;">
                        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
                        <br>
                        <a href="{{ $resetUrl }}" style="color:#087653;word-break:break-all;">{{ $resetUrl }}</a>
                    </p>
                    <div style="padding:16px;border-radius:12px;background:#fff7ed;color:#8a4b16;font-size:12px;line-height:1.6;">
                        Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail. Votre mot de passe actuel restera inchangé.
                    </div>
                </div>
            </td>
        </tr>
        <tr>
            <td style="padding:20px 12px 0;text-align:center;color:#87938c;font-size:11px;line-height:1.7;">
                Cotiz · La solidarité, mieux organisée<br>
                Cet e-mail automatique concerne la sécurité de votre compte.
            </td>
        </tr>
    </table>
</body>
</html>
