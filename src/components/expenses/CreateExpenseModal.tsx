import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { useData } from '../../context/DataContext';
import { ExpenseCategory } from '../../types/expense';

interface CreateExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateExpenseModal: React.FC<CreateExpenseModalProps> = ({ isOpen, onClose }) => {
  const { createExpense } = useData();

  const [amount, setAmount] = useState<number>(10000);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ExpenseCategory>('Nourriture');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description.trim()) return;

    setIsSaving(true);
    const created = await createExpense({
      amount: Number(amount),
      description,
      date,
      category,
    });
    setIsSaving(false);
    if (!created) return;

    onClose();
    setDescription('');
    setAmount(10000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Enregistrer une Dépense"
      subtitle="Chaque dépense enregistrée sera traçable par les membres autorisés"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Montant de la dépense (FCFA)"
          type="number"
          min="100"
          step="500"
          value={amount}
          onChange={e => setAmount(Number(e.target.value))}
          required
        />

        <Input
          label="Description détaillée / Justificatif"
          placeholder="Ex: Achat nattes pour zikr, frais transport..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Catégorie"
            value={category}
            onChange={e => setCategory(e.target.value as ExpenseCategory)}
            options={[
              { value: 'Nourriture', label: 'Nourriture & Collation' },
              { value: 'Transport', label: 'Transport & Logistique' },
              { value: 'Santé', label: 'Santé & Social' },
              { value: 'Autres', label: 'Autres charges' },
            ]}
          />

          <Input
            label="Date d'engagement"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" isLoading={isSaving}>Enregistrer la dépense</Button>
        </div>
      </form>
    </Modal>
  );
};
