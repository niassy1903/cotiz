import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { useAuth } from '../../context/AuthContext';
import { Gender } from '../../types/auth';
import { getInitials } from '../../utils/formatters';
import {
  User,
  Bell,
  Globe,
  Lock,
  LogOut,
  Check,
  Shield,
  Smartphone,
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, updateCurrentUserProfile, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile');

  // Profile form
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [gender, setGender] = useState<Gender>(user?.gender || 'M');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Notifications toggles
  const [notifNewContrib, setNotifNewContrib] = useState(true);
  const [notifPaymentReceived, setNotifPaymentReceived] = useState(true);
  const [notifLateAlert, setNotifLateAlert] = useState(true);
  const [notifDueReminder, setNotifDueReminder] = useState(true);
  const [notifExpenseRecorded, setNotifExpenseRecorded] = useState(true);

  // Language
  const [language, setLanguage] = useState<'FR' | 'EN'>('FR');

  if (!user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError('');
    try {
      await updateCurrentUserProfile({ firstName, lastName, phone, gender });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'La mise à jour du profil a échoué.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Mon Profil Utilisateur"
      subtitle="Gestion de votre compte personnel, sécurité et notifications"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Profile Card Header */}
        <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-900 text-white font-bold text-sm flex items-center justify-center shrink-0">
            {getInitials(`${user.firstName} ${user.lastName}`)}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-bold text-slate-900 truncate">
              {user.firstName} {user.lastName}
            </h4>
            <p className="text-xs text-slate-500 truncate">{user.email}</p>
            <span className="text-[10px] font-semibold text-emerald-800 uppercase">
              Rôle : {user.role}
            </span>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-lg bg-slate-100 p-1 text-xs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-1.5 font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'profile' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Informations
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-1.5 font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'notifications' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-1.5 font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'security' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Sécurité & Langue
          </button>
        </div>

        {/* Tab 1: Profile info */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-3">
            {saveError && <p role="alert" className="text-xs text-rose-700">{saveError}</p>}
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Prénom"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Nom"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
              />
            </div>

            <Input
              label="Numéro de téléphone"
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
            />

            <Select
              label="Sexe"
              value={gender}
              onChange={e => setGender(e.target.value as Gender)}
              options={[
                { value: 'M', label: 'Homme' },
                { value: 'F', label: 'Femme' },
              ]}
            />

            <div className="flex items-center justify-between pt-2">
              {savedSuccess ? (
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Enregistré !
                </span>
              ) : <div />}

              <Button type="submit" size="sm">
                Sauvegarder mon profil
              </Button>
            </div>
          </form>
        )}

        {/* Tab 2: Notification toggles */}
        {activeTab === 'notifications' && (
          <div className="space-y-3 text-xs">
            <p className="text-slate-500 text-[11px]">
              Activez ou désactivez les alertes reçues sur votre application et par SMS :
            </p>

            {[
              {
                id: 'newContrib',
                label: 'Nouvelle cotisation créée',
                desc: 'Alerte lors de l’ouverture d’un cycle',
                val: notifNewContrib,
                set: setNotifNewContrib,
              },
              {
                id: 'paymentRec',
                label: 'Paiement reçu & validé',
                desc: 'Confirmation de réception Wave / OM',
                val: notifPaymentReceived,
                set: setNotifPaymentReceived,
              },
              {
                id: 'lateAlert',
                label: 'Cotisation en retard',
                desc: 'Notification de rappel automatique',
                val: notifLateAlert,
                set: setNotifLateAlert,
              },
              {
                id: 'dueReminder',
                label: 'Rappel d’échéance imminente',
                desc: 'Envoyé 48h avant la date limite',
                val: notifDueReminder,
                set: setNotifDueReminder,
              },
              {
                id: 'expRecorded',
                label: 'Dépense enregistrée',
                desc: 'Pour les membres autorisés',
                val: notifExpenseRecorded,
                set: setNotifExpenseRecorded,
              },
            ].map(item => (
              <label
                key={item.id}
                className="p-2.5 rounded-lg border border-slate-200 flex items-center justify-between hover:bg-slate-50 cursor-pointer"
              >
                <div>
                  <span className="font-semibold text-slate-800 block">{item.label}</span>
                  <span className="text-[11px] text-slate-500">{item.desc}</span>
                </div>
                <input
                  type="checkbox"
                  checked={item.val}
                  onChange={e => item.set(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600"
                />
              </label>
            ))}
          </div>
        )}

        {/* Tab 3: Security & Language */}
        {activeTab === 'security' && (
          <div className="space-y-4 text-xs">
            {/* Language */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-600" />
                <span className="font-semibold text-slate-800">Langue de l'application</span>
              </div>
              <div className="flex gap-1">
                {(['FR', 'EN'] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer ${
                      language === lang
                        ? 'bg-emerald-800 text-white'
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Logout button */}
            <div className="pt-2">
              <Button
                variant="danger"
                size="sm"
                className="w-full"
                onClick={() => {
                  logout();
                  onClose();
                }}
                leftIcon={<LogOut className="w-4 h-4" />}
              >
                Se déconnecter
              </Button>
            </div>

            <div className="text-center pt-2 text-[10px] text-slate-400">
              Cotiz Web v1.0.0 · Dernière mise à jour Novembre 2026
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
