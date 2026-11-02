export type UserRole = 'admin' | 'member' | 'superadmin';
export type Gender = 'M' | 'F';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: Gender;
  avatar?: string;
  role: UserRole;
  currentOrgId: string;
  accessibleOrgIds: string[];
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
