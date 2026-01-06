import { Router, type IRouter } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../utils/prisma';
import { authMiddleware } from '../middleware/auth';
import type { OrganizationMember, Organization, Invite, User, InviteAccept } from '@prisma/client';

const router: IRouter = Router();

// Validation schemas
const createOrgSchema = z.object({
  name: z.string().min(3).max(50),
});

const createInviteSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
  label: z.string().max(100).optional(),
  maxUses: z.number().int().min(1).max(1000).optional(), // null = unlimited
  expiresInDays: z.number().int().min(1).max(30).default(7),
});

// ==========================================
// PUBLIC ROUTES (no auth required)
// These must come BEFORE dynamic :id routes
// ==========================================

// Get invite info (no auth required)
router.get('/invites/:token', async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'No token provided' });
    }

    const invite = await prisma.invite.findUnique({
      where: { token },
      include: {
        organization: {
          select: { id: true, name: true },
          },
        creator: {
          select: { name: true },
        },
      },
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (invite.revoked) {
      return res.status(400).json({ error: 'This invite has been revoked' });
    }

    if (new Date() > invite.expiresAt) {
      return res.status(400).json({ error: 'Invite has expired' });
    }

    // Check if max uses reached (for multi-use invites)
    if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
      return res.status(400).json({ error: 'This invite has reached its maximum uses' });
    }

    res.json({
      invite: {
        organization: invite.organization,
        invitedBy: invite.creator.name,
        role: invite.role,
        expiresAt: invite.expiresAt,
        // Show remaining uses for multi-use invites
        remainingUses: invite.maxUses !== null ? invite.maxUses - invite.useCount : null,
      },
    });
  } catch (error) {
    console.error('Get invite error:', error);
    res.status(500).json({ error: 'Failed to get invite' });
  }
});

// ==========================================
// PROTECTED ROUTES (auth required)
// ==========================================

// Apply auth middleware to all routes below
router.use(authMiddleware);

// Accept invite (requires auth)
router.post('/invites/:token/accept', async (req, res) => {
  try {
    const { token } = req.params;
    const userId = req.userId!;

    const invite = await prisma.invite.findUnique({
      where: { token },
      include: {
        organization: true,
      },
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    if (invite.revoked) {
      return res.status(400).json({ error: 'This invite has been revoked' });
    }

    if (new Date() > invite.expiresAt) {
      return res.status(400).json({ error: 'Invite has expired' });
    }

    // Check if max uses reached (for multi-use invites)
    if (invite.maxUses !== null && invite.useCount >= invite.maxUses) {
      return res.status(400).json({ error: 'This invite has reached its maximum uses' });
    }

    // Check if already a member
    const existingMembership = await prisma.organizationMember.findUnique({
      where: {
        orgId_userId: { orgId: invite.orgId, userId },
      },
    });

    if (existingMembership) {
      return res.status(400).json({ error: 'Already a member of this organization' });
    }

    // Create membership, track acceptance, and update use count
    await prisma.$transaction([
      // Create membership with the role specified in the invite
      prisma.organizationMember.create({
        data: {
          orgId: invite.orgId,
          userId,
          role: invite.role,
        },
      }),
      // Track who accepted this invite
      prisma.inviteAccept.create({
        data: {
          inviteId: invite.id,
          userId,
        },
      }),
      // Update invite use count
      prisma.invite.update({
        where: { id: invite.id },
        data: {
          useCount: { increment: 1 },
          // For backward compatibility, also set used/usedBy on first use
          ...(invite.useCount === 0 ? { used: true, usedBy: userId } : {}),
        },
      }),
    ]);

    res.json({
      message: 'Successfully joined organization',
      organization: {
        id: invite.organization.id,
        name: invite.organization.name,
      },
      role: invite.role,
    });
  } catch (error) {
    console.error('Accept invite error:', error);
    res.status(500).json({ error: 'Failed to accept invite' });
  }
});

// Create organization
router.post('/', async (req, res) => {
  try {
    const { name } = createOrgSchema.parse(req.body);
    const userId = req.userId!;

    // Create organization with user as admin
    const org = await prisma.organization.create({
      data: {
        name,
        createdBy: userId,
        members: {
          create: {
            userId,
            role: 'ADMIN',
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    res.status(201).json({ organization: org });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create org error:', error);
    res.status(500).json({ error: 'Failed to create organization' });
  }
});

// List user's organizations
router.get('/', async (req, res) => {
  try {
    const userId = req.userId!;

    const memberships = await prisma.organizationMember.findMany({
      where: { userId },
      include: {
        organization: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    });

    const organizations = memberships.map((m: OrganizationMember & { organization: Organization & { _count: { members: number } } }) => ({
      id: m.organization.id,
      name: m.organization.name,
      role: m.role,
      memberCount: m.organization._count.members,
      joinedAt: m.joinedAt,
    }));

    res.json({ organizations });
  } catch (error) {
    console.error('List orgs error:', error);
    res.status(500).json({ error: 'Failed to list organizations' });
  }
});

// ==========================================
// DYNAMIC :id ROUTES (must come last)
// ==========================================

// Get organization details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Check if user is a member
    const membership = await prisma.organizationMember.findUnique({
      where: {
        orgId_userId: { orgId: id, userId },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this organization' });
    }

    const org = await prisma.organization.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json({
      organization: {
        ...org,
        currentUserRole: membership.role,
      },
    });
  } catch (error) {
    console.error('Get org error:', error);
    res.status(500).json({ error: 'Failed to get organization' });
  }
});

// Update organization (admin only)
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { name } = createOrgSchema.parse(req.body);

    // Check if user is admin
    const membership = await prisma.organizationMember.findUnique({
      where: {
        orgId_userId: { orgId: id, userId },
      },
    });

    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can update the organization' });
    }

    const org = await prisma.organization.update({
      where: { id },
      data: { name },
    });

    res.json({ organization: org });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Update org error:', error);
    res.status(500).json({ error: 'Failed to update organization' });
  }
});

// Delete organization (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Check if user is admin
    const membership = await prisma.organizationMember.findUnique({
      where: {
        orgId_userId: { orgId: id, userId },
      },
    });

    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can delete the organization' });
    }

    await prisma.organization.delete({
      where: { id },
    });

    res.json({ message: 'Organization deleted' });
  } catch (error) {
    console.error('Delete org error:', error);
    res.status(500).json({ error: 'Failed to delete organization' });
  }
});

// Get organization members
router.get('/:id/members', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Check if user is a member
    const membership = await prisma.organizationMember.findUnique({
      where: {
        orgId_userId: { orgId: id, userId },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this organization' });
    }

    const members = await prisma.organizationMember.findMany({
      where: { orgId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    res.json({ members });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Failed to get members' });
  }
});

// Remove member (admin only)
router.delete('/:id/members/:memberId', async (req, res) => {
  try {
    const { id, memberId } = req.params;
    const userId = req.userId!;

    // Check if user is admin
    const membership = await prisma.organizationMember.findUnique({
      where: {
        orgId_userId: { orgId: id, userId },
      },
    });

    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can remove members' });
    }

    // Can't remove yourself
    if (memberId === userId) {
      return res.status(400).json({ error: 'Cannot remove yourself' });
    }

    await prisma.organizationMember.delete({
      where: {
        orgId_userId: { orgId: id, userId: memberId },
      },
    });

    res.json({ message: 'Member removed' });
  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

// Create invite link
router.post('/:id/invites', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Check if user is admin
    const membership = await prisma.organizationMember.findUnique({
      where: {
        orgId_userId: { orgId: id, userId },
      },
    });

    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can create invites' });
    }

    // Parse and validate input
    const { role, label, maxUses, expiresInDays } = createInviteSchema.parse(req.body || {});

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const invite = await prisma.invite.create({
      data: {
        orgId: id,
        token,
        createdBy: userId,
        expiresAt,
        role,
        label,
        maxUses,
      },
    });

    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${token}`;

    res.status(201).json({
      invite: {
        id: invite.id,
        token: invite.token,
        role: invite.role,
        label: invite.label,
        maxUses: invite.maxUses,
        useCount: invite.useCount,
        expiresAt: invite.expiresAt,
        url: inviteUrl,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create invite error:', error);
    res.status(500).json({ error: 'Failed to create invite' });
  }
});

// List organization invites (admin only)
router.get('/:id/invites', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Check if user is admin
    const membership = await prisma.organizationMember.findUnique({
      where: {
        orgId_userId: { orgId: id, userId },
      },
    });

    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can view invites' });
    }

    const invites = await prisma.invite.findMany({
      where: { orgId: id },
      include: {
        creator: {
          select: { id: true, name: true },
        },
        acceptedBy: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { acceptedAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    type InviteWithRelations = Invite & {
      creator: { id: string; name: string };
      acceptedBy: (InviteAccept & { user: { id: string; name: string; email: string } })[];
    };

    res.json({
      invites: invites.map((invite: InviteWithRelations) => ({
        id: invite.id,
        token: invite.token,
        role: invite.role,
        label: invite.label,
        maxUses: invite.maxUses,
        useCount: invite.useCount,
        revoked: invite.revoked,
        expiresAt: invite.expiresAt,
        createdAt: invite.createdAt,
        createdBy: invite.creator,
        url: `${frontendUrl}/invite/${invite.token}`,
        isExpired: new Date() > invite.expiresAt,
        isExhausted: invite.maxUses !== null && invite.useCount >= invite.maxUses,
        acceptedBy: invite.acceptedBy.map((a: InviteWithRelations['acceptedBy'][number]) => ({
          user: a.user,
          acceptedAt: a.acceptedAt,
        })),
      })),
    });
  } catch (error) {
    console.error('List invites error:', error);
    res.status(500).json({ error: 'Failed to list invites' });
  }
});

// Revoke invite (admin only)
router.post('/:id/invites/:inviteId/revoke', async (req, res) => {
  try {
    const { id, inviteId } = req.params;
    const userId = req.userId!;

    // Check if user is admin
    const membership = await prisma.organizationMember.findUnique({
      where: {
        orgId_userId: { orgId: id, userId },
      },
    });

    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can revoke invites' });
    }

    const invite = await prisma.invite.findFirst({
      where: { id: inviteId, orgId: id },
    });

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' });
    }

    await prisma.invite.update({
      where: { id: inviteId },
      data: {
        revoked: true,
        revokedAt: new Date(),
      },
    });

    res.json({ message: 'Invite revoked' });
  } catch (error) {
    console.error('Revoke invite error:', error);
    res.status(500).json({ error: 'Failed to revoke invite' });
  }
});

// Delete invite permanently (admin only)
router.delete('/:id/invites/:inviteId', async (req, res) => {
  try {
    const { id, inviteId } = req.params;
    const userId = req.userId!;

    // Check if user is admin
    const membership = await prisma.organizationMember.findUnique({
      where: {
        orgId_userId: { orgId: id, userId },
      },
    });

    if (!membership || membership.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can delete invites' });
    }

    await prisma.invite.delete({
      where: { id: inviteId, orgId: id },
    });

    res.json({ message: 'Invite deleted' });
  } catch (error) {
    console.error('Delete invite error:', error);
    res.status(500).json({ error: 'Failed to delete invite' });
  }
});

// Leave organization
router.post('/:id/leave', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const membership = await prisma.organizationMember.findUnique({
      where: {
        orgId_userId: { orgId: id, userId },
      },
    });

    if (!membership) {
      return res.status(404).json({ error: 'Not a member of this organization' });
    }

    // Check if user is the only admin
    if (membership.role === 'ADMIN') {
      const adminCount = await prisma.organizationMember.count({
        where: { orgId: id, role: 'ADMIN' },
      });

      if (adminCount === 1) {
        return res.status(400).json({
          error: 'Cannot leave - you are the only admin. Delete the organization or promote another admin first.',
        });
      }
    }

    await prisma.organizationMember.delete({
      where: {
        orgId_userId: { orgId: id, userId },
      },
    });

    res.json({ message: 'Left organization' });
  } catch (error) {
    console.error('Leave org error:', error);
    res.status(500).json({ error: 'Failed to leave organization' });
  }
});

export default router;
