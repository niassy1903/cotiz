import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { useData } from '../../context/DataContext';
import { Gender } from '../../types/auth';
import { MemberRole } from '../../types/member';
import { UserCheck, Ghost, Info } from 'lucide-react';

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ isOpen, onClose }) => {
  const { addMember } = useData();

  const [tab, setTab] = useState<'active' | 'ghost'>('active');

  // Form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<Gender>('M');
  const [role, setRole] = useState<MemberRole>('member');
  const [isSaving, setIsSaving] = useState(false);
  const [accessLinkMessage, setAccessLinkMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setAccessLinkMessage(null);
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !phone.trim()) return;

    setIsSaving(true);
    const created = await addMember({
      firstName,
      lastName,
      phone,
      email: tab === 'active' ? email : undefined,
      gender,
      role,
      isGhost: tab === 'ghost',
    });
    setIsSaving(false);
    if (!created) return;

    // Reset
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    if (created.accessLinkSent === false) {
      setAccessLinkMessage(created.accessLinkMessage || 'Le compte est créé, mais le lien d’activation n’a pas pu être envoyé.');
      return;
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajouter un Membre"
      subtitle="Intégrez un membre actif avec compte ou un membre géré par l'admin"
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Tab switch between Active and Ghost */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setTab('active')}
            className={`py-2 px-3 font-semibold rounded-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tab === 'active'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-700" />
            <span>Membre Actif</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('ghost')}
            className={`py-2 px-3 font-semibold rounded-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
              tab === 'ghost'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Ghost className="w-4 h-4 text-amber-600" />
            <span>Membre Fantôme</span>
          </button>
        </div>

        {tab === 'ghost' && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Un membre fantôme n'a pas besoin de créer de compte Cotiz. L'administrateur saisit et valide manuellement toutes ses cotisations en espèces ou Wave pour lui.
            </span>
          </div>
        )}

        {accessLinkMessage ? (
          <div className="space-y-4">
            <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              {accessLinkMessage}
            </p>
            <div className="flex justify-end">
              <Button type="button" onClick={onClose}>Fermer</Button>
            </div>
          </div>
        ) : <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Prénom"
              placeholder="Ex: Moussa"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Nom"
              placeholder="Ex: Ndiaye"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              required
            />
          </div>

          <Input
            label="Numéro de téléphone"
            type="tel"
            placeholder="+221 77 000 00 00"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            helperText="Requis pour l'envoi de SMS et reçus de cotisation"
            required
          />

          {tab === 'active' && (
            <Input
              label="Adresse e-mail du membre"
              type="email"
              placeholder="moussa@exemple.sn"
              value={email}
              onChange={e => setEmail(e.target.value)}
              helperText="Un compte Cotiz sera lié (ou créé) pour son suivi personnel. S’il est nouveau, un lien sécurisé lui permettra de choisir son mot de passe."
              required
            />
          )}

          <div className="grid grid-cols-2 gap-2">
            <Select
              label="Sexe"
              value={gender}
              onChange={e => setGender(e.target.value as Gender)}
              options={[
                { value: 'M', label: 'Homme' },
                { value: 'F', label: 'Femme' },
              ]}
            />
            <Select
              label="Rôle"
              value={role}
              onChange={e => setRole(e.target.value as MemberRole)}
              options={[
                { value: 'member', label: 'Membre régulier' },
                { value: 'admin', label: 'Administrateur' },
              ]}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" isLoading={isSaving}>
              {tab === 'ghost' ? 'Ajouter le membre fantôme' : 'Ajouter le membre'}
            </Button>
          </div>
        </form>}
      </div>
    </Modal>
  );
};
