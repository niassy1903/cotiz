import { User } from '../types/auth';
import { Organization } from '../types/organization';
import { Member } from '../types/member';
import { Contribution, ContributionCycle } from '../types/contribution';
import { Payment } from '../types/payment';
import { Expense } from '../types/expense';
import { AppNotification, AuditLog } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').replace(/\/+$/, '');
export const AUTH_TOKEN_KEY = 'cotiz_api_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function toClient(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toClient);
  if (!value || typeof value !== 'object') return value;

  const result: Record<string, unknown> = {};
  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
    const alias: Record<string, string> = {
      organizationId: 'orgId',
      createdBy: 'createdByAdminId',
    };
    const normalized = toClient(nestedValue);
    result[alias[camelKey] || camelKey] =
      (camelKey === 'id' || camelKey.endsWith('Id')) && typeof normalized === 'number'
        ? String(normalized)
        : camelKey.endsWith('Ids') && Array.isArray(normalized)
          ? normalized.map(String)
        : normalized;
  }

  return result;
}

function toServer(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toServer);
  if (!value || typeof value !== 'object') return value;

  const aliases: Record<string, string> = {
    orgId: 'organization_id',
    memberId: 'member_id',
    currentOrgId: 'current_org_id',
    accessibleOrgIds: 'accessible_org_ids',
    targetMemberIds: 'target_member_ids',
    createdByAdminId: 'created_by_admin_id',
  };
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
      aliases[key] || key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`),
      toServer(nestedValue),
    ]),
  );
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError('Impossible de joindre le serveur Cotiz. Vérifiez que l’API Laravel est démarrée.', 0);
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload.message === 'string' ? payload.message : `Erreur API (${response.status}).`;
    throw new ApiError(message, response.status, payload.errors);
  }

  const data = Object.prototype.hasOwnProperty.call(payload, 'data') ? payload.data : payload;
  return toClient(data) as T;
}

const json = (method: string, body?: unknown): RequestInit => ({
  method,
  ...(body === undefined ? {} : { body: JSON.stringify(toServer(body)) }),
});

const organizationPath = (orgId: string) => `/organizations/${encodeURIComponent(orgId)}`;

export interface BootstrapData {
  user: User;
  organizations: Organization[];
  currentOrgId: string;
  members: Member[];
  contributions: Contribution[];
  cycles: ContributionCycle[];
  payments: Payment[];
  expenses: Expense[];
  notifications: AppNotification[];
  auditLogs: AuditLog[];
}

export interface LoginChallenge {
  challenge: string;
  expiresAt: string;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<LoginChallenge>('/auth/login', json('POST', { email, password })),
    verifyLoginOtp: (challenge: string, code: string) =>
      request<{ token: string; user: User }>('/auth/login/verify', json('POST', { challenge, code })),
    resendLoginOtp: (challenge: string) =>
      request<LoginChallenge>('/auth/login/resend', json('POST', { challenge })),
    register: (data: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      gender: string;
      password: string;
      passwordConfirmation: string;
      organizationName?: string;
      inviteToken?: string;
      referralCode?: string;
    }) => request<{ token: string; user: User }>('/auth/register', json('POST', data)),
    me: () => request<User>('/auth/me'),
    logout: () => request<{ message: string }>('/auth/logout', json('POST')),
    updateProfile: (data: Partial<User>) => request<User>('/auth/profile', json('PATCH', data)),
    forgotPassword: (email: string) =>
      request<{ message: string }>('/auth/forgot-password', json('POST', { email })),
    resetPassword: (email: string, token: string, password: string) =>
      request<{ message: string }>('/auth/reset-password', json('POST', {
        email,
        token,
        password,
        passwordConfirmation: password,
      })),
  },
  bootstrap: (organizationId?: string) =>
    request<BootstrapData>(`/bootstrap${organizationId ? `?organization_id=${encodeURIComponent(organizationId)}` : ''}`),
  organizations: {
    list: () => request<Organization[]>('/organizations'),
    create: (data: Partial<Organization>) => request<Organization>('/organizations', json('POST', data)),
    update: (id: string, data: Partial<Organization>) =>
      request<Organization>(`${organizationPath(id)}`, json('PATCH', data)),
    delete: (id: string) => request<Organization>(`${organizationPath(id)}`, json('DELETE')),
    restore: (id: string) => request<Organization>(`${organizationPath(id)}/restore`, json('POST')),
    updatePlan: (id: string, plan: string) =>
      request<Organization>(`${organizationPath(id)}/subscription`, json('PATCH', { subscriptionPlan: plan })),
    updateStatus: (id: string, status: string) =>
      request<Organization>(`/admin/organizations/${encodeURIComponent(id)}/status`, json('PATCH', { status })),
  },
  invitations: {
    create: (orgId: string) =>
      request<{ url: string; expiresAt: string }>(`${organizationPath(orgId)}/invitations`, json('POST')),
    preview: (token: string) =>
      request<{ organization: Pick<Organization, 'id' | 'name' | 'type'>; expiresAt: string }>(
        `/invitations/${encodeURIComponent(token)}`,
      ),
  },
  referrals: {
    show: () => request<import('../types').ReferralData>('/referrals'),
    rotate: () => request<import('../types').ReferralData>('/referrals/rotate', json('POST')),
  },
  members: {
    add: (orgId: string, data: Partial<Member>) =>
      request<Member>(`${organizationPath(orgId)}/members`, json('POST', data)),
    update: (orgId: string, id: string, data: Partial<Member>) =>
      request<Member>(`${organizationPath(orgId)}/members/${encodeURIComponent(id)}`, json('PATCH', data)),
    archive: (orgId: string, id: string) =>
      request<Member>(`${organizationPath(orgId)}/members/${encodeURIComponent(id)}`, json('DELETE')),
    accept: (orgId: string, id: string) =>
      request<Member>(`${organizationPath(orgId)}/members/${encodeURIComponent(id)}/accept`, json('POST')),
    reject: (orgId: string, id: string) =>
      request<{ message: string }>(`${organizationPath(orgId)}/members/${encodeURIComponent(id)}/reject`, json('POST')),
    toggleTransactionAccess: (orgId: string, id: string) =>
      request<Member>(
        `${organizationPath(orgId)}/members/${encodeURIComponent(id)}/transaction-access`,
        json('PATCH'),
      ),
    transferAdmin: (orgId: string, id: string) =>
      request<Member>(`${organizationPath(orgId)}/members/${encodeURIComponent(id)}/transfer-admin`, json('POST')),
  },
  contributions: {
    create: (orgId: string, data: Partial<Contribution>) =>
      request<Contribution>(`${organizationPath(orgId)}/contributions`, json('POST', data)),
    update: (orgId: string, id: string, data: Partial<Contribution>) =>
      request<Contribution>(`${organizationPath(orgId)}/contributions/${encodeURIComponent(id)}`, json('PATCH', data)),
    closeCycle: (orgId: string, id: string) =>
      request<ContributionCycle>(`${organizationPath(orgId)}/cycles/${encodeURIComponent(id)}/close`, json('POST')),
  },
  payments: {
    create: (orgId: string, data: Partial<Payment>) =>
      request<Payment>(`${organizationPath(orgId)}/payments`, json('POST', data)),
    validate: (orgId: string, id: string, notes?: string) =>
      request<Payment>(`${organizationPath(orgId)}/payments/${encodeURIComponent(id)}/validate`, json('POST', { notes })),
    reject: (orgId: string, id: string, reason: string) =>
      request<Payment>(`${organizationPath(orgId)}/payments/${encodeURIComponent(id)}/reject`, json('POST', { reason })),
    cancel: (orgId: string, id: string) =>
      request<Payment>(`${organizationPath(orgId)}/payments/${encodeURIComponent(id)}/cancel`, json('POST')),
  },
  expenses: {
    create: (orgId: string, data: Partial<Expense>) =>
      request<Expense>(`${organizationPath(orgId)}/expenses`, json('POST', data)),
    cancel: (orgId: string, id: string) =>
      request<Expense>(`${organizationPath(orgId)}/expenses/${encodeURIComponent(id)}/cancel`, json('POST')),
  },
  notifications: {
    markRead: (orgId: string, id: string) =>
      request<AppNotification>(`${organizationPath(orgId)}/notifications/${encodeURIComponent(id)}/read`, json('POST')),
    markAllRead: (orgId: string) =>
      request<{ message: string }>(`${organizationPath(orgId)}/notifications/read-all`, json('POST')),
  },
  audit: {
    undo: (orgId: string, id: string) =>
      request<AuditLog>(`${organizationPath(orgId)}/audit-logs/${encodeURIComponent(id)}/undo`, json('POST')),
  },
};

export function getApiErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Une erreur inattendue est survenue.';
}
