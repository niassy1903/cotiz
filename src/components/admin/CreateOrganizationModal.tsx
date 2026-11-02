import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { OrganizationType } from '../../types/organization';

interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateOrganizationModal: React.FC<CreateOrganizationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const { createOrganization } = useData();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<OrganizationType>('dahira');
  const [location, setLocation] = useState('Dakar, Sénégal');
  const [memberEstimate, setMemberEstimate] = useState(25);
  const [waveNumber, setWaveNumber] = useState(user?.phone || '+221 77 123 45 67');
  const [orangeMoneyNumber, setOrangeMoneyNumber] = useState(user?.phone || '+221 78 123 45 67');

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    const created = await createOrganization({
      name,
      description,
      type,
      location,
      memberEstimate: Number(memberEstimate),
      adminId: user?.id || 'usr-1',
      adminName: user ? `${user.firstName} ${user.lastName}` : 'Admin',
      waveNumber,
      orangeMoneyNumber,
      subscriptionPlan: 'free',
      subscriptionRenewalDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 jours d'essai gratuit
    });
    setIsSaving(false);
    if (!created) return;

    onClose();
    setName('');
    setDescription('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Créer une Nouvelle Organisation"
      subtitle="Configurez votre dahira, tontine ou association en 2 minutes"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nom de l'organisation"
          placeholder="Ex: Dahira Keur Serigne Touba, Tontine Diamono..."
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Type de structure"
            value={type}
            onChange={e => setType(e.target.value as OrganizationType)}
            options={[
              { value: 'dahira', label: 'Dahira (Spirituel & Social)' },
              { value: 'tontine', label: 'Tontine (Épargne solidaire)' },
              { value: 'association', label: 'Association caritative' },
            ]}
          />
          <Input
            label="Estimation des membres"
            type="number"
            value={memberEstimate}
            onChange={e => setMemberEstimate(Number(e.target.value))}
          />
        </div>

        <Input
          label="Localisation / Quartier / Ville"
          placeholder="Ex: Dakar, Pikine, Thiès, Touba..."
          value={location}
          onChange={e => setLocation(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Numéro Wave de collecte"
            type="tel"
            value={waveNumber}
            onChange={e => setWaveNumber(e.target.value)}
            required
          />
          <Input
            label="Numéro Orange Money"
            type="tel"
            value={orangeMoneyNumber}
            onChange={e => setOrangeMoneyNumber(e.target.value)}
            required
          />
        </div>

        <Input
          label="Description ou vocation (optionnel)"
          placeholder="Ex: Entraide fraternelle, assistance médicale et organisation d'événements"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800">
          <span className="font-bold block mb-0.5">Essai Gratuit de 14 Jours</span>
          Accès complet à toutes les fonctionnalités Premium offert lors de la création.
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" isLoading={isSaving}>Créer l'organisation</Button>
        </div>
      </form>
    </Modal>
  );
};
