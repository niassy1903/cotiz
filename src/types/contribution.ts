export type ContributionFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual';
export type ContributionAmountType = 'fixed' | 'minimum';
export type ContributionTargetType = 'all' | 'custom' | 'by_gender';
export type ContributionStatus = 'active' | 'inactive' | 'archived';

export interface Contribution {
  id: string;
  orgId: string;
  title: string;
  amountType: ContributionAmountType;
  amount: number;
  amountFemale?: number; // In case targetType is 'by_gender'
  frequency: ContributionFrequency;
  dayOfMonth?: number;
  startDate: string;
  targetType: ContributionTargetType;
  targetMemberIds?: string[];
  status: ContributionStatus;
  createdAt: string;
}

export type CycleStatus = 'open' | 'closed';

export interface ContributionCycle {
  id: string;
  contributionId: string;
  contributionTitle: string;
  orgId: string;
  cycleNumber: number;
  periodLabel: string; // e.g. "Novembre 2026"
  dueDate: string;
  expectedAmount: number;
  totalCollected: number;
  status: CycleStatus;
}
