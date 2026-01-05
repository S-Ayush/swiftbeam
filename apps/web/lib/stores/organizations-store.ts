import { create } from 'zustand';
import {
  organizationsAPI,
  OrganizationWithRole,
  OrganizationDetails,
  OrganizationMember,
  Invite,
  InviteInfo,
} from '@/lib/api/organizations';

interface OrganizationsState {
  organizations: OrganizationWithRole[];
  currentOrg: OrganizationDetails | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchOrganizations: () => Promise<void>;
  createOrganization: (name: string) => Promise<OrganizationDetails>;
  fetchOrganization: (id: string) => Promise<void>;
  updateOrganization: (id: string, name: string) => Promise<void>;
  deleteOrganization: (id: string) => Promise<void>;
  leaveOrganization: (id: string) => Promise<void>;
  removeMember: (orgId: string, memberId: string) => Promise<void>;
  createInvite: (orgId: string) => Promise<Invite>;
  clearCurrentOrg: () => void;
  clearError: () => void;
}

export const useOrganizationsStore = create<OrganizationsState>((set, get) => ({
  organizations: [],
  currentOrg: null,
  isLoading: false,
  error: null,

  fetchOrganizations: async () => {
    set({ isLoading: true, error: null });
    try {
      const { organizations } = await organizationsAPI.list();
      set({ organizations, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch organizations',
        isLoading: false,
      });
    }
  },

  createOrganization: async (name: string) => {
    set({ isLoading: true, error: null });
    try {
      const { organization } = await organizationsAPI.create(name);
      // Fetch the full org details
      const { organization: fullOrg } = await organizationsAPI.get(organization.id);
      // Refresh the list
      await get().fetchOrganizations();
      set({ isLoading: false });
      return fullOrg;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create organization',
        isLoading: false,
      });
      throw error;
    }
  },

  fetchOrganization: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { organization } = await organizationsAPI.get(id);
      set({ currentOrg: organization, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch organization',
        isLoading: false,
      });
    }
  },

  updateOrganization: async (id: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      await organizationsAPI.update(id, name);
      // Refresh current org and list
      await Promise.all([get().fetchOrganization(id), get().fetchOrganizations()]);
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update organization',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteOrganization: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await organizationsAPI.delete(id);
      set({ currentOrg: null });
      await get().fetchOrganizations();
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete organization',
        isLoading: false,
      });
      throw error;
    }
  },

  leaveOrganization: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await organizationsAPI.leave(id);
      set({ currentOrg: null });
      await get().fetchOrganizations();
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to leave organization',
        isLoading: false,
      });
      throw error;
    }
  },

  removeMember: async (orgId: string, memberId: string) => {
    set({ isLoading: true, error: null });
    try {
      await organizationsAPI.removeMember(orgId, memberId);
      // Refresh current org
      await get().fetchOrganization(orgId);
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to remove member',
        isLoading: false,
      });
      throw error;
    }
  },

  createInvite: async (orgId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { invite } = await organizationsAPI.createInvite(orgId);
      set({ isLoading: false });
      return invite;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create invite',
        isLoading: false,
      });
      throw error;
    }
  },

  clearCurrentOrg: () => set({ currentOrg: null }),
  clearError: () => set({ error: null }),
}));
