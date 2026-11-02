export type ExpenseCategory = 'Nourriture' | 'Transport' | 'Santé' | 'Autres';
export type ExpenseStatus = 'active' | 'cancelled';

export interface Expense {
  id: string;
  orgId: string;
  amount: number;
  description: string;
  date: string;
  category: ExpenseCategory;
  createdByAdminId: string;
  createdByAdminName: string;
  status: ExpenseStatus;
  createdAt: string;
  cancelledAt?: string;
}
