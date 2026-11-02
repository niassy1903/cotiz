export type OrganizationType = 'dahira' | 'tontine' | 'association';
export type SubscriptionTier = 'free' | 'basic' | 'premium';

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  description?: string;
  logoUrl?: string;
  location: string;
  memberEstimate: number;
  adminId: string;
  adminName: string;
  waveNumber: string;
  orangeMoneyNumber: string;
  subscriptionPlan: SubscriptionTier;
  subscriptionRenewalDate: string;
  status: 'active' | 'suspended' | 'pending_deletion';
  deletionScheduledAt?: string;
  createdAt: string;
}
