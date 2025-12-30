import React, { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Service, Line, Team, Post } from '@/types';
import {
  Building2,
  Factory,
  Layers,
  MapPin,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import AdminPagination from '@/components/common/AdminPagination';

const ITEMS_PER_PAGE = 4;

const AdminOrganizationPage: React.FC = () => {
  const { services, lines, teams, posts, users, addService, updateService, deleteService, addLine, updateLine, deleteLine, addTeam, updateTeam, deleteTeam, addPost, updatePost, deletePost } = useData();
  const [activeTab, setActiveTab] = useState('services');
  
  // Pagination states
  const [servicesPage, setServicesPage] = useState(1);
  const [linesPage, setLinesPage] = useState(1);
  const [teamsPage, setTeamsPage] = useState(1);
  const [postsPage, setPostsPage] = useState(1);
  
  // Dialog states
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isLineDialogOpen, setIsLineDialogOpen] = useState(false);
  const [isTeamDialogOpen, setIsTeamDialogOpen] = useState(false);
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false);
  
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingLine, setEditingLine] = useState<Line | null>(null);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editingPost, setEditingPost] = useState<Post | null>(null);

  // Form states
  const [serviceForm, setServiceForm] = useState({ name: '', responsibleId: '' });
  const [lineForm, setLineForm] = useState({ name: '', serviceId: '', supervisorId: '' });
  const [teamForm, setTeamForm] = useState({ name: '', serviceId: '', lineId: '', leaderId: '' });
  const [postForm, setPostForm] = useState({ name: '', serviceId: '', lineId: '', teamId: '', operatorId: '' });

  // Paginated data
  const paginatedServices = useMemo(() => {
    const start = (servicesPage - 1) * ITEMS_PER_PAGE;
    return services.slice(start, start + ITEMS_PER_PAGE);
  }, [services, servicesPage]);

  const paginatedLines = useMemo(() => {
    const start = (linesPage - 1) * ITEMS_PER_PAGE;
    return lines.slice(start, start + ITEMS_PER_PAGE);
  }, [lines, linesPage]);

  const paginatedTeams = useMemo(() => {
    const start = (teamsPage - 1) * ITEMS_PER_PAGE;
    return teams.slice(start, start + ITEMS_PER_PAGE);
  }, [teams, teamsPage]);

  const paginatedPosts = useMemo(() => {
    const start = (postsPage - 1) * ITEMS_PER_PAGE;
    return posts.slice(start, start + ITEMS_PER_PAGE);
  }, [posts, postsPage]);

  const kpis = [
    { label: 'Services', value: services.length, icon: Building2, color: 'bg-blue-500' },
    { label: 'Lignes', value: lines.length, icon: Factory, color: 'bg-purple-500' },
    { label: 'Équipes', value: teams.length, icon: Layers, color: 'bg-green-500' },
    { label: 'Postes', value: posts.length, icon: MapPin, color: 'bg-orange-500' },
    { label: 'TRS Global', value: '87.5%', icon: TrendingUp, color: 'bg-cyan-500' },
  ];

  const managers = users.filter(u => u.role === 'manager');

  // Filtered supervisors by selected service for Line form
  const filteredSupervisorsForLine = lineForm.serviceId
    ? users.filter(u => u.role === 'supervisor' && u.serviceId === lineForm.serviceId)
    : [];

  // Filtered team leaders by selected line for Team form
  const filteredTeamLeadersForTeam = teamForm.lineId
    ? users.filter(u => u.role === 'team_leader' && u.lineId === teamForm.lineId)
    : [];

  // Filtered operators by selected team for Post form
  const filteredOperatorsForPost = postForm.teamId
    ? users.filter(u => u.role === 'operator' && u.teamId === postForm.teamId)
    : [];

  // Service handlers
  const openServiceDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setServiceForm({ name: service.name, responsibleId: service.responsibleId || '' });
    } else {
      setEditingService(null);
      setServiceForm({ name: '', responsibleId: '' });
    }
    setIsServiceDialogOpen(true);
  };

  const handleServiceSubmit = () => {
    if (!serviceForm.name) {
      toast.error('Le nom est obligatoire');
      return;
    }
    const responsible = users.find(u => u.id === serviceForm.responsibleId);
    const data = {
      name: serviceForm.name,
      responsibleId: serviceForm.responsibleId || undefined,
      responsibleName: responsible ? `${responsible.firstName} ${responsible.lastName}` : undefined,
    };
    if (editingService) {
      updateService(editingService.id, data);
      toast.success('Service modifié');
    } else {
      addService(data);
      toast.success('Service ajouté');
    }
    setIsServiceDialogOpen(false);
  };

  // Line handlers
  const openLineDialog = (line?: Line) => {
    if (line) {
      setEditingLine(line);
      setLineForm({ name: line.name, serviceId: line.serviceId, supervisorId: line.teamLeaderId || '' });
    } else {
      setEditingLine(null);
      setLineForm({ name: '', serviceId: '', supervisorId: '' });
    }
    setIsLineDialogOpen(true);
  };

  const handleLineServiceChange = (serviceId: string) => {
    setLineForm(prev => ({ ...prev, serviceId, supervisorId: '' }));
  };

  const handleLineSubmit = () => {
    if (!lineForm.name || !lineForm.serviceId) {
      toast.error('Le nom et le service sont obligatoires');
      return;
    }
    const service = services.find(s => s.id === lineForm.serviceId);
    const supervisor = users.find(u => u.id === lineForm.supervisorId);
    const data = {
      name: lineForm.name,
      serviceId: lineForm.serviceId,
      serviceName: service?.name || '',
      teamLeaderId: lineForm.supervisorId || undefined,
      teamLeaderName: supervisor ? `${supervisor.firstName} ${supervisor.lastName}` : undefined,
    };
    if (editingLine) {
      updateLine(editingLine.id, data);
      toast.success('Ligne modifiée');
    } else {
      addLine(data);
      toast.success('Ligne ajoutée');
    }
    setIsLineDialogOpen(false);
  };

  // Team handlers - with cascading hierarchy
  const openTeamDialog = (team?: Team) => {
    if (team) {
      setEditingTeam(team);
      // Find the service for this team's line
      const line = lines.find(l => l.id === team.lineId);
      setTeamForm({ 
        name: team.name, 
        serviceId: line?.serviceId || '', 
        lineId: team.lineId, 
        leaderId: team.leaderId || '' 
      });
    } else {
      setEditingTeam(null);
      setTeamForm({ name: '', serviceId: '', lineId: '', leaderId: '' });
    }
    setIsTeamDialogOpen(true);
  };

  const handleTeamServiceChange = (serviceId: string) => {
    setTeamForm(prev => ({ ...prev, serviceId, lineId: '', leaderId: '' }));
  };

  const handleTeamLineChange = (lineId: string) => {
    setTeamForm(prev => ({ ...prev, lineId, leaderId: '' }));
  };

  const filteredLinesForTeam = teamForm.serviceId 
    ? lines.filter(l => l.serviceId === teamForm.serviceId) 
    : [];

  const handleTeamSubmit = () => {
    if (!teamForm.name || !teamForm.lineId) {
      toast.error('Le nom et la ligne sont obligatoires');
      return;
    }
    const line = lines.find(l => l.id === teamForm.lineId);
    const leader = users.find(u => u.id === teamForm.leaderId);
    const data = {
      name: teamForm.name,
      lineId: teamForm.lineId,
      lineName: line?.name || '',
      leaderId: teamForm.leaderId || undefined,
      leaderName: leader ? `${leader.firstName} ${leader.lastName}` : undefined,
    };
    if (editingTeam) {
      updateTeam(editingTeam.id, data);
      toast.success('Équipe modifiée');
    } else {
      addTeam(data);
      toast.success('Équipe ajoutée');
    }
    setIsTeamDialogOpen(false);
  };

  // Post handlers - with cascading hierarchy
  const openPostDialog = (post?: Post) => {
    if (post) {
      setEditingPost(post);
      // Find the service and line for this post's team
      const team = teams.find(t => t.id === post.teamId);
      const line = lines.find(l => l.id === team?.lineId);
      setPostForm({ 
        name: post.name, 
        serviceId: line?.serviceId || '', 
        lineId: team?.lineId || '', 
        teamId: post.teamId,
        operatorId: ''
      });
    } else {
      setEditingPost(null);
      setPostForm({ name: '', serviceId: '', lineId: '', teamId: '', operatorId: '' });
    }
    setIsPostDialogOpen(true);
  };

  const handlePostServiceChange = (serviceId: string) => {
    setPostForm(prev => ({ ...prev, serviceId, lineId: '', teamId: '', operatorId: '' }));
  };

  const handlePostLineChange = (lineId: string) => {
    setPostForm(prev => ({ ...prev, lineId, teamId: '', operatorId: '' }));
  };

  const handlePostTeamChange = (teamId: string) => {
    setPostForm(prev => ({ ...prev, teamId, operatorId: '' }));
  };

  const filteredLinesForPost = postForm.serviceId 
    ? lines.filter(l => l.serviceId === postForm.serviceId) 
    : [];

  const filteredTeamsForPost = postForm.lineId 
    ? teams.filter(t => t.lineId === postForm.lineId) 
    : [];

  const handlePostSubmit = () => {
    if (!postForm.name || !postForm.serviceId || !postForm.lineId || !postForm.teamId) {
      toast.error('Tous les champs sont obligatoires');
      return;
    }
    const team = teams.find(t => t.id === postForm.teamId);
    const line = lines.find(l => l.id === postForm.lineId);
    const data = {
      name: postForm.name,
      teamId: postForm.teamId,
      teamName: team?.name || '',
      lineId: postForm.lineId,
      lineName: line?.name || '',
    };
    if (editingPost) {
      updatePost(editingPost.id, data);
      toast.success('Poste modifié');
    } else {
      addPost(data);
      toast.success('Poste ajouté');
    }
    setIsPostDialogOpen(false);
  };

  const countOperatorsByService = (serviceId: string) => {
    const serviceLines = lines.filter(l => l.serviceId === serviceId);
    const lineIds = serviceLines.map(l => l.id);
    return users.filter(u => u.role === 'operator' && u.lineId && lineIds.includes(u.lineId)).length;
  };

  const countTeamsByService = (serviceId: string) => {
    const serviceLines = lines.filter(l => l.serviceId === serviceId);
    return teams.filter(t => serviceLines.some(l => l.id === t.lineId)).length;
  };

  const countTeamsByLine = (lineId: string) => {
    return teams.filter(t => t.lineId === lineId).length;
  };

  const getSupervisorByLine = (lineId: string) => {
    const line = lines.find(l => l.id === lineId);
    if (!line) return '-';
    const supervisor = users.find(u => u.role === 'supervisor' && u.lineId === lineId);
    return supervisor ? `${supervisor.firstName} ${supervisor.lastName}` : '-';
  };

  const getServiceByLine = (lineId: string) => {
    const line = lines.find(l => l.id === lineId);
    return line?.serviceName || '-';
  };

  const countOperatorsByLine = (lineId: string) => {
    return users.filter(u => u.role === 'operator' && u.lineId === lineId).length;
  };

  const countOperatorsByTeam = (teamId: string) => {
    return users.filter(u => u.role === 'operator' && u.teamId === teamId).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Organisation</h1>
        <p className="text-muted-foreground">Gérer la structure organisationnelle</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-lg ${kpi.color} flex items-center justify-center mb-2`}>
                <kpi.icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="lines">Lignes</TabsTrigger>
          <TabsTrigger value="teams">Équipes</TabsTrigger>
          <TabsTrigger value="posts">Postes</TabsTrigger>
        </TabsList>

        {/* Services Tab */}
        <TabsContent value="services" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Services</CardTitle>
              <Button onClick={() => openServiceDialog()} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Nb lignes</TableHead>
                    <TableHead>Nb équipes</TableHead>
                    <TableHead>Nb opérateurs</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedServices.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="font-medium">{service.name}</TableCell>
                      <TableCell>{service.responsibleName || '-'}</TableCell>
                      <TableCell>{lines.filter(l => l.serviceId === service.id).length}</TableCell>
                      <TableCell>{countTeamsByService(service.id)}</TableCell>
                      <TableCell>{countOperatorsByService(service.id)}</TableCell>
                      <TableCell><Badge>Actif</Badge></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openServiceDialog(service)}>
                              <Edit className="h-4 w-4 mr-2" />Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { deleteService(service.id); toast.success('Service supprimé'); }} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <AdminPagination
                currentPage={servicesPage}
                totalPages={Math.ceil(services.length / ITEMS_PER_PAGE)}
                totalItems={services.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setServicesPage}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Lines Tab */}
        <TabsContent value="lines" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Lignes</CardTitle>
              <Button onClick={() => openLineDialog()} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ligne</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Superviseur</TableHead>
                    <TableHead>Nb équipes</TableHead>
                    <TableHead>Nb opérateurs</TableHead>
                    <TableHead>TRS</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedLines.map((line) => (
                    <TableRow key={line.id}>
                      <TableCell className="font-medium">{line.name}</TableCell>
                      <TableCell>{line.serviceName}</TableCell>
                      <TableCell>{getSupervisorByLine(line.id)}</TableCell>
                      <TableCell>{countTeamsByLine(line.id)}</TableCell>
                      <TableCell>{countOperatorsByLine(line.id)}</TableCell>
                      <TableCell><Badge variant="secondary">85%</Badge></TableCell>
                      <TableCell><Badge>Actif</Badge></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openLineDialog(line)}>
                              <Edit className="h-4 w-4 mr-2" />Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { deleteLine(line.id); toast.success('Ligne supprimée'); }} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <AdminPagination
                currentPage={linesPage}
                totalPages={Math.ceil(lines.length / ITEMS_PER_PAGE)}
                totalItems={lines.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setLinesPage}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Équipes</CardTitle>
              <Button onClick={() => openTeamDialog()} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Équipe</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Ligne</TableHead>
                    <TableHead>Chef d'équipe</TableHead>
                    <TableHead>Nb opérateurs</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTeams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell>{getServiceByLine(team.lineId)}</TableCell>
                      <TableCell>{team.lineName}</TableCell>
                      <TableCell>{team.leaderName || '-'}</TableCell>
                      <TableCell>{countOperatorsByTeam(team.id)}</TableCell>
                      <TableCell><Badge>Actif</Badge></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openTeamDialog(team)}>
                              <Edit className="h-4 w-4 mr-2" />Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { deleteTeam(team.id); toast.success('Équipe supprimée'); }} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <AdminPagination
                currentPage={teamsPage}
                totalPages={Math.ceil(teams.length / ITEMS_PER_PAGE)}
                totalItems={teams.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setTeamsPage}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Posts Tab */}
        <TabsContent value="posts" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Postes</CardTitle>
              <Button onClick={() => openPostDialog()} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Poste</TableHead>
                    <TableHead>Ligne</TableHead>
                    <TableHead>Équipe</TableHead>
                    <TableHead>TRS poste</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">{post.name}</TableCell>
                      <TableCell>{post.lineName}</TableCell>
                      <TableCell>{post.teamName}</TableCell>
                      <TableCell><Badge variant="secondary">88%</Badge></TableCell>
                      <TableCell><Badge>Actif</Badge></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openPostDialog(post)}>
                              <Edit className="h-4 w-4 mr-2" />Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => { deletePost(post.id); toast.success('Poste supprimé'); }} className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <AdminPagination
                currentPage={postsPage}
                totalPages={Math.ceil(posts.length / ITEMS_PER_PAGE)}
                totalItems={posts.length}
                itemsPerPage={ITEMS_PER_PAGE}
                onPageChange={setPostsPage}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Service Dialog */}
      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingService ? 'Modifier le service' : 'Ajouter un service'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom du service *</Label>
              <Input value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Responsable</Label>
              <Select value={serviceForm.responsibleId} onValueChange={(value) => setServiceForm({ ...serviceForm, responsibleId: value })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {managers.map(u => <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsServiceDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleServiceSubmit}>{editingService ? 'Enregistrer' : 'Ajouter'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Line Dialog */}
      <Dialog open={isLineDialogOpen} onOpenChange={setIsLineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLine ? 'Modifier la ligne' : 'Ajouter une ligne'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom de la ligne *</Label>
              <Input value={lineForm.name} onChange={(e) => setLineForm({ ...lineForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Service *</Label>
              <Select value={lineForm.serviceId} onValueChange={handleLineServiceChange}>
                <SelectTrigger><SelectValue placeholder="Sélectionner le service" /></SelectTrigger>
                <SelectContent>
                  {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Superviseur</Label>
              <Select 
                value={lineForm.supervisorId} 
                onValueChange={(value) => setLineForm({ ...lineForm, supervisorId: value })}
                disabled={!lineForm.serviceId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={lineForm.serviceId 
                    ? (filteredSupervisorsForLine.length > 0 ? "Sélectionner le superviseur" : "Aucun superviseur dans ce service") 
                    : "Sélectionnez d'abord le service"} 
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredSupervisorsForLine.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLineDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleLineSubmit}>{editingLine ? 'Enregistrer' : 'Ajouter'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Team Dialog - with cascading hierarchy */}
      <Dialog open={isTeamDialogOpen} onOpenChange={setIsTeamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTeam ? 'Modifier l\'équipe' : 'Ajouter une équipe'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom de l'équipe *</Label>
              <Input value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Service *</Label>
              <Select value={teamForm.serviceId} onValueChange={handleTeamServiceChange}>
                <SelectTrigger><SelectValue placeholder="Sélectionner le service" /></SelectTrigger>
                <SelectContent>
                  {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ligne *</Label>
              <Select 
                value={teamForm.lineId} 
                onValueChange={handleTeamLineChange}
                disabled={!teamForm.serviceId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={teamForm.serviceId ? "Sélectionner la ligne" : "Sélectionnez d'abord le service"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredLinesForTeam.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Chef d'équipe</Label>
              <Select 
                value={teamForm.leaderId} 
                onValueChange={(value) => setTeamForm({ ...teamForm, leaderId: value })}
                disabled={!teamForm.lineId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={teamForm.lineId 
                    ? (filteredTeamLeadersForTeam.length > 0 ? "Sélectionner le chef d'équipe" : "Aucun chef d'équipe dans cette ligne") 
                    : "Sélectionnez d'abord la ligne"} 
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredTeamLeadersForTeam.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTeamDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleTeamSubmit}>{editingTeam ? 'Enregistrer' : 'Ajouter'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post Dialog - with cascading hierarchy */}
      <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPost ? 'Modifier le poste' : 'Ajouter un poste'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom du poste *</Label>
              <Input value={postForm.name} onChange={(e) => setPostForm({ ...postForm, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Service *</Label>
              <Select value={postForm.serviceId} onValueChange={handlePostServiceChange}>
                <SelectTrigger><SelectValue placeholder="Sélectionner le service" /></SelectTrigger>
                <SelectContent>
                  {services.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ligne *</Label>
              <Select 
                value={postForm.lineId} 
                onValueChange={handlePostLineChange}
                disabled={!postForm.serviceId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={postForm.serviceId ? "Sélectionner la ligne" : "Sélectionnez d'abord le service"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredLinesForPost.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Équipe *</Label>
              <Select 
                value={postForm.teamId} 
                onValueChange={handlePostTeamChange}
                disabled={!postForm.lineId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={postForm.lineId ? "Sélectionner l'équipe" : "Sélectionnez d'abord la ligne"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredTeamsForPost.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Opérateur affecté</Label>
              <Select 
                value={postForm.operatorId} 
                onValueChange={(value) => setPostForm({ ...postForm, operatorId: value })}
                disabled={!postForm.teamId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={postForm.teamId 
                    ? (filteredOperatorsForPost.length > 0 ? "Sélectionner l'opérateur" : "Aucun opérateur dans cette équipe") 
                    : "Sélectionnez d'abord l'équipe"} 
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredOperatorsForPost.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.firstName} {u.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPostDialogOpen(false)}>Annuler</Button>
            <Button onClick={handlePostSubmit}>{editingPost ? 'Enregistrer' : 'Ajouter'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrganizationPage;
