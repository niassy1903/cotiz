export type PaymentMethod = 'wave' | 'orange_money' | 'cash';
export type PaymentStatus = 'pending' | 'validated' | 'rejected' | 'cancelled';

export interface Payment {
  id: string;
  orgId: string;
  contributionId: string;
  contributionTitle: string;
  cycleId?: string;
  memberId: string;
  memberName: string;
  memberPhone?: string;
  amount: number;
  method: PaymentMethod;
  transactionId: string;
  status: PaymentStatus;
  notes?: string;
  rejectReason?: string;
  paymentDate: string;
  validatedAt?: string;
  validatedBy?: string;
}
