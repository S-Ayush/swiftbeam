import { authAPI, User } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  orgId: string;
  userId: string;
  role: 'ADMIN' | 'MEMBER';
  joinedAt: string;
  user: Pick<User, 'id' | 'name' | 'email'>;
}

export interface OrganizationWithRole {
  id: string;
  name: string;
  role: 'ADMIN' | 'MEMBER';
  memberCount: number;
  joinedAt: string;
}

export interface OrganizationDetails extends Organization {
  members: OrganizationMember[];
  creator: Pick<User, 'id' | 'name' | 'email'>;
  currentUserRole: 'ADMIN' | 'MEMBER';
}

export interface CreateInviteOptions {
  role?: 'ADMIN' | 'MEMBER';
  label?: string;
  maxUses?: number;
  expiresInDays?: number;
}

export interface Invite {
  id: string;
  token: string;
  role: 'ADMIN' | 'MEMBER';
  label: string | null;
  maxUses: number | null;
  useCount: number;
  expiresAt: string;
  url: string;
}

export interface InviteWithDetails extends Invite {
  revoked: boolean;
  createdAt: string;
  createdBy: { id: string; name: string };
  isExpired: boolean;
  isExhausted: boolean;
  acceptedBy: Array<{
    user: Pick<User, 'id' | 'name' | 'email'>;
    acceptedAt: string;
  }>;
}

export interface InviteInfo {
  organization: Pick<Organization, 'id' | 'name'>;
  invitedBy: string;
  role: 'ADMIN' | 'MEMBER';
  expiresAt: string;
  remainingUses: number | null;
}

class OrganizationsAPI {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const token = authAPI.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Organization CRUD
  async create(name: string): Promise<{ organization: Organization }> {
    return this.request('/api/orgs', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async list(): Promise<{ organizations: OrganizationWithRole[] }> {
    return this.request('/api/orgs');
  }

  async get(id: string): Promise<{ organization: OrganizationDetails }> {
    return this.request(`/api/orgs/${id}`);
  }

  async update(id: string, name: string): Promise<{ organization: Organization }> {
    return this.request(`/api/orgs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  }

  async delete(id: string): Promise<{ message: string }> {
    return this.request(`/api/orgs/${id}`, {
      method: 'DELETE',
    });
  }

  // Members
  async getMembers(orgId: string): Promise<{ members: OrganizationMember[] }> {
    return this.request(`/api/orgs/${orgId}/members`);
  }

  async removeMember(orgId: string, memberId: string): Promise<{ message: string }> {
    return this.request(`/api/orgs/${orgId}/members/${memberId}`, {
      method: 'DELETE',
    });
  }

  async leave(orgId: string): Promise<{ message: string }> {
    return this.request(`/api/orgs/${orgId}/leave`, {
      method: 'POST',
    });
  }

  // Invites
  async createInvite(orgId: string, options?: CreateInviteOptions): Promise<{ invite: Invite }> {
    return this.request(`/api/orgs/${orgId}/invites`, {
      method: 'POST',
      body: JSON.stringify(options || {}),
    });
  }

  async listInvites(orgId: string): Promise<{ invites: InviteWithDetails[] }> {
    return this.request(`/api/orgs/${orgId}/invites`);
  }

  async revokeInvite(orgId: string, inviteId: string): Promise<{ message: string }> {
    return this.request(`/api/orgs/${orgId}/invites/${inviteId}/revoke`, {
      method: 'POST',
    });
  }

  async deleteInvite(orgId: string, inviteId: string): Promise<{ message: string }> {
    return this.request(`/api/orgs/${orgId}/invites/${inviteId}`, {
      method: 'DELETE',
    });
  }

  async getInviteInfo(token: string): Promise<{ invite: InviteInfo }> {
    return this.request(`/api/orgs/invites/${token}`);
  }

  async acceptInvite(token: string): Promise<{ message: string; organization: Pick<Organization, 'id' | 'name'>; role: string }> {
    return this.request(`/api/orgs/invites/${token}/accept`, {
      method: 'POST',
    });
  }
}

export const organizationsAPI = new OrganizationsAPI();
