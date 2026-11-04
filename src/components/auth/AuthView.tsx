import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Gender } from '../../types/auth';
import { api, ApiError, getApiErrorMessage } from '../../api/client';
import communityImage from '../../assets/images/cotiz_community_solidarity_1793623091783.jpg';
import paymentImage from '../../assets/images/cotiz_mobile_payment_1793623091703.jpg';
import transparencyImage from '../../assets/images/cotiz_growth_transparency_1793623092103.jpg';
import {
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  KeyRound,
  Timer,
  RefreshCw,
  ArrowLeft,
  Globe,
} from 'lucide-react';
import { appLanguages, usePreferences } from '../../context/PreferencesContext';

const splashSlides = [
  {
    image: communityImage,
    tag: 'Solidarité & Confiance',
    title: 'Gérez vos cotisations en toute transparence',
    description:
      'Dahiras, tontines et associations : rassemblez vos membres, suivez les versements et gardez une trace claire de votre organisation.',
    statNumber: 'En un coup d’œil',
    statLabel: 'Membres et cotisations',
  },
  {
    image: paymentImage,
    tag: 'Suivi des Paiements',
    title: 'Règlements Wave, Orange Money et Espèces',
    description:
      'Déclarez les versements Wave, Orange Money ou espèces. Les reçus sont horodatés puis vérifiés par un administrateur.',
    statNumber: 'Wave · OM',
    statLabel: 'Déclaration et validation',
  },
  {
    image: transparencyImage,
    tag: 'Gouvernance & Bilan',
    title: 'Clarté financière et dépenses maîtrisées',
    description:
      'Accédez aux bilans financiers de votre organisation, auditez les dépenses autorisées et relancez les échéances en un clic.',
    statNumber: 'Chaque dépense',
    statLabel: 'Suivie et historisée',
  },
];

export const AuthView: React.FC = () => {
  const { login, verifyLoginOtp, resendLoginOtp, signup } = useAuth();
  const { language, setLanguage, t } = usePreferences();
  const invitationToken = new URLSearchParams(window.location.search).get('invite') || undefined;
  const referralCode = new URLSearchParams(window.location.search).get('ref') || undefined;

  // Mode: 'signin' | 'signup' | 'forgot'
  const resetToken = new URLSearchParams(window.location.search).get('reset_token') || undefined;
  const resetEmail = new URLSearchParams(window.location.search).get('email') || '';
  const [mode, setMode] = useState<'signin' | 'otp' | 'signup' | 'forgot' | 'reset'>('signin');

  // Carousel index
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-rotate slides every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide(prev => (prev + 1) % splashSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState('');
  const [otpChallenge, setOtpChallenge] = useState('');
  const [otpExpiresAt, setOtpExpiresAt] = useState('');
  const [otpResendAt, setOtpResendAt] = useState(0);
  const [otpCode, setOtpCode] = useState('');
  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);

  // Sign up fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [invitationName, setInvitationName] = useState('');
  const [enteredReferralCode, setEnteredReferralCode] = useState(referralCode || '');
  const [isInviteLoading, setIsInviteLoading] = useState(Boolean(invitationToken));

  const clearSignupError = (field: string) => {
    setSignupErrors(current => {
      if (!(field in current)) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const signupError = (field: string) => signupErrors[field];
  const passwordRequirements: Array<[string, boolean]> = [
    [t('Au moins 8 caractères'), password.length >= 8 && password.length <= 72],
    [t('Une lettre minuscule'), /[a-z]/.test(password)],
    [t('Une lettre majuscule'), /[A-Z]/.test(password)],
    [t('Un chiffre'), /\d/.test(password)],
    [t('Un symbole'), /[^A-Za-z\d]/.test(password)],
  ];
  const passwordStrengthScore = password
    ? Number(password.length >= 8 && password.length <= 72) +
      Number(/[a-z]/.test(password)) +
      Number(/[A-Z]/.test(password)) +
      Number(/\d/.test(password)) +
      Number(/[^A-Za-z\d]/.test(password)) +
      Number(password.length >= 12) +
      Number(password.length >= 16)
    : 0;
  const passwordStrength = passwordStrengthScore < 2
    ? { label: t('Très faible'), color: 'bg-rose-500', textColor: 'text-rose-600' }
    : passwordStrengthScore < 3
    ? { label: t('Faible'), color: 'bg-orange-500', textColor: 'text-orange-600' }
    : passwordStrengthScore < 4
    ? { label: t('Médiocre'), color: 'bg-amber-500', textColor: 'text-amber-600' }
    : passwordStrengthScore < 5
    ? { label: t('Moyen'), color: 'bg-yellow-500', textColor: 'text-yellow-700' }
    : passwordStrengthScore < 6
    ? { label: t('Bon'), color: 'bg-lime-500', textColor: 'text-lime-700' }
    : passwordStrengthScore < 7
    ? { label: t('Fort'), color: 'bg-emerald-500', textColor: 'text-emerald-700' }
    : { label: t('Très fort'), color: 'bg-emerald-700', textColor: 'text-emerald-800' };

  useEffect(() => {
    if (mode !== 'otp') return;

    const updateCountdowns = () => {
      const now = Date.now();
      setOtpSecondsLeft(Math.max(0, Math.ceil((new Date(otpExpiresAt).getTime() - now) / 1000)));
      setResendSecondsLeft(Math.max(0, Math.ceil((otpResendAt - now) / 1000)));
    };

    updateCountdowns();
    const timer = window.setInterval(updateCountdowns, 1000);
    return () => window.clearInterval(timer);
  }, [mode, otpExpiresAt, otpResendAt]);

  useEffect(() => {
    if (!invitationToken) return;
    setMode('signup');
    api.invitations.preview(invitationToken)
      .then(invitation => {
        setInvitationName(invitation.organization.name);
        setOrganizationName(invitation.organization.name);
      })
      .catch(error => setErrorMsg(getApiErrorMessage(error)))
      .finally(() => setIsInviteLoading(false));
  }, [invitationToken]);

  useEffect(() => {
    if (!resetToken) return;
    setEmail(resetEmail);
    setMode('reset');
  }, [resetEmail, resetToken]);
  const [gender, setGender] = useState<Gender>('M');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email) {
      setErrorMsg(t('Veuillez entrer une adresse email valide.'));
      return;
    }
    setIsLoading(true);
    try {
      const challenge = await login(email, password);
      setOtpChallenge(challenge.challenge);
      setOtpExpiresAt(challenge.expiresAt);
      setOtpResendAt(Date.now() + 60_000);
      setOtpCode('');
      setSuccessMsg(`Un code de connexion a été envoyé à ${email}.`);
      setMode('otp');
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyLoginOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!otpChallenge || otpSecondsLeft === 0 || !/^\d{6}$/.test(otpCode)) {
      setErrorMsg(otpSecondsLeft === 0
        ? t('Ce code a expiré. Recommencez votre connexion.')
        : t('Saisissez les 6 chiffres reçus par e-mail.'));
      return;
    }

    setIsLoading(true);
    try {
      await verifyLoginOtp(otpChallenge, otpCode, rememberMe);
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendLoginOtp = async () => {
    if (!otpChallenge || resendSecondsLeft > 0) return;
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const challenge = await resendLoginOtp(otpChallenge);
      setOtpChallenge(challenge.challenge);
      setOtpExpiresAt(challenge.expiresAt);
      setOtpResendAt(Date.now() + 60_000);
      setOtpCode('');
      setSuccessMsg(`Un nouveau code a été envoyé à ${email}.`);
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const returnToSignIn = () => {
    setMode('signin');
    setOtpChallenge('');
    setOtpExpiresAt('');
    setOtpCode('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const errors: Record<string, string> = {};
    const normalizedPhone = phone.replace(/[\s().-]/g, '');
    if (!firstName.trim()) errors.firstName = t('Saisissez votre prénom.');
    if (!lastName.trim()) errors.lastName = t('Saisissez votre nom.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = t('Saisissez une adresse e-mail valide.');
    }
    if (!/^\+?[1-9]\d{7,15}$/.test(normalizedPhone)) {
      errors.phone = t('Saisissez un numéro de téléphone valide.');
    }
    if (!invitationToken && organizationName.trim().length < 2) {
      errors.organizationName = t('Le nom de l’organisation doit contenir au moins 2 caractères.');
    }
    if (
      password.length < 8 ||
      password.length > 72 ||
      !/[a-z]/.test(password) ||
      !/[A-Z]/.test(password) ||
      !/\d/.test(password) ||
      !/[^A-Za-z\d]/.test(password)
    ) {
      errors.password = t('Le mot de passe ne respecte pas encore les critères de sécurité.');
    }
    if (passwordConfirmation !== password) {
      errors.passwordConfirmation = t('La confirmation ne correspond pas au mot de passe.');
    }
    setSignupErrors(errors);
    if (Object.keys(errors).length > 0) {
      setErrorMsg(t('Corrigez les champs signalés ci-dessous.'));
      return;
    }
    if (isInviteLoading) return;
    setIsLoading(true);
    try {
      await signup({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: normalizedPhone,
        gender,
        password,
        passwordConfirmation,
        organizationName: (invitationName || organizationName).trim(),
        invitationToken,
        referralCode: enteredReferralCode.trim() || undefined,
      });
    } catch (error) {
      if (error instanceof ApiError && error.errors) {
        const fieldNames: Record<string, string> = {
          first_name: 'firstName',
          last_name: 'lastName',
          email: 'email',
          phone: 'phone',
          organization_name: 'organizationName',
          invite_token: 'organizationName',
          referral_code: 'referralCode',
          gender: 'gender',
          password: 'password',
          password_confirmation: 'passwordConfirmation',
        };
        const messages = Object.fromEntries(
          Object.entries(error.errors).map(([field, messages]) => {
            const name = fieldNames[field] || field;
            const message = messages[0] || t('Vérifiez ce champ.');
            if (message.startsWith('validation.min.string')) {
              return [
                name,
                field === 'password'
                  ? t('Le mot de passe doit contenir au moins 8 caractères.')
                  : field === 'organization_name'
                  ? t('Le nom de l’organisation doit contenir au moins 2 caractères.')
                  : t('Cette valeur est trop courte.'),
              ];
            }
            if (message.startsWith('validation.required')) {
              return [name, t('Ce champ est obligatoire.')];
            }
            if (message.startsWith('validation.confirmed')) {
              return [
                field === 'password' ? 'passwordConfirmation' : name,
                t('La confirmation ne correspond pas au mot de passe.'),
              ];
            }
            if (message.startsWith('validation.email')) {
              return [name, t('Saisissez une adresse e-mail valide.')];
            }
            if (message.startsWith('validation.regex')) {
              return [
                name,
                field === 'password'
                  ? t('Ajoutez une majuscule, une minuscule, un chiffre et un symbole.')
                  : t('Le format saisi est invalide.'),
              ];
            }
            if (message.startsWith('validation.unique')) {
              return [
                name,
                field === 'email'
                  ? t('Cette adresse e-mail est déjà utilisée.')
                  : field === 'phone'
                  ? t('Ce numéro de téléphone est déjà utilisé.')
                  : t('Cette valeur est déjà utilisée.'),
              ];
            }
            if (message.startsWith('validation.max.string')) {
              return [
                name,
                field === 'password'
                  ? t('Le mot de passe ne peut pas dépasser 72 caractères.')
                  : t('Cette valeur est trop longue.'),
              ];
            }
            return [
              name,
              message.startsWith('validation.')
                ? t('Valeur invalide. Vérifiez ce champ.')
                : message,
            ];
          }),
        );
        setSignupErrors(messages);
        setErrorMsg(t('Corrigez les champs signalés ci-dessous.'));
      } else {
        setErrorMsg(getApiErrorMessage(error));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMsg(t('Veuillez renseigner votre email.'));
      return;
    }
    setIsLoading(true);
    try {
      const result = await api.auth.forgotPassword(email);
      setSuccessMsg(result.message);
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!resetToken || password.length < 8 || password !== passwordConfirmation) {
      setErrorMsg(t('Vérifiez le lien et saisissez deux fois le même mot de passe (8 caractères minimum).'));
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.auth.resetPassword(email, resetToken, password);
      setSuccessMsg(result.message);
      setPassword('');
      setPasswordConfirmation('');
      setMode('signin');
    } catch (error) {
      setErrorMsg(getApiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-shell min-h-screen w-full flex flex-col lg:flex-row font-sans text-slate-900 selection:bg-emerald-500 selection:text-white">
      <style>{`
        .auth-orbit-art{position:absolute;top:20%;right:9%;width:min(31vw,390px);aspect-ratio:1;z-index:2;pointer-events:none;perspective:900px;animation:auth-art-enter 900ms cubic-bezier(.2,.8,.2,1) both}
        .auth-orbit{position:absolute;inset:12%;border:1px solid rgb(209 250 229 / 32%);border-radius:32%;transform:rotateX(62deg) rotateZ(-28deg);box-shadow:0 0 45px rgb(52 211 153 / 12%),inset 0 0 35px rgb(52 211 153 / 8%)}
        .auth-orbit-two{inset:2%;border-color:rgb(253 186 116 / 35%);transform:rotateX(62deg) rotateZ(32deg);animation:auth-orbit-spin 24s linear infinite}
        .auth-orbit-core{position:absolute;inset:30%;display:grid;place-items:center;border:1px solid rgb(255 255 255 / 35%);border-radius:32%;color:#fff7d6;background:linear-gradient(145deg,rgb(52 211 153 / 62%),rgb(4 75 54 / 82%));box-shadow:0 30px 80px rgb(1 25 17 / 42%),inset 0 1px rgb(255 255 255 / 35%);transform:rotateX(12deg) rotateY(-16deg) rotateZ(-8deg);animation:auth-core-float 5s ease-in-out infinite}
        .auth-orbit-core svg{width:38%;height:38%;stroke-width:1.3}
        .auth-float-card{position:absolute;display:flex;align-items:center;gap:.65rem;padding:.8rem 1rem;color:white;font-size:.68rem;line-height:1.35;border:1px solid rgb(255 255 255 / 24%);border-radius:1rem;background:rgb(8 42 32 / 52%);box-shadow:0 16px 45px rgb(0 0 0 / 18%);backdrop-filter:blur(14px)}
        .auth-float-card svg{width:1.2rem;color:#a7f3d0}.auth-float-card strong{color:#fde68a;font-weight:700}
        .auth-float-card-top{top:8%;right:-1%;animation:auth-card-float 6s ease-in-out infinite}.auth-float-card-bottom{bottom:11%;left:-9%;animation:auth-card-float 7s ease-in-out infinite reverse}
        .auth-float-dot{width:.5rem;height:.5rem;border-radius:50%;background:#4ade80;box-shadow:0 0 12px #4ade80}
        .auth-mode-content{animation:auth-content-enter 380ms cubic-bezier(.2,.75,.25,1) both}.auth-card form{animation:auth-content-enter 420ms cubic-bezier(.2,.75,.25,1) both}
        .auth-card{box-shadow:0 34px 90px -38px rgb(15 76 55 / 30%),0 2px 8px rgb(15 76 55 / 4%);animation:auth-card-enter 650ms cubic-bezier(.2,.8,.2,1) both}
        .auth-form-side{position:relative;overflow:hidden;isolation:isolate}
        .auth-form-side:before,.auth-form-side:after{position:absolute;z-index:-1;content:"";pointer-events:none;border-radius:50%;filter:blur(1px)}
        .auth-form-side:before{width:22rem;height:22rem;top:-8rem;right:-8rem;background:radial-gradient(circle,rgb(16 185 129 / 13%),transparent 68%);animation:auth-glow-drift 12s ease-in-out infinite alternate}
        .auth-form-side:after{width:18rem;height:18rem;bottom:-8rem;left:-7rem;background:radial-gradient(circle,rgb(251 146 60 / 10%),transparent 70%);animation:auth-glow-drift 15s ease-in-out infinite alternate-reverse}
        .auth-card{position:relative;z-index:1;overflow:hidden;border-color:rgb(255 255 255 / 88%);background:rgb(255 255 255 / 88%);backdrop-filter:blur(24px);transform-style:preserve-3d}
        .auth-card:before{position:absolute;top:0;left:12%;right:12%;height:1px;content:"";background:linear-gradient(90deg,transparent,rgb(16 185 129 / 55%),transparent)}
        .auth-card input:not([type="checkbox"]){min-height:3.4rem;border-radius:.9rem;transition:border-color 180ms ease,box-shadow 180ms ease,background-color 180ms ease,transform 180ms ease}
        .auth-card input:not([type="checkbox"]):focus{transform:translateY(-1px);box-shadow:0 0 0 4px rgb(16 185 129 / 10%),0 8px 22px -16px rgb(5 95 70 / 50%)}
        .auth-card label{font-weight:600;letter-spacing:.005em}
        .auth-mode-tabs{box-shadow:inset 0 1px rgb(255 255 255 / 80%)}
        .auth-mode-tabs .auth-tab-active{background:linear-gradient(180deg,#fff,#f7faf7);box-shadow:0 4px 12px rgb(15 76 55 / 9%),inset 0 1px #fff}
        .auth-submit{position:relative;overflow:hidden}
        .auth-submit:before{position:absolute;inset:0;content:"";transform:translateX(-120%);background:linear-gradient(105deg,transparent 25%,rgb(255 255 255 / 22%) 50%,transparent 75%);transition:transform 650ms ease}
        .auth-submit:hover:before{transform:translateX(120%)}
        .auth-field-decoration{position:absolute;z-index:0;pointer-events:none;opacity:.78;filter:drop-shadow(0 18px 24px rgb(6 95 70 / 12%));animation:auth-deco-float 8s ease-in-out infinite}
        .auth-field-decoration svg{stroke-width:1.15}
        .auth-field-decoration-one{top:15%;right:7%;color:#10b981;transform:rotate(12deg)}
        .auth-field-decoration-two{bottom:14%;right:5%;color:#f59e0b;animation-delay:-3s;transform:rotate(-10deg)}
        .auth-card-content{position:relative;z-index:1}
        @keyframes auth-art-enter{from{opacity:0;transform:translate3d(25px,18px,0) scale(.92)}to{opacity:1;transform:translate3d(0,0,0) scale(1)}}
        @keyframes auth-content-enter{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}
        @keyframes auth-card-enter{from{opacity:0;transform:translateY(18px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes auth-core-float{0%,100%{transform:translate3d(0,0,0) rotateX(12deg) rotateY(-16deg) rotateZ(-8deg)}50%{transform:translate3d(0,-12px,8px) rotateX(17deg) rotateY(-8deg) rotateZ(-3deg)}}
        @keyframes auth-card-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
        @keyframes auth-orbit-spin{to{transform:rotateX(62deg) rotateZ(392deg)}}
        @keyframes auth-deco-float{0%,100%{translate:0 0;rotate:0deg}50%{translate:0 -12px;rotate:4deg}}
        @keyframes auth-glow-drift{from{transform:translate3d(-10px,0,0) scale(.94)}to{transform:translate3d(15px,20px,0) scale(1.08)}}
        @media (min-width:1024px) and (max-height:780px){.auth-orbit-art{top:16%;width:min(26vw,310px)}}
        @media (max-width:1023px){.auth-field-decoration{opacity:.38}.auth-field-decoration-one{top:5%;right:3%}.auth-field-decoration-two{bottom:5%;right:2%}}
        @media (prefers-reduced-motion:reduce){.auth-orbit-art,.auth-orbit-two,.auth-orbit-core,.auth-float-card,.auth-card,.auth-mode-content,.auth-card form,.auth-field-decoration,.auth-form-side:before,.auth-form-side:after{animation:none!important}.auth-submit:before{display:none}}
      `}</style>
      {/* LEFT COLUMN: Dynamic Splash Story Showcase (Desktop 50%, hidden or banner on mobile) */}
      <div className="auth-showcase relative w-full lg:w-1/2 min-h-[380px] lg:min-h-screen overflow-hidden flex flex-col justify-between p-6 sm:p-10 lg:p-14 select-none">
        <div className="auth-orbit-art" aria-hidden="true">
          <div className="auth-orbit auth-orbit-one" />
          <div className="auth-orbit auth-orbit-two" />
          <div className="auth-orbit-core"><Sparkles /></div>
          <div className="auth-float-card auth-float-card-top"><ShieldCheck /><span>Transactions<br /><strong>transparentes</strong></span></div>
          <div className="auth-float-card auth-float-card-bottom"><span className="auth-float-dot" />Communauté active <strong>+2 400</strong></div>
        </div>
        {/* Background Images Carousel */}
        {splashSlides.map((slide, idx) => (
          <div
            key={idx}
            className={`auth-slide absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === activeSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="auth-slide-image w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            {/* Scrim Overlay */}
            <div className="auth-slide-overlay absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/30" />
            <div className="absolute inset-0 bg-emerald-950/20 mix-blend-multiply" />
          </div>
        ))}

        {/* Top Branding on Image */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="auth-logo-frame w-10 h-10 rounded-xl bg-white p-1.5 shadow-md flex items-center justify-center">
              <img
                src="/assets/aistudio/image_64acfe51.png"
                alt="Cotiz"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white block">Cotiz</span>
              <span className="text-[11px] text-emerald-100 font-medium">{t('Finance solidaire')}</span>
            </div>
          </div>

          <span className="auth-trust-pill hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-100 text-xs font-semibold border border-white/15">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('Devise officielle : FCFA')}</span>
          </span>
        </div>

        {/* Bottom Story Card & Controls */}
        <div className="relative z-10 mt-auto pt-8">
          <div className="max-w-xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/20 backdrop-blur-md border border-emerald-400/30 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>              {t(splashSlides[activeSlide].tag)}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight text-balance">
              {t(splashSlides[activeSlide].title)}
            </h2>

            <p className="text-sm text-slate-200/90 leading-relaxed max-w-lg">
              {t(splashSlides[activeSlide].description)}
            </p>

            {/* Micro proof metric strip */}
            <div className="pt-2 flex items-center gap-6">
              <div>
                <span className="text-xl font-bold text-emerald-400 font-tabular">
                  {t(splashSlides[activeSlide].statNumber)}
                </span>
                <span className="block text-[11px] text-slate-300">
                  {t(splashSlides[activeSlide].statLabel)}
                </span>
              </div>
              <div className="h-8 w-px bg-white/20" />
              <div>
                <span className="text-xl font-bold text-amber-300 font-tabular">FCFA</span>
                <span className="block text-[11px] text-slate-200">{t('Pour les cotisations locales')}</span>
              </div>
            </div>
          </div>

          {/* Carousel Navigation Indicators */}
          <div className="flex items-center justify-between pt-6 border-t border-white/15 mt-6">
            <div className="flex items-center gap-2">
              {splashSlides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveSlide(i)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    i === activeSlide ? 'w-8 bg-emerald-400' : 'w-2 bg-white/30 hover:bg-white/60'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                  aria-current={i === activeSlide ? 'true' : undefined}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() =>
                  setActiveSlide(prev => (prev - 1 + splashSlides.length) % splashSlides.length)
                }
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label={t('Précédent')}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveSlide(prev => (prev + 1) % splashSlides.length)}
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label={t('Suivant')}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Auth Form (Desktop 50%, full on mobile) */}
      <div className="auth-form-side w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8 lg:p-12 min-h-screen">
        <div className="auth-field-decoration auth-field-decoration-one" aria-hidden="true">
          <svg width="116" height="116" viewBox="0 0 116 116" fill="none"><path d="M58 5 70 39l34 12-34 12-12 34-12-34L12 51l34-12L58 5Z" fill="currentColor" fillOpacity=".1" stroke="currentColor" strokeWidth="2"/><circle cx="58" cy="51" r="9" fill="currentColor" fillOpacity=".2"/><path d="m91 9 4 11 11 4-11 4-4 11-4-11-11-4 11-4 4-11Z" fill="#f59e0b" fillOpacity=".6"/></svg>
        </div>
        <div className="auth-field-decoration auth-field-decoration-two" aria-hidden="true">
          <svg width="104" height="104" viewBox="0 0 104 104" fill="none"><path d="M52 8c9 17 17 25 34 34-17 9-25 17-34 34C43 59 35 51 18 42 35 33 43 25 52 8Z" fill="currentColor" fillOpacity=".13" stroke="currentColor" strokeWidth="2"/><circle cx="52" cy="42" r="7" fill="currentColor" fillOpacity=".25"/><circle cx="84" cy="79" r="8" stroke="#f59e0b" strokeWidth="2"/><path d="M84 75v8m-4-4h8" stroke="#f59e0b" strokeWidth="1.5"/></svg>
        </div>
        <div className="auth-card w-full max-w-md rounded-2xl border p-6 sm:p-8 space-y-6">
          <div className="flex justify-end">
            <label className="flex items-center gap-2 text-xs text-slate-500">
              <Globe className="h-4 w-4" />
              <span className="sr-only">{t('Langue de l’application')}</span>
              <select
                value={language}
                onChange={event => setLanguage(event.target.value as typeof language)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                aria-label={t('Langue de l’application')}
              >
                {appLanguages.map(option => (
                  <option key={option.code} value={option.code}>{option.nativeName}</option>
                ))}
              </select>
            </label>
          </div>
          {/* Header Title & Switch */}
          <div key={mode} className="auth-mode-content">
            <div className="flex items-center justify-between mb-1">
              <h1 className="auth-title text-2xl font-bold tracking-tight">
                {mode === 'signin'
                  ? t('Ravi de vous revoir')
                  : mode === 'otp'
                  ? t('Vérifiez votre identité')
                  : mode === 'signup'
                  ? t('Rejoindre Cotiz')
                  : mode === 'reset'
                  ? t('Nouveau mot de passe')
                  : t('Récupération de compte')}
              </h1>
              <div className="auth-logo-frame lg:hidden w-9 h-9 rounded-xl bg-white p-1.5 shadow-sm">
                <img
                  src="/assets/aistudio/image_64acfe51.png"
                  alt="Cotiz"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <p className="auth-subtitle text-xs text-slate-500">
              {mode === 'signin'
                ? t('Connectez-vous pour retrouver votre communauté et suivre vos cotisations.')
                : mode === 'otp'
                ? `${t('Saisissez le code à 6 chiffres envoyé à')} ${email}.`
                : mode === 'signup'
                ? t('Créez votre profil membre en moins d’une minute')
                : mode === 'reset'
                ? t('Choisissez un nouveau mot de passe sécurisé')
                : t('Saisissez votre adresse email pour réinitialiser votre accès')}
            </p>
          </div>

          {/* Tab Selector: Connexion vs Inscription */}
          {mode !== 'forgot' && mode !== 'reset' && mode !== 'otp' && (
            <div className="auth-mode-tabs grid grid-cols-2 p-1 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg('');
                  setSuccessMsg('');
                  setSignupErrors({});
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  mode === 'signin'
                    ? 'auth-tab-active bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                aria-pressed={mode === 'signin'}
              >
                {t('Se connecter')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg('');
                  setSuccessMsg('');
                  setSignupErrors({});
                }}
                className={`py-2 rounded-lg transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'auth-tab-active bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                aria-pressed={mode === 'signup'}
              >
                {t('Créer un compte')}
              </button>
            </div>
          )}

          {/* Error & Success Feedback */}
          {errorMsg && (
            <div role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div role="status" className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              {successMsg}
            </div>
          )}

          {/* SIGN IN FORM */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <Input
                label={t('Adresse e-mail')}
                type="email"
                placeholder="votre.email@cotiz.sn"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                value={email}
                onChange={e => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <div>
                <Input
                  label={t('Mot de passe')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Votre mot de passe"
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      aria-label={showPassword ? t('Masquer le mot de passe') : t('Afficher le mot de passe')}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  required
                />
                <div className="flex items-center justify-between mt-2 text-xs">
                  <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                    />
                    <span>{t('Se souvenir de moi')}</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="auth-link text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
                  >
                    {t('Mot de passe oublié ?')}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="auth-submit w-full mt-2"
                size="md"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {t('Recevoir mon code OTP')}
              </Button>
            </form>
          )}

          {mode === 'otp' && (
            <form onSubmit={handleVerifyLoginOtp} className="space-y-5">
              <div className="auth-otp-intro">
                <div className="auth-otp-icon">
                  <KeyRound className="h-6 w-6" />
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  {t('Ouvrez votre boîte e-mail et entrez le code de sécurité à usage unique.')}
                </p>
              </div>

              <Input
                label={t('Code de vérification')}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="000000"
                value={otpCode}
                onChange={event => setOtpCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                className="auth-otp-input"
                aria-describedby="otp-expiry"
                required
              />

              <div id="otp-expiry" className="auth-otp-timer">
                <Timer className="h-4 w-4" />
                {otpSecondsLeft > 0
                  ? `${t('Ce code expire dans')} ${Math.floor(otpSecondsLeft / 60)}:${String(otpSecondsLeft % 60).padStart(2, '0')}`
                  : t('Ce code a expiré. Recommencez votre connexion.')}
              </div>

              <Button
                type="submit"
                className="auth-submit w-full"
                size="md"
                isLoading={isLoading}
                disabled={otpSecondsLeft === 0 || otpCode.length !== 6}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                {t('Vérifier et accéder à Cotiz')}
              </Button>

              <div className="flex flex-col items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => void handleResendLoginOtp()}
                  disabled={isLoading || resendSecondsLeft > 0}
                  className="auth-link inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 disabled:cursor-not-allowed disabled:text-slate-400 cursor-pointer"
                >
                  <RefreshCw className="h-4 w-4" />
                  {resendSecondsLeft > 0
                    ? `${t('Renvoyer le code dans')} ${resendSecondsLeft}s`
                    : t('Renvoyer un nouveau code')}
                </button>
                <button
                  type="button"
                  onClick={returnToSignIn}
                  className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition-colors hover:text-slate-800 cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t('Retour à la connexion')}
                </button>
              </div>
            </form>
          )}

          {/* SIGN UP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3" noValidate>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label={t('Prénom')}
                  placeholder="Ex: Ibrahima"
                  value={firstName}
                  onChange={e => {
                    setFirstName(e.target.value);
                    clearSignupError('firstName');
                  }}
                  error={signupError('firstName')}
                  required
                />
                <Input
                  label={t('Nom')}
                  placeholder="Ex: Diallo"
                  value={lastName}
                  onChange={e => {
                    setLastName(e.target.value);
                    clearSignupError('lastName');
                  }}
                  error={signupError('lastName')}
                  required
                />
              </div>

              <Input
                label={t('Adresse e-mail')}
                type="email"
                placeholder="ibrahima.diallo@cotiz.sn"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  clearSignupError('email');
                }}
                error={signupError('email')}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <Input
                label={t('Numéro de téléphone')}
                type="tel"
                placeholder="+221 77 000 00 00"
                value={phone}
                onChange={e => {
                  setPhone(e.target.value);
                  clearSignupError('phone');
                }}
                error={signupError('phone')}
                leftIcon={<Phone className="w-4 h-4" />}
                helperText={t('Requis pour recevoir les notifications de versement')}
                required
              />

              <Input
                label={invitationToken ? t("Organisation d'invitation") : t('Nom de votre organisation')}
                placeholder={t('Ex. : Association, dahira ou tontine (2 caractères minimum)')}
                value={organizationName}
                onChange={e => {
                  setOrganizationName(e.target.value);
                  clearSignupError('organizationName');
                }}
                error={signupError('organizationName')}
                disabled={Boolean(invitationToken)}
                helperText={invitationToken ? (isInviteLoading ? t('Vérification du lien…') : `${t('Vous rejoignez')} ${invitationName}.`) : undefined}
                required
              />

              {!invitationToken && (
                <Input
                  label={t('Code de parrainage (facultatif)')}
                  value={enteredReferralCode}
                  onChange={e => {
                    setEnteredReferralCode(e.target.value.toUpperCase());
                    clearSignupError('referralCode');
                  }}
                  error={signupError('referralCode')}
                />
              )}

              <div className="space-y-3">
                <Select
                  label={t('Sexe')}
                  value={gender}
                onChange={e => {
                  setGender(e.target.value as Gender);
                  clearSignupError('gender');
                }}
                error={signupError('gender')}
                  options={[
                    { value: 'M', label: t('Homme') },
                    { value: 'F', label: t('Femme') },
                  ]}
                />
                <div className="space-y-2">
                  <Input
                    label={t('Mot de passe')}
                    type="password"
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    placeholder={t('Au moins 8 caractères')}
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value);
                      clearSignupError('password');
                      if (passwordConfirmation) clearSignupError('passwordConfirmation');
                    }}
                    error={signupError('password')}
                    helperText={t('8 caractères minimum, avec une majuscule, une minuscule, un chiffre et un symbole.')}
                    required
                  />
                  <div
                    role="meter"
                    aria-label={t('Robustesse du mot de passe')}
                    aria-valuemin={0}
                    aria-valuemax={7}
                    aria-valuenow={passwordStrengthScore}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-2"
                  >
                    <div className="flex gap-1" aria-hidden="true">
                      {Array.from({ length: 7 }, (_, index) => (
                        <span
                          key={index}
                          className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                            password && index < passwordStrengthScore
                              ? passwordStrength.color
                              : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-[11px] font-semibold ${password ? passwordStrength.textColor : 'text-slate-500'}`}>
                      {password
                        ? `${t('Robustesse')} : ${passwordStrength.label}`
                        : t('La robustesse s’affichera pendant la saisie.')}
                    </p>
                  </div>
                </div>
              </div>

              <Input
                label={t('Confirmer le mot de passe')}
                type="password"
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                placeholder={t('Saisissez à nouveau le même mot de passe')}
                value={passwordConfirmation}
                onChange={e => {
                  setPasswordConfirmation(e.target.value);
                  clearSignupError('passwordConfirmation');
                }}
                error={
                  signupError('passwordConfirmation') ||
                  (passwordConfirmation && passwordConfirmation !== password
                    ? t('La confirmation ne correspond pas au mot de passe.')
                    : undefined)
                }
                required
              />

              <ul className="space-y-1 text-[11px] text-slate-500" aria-label={t('Critères du mot de passe')}>
                {passwordRequirements.map(([label, valid]) => (
                  <li key={label} className={valid ? 'text-emerald-700' : undefined}>
                    {valid ? '✓' : '○'} {label}
                  </li>
                ))}
              </ul>

              <p className="text-[11px] text-slate-500 pt-1 leading-snug">
                {t('En créant un compte, vous acceptez le règlement financier de votre organisation et la charte de confidentialité Cotiz.')}
              </p>

              <Button type="submit" className="w-full mt-2" size="md" isLoading={isLoading || isInviteLoading}>
                {t('Créer mon compte')}
              </Button>
            </form>
          )}

          {/* FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <Input
                label={t('Email enregistré')}
                type="email"
                placeholder="votre.email@cotiz.sn"
                value={email}
                onChange={e => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setMode('signin');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                >
                  {t('Retour')}
                </Button>
                <Button type="submit" className="flex-1">
                  {t('Envoyer le lien')}
                </Button>
              </div>
            </form>
          )}

          {mode === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <Input label={t('Adresse e-mail')} type="email" value={email} readOnly />
              <Input
                label={t('Nouveau mot de passe')}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                minLength={8}
                required
              />
              <Input
                label={t('Confirmer le mot de passe')}
                type="password"
                value={passwordConfirmation}
                onChange={e => setPasswordConfirmation(e.target.value)}
                minLength={8}
                required
              />
              <Button type="submit" className="w-full" isLoading={isLoading}>
                {t('Réinitialiser le mot de passe')}
              </Button>
            </form>
          )}

          {/* Bottom Security Trust Banner */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 text-slate-600">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('Chiffrement sécurisé')}</span>
            </span>
            <span>cotiz.finance · Sénégal</span>
          </div>
        </div>
      </div>
    </div>
  );
};
