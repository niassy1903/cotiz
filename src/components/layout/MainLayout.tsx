import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Header } from './Header';
import { Sidebar, NavigationTab } from './Sidebar';
import { BottomTabBar } from './BottomTabBar';
import { GlobalSearchModal } from './GlobalSearchModal';
import { NotificationsModal } from './NotificationsModal';
import { UserProfileModal } from '../profile/UserProfileModal';
import { InviteLinkModal } from '../members/InviteLinkModal';
import { MakePaymentModal } from '../payments/MakePaymentModal';
import { CreateContributionModal } from '../contributions/CreateContributionModal';
import { CreateExpenseModal } from '../expenses/CreateExpenseModal';
import { AddMemberModal } from '../members/AddMemberModal';
import { CreateOrganizationModal } from '../admin/CreateOrganizationModal';

import { AdminDashboard } from '../dashboard/AdminDashboard';
import { MemberDashboard } from '../dashboard/MemberDashboard';
import { ContributionsList } from '../contributions/ContributionsList';
import { PaymentHistoryTable } from '../payments/PaymentHistoryTable';
import { MembersList } from '../members/MembersList';
import { ExpensesList } from '../expenses/ExpensesList';
import { ReportsDashboard } from '../reports/ReportsDashboard';
import { OrganizationSettings } from '../admin/OrganizationSettings';
import { ReferralDashboard } from '../referrals/ReferralDashboard';
import { SuperAdminConsole } from '../admin/SuperAdminConsole';

export const MainLayout: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // Navigation state
  const [currentTab, setCurrentTab] = useState<NavigationTab>('dashboard');

  // Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isMakePaymentOpen, setIsMakePaymentOpen] = useState(false);
  const [selectedContributionForPayment, setSelectedContributionForPayment] = useState<string | undefined>();
  const [isCreateContributionOpen, setIsCreateContributionOpen] = useState(false);
  const [isCreateExpenseOpen, setIsCreateExpenseOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);

  const handleOpenPaymentWithContrib = (contribId?: string) => {
    setSelectedContributionForPayment(contribId);
    setIsMakePaymentOpen(true);
  };

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden text-slate-800">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenInviteModal={() => setIsInviteOpen(true)}
        />
      </div>

      {/* Main View Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
        />

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          <div key={currentTab} className="app-page-transition max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              isAdmin ? (
                <AdminDashboard
                  onNavigateTab={setCurrentTab}
                  onOpenCreateContribution={() => setIsCreateContributionOpen(true)}
                  onOpenCreateExpense={() => setIsCreateExpenseOpen(true)}
                  onOpenAddMember={() => setIsAddMemberOpen(true)}
                  onOpenInviteModal={() => setIsInviteOpen(true)}
                  onOpenValidatePayment={() => setCurrentTab('payments')}
                />
              ) : (
                <MemberDashboard
                  onOpenMakePayment={handleOpenPaymentWithContrib}
                  onNavigateTab={setCurrentTab}
                />
              )
            )}

            {currentTab === 'contributions' && (
              <ContributionsList
                onOpenCreate={() => setIsCreateContributionOpen(true)}
                onOpenMakePayment={handleOpenPaymentWithContrib}
              />
            )}

            {currentTab === 'payments' && (
              <PaymentHistoryTable
                onOpenMakePayment={() => setIsMakePaymentOpen(true)}
              />
            )}

            {currentTab === 'members' && <MembersList />}

            {currentTab === 'expenses' && (
              <ExpensesList onOpenCreate={() => setIsCreateExpenseOpen(true)} />
            )}

            {currentTab === 'reports' && <ReportsDashboard />}

            {currentTab === 'settings' && <OrganizationSettings />}

            {currentTab === 'referrals' && <ReferralDashboard />}

            {currentTab === 'superadmin' && <SuperAdminConsole />}
          </div>
        </main>

        {/* Mobile Bottom Tab Bar */}
        <BottomTabBar
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          onOpenProfile={() => setIsProfileOpen(true)}
        />
      </div>

      {/* Modals Container */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={(type, id) => {
          if (type === 'contribution') setCurrentTab('contributions');
          else if (type === 'payment') setCurrentTab('payments');
          else if (type === 'member') setCurrentTab('members');
        }}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />

      <InviteLinkModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />

      <MakePaymentModal
        isOpen={isMakePaymentOpen}
        onClose={() => setIsMakePaymentOpen(false)}
        preselectedContributionId={selectedContributionForPayment}
      />

      <CreateContributionModal
        isOpen={isCreateContributionOpen}
        onClose={() => setIsCreateContributionOpen(false)}
      />

      <CreateExpenseModal
        isOpen={isCreateExpenseOpen}
        onClose={() => setIsCreateExpenseOpen(false)}
      />

      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
      />

      <CreateOrganizationModal
        isOpen={isCreateOrgOpen}
        onClose={() => setIsCreateOrgOpen(false)}
      />
    </div>
  );
};
