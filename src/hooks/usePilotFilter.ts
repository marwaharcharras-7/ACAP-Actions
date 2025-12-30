import { useMemo } from 'react';
import { User, UserRole } from '@/types';

// Role hierarchy levels (higher number = higher authority)
const ROLE_HIERARCHY: Record<UserRole, number> = {
  operator: 1,
  team_leader: 2,
  supervisor: 3,
  manager: 4,
  admin: 5,
};

interface PilotFilterParams {
  users: User[];
  currentUserRole: UserRole | undefined;
  serviceId: string;
  lineId: string;
  teamId: string;
  postId: string;
}

/**
 * Filters pilots based on:
 * 1. Location scope (service/line/team/post)
 * 2. Role hierarchy (user can only assign pilots of equal or lower role level)
 * 
 * Hierarchy: operator < team_leader < supervisor < manager < admin
 * - Team leader can assign: operators, team leaders
 * - Supervisor can assign: operators, team leaders, supervisors
 * - Manager can assign: operators, team leaders, supervisors, managers
 * - Admin can assign: anyone
 */
export const usePilotFilter = ({
  users,
  currentUserRole,
  serviceId,
  lineId,
  teamId,
  postId,
}: PilotFilterParams): User[] => {
  return useMemo(() => {
    if (!currentUserRole) return [];

    const currentRoleLevel = ROLE_HIERARCHY[currentUserRole] || 0;

    // Filter users by location scope and role hierarchy
    return users.filter((u) => {
      if (!u.isActive) return false;

      // 1. Check role hierarchy - can only assign pilots of equal or lower level
      const userRoleLevel = ROLE_HIERARCHY[u.role] || 0;
      if (userRoleLevel > currentRoleLevel && currentUserRole !== 'admin') {
        return false;
      }

      // 2. Check location scope based on user's role
      // Each role has a specific scope to check
      switch (u.role) {
        case 'operator':
          // Operator must be in the selected post/team/line/service
          if (postId && u.postId !== postId) return false;
          if (!postId && teamId && u.teamId !== teamId) return false;
          if (!postId && !teamId && lineId && u.lineId !== lineId) return false;
          if (!postId && !teamId && !lineId && serviceId && u.serviceId !== serviceId) return false;
          break;

        case 'team_leader':
          // Team leader must be assigned to the selected team/line/service
          if (teamId && u.teamId !== teamId) return false;
          if (!teamId && lineId && u.lineId !== lineId) return false;
          if (!teamId && !lineId && serviceId && u.serviceId !== serviceId) return false;
          break;

        case 'supervisor':
          // Supervisor must be assigned to the selected line/service
          if (lineId && u.lineId !== lineId) return false;
          if (!lineId && serviceId && u.serviceId !== serviceId) return false;
          break;

        case 'manager':
          // Manager must be assigned to the selected service
          if (serviceId && u.serviceId !== serviceId) return false;
          break;

        case 'admin':
          // Admin can be assigned regardless of scope
          break;
      }

      return true;
    });
  }, [users, currentUserRole, serviceId, lineId, teamId, postId]);
};

/**
 * Get role label in French with hierarchy indication
 */
export const getRoleLabel = (role: UserRole): string => {
  const labels: Record<UserRole, string> = {
    operator: 'Opérateur',
    team_leader: 'Chef d\'équipe',
    supervisor: 'Superviseur',
    manager: 'Manager',
    admin: 'Administrateur',
  };
  return labels[role] || role;
};
