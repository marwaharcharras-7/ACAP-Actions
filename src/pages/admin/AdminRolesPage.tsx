import React, { useState } from 'react';
import { ROLE_LABELS, UserRole } from '@/types';
import {
  Shield,
  Eye,
  Edit,
  Plus,
  Check,
  X,
  Calendar,
  BarChart3,
  FileText,
  Users,
  Trash2,
  Save,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface Permission {
  key: string;
  label: string;
  icon: React.ElementType;
}

const permissions: Permission[] = [
  { key: 'view_action', label: 'Voir les actions', icon: Eye },
  { key: 'edit_action', label: 'Modifier les actions', icon: Edit },
  { key: 'create_action', label: 'Créer des actions', icon: Plus },
  { key: 'validate_action', label: 'Valider les actions', icon: Check },
  { key: 'delete_action', label: 'Supprimer les actions', icon: Trash2 },
  { key: 'manage_files', label: 'Gérer les fichiers', icon: FileText },
  { key: 'manage_users', label: 'Gérer les utilisateurs', icon: Users },
  { key: 'access_calendar', label: 'Accès calendrier', icon: Calendar },
  { key: 'access_stats', label: 'Accès statistiques', icon: BarChart3 },
];

type RolePermissions = Record<string, boolean>;

const defaultPermissions: Record<UserRole, RolePermissions> = {
  operator: {
    view_action: true,
    edit_action: false,
    create_action: false,
    validate_action: false,
    delete_action: false,
    manage_files: false,
    manage_users: false,
    access_calendar: true,
    access_stats: false,
  },
  team_leader: {
    view_action: true,
    edit_action: true,
    create_action: true,
    validate_action: false,
    delete_action: false,
    manage_files: true,
    manage_users: false,
    access_calendar: true,
    access_stats: true,
  },
  supervisor: {
    view_action: true,
    edit_action: true,
    create_action: true,
    validate_action: true,
    delete_action: false,
    manage_files: true,
    manage_users: false,
    access_calendar: true,
    access_stats: true,
  },
  // Manager has same permissions as Supervisor
  manager: {
    view_action: true,
    edit_action: true,
    create_action: true,
    validate_action: true,
    delete_action: false,
    manage_files: true,
    manage_users: false,
    access_calendar: true,
    access_stats: true,
  },
  // Admin only has access to system management (users, organization, files, roles, settings)
  admin: {
    view_action: false,
    edit_action: false,
    create_action: false,
    validate_action: false,
    delete_action: false,
    manage_files: true,
    manage_users: true,
    access_calendar: false,
    access_stats: false,
  },
};

const roleColors: Record<UserRole, string> = {
  operator: 'bg-green-500',
  team_leader: 'bg-blue-500',
  supervisor: 'bg-purple-500',
  manager: 'bg-orange-500',
  admin: 'bg-red-500',
};

const AdminRolesPage: React.FC = () => {
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, RolePermissions>>(defaultPermissions);
  const [activeRole, setActiveRole] = useState<UserRole>('operator');
  const [hasChanges, setHasChanges] = useState(false);

  const togglePermission = (role: UserRole, permKey: string) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permKey]: !prev[role][permKey],
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    toast.success('Permissions enregistrées avec succès');
    setHasChanges(false);
  };

  const countActivePermissions = (role: UserRole) => {
    return Object.values(rolePermissions[role]).filter(Boolean).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rôles & Permissions</h1>
          <p className="text-muted-foreground">Configurer les droits d'accès par rôle</p>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges} className="gap-2">
          <Save className="h-4 w-4" />
          Enregistrer les permissions
        </Button>
      </div>

      {/* Role Cards Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
          <Card 
            key={role} 
            className={`cursor-pointer transition-all border-2 ${
              activeRole === role ? 'border-primary shadow-lg' : 'border-transparent hover:border-muted'
            }`}
            onClick={() => setActiveRole(role)}
          >
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-lg ${roleColors[role]} flex items-center justify-center mb-2`}>
                <Shield className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-sm">{ROLE_LABELS[role]}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {countActivePermissions(role)}/{permissions.length} permissions
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permissions Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${roleColors[activeRole]} flex items-center justify-center`}>
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>{ROLE_LABELS[activeRole]}</CardTitle>
              <CardDescription>Gérer les permissions pour ce rôle</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {permissions.map((perm) => {
              const isEnabled = rolePermissions[activeRole][perm.key];
              return (
                <div 
                  key={perm.key}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${isEnabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'} flex items-center justify-center`}>
                      <perm.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium">{perm.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {isEnabled ? 'Autorisé' : 'Non autorisé'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={isEnabled}
                    onCheckedChange={() => togglePermission(activeRole, perm.key)}
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Full Permissions Matrix */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Matrice complète des permissions</CardTitle>
          <CardDescription>Vue d'ensemble de toutes les permissions par rôle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Permission</th>
                  {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                    <th key={role} className="text-center py-3 px-4 font-medium">
                      <Badge className={`${roleColors[role]} text-white`}>
                        {ROLE_LABELS[role]}
                      </Badge>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissions.map((perm) => (
                  <tr key={perm.key} className="border-b hover:bg-muted/30">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <perm.icon className="h-4 w-4 text-muted-foreground" />
                        <span>{perm.label}</span>
                      </div>
                    </td>
                    {(Object.keys(ROLE_LABELS) as UserRole[]).map((role) => (
                      <td key={role} className="text-center py-3 px-4">
                        <button
                          onClick={() => togglePermission(role, perm.key)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            rolePermissions[role][perm.key]
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-red-100 text-red-600 hover:bg-red-200'
                          }`}
                        >
                          {rolePermissions[role][perm.key] ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRolesPage;
