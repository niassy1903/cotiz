import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { ConfirmModal } from '../common/ConfirmModal';
import { OrganizationType, SubscriptionTier } from '../../types/organization';
import { formatFCFA, formatDate, getInitials } from '../../utils/formatters';
import {
  Building2,
  Save,
  CreditCard,
  Shield,
  Smartphone,
  Trash2,
  Check,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { canUndo } from '../../utils/helpers';

export const OrganizationSettings: React.FC = () => {
  const {
    currentOrg,
    updateOrganization,
    deleteOrganization,
    orgMembers,
    orgAuditLogs,
    undoAuditAction,
    updateSubscriptionPlan,
  } = useData();

  // Settings form
  const [name, setName] = useState(currentOrg.name);
  const [description, setDescription] = useState(currentOrg.description || '');
  const [type, setType] = useState<OrganizationType>(currentOrg.type);
  const [location, setLocation] = useState(currentOrg.location);
  const [memberEstimate, setMemberEstimate] = useState(currentOrg.memberEstimate);

  // Payment Numbers
  const [waveNumber, setWaveNumber] = useState(currentOrg.waveNumber);
  const [orangeMoneyNumber, setOrangeMoneyNumber] = useState(currentOrg.orangeMoneyNumber);

  // States
  const [isSaved, setIsSaved] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [selectedPlanToUpgrade, setSelectedPlanToUpgrade] = useState<SubscriptionTier | null>(null);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrganization(currentOrg.id, {
      name,
      description,
      type,
      location,
      memberEstimate: Number(memberEstimate),
      waveNumber,
      orangeMoneyNumber,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleDeleteOrg = () => {
    if (deleteConfirmationInput.trim() !== currentOrg.name.trim()) return;
    deleteOrganization(currentOrg.id);
    setShowDeleteModal(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Paramètres & Administration de l'Organisation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configuration générale, comptes de paiement Wave/OM, audit et formule SaaS
          </p>
        </div>

        {isSaved && (
          <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Modifications enregistrées !</span>
          </span>
        )}
      </div>

      {/* Section 1: General Settings */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Building2 className="w-5 h-5 text-emerald-800" />
          <h3 className="text-sm font-bold text-slate-900">Identité & Coordonnées</h3>
        </div>

        <form onSubmit={handleSaveGeneral} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nom de l'organisation"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />

            <Select
              label="Type de structure"
              value={type}
              onChange={e => setType(e.target.value as OrganizationType)}
              options={[
                { value: 'dahira', label: 'Dahira (Communauté spirituelle & sociale)' },
                { value: 'tontine', label: 'Tontine (Épargne solidaire & rotative)' },
                { value: 'association', label: 'Association caritative ou de quartier' },
              ]}
            />
          </div>

          <Input
            label="Localisation / Siège"
            placeholder="Ex: Dakar, Touba, Thiès, etc."
            value={location}
            onChange={e => setLocation(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Estimation du nombre de membres"
              type="number"
              value={memberEstimate}
              onChange={e => setMemberEstimate(Number(e.target.value))}
            />
            <Input
              label="Description (optionnel)"
              placeholder="Courte présentation de la vocation de la structure"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Section 2: Payment Gateway Configuration */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
              Comptes de Réception Mobile Money
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Numéro Wave officiel de l'organisation"
                placeholder="+221 77 000 00 00"
                value={waveNumber}
                onChange={e => setWaveNumber(e.target.value)}
                leftIcon={<Smartphone className="w-4 h-4 text-sky-600" />}
                helperText="Les membres peuvent scanner ou transférer directement vers ce compte"
                required
              />
              <Input
                label="Numéro Orange Money officiel"
                placeholder="+221 78 000 00 00"
                value={orangeMoneyNumber}
                onChange={e => setOrangeMoneyNumber(e.target.value)}
                leftIcon={<Smartphone className="w-4 h-4 text-orange-600" />}
                helperText="Compte marchant ou numéro Orange Money de trésorerie"
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <Button type="submit" leftIcon={<Save className="w-4 h-4" />}>
              Enregistrer les modifications
            </Button>
          </div>
        </form>
      </div>

      {/* Section 3: Subscription Plan & SaaS Pricing */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">Abonnement SaaS Cotiz</h3>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase">
            Formule active : {currentOrg.subscriptionPlan}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Free Tier */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between ${
              currentOrg.subscriptionPlan === 'free'
                ? 'border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-600'
                : 'border-slate-200 bg-slate-50/50'
            }`}
          >
            <div>
              <h4 className="text-sm font-bold text-slate-900">Gratuit (Free)</h4>
              <p className="text-xs text-slate-500 mt-0.5">Pour petits groupes</p>
              <div className="mt-3 text-lg font-black font-tabular text-slate-900">0 FCFA</div>
              <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
                <li>✓ Jusqu'à 10 membres</li>
                <li>✓ Cotisations & paiements Wave/OM</li>
                <li>✓ Dashboard basique</li>
                <li>· Publicités partenaires discrètes</li>
              </ul>
            </div>
            {currentOrg.subscriptionPlan !== 'free' && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => updateSubscriptionPlan(currentOrg.id, 'free')}
              >
                Passer au gratuit
              </Button>
            )}
          </div>

          {/* Basic Tier */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between ${
              currentOrg.subscriptionPlan === 'basic'
                ? 'border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-600'
                : 'border-slate-200 bg-slate-50/50'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">Essentiel (Basic)</h4>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Recommandé
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Pour dahiras actifs</p>
              <div className="mt-3 text-lg font-black font-tabular text-slate-900">
                1 900 FCFA <span className="text-xs font-normal text-slate-500">/mois</span>
              </div>
              <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
                <li>✓ Jusqu'à 75 membres</li>
                <li>✓ Zéro publicité garantie</li>
                <li>✓ Gestion complète des dépenses</li>
                <li>✓ Paiements partiels et rattrapages</li>
                <li>✓ Support prioritaire WhatsApp</li>
              </ul>
            </div>
            {currentOrg.subscriptionPlan !== 'basic' && (
              <Button
                size="sm"
                className="w-full mt-4"
                onClick={() => updateSubscriptionPlan(currentOrg.id, 'basic')}
              >
                Choisir Essentiel
              </Button>
            )}
          </div>

          {/* Premium Tier */}
          <div
            className={`p-4 rounded-xl border flex flex-col justify-between ${
              currentOrg.subscriptionPlan === 'premium'
                ? 'border-emerald-600 bg-emerald-50/30 ring-1 ring-emerald-600'
                : 'border-slate-200 bg-slate-50/50'
            }`}
          >
            <div>
              <h4 className="text-sm font-bold text-slate-900">Illimité (Premium)</h4>
              <p className="text-xs text-slate-500 mt-0.5">Pour grandes fédérations</p>
              <div className="mt-3 text-lg font-black font-tabular text-slate-900">
                3 900 FCFA <span className="text-xs font-normal text-slate-500">/mois</span>
              </div>
              <ul className="mt-3 space-y-1.5 text-[11px] text-slate-600">
                <li>✓ Membres illimités</li>
                <li>✓ Audit logs complets (avec annulation 1h)</li>
                <li>✓ Carte de membre digitale</li>
                <li>✓ Health score & analyses avancées</li>
                <li>✓ Support VIP 24/7</li>
              </ul>
            </div>
            {currentOrg.subscriptionPlan !== 'premium' && (
              <Button
                size="sm"
                variant="secondary"
                className="w-full mt-4"
                onClick={() => updateSubscriptionPlan(currentOrg.id, 'premium')}
              >
                Passer à l'Illimité
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Section 4: Audit Logs & Undo 1h */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-800" />
            <h3 className="text-sm font-bold text-slate-900">
              Journal d'Audit & Sécurité (Audit Logs)
            </h3>
          </div>
          <span className="text-xs text-slate-500">Délai d'annulation autorisé : 1 heure</span>
        </div>

        <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
          {orgAuditLogs.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">Aucun événement enregistré.</p>
          ) : (
            orgAuditLogs.map(log => {
              const isUndoable = !log.isUndone && canUndo(log.timestamp, 1);

              return (
                <div key={log.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{log.action}</span>
                      <span className="text-[10px] text-slate-400">
                        {formatDate(log.timestamp, { showTime: true })}
                      </span>
                    </div>
                    <p className="text-slate-600 mt-0.5">{log.details}</p>
                    <span className="text-[10px] text-slate-400">Par {log.userName}</span>
                  </div>

                  <div>
                    {log.isUndone ? (
                      <span className="text-[11px] font-medium text-slate-400 line-through">
                        Annulé
                      </span>
                    ) : isUndoable ? (
                      <button
                        onClick={() => undoAuditAction(log.id)}
                        className="px-2.5 py-1 text-[11px] font-medium rounded border border-rose-200 text-rose-700 hover:bg-rose-50 flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Annuler l'action</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400">Archivé</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Section 5: Danger Zone - Delete Organization */}
      <div className="bg-rose-50 rounded-xl border border-rose-200 p-6 space-y-4">
        <div className="flex items-center gap-2 text-rose-800">
          <Trash2 className="w-5 h-5" />
          <h3 className="text-sm font-bold">Zone Dangereuse : Suppression de l'Organisation</h3>
        </div>
        <p className="text-xs text-rose-700 leading-relaxed max-w-2xl">
          Conformément au cahier des charges, la suppression conserve les données dans un état d'archivage pendant 30 jours avant suppression définitive. Durant ce délai, l'organisation peut être restaurée par le support.
        </p>

        <Button
          variant="danger"
          size="sm"
          onClick={() => setShowDeleteModal(true)}
          leftIcon={<AlertTriangle className="w-4 h-4" />}
        >
          Supprimer cette organisation
        </Button>
      </div>

      {/* Delete Org Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-rose-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Attention ! Suppression irréversible</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Pour confirmer, veuillez saisir exactement le nom de votre organisation :{' '}
              <span className="font-bold text-slate-900">"{currentOrg.name}"</span>.
            </p>

            <Input
              placeholder={currentOrg.name}
              value={deleteConfirmationInput}
              onChange={e => setDeleteConfirmationInput(e.target.value)}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationInput('');
                }}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={deleteConfirmationInput.trim() !== currentOrg.name.trim()}
                onClick={handleDeleteOrg}
              >
                Confirmer la suppression
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
