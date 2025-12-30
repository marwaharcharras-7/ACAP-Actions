import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import SortableTableHeader, { useSorting, SortDirection } from '@/components/common/SortableTableHeader';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Target,
  ArrowLeft,
  Eye,
  ChevronRight,
} from 'lucide-react';
import TrackingCharts from '@/components/tracking/TrackingCharts';
import { User, Action, ROLE_LABELS, STATUS_LABELS } from '@/types';
import { cn } from '@/lib/utils';
import PilotActionsModal from '@/components/tracking/PilotActionsModal';
import ExportDropdown from '@/components/common/ExportDropdown';
import { ExportColumn } from '@/lib/exportUtils';

type DrillLevel = 'supervisors' | 'team_leaders' | 'pilots';

interface NavigationState {
  level: DrillLevel;
  selectedSupervisorId?: string;
  selectedSupervisorName?: string;
  selectedTeamLeaderId?: string;
  selectedTeamLeaderName?: string;
}

interface MemberStats {
  user: User;
  total: number;
  inProgress: number;
  planned: number;
  late: number;
  completed: number;
  performance: number;
  delayCategories: { green: number; yellow: number; orange: number; red: number };
}

const TeamTrackingPage = () => {
  const { actions, users, services, lines, teams } = useData();
  const { user: currentUser } = useAuth();
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [lineFilter, setLineFilter] = useState<string>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');

  // Pilot modal state
  const [selectedPilot, setSelectedPilot] = useState<User | null>(null);
  const [pilotModalOpen, setPilotModalOpen] = useState(false);

  // Table sorting state
  const [tableSortKey, setTableSortKey] = useState<string | null>(null);
  const [tableSortDirection, setTableSortDirection] = useState<SortDirection>(null);

  const handleTableSort = (key: string) => {
    if (tableSortKey === key) {
      if (tableSortDirection === 'asc') {
        setTableSortDirection('desc');
      } else if (tableSortDirection === 'desc') {
        setTableSortKey(null);
        setTableSortDirection(null);
      } else {
        setTableSortDirection('asc');
      }
    } else {
      setTableSortKey(key);
      setTableSortDirection('asc');
    }
  };

  // Navigation state for drill-down
  const [navigation, setNavigation] = useState<NavigationState>(() => {
    if (currentUser?.role === 'manager') return { level: 'supervisors' };
    if (currentUser?.role === 'supervisor') return { level: 'team_leaders' };
    return { level: 'pilots' }; // team_leader
  });

  // Helper function to calculate stats for a user based on their piloted actions
  const calculateMemberStats = (member: User, relevantActions: Action[]): MemberStats => {
    const memberActions = relevantActions.filter(a => a.pilotId === member.id);
    const total = memberActions.length;
    const inProgress = memberActions.filter(a => a.status === 'in_progress').length;
    const planned = memberActions.filter(a => a.status === 'planned').length;
    const late = memberActions.filter(a => a.status === 'late').length;
    const completed = memberActions.filter(a => a.status === 'completed' || a.status === 'validated').length;
    
    const completedActions = memberActions.filter(a => a.status === 'completed' || a.status === 'validated');
    const onTime = completedActions.filter(a => {
      if (a.completedAt) {
        return new Date(a.completedAt) <= new Date(a.dueDate);
      }
      return false;
    }).length;
    const performance = completedActions.length > 0 
      ? Math.round((onTime / completedActions.length) * 100) 
      : 0;

    const activeActions = memberActions.filter(a => 
      a.status !== 'completed' && a.status !== 'validated' && a.status !== 'archived'
    );
    
    const delayCategories = { green: 0, yellow: 0, orange: 0, red: 0 };
    activeActions.forEach(action => {
      const createdAt = new Date(action.createdAt);
      const dueDate = new Date(action.dueDate);
      const now = new Date();
      
      const totalDays = (dueDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const elapsedDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const percentConsumed = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 100;

      if (percentConsumed > 100) delayCategories.red++;
      else if (percentConsumed >= 75) delayCategories.orange++;
      else if (percentConsumed >= 50) delayCategories.yellow++;
      else delayCategories.green++;
    });

    return {
      user: member,
      total,
      inProgress,
      planned,
      late,
      completed,
      performance,
      delayCategories,
    };
  };

  // Helper function to calculate aggregated stats for a manager/supervisor based on their subordinates
  const calculateAggregatedStats = (subordinateUserIds: string[], allActions: Action[]): Omit<MemberStats, 'user'> => {
    const relevantActions = allActions.filter(a => subordinateUserIds.includes(a.pilotId));
    const total = relevantActions.length;
    const inProgress = relevantActions.filter(a => a.status === 'in_progress').length;
    const planned = relevantActions.filter(a => a.status === 'planned').length;
    const late = relevantActions.filter(a => a.status === 'late').length;
    const completed = relevantActions.filter(a => a.status === 'completed' || a.status === 'validated').length;
    
    const completedActions = relevantActions.filter(a => a.status === 'completed' || a.status === 'validated');
    const onTime = completedActions.filter(a => {
      if (a.completedAt) {
        return new Date(a.completedAt) <= new Date(a.dueDate);
      }
      return false;
    }).length;
    const performance = completedActions.length > 0 
      ? Math.round((onTime / completedActions.length) * 100) 
      : 0;

    const activeActions = relevantActions.filter(a => 
      a.status !== 'completed' && a.status !== 'validated' && a.status !== 'archived'
    );
    
    const delayCategories = { green: 0, yellow: 0, orange: 0, red: 0 };
    activeActions.forEach(action => {
      const createdAt = new Date(action.createdAt);
      const dueDate = new Date(action.dueDate);
      const now = new Date();
      
      const totalDays = (dueDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const elapsedDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const percentConsumed = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 100;

      if (percentConsumed > 100) delayCategories.red++;
      else if (percentConsumed >= 75) delayCategories.orange++;
      else if (percentConsumed >= 50) delayCategories.yellow++;
      else delayCategories.green++;
    });

    return {
      total,
      inProgress,
      planned,
      late,
      completed,
      performance,
      delayCategories,
    };
  };

  // Get all users managed by a supervisor (team leaders + pilots in their line)
  const getSubordinatesForSupervisor = (supervisor: User): string[] => {
    const subordinateIds: string[] = [];
    users.forEach(u => {
      if (u.role !== 'admin' && u.lineId === supervisor.lineId) {
        subordinateIds.push(u.id);
      }
    });
    return subordinateIds;
  };

  // Get all users managed by a team leader (pilots in their team)
  const getPilotIdsForTeamLeader = (teamLeader: User): string[] => {
    // Get actions in the team leader's team scope
    const teamActions = actions.filter(a => a.teamId === teamLeader.teamId);
    const pilotIds = [...new Set(teamActions.map(a => a.pilotId))];
    return pilotIds;
  };

  // Get pilots for a team leader (users who pilot actions in their scope)
  const getPilotsForTeamLeader = (teamLeader: User): User[] => {
    const pilotIds = getPilotIdsForTeamLeader(teamLeader);
    return users.filter(u => pilotIds.includes(u.id) && u.role !== 'admin');
  };

  // Get available filters based on role and navigation level
  const getAvailableLines = useMemo(() => {
    if (currentUser?.role === 'manager') {
      // Manager can filter by lines in their service
      return lines.filter(l => {
        const service = services.find(s => s.id === l.serviceId);
        return service?.responsibleId === currentUser.id || l.serviceId === currentUser.serviceId;
      });
    }
    if (currentUser?.role === 'supervisor') {
      // Supervisor can only see their line
      return lines.filter(l => l.id === currentUser.lineId);
    }
    return lines;
  }, [lines, services, currentUser]);

  const getAvailableTeams = useMemo(() => {
    if (currentUser?.role === 'team_leader') {
      return teams.filter(t => t.id === currentUser.teamId);
    }
    if (navigation.selectedTeamLeaderId) {
      const teamLeader = users.find(u => u.id === navigation.selectedTeamLeaderId);
      return teams.filter(t => t.id === teamLeader?.teamId);
    }
    return teams;
  }, [teams, currentUser, navigation.selectedTeamLeaderId, users]);

  // Members to display based on current navigation level
  const displayMembers = useMemo((): MemberStats[] => {
    let membersToShow: User[] = [];
    
    if (navigation.level === 'supervisors') {
      // Manager level: show supervisors in their service
      membersToShow = users.filter(u => u.role === 'supervisor');
      if (currentUser?.serviceId) {
        membersToShow = membersToShow.filter(u => u.serviceId === currentUser.serviceId);
      }
      if (serviceFilter !== 'all') {
        membersToShow = membersToShow.filter(u => u.serviceId === serviceFilter);
      }
      if (lineFilter !== 'all') {
        membersToShow = membersToShow.filter(u => u.lineId === lineFilter);
      }
    } else if (navigation.level === 'team_leaders') {
      if (navigation.selectedSupervisorId) {
        // Drilling from a supervisor: show team_leaders under that supervisor's line
        const supervisor = users.find(u => u.id === navigation.selectedSupervisorId);
        if (supervisor) {
          membersToShow = users.filter(u => 
            u.role === 'team_leader' && u.lineId === supervisor.lineId
          );
        }
      } else {
        // Supervisor's initial view: show team_leaders in their line
        membersToShow = users.filter(u => 
          u.role === 'team_leader' && u.lineId === currentUser?.lineId
        );
      }
      if (teamFilter !== 'all') {
        membersToShow = membersToShow.filter(u => u.teamId === teamFilter);
      }
    } else if (navigation.level === 'pilots') {
      if (navigation.selectedTeamLeaderId) {
        // Drilling from a team leader: show pilots under that team leader
        const teamLeader = users.find(u => u.id === navigation.selectedTeamLeaderId);
        if (teamLeader) {
          membersToShow = getPilotsForTeamLeader(teamLeader);
        }
      } else {
        // Team leader's initial view: show pilots in their team
        if (currentUser) {
          membersToShow = getPilotsForTeamLeader(currentUser);
        }
      }
    }

    // Calculate stats for each member
    return membersToShow.map(member => {
      if (navigation.level === 'supervisors') {
        // For supervisors, aggregate stats from all users in their line
        const subordinateIds = getSubordinatesForSupervisor(member);
        const aggregated = calculateAggregatedStats(subordinateIds, actions);
        return { user: member, ...aggregated };
      } else if (navigation.level === 'team_leaders') {
        // For team leaders, aggregate stats from their pilots
        const pilotIds = getPilotIdsForTeamLeader(member);
        const aggregated = calculateAggregatedStats(pilotIds, actions);
        return { user: member, ...aggregated };
      } else {
        // For pilots, calculate individual stats
      return calculateMemberStats(member, actions);
      }
    });
  }, [users, actions, navigation, currentUser, serviceFilter, lineFilter, teamFilter]);

  // Sort the display members
  const sortedDisplayMembers = useMemo(() => {
    if (!tableSortKey || !tableSortDirection) {
      return [...displayMembers].sort((a, b) => b.total - a.total);
    }

    return [...displayMembers].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (tableSortKey) {
        case 'name':
          aVal = `${a.user.firstName} ${a.user.lastName}`.toLowerCase();
          bVal = `${b.user.firstName} ${b.user.lastName}`.toLowerCase();
          break;
        case 'role':
          aVal = a.user.role;
          bVal = b.user.role;
          break;
        case 'total':
          aVal = a.total;
          bVal = b.total;
          break;
        case 'inProgress':
          aVal = a.inProgress;
          bVal = b.inProgress;
          break;
        case 'planned':
          aVal = a.planned;
          bVal = b.planned;
          break;
        case 'late':
          aVal = a.late;
          bVal = b.late;
          break;
        case 'completed':
          aVal = a.completed;
          bVal = b.completed;
          break;
        case 'performance':
          aVal = a.performance;
          bVal = b.performance;
          break;
        default:
          return 0;
      }

      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else {
        comparison = (aVal as number) - (bVal as number);
      }

      return tableSortDirection === 'asc' ? comparison : -comparison;
    });
  }, [displayMembers, tableSortKey, tableSortDirection]);

  // Overall stats
  const overallStats = useMemo(() => {
    const totalActions = displayMembers.reduce((acc, m) => acc + m.total, 0);
    const totalInProgress = displayMembers.reduce((acc, m) => acc + m.inProgress, 0);
    const totalLate = displayMembers.reduce((acc, m) => acc + m.late, 0);
    const totalCompleted = displayMembers.reduce((acc, m) => acc + m.completed, 0);
    const avgPerformance = displayMembers.length > 0
      ? Math.round(displayMembers.reduce((acc, m) => acc + m.performance, 0) / displayMembers.length)
      : 0;

    return { totalActions, totalInProgress, totalLate, totalCompleted, avgPerformance };
  }, [displayMembers]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Handle row click for drill-down (supervisors and team_leaders only)
  const handleDrillDown = (member: User) => {
    if (navigation.level === 'supervisors') {
      // Manager clicking on supervisor → show team leaders
      setNavigation({
        level: 'team_leaders',
        selectedSupervisorId: member.id,
        selectedSupervisorName: `${member.firstName} ${member.lastName}`,
      });
      setLineFilter('all');
      setTeamFilter('all');
    } else if (navigation.level === 'team_leaders') {
      // Supervisor clicking on team leader → show pilots
      setNavigation({
        level: 'pilots',
        selectedSupervisorId: navigation.selectedSupervisorId,
        selectedSupervisorName: navigation.selectedSupervisorName,
        selectedTeamLeaderId: member.id,
        selectedTeamLeaderName: `${member.firstName} ${member.lastName}`,
      });
      setTeamFilter('all');
    }
  };

  // Handle pilot click - open modal
  const handlePilotClick = (member: User) => {
    setSelectedPilot(member);
    setPilotModalOpen(true);
  };

  // Handle back navigation
  const handleBack = () => {
    if (navigation.level === 'pilots' && navigation.selectedTeamLeaderId) {
      setNavigation({
        level: 'team_leaders',
        selectedSupervisorId: navigation.selectedSupervisorId,
        selectedSupervisorName: navigation.selectedSupervisorName,
      });
    } else if (navigation.level === 'team_leaders' && navigation.selectedSupervisorId) {
      setNavigation({ level: 'supervisors' });
    }
  };

  // Get page title based on role
  const getRoleSpaceLabel = () => {
    if (currentUser?.role === 'manager') return 'Espace Manager';
    if (currentUser?.role === 'supervisor') return 'Espace Superviseur';
    if (currentUser?.role === 'team_leader') return "Espace Chef d'équipe";
    return '';
  };

  // Get breadcrumb
  const getBreadcrumb = () => {
    const parts: string[] = ['Suivi'];
    
    if (navigation.selectedSupervisorName) {
      parts.push(`Superviseur : ${navigation.selectedSupervisorName}`);
    }
    if (navigation.selectedTeamLeaderName) {
      parts.push(`Chef d'équipe : ${navigation.selectedTeamLeaderName}`);
    }
    
    return parts;
  };

  // Get page info based on navigation
  const getPageInfo = () => {
    if (navigation.level === 'supervisors') {
      return {
        entityLabel: 'Superviseur',
        entityLabelPlural: 'Superviseurs',
      };
    } else if (navigation.level === 'team_leaders') {
      return {
        entityLabel: "Chef d'équipe",
        entityLabelPlural: "Chefs d'équipe",
      };
    } else {
      return {
        entityLabel: 'Pilote',
        entityLabelPlural: 'Pilotes',
      };
    }
  };

  const pageInfo = getPageInfo();
  const breadcrumb = getBreadcrumb();
  const showBackButton = navigation.selectedSupervisorId || navigation.selectedTeamLeaderId;
  const isPilotLevel = navigation.level === 'pilots';

  // Export configuration
  const exportColumns: ExportColumn[] = [
    { header: 'Nom', key: 'name' },
    { header: 'Rôle', key: 'roleLabel' },
    { header: 'Actions totales', key: 'total' },
    { header: 'En cours', key: 'inProgress' },
    { header: 'En retard', key: 'late' },
    { header: 'Finalisées', key: 'completed' },
    { header: 'Performance', key: 'performanceLabel' },
  ];

  const exportData = displayMembers.map(member => ({
    name: `${member.user.firstName} ${member.user.lastName}`,
    roleLabel: ROLE_LABELS[member.user.role],
    total: member.total,
    inProgress: member.inProgress,
    late: member.late,
    completed: member.completed,
    performanceLabel: `${member.performance}%`,
  }));

  return (
    <div className="space-y-4 md:space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
            {showBackButton && (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleBack}
                className="shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                Suivi <span className="text-muted-foreground font-normal text-base md:text-xl">• {getRoleSpaceLabel()}</span>
              </h1>
              {breadcrumb.length > 1 && (
                <p className="text-xs md:text-sm text-muted-foreground mt-1 truncate">
                  {breadcrumb.join(' > ')}
                </p>
              )}
            </div>
          </div>
          <ExportDropdown
            data={exportData}
            columns={exportColumns}
            filename="suivi_equipe"
            title="Suivi Équipe"
          />
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {navigation.level === 'supervisors' && currentUser?.role === 'manager' && (
            <Select value={lineFilter} onValueChange={setLineFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Ligne" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes lignes</SelectItem>
                {getAvailableLines.map((line) => (
                  <SelectItem key={line.id} value={line.id}>{line.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {navigation.level === 'team_leaders' && (
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Équipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes équipes</SelectItem>
                {getAvailableTeams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Overview KPIs - Better responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <Card className="shadow-card">
          <CardContent className="p-3 md:pt-4 md:px-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary-light flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-2xl font-bold text-foreground">{displayMembers.length}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground truncate">{pageInfo.entityLabelPlural}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-3 md:pt-4 md:px-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-info-light flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 md:w-5 md:h-5 text-info" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-2xl font-bold text-foreground">{overallStats.totalInProgress}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">En cours</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-3 md:pt-4 md:px-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-success-light flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-2xl font-bold text-foreground">{overallStats.totalCompleted}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Finalisées</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-3 md:pt-4 md:px-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-danger-light flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-danger" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-2xl font-bold text-foreground">{overallStats.totalLate}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">En retard</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card col-span-2 sm:col-span-1">
          <CardContent className="p-3 md:pt-4 md:px-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-success-light flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-lg md:text-2xl font-bold text-foreground">{overallStats.avgPerformance}%</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">Performance moy.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg">Vue globale par {pageInfo.entityLabel.toLowerCase()}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-w-full">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <SortableTableHeader
                    label={pageInfo.entityLabel}
                    sortKey="name"
                    currentSortKey={tableSortKey}
                    currentSortDirection={tableSortDirection}
                    onSort={handleTableSort}
                  />
                  <SortableTableHeader
                    label="Rôle"
                    sortKey="role"
                    currentSortKey={tableSortKey}
                    currentSortDirection={tableSortDirection}
                    onSort={handleTableSort}
                  />
                  <SortableTableHeader
                    label="Total"
                    sortKey="total"
                    currentSortKey={tableSortKey}
                    currentSortDirection={tableSortDirection}
                    onSort={handleTableSort}
                    className="text-center"
                  />
                  <SortableTableHeader
                    label="En cours"
                    sortKey="inProgress"
                    currentSortKey={tableSortKey}
                    currentSortDirection={tableSortDirection}
                    onSort={handleTableSort}
                    className="text-center"
                  />
                  <SortableTableHeader
                    label="Prévues"
                    sortKey="planned"
                    currentSortKey={tableSortKey}
                    currentSortDirection={tableSortDirection}
                    onSort={handleTableSort}
                    className="text-center"
                  />
                  <SortableTableHeader
                    label="En retard"
                    sortKey="late"
                    currentSortKey={tableSortKey}
                    currentSortDirection={tableSortDirection}
                    onSort={handleTableSort}
                    className="text-center"
                  />
                  <SortableTableHeader
                    label="Finalisées"
                    sortKey="completed"
                    currentSortKey={tableSortKey}
                    currentSortDirection={tableSortDirection}
                    onSort={handleTableSort}
                    className="text-center"
                  />
                  <SortableTableHeader
                    label="Performance"
                    sortKey="performance"
                    currentSortKey={tableSortKey}
                    currentSortDirection={tableSortDirection}
                    onSort={handleTableSort}
                  />
                  <TableHead className="w-20 text-center">Détails</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDisplayMembers.length > 0 ? (
                  sortedDisplayMembers.map(({ user, total, inProgress, planned, late, completed, performance }) => (
                    <TableRow 
                      key={user.id} 
                      className="hover:bg-muted/30"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatarUrl} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                              {getInitials(user.firstName, user.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.firstName} {user.lastName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">{total}</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-primary-light text-primary">{inProgress}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-warning-light text-warning">{planned}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className={cn(late > 0 ? 'bg-danger-light text-danger' : 'bg-muted text-muted-foreground')}>
                          {late}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-success-light text-success">{completed}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={performance} className="w-16 h-2" />
                          <span className={cn(
                            'text-sm font-medium',
                            performance >= 80 ? 'text-success' : 
                            performance >= 50 ? 'text-warning' : 'text-danger'
                          )}>
                            {performance}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {isPilotLevel ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handlePilotClick(user)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1"
                            onClick={() => handleDrillDown(user)}
                          >
                            Détails
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Aucun {pageInfo.entityLabel.toLowerCase()} trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Visualizations - Charts */}
      <TrackingCharts
        displayMembers={displayMembers}
        entityLabel={pageInfo.entityLabel}
        entityLabelPlural={pageInfo.entityLabelPlural}
      />

      {/* Heatmap */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Heatmap par délai consommé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>{pageInfo.entityLabel}</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-success" />
                      0-50%
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-warning" />
                      50-75%
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      75-100%
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-danger" />
                      {'>'}100%
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayMembers.map(({ user, delayCategories }) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.firstName} {user.lastName}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className={cn(
                        'inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold',
                        delayCategories.green > 0 ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
                      )}>
                        {delayCategories.green}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className={cn(
                        'inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold',
                        delayCategories.yellow > 0 ? 'bg-warning text-warning-foreground' : 'bg-muted text-muted-foreground'
                      )}>
                        {delayCategories.yellow}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className={cn(
                        'inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold',
                        delayCategories.orange > 0 ? 'bg-orange-500 text-white' : 'bg-muted text-muted-foreground'
                      )}>
                        {delayCategories.orange}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className={cn(
                        'inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold',
                        delayCategories.red > 0 ? 'bg-danger text-danger-foreground' : 'bg-muted text-muted-foreground'
                      )}>
                        {delayCategories.red}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pilot Actions Modal */}
      <PilotActionsModal
        open={pilotModalOpen}
        onOpenChange={setPilotModalOpen}
        pilot={selectedPilot}
        actions={actions}
      />
    </div>
  );
};

export default TeamTrackingPage;
