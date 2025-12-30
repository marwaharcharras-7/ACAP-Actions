export type UserRole = 'operator' | 'team_leader' | 'supervisor' | 'manager' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  cvUrl?: string;
  dateOfBirth?: string;
  hireDate?: string;
  skills?: string[];
  serviceId?: string;
  lineId?: string;
  teamId?: string;
  postId?: string;
  factoryId?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export type ActionStatus = 'identified' | 'planned' | 'in_progress' | 'completed' | 'late' | 'validated' | 'archived';
export type ActionType = 'corrective' | 'preventive';
export type UrgencyLevel = 'low' | 'medium' | 'high';
export type Category5M = 'main_oeuvre' | 'matiere' | 'methode' | 'milieu' | 'machine';

export interface Action {
  id: string;
  title: string;
  description: string;
  problem: string;
  rootCause?: string;
  type: ActionType;
  status: ActionStatus;
  urgency: UrgencyLevel;
  category5M?: Category5M;
  pilotId: string;
  pilotName: string;
  createdById: string;
  createdByName: string;
  serviceId?: string;
  serviceName?: string;
  lineId?: string;
  lineName?: string;
  teamId?: string;
  teamName?: string;
  postId?: string;
  postName?: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  validatedAt?: string;
  progressPercent: number;
  efficiencyPercent?: number;
  isEffective?: boolean;
  comments?: string;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  path: string; // Storage path for signed URL generation
  uploadedAt: string;
  uploadedById: string;
  uploadedByName?: string;
}

export interface Service {
  id: string;
  name: string;
  responsibleId?: string;
  responsibleName?: string;
}

export interface Line {
  id: string;
  name: string;
  serviceId: string;
  serviceName: string;
  teamLeaderId?: string;
  teamLeaderName?: string;
}

export interface Team {
  id: string;
  name: string;
  lineId: string;
  lineName: string;
  leaderId?: string;
  leaderName?: string;
}

export interface Post {
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  lineId: string;
  lineName: string;
}

export interface Factory {
  id: string;
  name: string;
}

export interface DashboardStats {
  totalActions: number;
  identified: number;
  planned: number;
  inProgress: number;
  completed: number;
  late: number;
  validated: number;
  archived: number;
  onTimeRate: number;
  avgEfficiency: number;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface Permission {
  id: string;
  label: string;
  granted: boolean;
}

export const STATUS_LABELS: Record<ActionStatus, string> = {
  identified: 'Identifiée',
  planned: 'Prévue',
  in_progress: 'En cours',
  completed: 'Finalisée',
  late: 'En retard',
  validated: 'Validée',
  archived: 'Archivée',
};

export const TYPE_LABELS: Record<ActionType, string> = {
  corrective: 'Corrective',
  preventive: 'Préventive',
};

export const URGENCY_LABELS: Record<UrgencyLevel, string> = {
  low: 'Faible',
  medium: 'Moyen',
  high: 'Élevé',
};

export const CATEGORY_5M_LABELS: Record<Category5M, string> = {
  main_oeuvre: 'Main d\'œuvre',
  matiere: 'Matière',
  methode: 'Méthode',
  milieu: 'Milieu',
  machine: 'Machine',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  operator: 'Opérateur',
  team_leader: 'Chef d\'équipe',
  supervisor: 'Superviseur',
  manager: 'Manager',
  admin: 'Administrateur',
};

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  operator: [
    { id: 'view_actions', label: 'Voir les actions', granted: true },
    { id: 'view_calendar', label: 'Voir le calendrier', granted: true },
    { id: 'view_dashboard', label: 'Voir le tableau de bord', granted: true },
    { id: 'create_actions', label: 'Créer des actions', granted: false },
    { id: 'edit_actions', label: 'Modifier des actions', granted: false },
    { id: 'validate_actions', label: 'Valider des actions', granted: false },
    { id: 'manage_users', label: 'Gérer les utilisateurs', granted: false },
  ],
  team_leader: [
    { id: 'view_actions', label: 'Voir les actions', granted: true },
    { id: 'view_calendar', label: 'Voir le calendrier', granted: true },
    { id: 'view_dashboard', label: 'Voir le tableau de bord', granted: true },
    { id: 'create_actions', label: 'Créer des actions', granted: true },
    { id: 'edit_actions', label: 'Modifier des actions (périmètre)', granted: true },
    { id: 'validate_actions', label: 'Valider des actions', granted: false },
    { id: 'manage_users', label: 'Gérer les utilisateurs', granted: false },
  ],
  supervisor: [
    { id: 'view_actions', label: 'Voir les actions', granted: true },
    { id: 'view_calendar', label: 'Voir le calendrier', granted: true },
    { id: 'view_dashboard', label: 'Voir le tableau de bord', granted: true },
    { id: 'create_actions', label: 'Créer des actions', granted: true },
    { id: 'edit_actions', label: 'Modifier des actions (zone)', granted: true },
    { id: 'validate_actions', label: 'Valider des actions', granted: true },
    { id: 'manage_users', label: 'Gérer les utilisateurs', granted: false },
  ],
  manager: [
    { id: 'view_actions', label: 'Voir les actions', granted: true },
    { id: 'view_calendar', label: 'Voir le calendrier', granted: true },
    { id: 'view_dashboard', label: 'Voir le tableau de bord', granted: true },
    { id: 'create_actions', label: 'Créer des actions', granted: true },
    { id: 'edit_actions', label: 'Modifier des actions (service)', granted: true },
    { id: 'validate_actions', label: 'Valider des actions', granted: true },
    { id: 'manage_users', label: 'Gérer les utilisateurs (service)', granted: true },
  ],
  admin: [
    { id: 'view_actions', label: 'Voir les actions', granted: true },
    { id: 'view_calendar', label: 'Voir le calendrier', granted: false },
    { id: 'view_dashboard', label: 'Voir le tableau de bord', granted: true },
    { id: 'create_actions', label: 'Créer des actions', granted: true },
    { id: 'edit_actions', label: 'Modifier toutes les actions', granted: true },
    { id: 'validate_actions', label: 'Valider des actions', granted: true },
    { id: 'manage_users', label: 'Gérer tous les utilisateurs', granted: true },
    { id: 'manage_organization', label: 'Gérer l\'organisation', granted: true },
    { id: 'manage_roles', label: 'Gérer les rôles', granted: true },
    { id: 'manage_settings', label: 'Gérer les paramètres', granted: true },
  ],
};
