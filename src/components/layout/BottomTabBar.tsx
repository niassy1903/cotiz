import React from 'react';
import { NavigationTab } from './Sidebar';
import { LayoutDashboard, Wallet, Users, User, ArrowLeftRight } from 'lucide-react';

interface BottomTabBarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenProfile: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  currentTab,
  onSelectTab,
  onOpenProfile,
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 px-3 py-1 flex items-center justify-around shadow-lg">
      <button
        onClick={() => onSelectTab('dashboard')}
        className={`flex flex-col items-center py-1 px-3 text-[10px] font-medium transition-colors cursor-pointer ${
          currentTab === 'dashboard' ? 'text-emerald-800 font-semibold' : 'text-slate-500'
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mb-0.5" />
        <span>Accueil</span>
      </button>

      <button
        onClick={() => onSelectTab('contributions')}
        className={`flex flex-col items-center py-1 px-3 text-[10px] font-medium transition-colors cursor-pointer ${
          currentTab === 'contributions' ? 'text-emerald-800 font-semibold' : 'text-slate-500'
        }`}
      >
        <Wallet className="w-5 h-5 mb-0.5" />
        <span>Cotisations</span>
      </button>

      <button
        onClick={() => onSelectTab('payments')}
        className={`flex flex-col items-center py-1 px-3 text-[10px] font-medium transition-colors cursor-pointer ${
          currentTab === 'payments' ? 'text-emerald-800 font-semibold' : 'text-slate-500'
        }`}
      >
        <ArrowLeftRight className="w-5 h-5 mb-0.5" />
        <span>Paiements</span>
      </button>

      <button
        onClick={() => onSelectTab('members')}
        className={`flex flex-col items-center py-1 px-3 text-[10px] font-medium transition-colors cursor-pointer ${
          currentTab === 'members' ? 'text-emerald-800 font-semibold' : 'text-slate-500'
        }`}
      >
        <Users className="w-5 h-5 mb-0.5" />
        <span>Membres</span>
      </button>

      <button
        onClick={onOpenProfile}
        className="flex flex-col items-center py-1 px-3 text-[10px] font-medium text-slate-500 hover:text-emerald-800 transition-colors cursor-pointer"
      >
        <User className="w-5 h-5 mb-0.5" />
        <span>Profil</span>
      </button>
    </div>
  );
};
