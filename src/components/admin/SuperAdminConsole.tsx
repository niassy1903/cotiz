import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Button } from '../common/Button';
import { SectionHero } from '../common/SectionHero';
import { Input } from '../common/Input';
import { formatDate } from '../../utils/formatters';
import { ShieldAlert, Check, X, Search, AlertTriangle } from 'lucide-react';

export const SuperAdminConsole: React.FC = () => {
  const { organizations, updateOrganization, auditLogs } = useData();

  const [search, setSearch] = useState('');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);

  const filteredOrgs = organizations.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.adminName.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleBlock = (orgId: string, currentStatus: string) => {
    if (currentStatus === 'suspended') {
      updateOrganization(orgId, { status: 'active' });
    } else {
      setSelectedOrgId(orgId);
      setShowBlockModal(true);
    }
  };

  const confirmBlock = () => {
    if (!selectedOrgId || !blockReason.trim()) return;
    updateOrganization(selectedOrgId, { status: 'suspended' });
    setShowBlockModal(false);
    setSelectedOrgId(null);
    setBlockReason('');
  };

  return (
    <div className="space-y-6">
      <SectionHero
        theme="security"
        eyebrow="Cotiz Global · Supervision"
        title="Console Super Administrateur"
        description="Supervision des organisations, modération et sécurité de la plateforme."
        detail={`${organizations.length} organisations hébergées`}
      />

      {/* Organizations moderation table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="relative w-full max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher une organisation..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {organizations.length} organisations hébergées
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Organisation</th>
                <th className="py-3 px-4">Administrateur</th>
                <th className="py-3 px-4">Plan SaaS</th>
                <th className="py-3 px-4">Comptes Collecte</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-right">Modération</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrgs.map(org => (
                <tr key={org.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900 block">{org.name}</span>
                    <span className="text-[10px] text-slate-400 capitalize">
                      {org.type} · {org.location}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-800 block">{org.adminName}</span>
                    <span className="text-[10px] text-slate-400">Créé le {formatDate(org.createdAt, { short: true })}</span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="font-semibold text-emerald-800 uppercase text-[11px]">
                      {org.subscriptionPlan}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <span className="text-[10px] text-slate-600 block">Wave : {org.waveNumber}</span>
                    <span className="text-[10px] text-slate-600 block">OM : {org.orangeMoneyNumber}</span>
                  </td>

                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                        org.status === 'active'
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-rose-50 text-rose-800'
                      }`}
                    >
                      {org.status === 'active' ? 'Active' : 'Bloquée / Suspendue'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <Button
                      size="sm"
                      variant={org.status === 'active' ? 'danger' : 'outline'}
                      onClick={() => handleToggleBlock(org.id, org.status)}
                    >
                      {org.status === 'active' ? 'Suspendre' : 'Débloquer'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Audit Feed */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900">
          Supervision des Logs Globaux d'Activité
        </h3>
        <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
          {auditLogs.slice(0, 8).map(log => (
            <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-900">{log.action}</span>
                <p className="text-[11px] text-slate-600">{log.details}</p>
              </div>
              <span className="text-[10px] text-slate-400">
                {formatDate(log.timestamp, { showTime: true })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Block reason modal */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <h3 className="text-base font-bold text-rose-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>Suspension d'Organisation</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Une raison obligatoire doit être renseignée pour suspendre cette communauté.
            </p>

            <Input
              label="Motif du blocage"
              placeholder="Ex: Signalement pour non-conformité financière"
              value={blockReason}
              onChange={e => setBlockReason(e.target.value)}
              required
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowBlockModal(false);
                  setBlockReason('');
                }}
              >
                Annuler
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={!blockReason.trim()}
                onClick={confirmBlock}
              >
                Confirmer le blocage
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
