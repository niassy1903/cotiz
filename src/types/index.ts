export type NotificationType = 'payment' | 'contribution' | 'member' | 'expense' | 'system';

export interface AppNotification {
  id: string;
  orgId: string;
  targetUserId?: string; // If specific to a user or all
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  date: string;
  linkAction?: string;
}

export interface AuditLog {
  id: string;
  orgId: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  resourceType: 'payment' | 'expense' | 'contribution' | 'member' | 'organization';
  resourceId: string;
  timestamp: string;
  canUndoUntil?: string; // Within 1 hour
  isUndone?: boolean;
}

export interface SubscriptionPlanInfo {
  tier: 'free' | 'basic' | 'premium';
  name: string;
  priceMonthly: number;
  priceYearly: number;
  maxMembers: number | 'Illimité';
  features: string[];
  recommended?: boolean;
}

export interface ReferralData {
  code: string;
  creatorName: string;
  totalUses: number;
  totalCommission: number;
  paidCommission: number;
  pendingCommission: number;
  convertedOrgs: Array<{
    orgName: string;
    date: string;
    plan: string;
    commissionAmount: number;
  }>;
  payouts: Array<{
    id: string;
    date: string;
    amount: number;
    status: 'paid' | 'pending';
    method: 'Wave';
    waveNumber: string;
  }>;
}
