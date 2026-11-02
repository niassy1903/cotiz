import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { useData } from '../../context/DataContext';
import {
  ContributionFrequency,
  ContributionAmountType,
  ContributionTargetType,
} from '../../types/contribution';
import { formatFCFA } from '../../utils/formatters';

interface CreateContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateContributionModal: React.FC<CreateContributionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { createContribution, orgMembers } = useData();

  const [title, setTitle] = useState('');
  const [amountType, setAmountType] = useState<ContributionAmountType>('fixed');
  const [amount, setAmount] = useState<number>(5000);
  const [amountFemale, setAmountFemale] = useState<number>(3000);
  const [frequency, setFrequency] = useState<ContributionFrequency>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState<number>(5);
  const [targetType, setTargetType] = useState<ContributionTargetType>('all');
  const [startDate, setStartDate] = useState<string>('2026-11-01');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    setIsSaving(true);
    const created = await createContribution({
      title,
      amountType,
      amount: Number(amount),
      amountFemale: targetType === 'by_gender' ? Number(amountFemale) : undefined,
      frequency,
      dayOfMonth: Number(dayOfMonth),
      startDate,
      targetType,
      status: 'active',
    });
    setIsSaving(false);
    if (!created) return;

    onClose();
    // Reset
    setTitle('');
    setAmount(5000);
  };

  // Projected estimate
  const memberCount = orgMembers.length || 10;
  const projectedTotal =
    targetType === 'by_gender'
      ? Math.round(memberCount * 0.5 * amount + memberCount * 0.5 * amountFemale)
      : memberCount * amount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Créer une nouvelle cotisation"
      subtitle="Configurez les paramètres et la récurrence automatique des échéances"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nom de la cotisation"
          placeholder="Ex: Sass Mensuelle Dahira, Adiya Magal, etc."
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Type de montant"
            value={amountType}
            onChange={e => setAmountType(e.target.value as ContributionAmountType)}
            options={[
              { value: 'fixed', label: 'Montant fixe obligatoire' },
              { value: 'minimum', label: 'Montant minimum (dons libres acceptés)' },
            ]}
          />

          <Select
            label="Fréquence de prélèvement"
            value={frequency}
            onChange={e => setFrequency(e.target.value as ContributionFrequency)}
            options={[
              { value: 'weekly', label: 'Hebdomadaire (Chaque semaine)' },
              { value: 'biweekly', label: 'Bihebdomadaire (Toutes les 2 semaines)' },
              { value: 'monthly', label: 'Mensuelle (Chaque mois)' },
              { value: 'quarterly', label: 'Trimestrielle' },
              { value: 'annual', label: 'Annuelle' },
            ]}
          />
        </div>

        {/* Target Type */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            Cible des cotisants
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'all', label: 'Tous les membres' },
              { id: 'by_gender', label: 'Par genre (Différencié)' },
              { id: 'custom', label: 'Sélection manuelle' },
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setTargetType(opt.id as ContributionTargetType)}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-colors cursor-pointer ${
                  targetType === opt.id
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Amounts */}
        {targetType === 'by_gender' ? (
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <Input
              label="Montant Hommes (FCFA)"
              type="number"
              min="100"
              step="500"
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              required
            />
            <Input
              label="Montant Femmes (FCFA)"
              type="number"
              min="100"
              step="500"
              value={amountFemale}
              onChange={e => setAmountFemale(Number(e.target.value))}
              required
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Montant par échéance (FCFA)"
              type="number"
              min="100"
              step="500"
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
              required
            />
            {frequency === 'monthly' && (
              <Input
                label="Jour d'échéance dans le mois"
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={e => setDayOfMonth(Number(e.target.value))}
                helperText="Ex: le 5 de chaque mois"
              />
            )}
          </div>
        )}

        {/* Start Date */}
        <Input
          label="Date de début de la récurrence"
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          required
        />

        {/* Projections summary box */}
        <div className="p-3.5 rounded-xl bg-emerald-900/5 border border-emerald-800/10 text-xs">
          <div className="flex items-center justify-between text-slate-700 font-medium">
            <span>Projection estimée par échéance :</span>
            <span className="font-bold text-emerald-900 font-tabular text-sm">
              ~ {formatFCFA(projectedTotal)}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Basé sur les {memberCount} membres actuels. Une nouvelle échéance sera générée automatiquement à chaque cycle.
          </p>
        </div>

        {/* Form actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" isLoading={isSaving}>Créer la cotisation</Button>
        </div>
      </form>
    </Modal>
  );
};
