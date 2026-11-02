import { Gender } from './auth';

export type MemberRole = 'admin' | 'member';
export type MemberStatus = 'active' | 'pending' | 'archived';

export interface Member {
  id: string;
  userId?: string; // If registered Cotiz user
  orgId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  gender: Gender;
  role: MemberRole;
  status: MemberStatus;
  isGhost: boolean; // Ghost member added without an active app account
  hasTransactionAccess: boolean; // Delegated financial visibility by admin
  joinDate: string;
  avatar?: string;
}
