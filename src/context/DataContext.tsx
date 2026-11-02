import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Organization, SubscriptionTier } from '../types/organization';
import { Member, MemberRole } from '../types/member';
import { Contribution, ContributionCycle } from '../types/contribution';
import { Payment, PaymentMethod } from '../types/payment';
import { Expense, ExpenseCategory } from '../types/expense';
import { AppNotification, AuditLog } from '../types';
import { api, BootstrapData, getApiErrorMessage } from '../api/client';
import { useAuth } from './AuthContext';

type NewMember = {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  gender: 'M' | 'F';
  role: MemberRole;
  isGhost: boolean;
};

type NewPayment = {
  contributionId: string;
  cycleId?: string;
  memberId: string;
  amount: number;
  method: PaymentMethod;
  transactionId?: string;
  notes?: string;
};

type NewExpense = {
  amount: number;
  description: string;
  date: string;
  category: ExpenseCategory;
};

interface DataContextType {
  currentOrg: Organization;
  organizations: Organization[];
  setCurrentOrgId: (id: string) => void;
  createOrganization: (data: Omit<Organization, 'id' | 'createdAt' | 'status'>) => Promise<Organization | undefined>;
  updateOrganization: (id: string, updates: Partial<Organization>) => Promise<void>;
  deleteOrganization: (id: string) => Promise<void>;

  members: Member[];
  orgMembers: Member[];
  addMember: (data: NewMember) => Promise<Member | undefined>;
  updateMember: (id: string, updates: Partial<Member>) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  acceptPendingMember: (id: string) => Promise<void>;
  rejectPendingMember: (id: string) => Promise<void>;
  toggleTransactionAccess: (memberId: string) => Promise<void>;
  transferAdminRole: (newAdminMemberId: string) => Promise<void>;

  contributions: Contribution[];
  orgContributions: Contribution[];
  createContribution: (data: Omit<Contribution, 'id' | 'createdAt' | 'orgId'>) => Promise<Contribution | undefined>;
  updateContribution: (id: string, updates: Partial<Contribution>) => Promise<void>;
  cycles: ContributionCycle[];
  orgCycles: ContributionCycle[];
  closeCycle: (cycleId: string) => Promise<void>;

  payments: Payment[];
  orgPayments: Payment[];
  recordPayment: (data: NewPayment) => Promise<Payment | undefined>;
  validatePayment: (paymentId: string, notes?: string) => Promise<boolean>;
  rejectPayment: (paymentId: string, reason: string) => Promise<boolean>;
  cancelPayment: (paymentId: string) => Promise<boolean>;

  expenses: Expense[];
  orgExpenses: Expense[];
  createExpense: (data: NewExpense) => Promise<Expense | undefined>;
  cancelExpense: (expenseId: string) => Promise<boolean>;

  notifications: AppNotification[];
  markNotificationAsRead: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  auditLogs: AuditLog[];
  orgAuditLogs: AuditLog[];
  undoAuditAction: (logId: string) => Promise<boolean>;
  updateSubscriptionPlan: (orgId: string, plan: SubscriptionTier) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrgId, setCurrentOrgId] = useState(user?.currentOrgId ?? '');
  const [members, setMembers] = useState<Member[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [cycles, setCycles] = useState<ContributionCycle[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const applyBootstrap = useCallback((data: BootstrapData) => {
    setOrganizations(data.organizations);
    setCurrentOrgId(data.currentOrgId || data.organizations[0]?.id || '');
    setMembers(data.members);
    setContributions(data.contributions);
    setCycles(data.cycles);
    setPayments(data.payments);
    setExpenses(data.expenses);
    setNotifications(data.notifications);
    setAuditLogs(data.auditLogs);
  }, []);

  const refresh = useCallback(async (organizationId = currentOrgId): Promise<void> => {
    setLoading(true);
    try {
      const data = await api.bootstrap(organizationId || undefined);
      applyBootstrap(data);
      setApiError(null);
    } catch (error) {
      setApiError(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [applyBootstrap, currentOrgId]);

  useEffect(() => {
    if (user) void refresh(currentOrgId);
  }, [user?.id, currentOrgId, refresh]);

  const execute = useCallback(async <T,>(
    operation: () => Promise<T>,
    shouldRefresh = true,
  ): Promise<T | undefined> => {
    setApiError(null);
    try {
      const result = await operation();
      if (shouldRefresh) await refresh();
      return result;
    } catch (error) {
      setApiError(getApiErrorMessage(error));
      return undefined;
    }
  }, [refresh]);

  const organizationsById = useMemo(() => new Map(organizations.map(org => [org.id, org])), [organizations]);
  const currentOrg = organizationsById.get(currentOrgId);
  const orgMembers = useMemo(() => members.filter(member => member.orgId === currentOrgId), [members, currentOrgId]);
  const orgContributions = useMemo(() => contributions.filter(item => item.orgId === currentOrgId), [contributions, currentOrgId]);
  const orgCycles = useMemo(() => cycles.filter(item => item.orgId === currentOrgId), [cycles, currentOrgId]);
  const orgPayments = useMemo(() => payments.filter(item => item.orgId === currentOrgId), [payments, currentOrgId]);
  const orgExpenses = useMemo(() => expenses.filter(item => item.orgId === currentOrgId), [expenses, currentOrgId]);
  const orgAuditLogs = useMemo(() => auditLogs.filter(item => item.orgId === currentOrgId), [auditLogs, currentOrgId]);

  const createOrganization = async (data: Omit<Organization, 'id' | 'createdAt' | 'status'>) => {
    const organization = await execute(() => api.organizations.create(data), false);
    if (organization) {
      setCurrentOrgId(organization.id);
      await refresh(organization.id);
    }
    return organization;
  };
  const updateOrganization = async (id: string, updates: Partial<Organization>) => {
    if (updates.status === 'suspended' || updates.status === 'active') {
      await execute(() => api.organizations.updateStatus(id, updates.status!));
      return;
    }
    await execute(() => api.organizations.update(id, updates));
  };
  const deleteOrganization = async (id: string) => {
    await execute(() => api.organizations.delete(id));
  };

  const addMember = (data: NewMember) => execute(() => api.members.add(currentOrgId, data));
  const updateMember = async (id: string, updates: Partial<Member>) => {
    await execute(() => api.members.update(currentOrgId, id, updates));
  };
  const deleteMember = async (id: string) => {
    await execute(() => api.members.archive(currentOrgId, id));
  };
  const acceptPendingMember = async (id: string) => {
    await execute(() => api.members.accept(currentOrgId, id));
  };
  const rejectPendingMember = async (id: string) => {
    await execute(() => api.members.reject(currentOrgId, id));
  };
  const toggleTransactionAccess = async (id: string) => {
    await execute(() => api.members.toggleTransactionAccess(currentOrgId, id));
  };
  const transferAdminRole = async (id: string) => {
    await execute(() => api.members.transferAdmin(currentOrgId, id));
  };

  const createContribution = (data: Omit<Contribution, 'id' | 'createdAt' | 'orgId'>) =>
    execute(() => api.contributions.create(currentOrgId, data));
  const updateContribution = async (id: string, updates: Partial<Contribution>) => {
    await execute(() => api.contributions.update(currentOrgId, id, updates));
  };
  const closeCycle = async (id: string) => {
    await execute(() => api.contributions.closeCycle(currentOrgId, id));
  };

  const recordPayment = (data: NewPayment) =>
    execute(() => api.payments.create(currentOrgId, data));
  const validatePayment = async (id: string, notes?: string) =>
    Boolean(await execute(() => api.payments.validate(currentOrgId, id, notes)));
  const rejectPayment = async (id: string, reason: string) =>
    Boolean(await execute(() => api.payments.reject(currentOrgId, id, reason)));
  const cancelPayment = async (id: string) =>
    Boolean(await execute(() => api.payments.cancel(currentOrgId, id)));

  const createExpense = (data: NewExpense) => execute(() => api.expenses.create(currentOrgId, data));
  const cancelExpense = async (id: string) =>
    Boolean(await execute(() => api.expenses.cancel(currentOrgId, id)));

  const markNotificationAsRead = async (id: string) => {
    await execute(() => api.notifications.markRead(currentOrgId, id));
  };
  const clearAllNotifications = async () => {
    await execute(() => api.notifications.markAllRead(currentOrgId));
  };
  const undoAuditAction = async (id: string) =>
    Boolean(await execute(() => api.audit.undo(currentOrgId, id)));
  const updateSubscriptionPlan = async (orgId: string, plan: SubscriptionTier) => {
    await execute(() => api.organizations.updatePlan(orgId, plan));
  };

  if (!currentOrg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6 text-center">
        <p role={apiError ? 'alert' : undefined} className="max-w-lg text-sm text-slate-600">
          {apiError || (loading
            ? 'Chargement des données de votre organisation…'
            : 'Aucune organisation active n’est associée à ce compte. Contactez un administrateur.')}
        </p>
        {apiError && <button className="rounded-lg bg-emerald-800 px-4 py-2 text-sm text-white" onClick={() => void refresh()}>Réessayer</button>}
      </div>
    );
  }

  return (
    <DataContext.Provider
      value={{
        currentOrg,
        organizations,
        setCurrentOrgId,
        createOrganization,
        updateOrganization,
        deleteOrganization,
        members,
        orgMembers,
        addMember,
        updateMember,
        deleteMember,
        acceptPendingMember,
        rejectPendingMember,
        toggleTransactionAccess,
        transferAdminRole,
        contributions,
        orgContributions,
        createContribution,
        updateContribution,
        cycles,
        orgCycles,
        closeCycle,
        payments,
        orgPayments,
        recordPayment,
        validatePayment,
        rejectPayment,
        cancelPayment,
        expenses,
        orgExpenses,
        createExpense,
        cancelExpense,
        notifications,
        markNotificationAsRead,
        clearAllNotifications,
        auditLogs,
        orgAuditLogs,
        undoAuditAction,
        updateSubscriptionPlan,
      }}
    >
      {apiError && (
        <div role="alert" className="fixed bottom-4 right-4 z-[100] flex max-w-md items-center gap-3 rounded-xl border border-rose-200 bg-white p-3 text-xs text-rose-700 shadow-lg">
          <span>{apiError}</span>
          <button className="shrink-0 font-semibold underline" onClick={() => void refresh()}>Réessayer</button>
        </div>
      )}
      {children}
    </DataContext.Provider>
  );
};

export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
