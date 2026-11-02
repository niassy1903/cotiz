import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';
import { AddMemberModal } from './AddMemberModal';
import { InviteLinkModal } from './InviteLinkModal';
import { MemberDetailsModal } from './MemberDetailsModal';
import { Member, MemberStatus, MemberRole } from '../../types/member';
import { formatDate, getInitials } from '../../utils/formatters';
import {
  UserPlus,
  Share2,
  Search,
  Check,
  X,
  Shield,
  Ghost,
  Eye,
  CheckCheck,
} from 'lucide-react';

export const MembersList: React.FC = () => {
  const { user } = useAuth();
  const {
    currentOrg,
    orgMembers,
    acceptPendingMember,
    rejectPendingMember,
  } = useData();

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // Filters
  const [search, setSearch] = useState('');
  const [statusTab, setStatusTab] = useState<MemberStatus | 'all'>('active');
  const [roleFilter, setRoleFilter] = useState<'all' | MemberRole>('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'M' | 'F'>('all');

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const pendingMembers = orgMembers.filter(m => m.status === 'pending');

  const filteredMembers = orgMembers.filter(m => {
    if (statusTab !== 'all' && m.status !== statusTab) return false;
    if (roleFilter !== 'all' && m.role !== roleFilter) return false;
    if (genderFilter !== 'all' && m.gender !== genderFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        m.email?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAcceptAllPending = () => {
    pendingMembers.forEach(m => acceptPendingMember(m.id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {isAdmin ? 'Gestion des Membres' : 'Annuaire de l’Organisation'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {orgMembers.filter(m => m.status === 'active').length} membres actifs dans {currentOrg.name}
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsInviteOpen(true)}
              leftIcon={<Share2 className="w-3.5 h-3.5" />}
            >
              Lien d'invitation
            </Button>
            <Button
              size="sm"
              onClick={() => setIsAddOpen(true)}
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
            >
              Ajouter un membre
            </Button>
          </div>
        )}
      </div>

      {/* Pending Approval Banner if any */}
      {isAdmin && pendingMembers.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-amber-950 flex items-center gap-2">
              <span>{pendingMembers.length} demande(s) d'adhésion en attente de confirmation</span>
            </h3>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleAcceptAllPending}
              leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
            >
              Accepter tous
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {pendingMembers.map(m => (
              <div
                key={m.id}
                className="bg-white p-3 rounded-lg border border-amber-200 flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-xs text-slate-900 block">
                    {m.firstName} {m.lastName}
                  </span>
                  <span className="text-[11px] text-slate-500">{m.phone}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => rejectPendingMember(m.id)}
                    leftIcon={<X className="w-3.5 h-3.5 text-rose-500" />}
                  >
                    Rejeter
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => acceptPendingMember(m.id)}
                    leftIcon={<Check className="w-3.5 h-3.5" />}
                  >
                    Accepter
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-3 shadow-xs">
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Tab */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
            {[
              { id: 'active', label: 'Actifs' },
              { id: 'pending', label: `En attente (${pendingMembers.length})` },
              { id: 'all', label: 'Tous' },
              { id: 'archived', label: 'Archivés' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusTab(tab.id as typeof statusTab)}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  statusTab === tab.id
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Gender Filter */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg text-xs">
            {[
              { id: 'all', label: 'Tous genres' },
              { id: 'M', label: 'Hommes' },
              { id: 'F', label: 'Femmes' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setGenderFilter(tab.id as typeof genderFilter)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  genderFilter === tab.id
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Members Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map(member => (
          <div
            key={member.id}
            className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {getInitials(`${member.firstName} ${member.lastName}`)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 leading-tight">
                      {member.firstName} {member.lastName}
                    </h3>
                    <span className="text-[11px] text-slate-500">{member.phone}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      member.role === 'admin'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {member.role === 'admin' ? 'Admin' : 'Membre'}
                  </span>
                  {member.isGhost && (
                    <span className="text-[10px] font-medium text-amber-600 flex items-center gap-0.5">
                      <Ghost className="w-3 h-3" />
                      <span>Fantôme</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400">Genre :</span>
                  <span className="font-medium text-slate-800">
                    {member.gender === 'M' ? 'Masculin' : 'Féminin'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Adhésion :</span>
                  <span className="font-medium text-slate-800">{formatDate(member.joinDate)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Accès transactions :</span>
                  <span
                    className={`font-semibold ${
                      member.hasTransactionAccess ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  >
                    {member.hasTransactionAccess ? 'Oui' : 'Non'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded capitalize ${
                  member.status === 'active'
                    ? 'bg-emerald-50 text-emerald-800'
                    : member.status === 'pending'
                    ? 'bg-amber-50 text-amber-800'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {member.status}
              </span>

              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedMember(member)}
                leftIcon={<Eye className="w-3.5 h-3.5" />}
              >
                Fiche détaillée
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      <AddMemberModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} />
      <InviteLinkModal isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} />
      <MemberDetailsModal
        member={selectedMember}
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        isAdmin={isAdmin}
      />
    </div>
  );
};
