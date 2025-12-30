import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { User, ROLE_LABELS, UserRole } from '@/types';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Copy,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import SortableTableHeader, { SortDirection } from '@/components/common/SortableTableHeader';
import AdminPagination from '@/components/common/AdminPagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

const ROLE_COLORS: Record<UserRole, string> = {
  admin: '#ef4444',
  manager: '#f59e0b',
  supervisor: '#8b5cf6',
  team_leader: '#3b82f6',
  operator: '#22c55e',
};

const ITEMS_PER_PAGE = 4;

const AdminUsersPage: React.FC = () => {
  const { users, services, lines, teams, posts, addUser, updateUser, deleteUser } = useData();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCredentialsDialogOpen, setIsCredentialsDialogOpen] = useState(false);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; password: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    role: 'operator' as UserRole,
    serviceId: '',
    lineId: '',
    teamId: '',
    postId: '',
    isActive: true,
  });

  // Role field visibility configuration
  const roleFieldConfig: Record<UserRole, { service: boolean; line: boolean; team: boolean; post: boolean }> = {
    operator: { service: true, line: true, team: true, post: true },
    team_leader: { service: true, line: true, team: true, post: false },
    supervisor: { service: true, line: true, team: false, post: false },
    manager: { service: true, line: false, team: false, post: false },
    admin: { service: false, line: false, team: false, post: false },
  };

  // Filtered options based on cascading selection
  const filteredLines = useMemo(() => {
    if (!formData.serviceId) return [];
    return lines.filter(line => line.serviceId === formData.serviceId);
  }, [lines, formData.serviceId]);

  const filteredTeams = useMemo(() => {
    if (!formData.lineId) return [];
    return teams.filter(team => team.lineId === formData.lineId);
  }, [teams, formData.lineId]);

  const filteredPosts = useMemo(() => {
    if (!formData.teamId) return [];
    return posts.filter(post => post.teamId === formData.teamId);
  }, [posts, formData.teamId]);

  // Handle role change - reset fields based on visibility
  const handleRoleChange = (value: UserRole) => {
    const config = roleFieldConfig[value];
    setFormData(prev => ({
      ...prev,
      role: value,
      serviceId: config.service ? prev.serviceId : '',
      lineId: config.line ? prev.lineId : '',
      teamId: config.team ? prev.teamId : '',
      postId: config.post ? prev.postId : '',
    }));
  };

  // Handle service change - reset child fields
  const handleServiceChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      serviceId: value,
      lineId: '',
      teamId: '',
      postId: '',
    }));
  };

  // Handle line change - reset child fields
  const handleLineChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      lineId: value,
      teamId: '',
      postId: '',
    }));
  };

  // Handle team change - reset child fields
  const handleTeamChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      teamId: value,
      postId: '',
    }));
  };

  // Exclude admins from the user list
  const nonAdminUsers = useMemo(() => users.filter(u => u.role !== 'admin'), [users]);

  const filteredUsers = useMemo(() => {
    return nonAdminUsers.filter(user => {
      const matchesSearch = 
        user.firstName.toLowerCase().includes(search.toLowerCase()) ||
        user.lastName.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' ? user.isActive : !user.isActive);
      const matchesTeam = teamFilter === 'all' || user.teamId === teamFilter;
      return matchesSearch && matchesRole && matchesStatus && matchesTeam;
    });
  }, [nonAdminUsers, search, roleFilter, statusFilter, teamFilter]);

  const handleSortUsers = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else if (sortDirection === 'desc') { setSortKey(null); setSortDirection(null); }
      else setSortDirection('asc');
    } else { setSortKey(key); setSortDirection('asc'); }
  };

  const sortedUsers = useMemo(() => {
    if (!sortKey || !sortDirection) return filteredUsers;
    return [...filteredUsers].sort((a, b) => {
      let aVal: string | number | boolean = '';
      let bVal: string | number | boolean = '';
      switch (sortKey) {
        case 'name': aVal = `${a.firstName} ${a.lastName}`.toLowerCase(); bVal = `${b.firstName} ${b.lastName}`.toLowerCase(); break;
        case 'email': aVal = a.email.toLowerCase(); bVal = b.email.toLowerCase(); break;
        case 'role': aVal = a.role; bVal = b.role; break;
        case 'team': aVal = getTeamName(a.teamId); bVal = getTeamName(b.teamId); break;
        case 'line': aVal = getLineName(a.lineId); bVal = getLineName(b.lineId); break;
        case 'createdAt': aVal = new Date(a.createdAt).getTime(); bVal = new Date(b.createdAt).getTime(); break;
        case 'isActive': aVal = a.isActive ? 1 : 0; bVal = b.isActive ? 1 : 0; break;
        default: return 0;
      }
      const comp = typeof aVal === 'string' ? aVal.localeCompare(bVal as string) : (aVal as number) - (bVal as number);
      return sortDirection === 'asc' ? comp : -comp;
    });
  }, [filteredUsers, sortKey, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedUsers, currentPage]);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    setCurrentPage(1);
  };

  const handleTeamFilterChange = (value: string) => {
    setTeamFilter(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const roleChartData = useMemo(() => {
    const roleCounts: Record<string, number> = {};
    nonAdminUsers.forEach(user => {
      roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
    });
    return Object.entries(roleCounts)
      .filter(([role]) => role !== 'admin')
      .map(([role, count]) => ({
        name: ROLE_LABELS[role as UserRole],
        value: count,
        color: ROLE_COLORS[role as UserRole],
      }));
  }, [nonAdminUsers]);

  const openAddDialog = () => {
    setEditingUser(null);
    setFormData({
      firstName: '',
      lastName: '',
      role: 'operator',
      serviceId: '',
      lineId: '',
      teamId: '',
      postId: '',
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      serviceId: user.serviceId || '',
      lineId: user.lineId || '',
      teamId: user.teamId || '',
      postId: user.postId || '',
      isActive: user.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error('Veuillez remplir le prénom et le nom');
      return;
    }

    const config = roleFieldConfig[formData.role];
    
    // Validate required scope fields based on role
    if (config.service && !formData.serviceId) {
      toast.error('Veuillez sélectionner un service');
      return;
    }
    if (config.line && !formData.lineId) {
      toast.error('Veuillez sélectionner une ligne');
      return;
    }
    if (config.team && !formData.teamId) {
      toast.error('Veuillez sélectionner une équipe');
      return;
    }
    if (config.post && !formData.postId) {
      toast.error('Veuillez sélectionner un poste');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        serviceId: config.service ? (formData.serviceId || undefined) : undefined,
        lineId: config.line ? (formData.lineId || undefined) : undefined,
        teamId: config.team ? (formData.teamId || undefined) : undefined,
        postId: config.post ? (formData.postId || undefined) : undefined,
        isActive: formData.isActive,
      };

      if (editingUser) {
        // Update existing user
        updateUser(editingUser.id, userData);
        toast.success('Utilisateur modifié avec succès');
        setIsDialogOpen(false);
      } else {
        // Create new user via edge function
        const credentials = await addUser(userData);
        
        setCreatedCredentials(credentials);
        setIsDialogOpen(false);
        setIsCredentialsDialogOpen(true);
        toast.success('Utilisateur créé avec succès');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'opération');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (userId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      deleteUser(userId);
      toast.success('Utilisateur supprimé');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copié dans le presse-papier');
  };

  const getLineName = (lineId?: string) => {
    if (!lineId) return '-';
    return lines.find(l => l.id === lineId)?.name || '-';
  };

  const getTeamName = (teamId?: string) => {
    if (!teamId) return '-';
    return teams.find(t => t.id === teamId)?.name || '-';
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Gestion des utilisateurs</h1>
          <p className="text-sm text-muted-foreground">Gérer les comptes et les accès</p>
        </div>
        <Button onClick={openAddDialog} className="gap-2 h-9">
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            <div className="relative col-span-2 sm:col-span-4 lg:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                {Object.entries(ROLE_LABELS)
                  .filter(([key]) => key !== 'admin')
                  .map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Select value={teamFilter} onValueChange={handleTeamFilterChange}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Équipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes équipes</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 lg:gap-6">
        {/* Users Table */}
        <div className="xl:col-span-3 order-2 xl:order-1">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <SortableTableHeader label="Utilisateur" sortKey="name" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={handleSortUsers} />
                      <SortableTableHeader label="Email" sortKey="email" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={handleSortUsers} className="hidden sm:table-cell" />
                      <SortableTableHeader label="Rôle" sortKey="role" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={handleSortUsers} />
                      <SortableTableHeader label="Équipe" sortKey="team" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={handleSortUsers} className="hidden lg:table-cell" />
                      <SortableTableHeader label="Ligne" sortKey="line" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={handleSortUsers} className="hidden xl:table-cell" />
                      <SortableTableHeader label="Statut" sortKey="isActive" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={handleSortUsers} />
                      <TableHead className="w-10">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0">
                              <AvatarImage src={user.avatarUrl} />
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {user.firstName[0]}{user.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <span className="font-medium text-sm block truncate">{user.firstName} {user.lastName}</span>
                              <span className="text-xs text-muted-foreground sm:hidden block truncate">{user.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{user.email}</TableCell>
                        <TableCell className="py-2">
                          <Badge 
                            variant="secondary"
                            className="text-xs whitespace-nowrap"
                            style={{ 
                              backgroundColor: `${ROLE_COLORS[user.role]}20`,
                              color: ROLE_COLORS[user.role]
                            }}
                          >
                            {ROLE_LABELS[user.role]}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">{getTeamName(user.teamId)}</TableCell>
                        <TableCell className="hidden xl:table-cell text-sm">{getLineName(user.lineId)}</TableCell>
                        <TableCell className="py-2">
                          <Badge variant={user.isActive ? 'default' : 'secondary'} className="text-xs">
                            {user.isActive ? 'Actif' : 'Inactif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(user.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <AdminPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={sortedUsers.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
              />
            </CardContent>
          </Card>
        </div>

        {/* Role Chart */}
        <div className="order-1 xl:order-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm sm:text-base">Répartition des rôles</CardTitle>
            </CardHeader>
            <CardContent className="p-2 sm:p-4">
              <ResponsiveContainer width="100%" height={180} className="xl:h-[220px]">
                <PieChart>
                  <Pie
                    data={roleChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {roleChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Modifier l\'utilisateur' : 'Ajouter un utilisateur'}
            </DialogTitle>
            {!editingUser && (
              <DialogDescription>
                L'email sera généré automatiquement: prénom.nom@entreprise.com
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prénom *</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Prénom"
                />
              </div>
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Nom"
                />
              </div>
            </div>
            {!editingUser && formData.firstName && formData.lastName && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Email généré: <span className="font-medium text-foreground">
                    {`${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}@entreprise.com`
                      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '')}
                  </span>
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Rôle *</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value: UserRole) => handleRoleChange(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS)
                    .filter(([key]) => key !== 'admin')
                    .map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Service - visible for all roles except admin */}
            {roleFieldConfig[formData.role].service && (
              <div className="space-y-2">
                <Label>Service *</Label>
                <Select 
                  value={formData.serviceId} 
                  onValueChange={handleServiceChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Ligne - visible for operator, team_leader, supervisor */}
            {roleFieldConfig[formData.role].line && (
              <div className="space-y-2">
                <Label>Ligne *</Label>
                <Select 
                  value={formData.lineId} 
                  onValueChange={handleLineChange}
                  disabled={!formData.serviceId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!formData.serviceId ? "Sélectionnez d'abord le service" : "Sélectionner une ligne"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredLines.map((line) => (
                      <SelectItem key={line.id} value={line.id}>{line.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Équipe - visible for operator, team_leader */}
            {roleFieldConfig[formData.role].team && (
              <div className="space-y-2">
                <Label>Équipe *</Label>
                <Select 
                  value={formData.teamId} 
                  onValueChange={handleTeamChange}
                  disabled={!formData.lineId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!formData.lineId ? "Sélectionnez d'abord la ligne" : "Sélectionner une équipe"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTeams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Poste - visible only for operator */}
            {roleFieldConfig[formData.role].post && (
              <div className="space-y-2">
                <Label>Poste *</Label>
                <Select 
                  value={formData.postId} 
                  onValueChange={(value) => setFormData({ ...formData, postId: value })}
                  disabled={!formData.teamId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={!formData.teamId ? "Sélectionnez d'abord l'équipe" : "Sélectionner un poste"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPosts.map((post) => (
                      <SelectItem key={post.id} value={post.id}>{post.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Label>Statut actif</Label>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingUser ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
      <Dialog open={isCredentialsDialogOpen} onOpenChange={setIsCredentialsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Utilisateur créé avec succès</DialogTitle>
            <DialogDescription>
              Voici les identifiants de connexion. Partagez-les avec l'utilisateur de manière sécurisée.
            </DialogDescription>
          </DialogHeader>
          {createdCredentials && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="flex gap-2">
                  <Input value={createdCredentials.email} readOnly className="bg-muted" />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(createdCredentials.email)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Mot de passe temporaire</Label>
                <div className="flex gap-2">
                  <Input value={createdCredentials.password} readOnly className="bg-muted font-mono" />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(createdCredentials.password)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                L'utilisateur pourra modifier son mot de passe après sa première connexion.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setIsCredentialsDialogOpen(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsersPage;
