import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Plus, 
  Eye, 
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { 
  Action, 
  STATUS_LABELS, 
  TYPE_LABELS, 
  URGENCY_LABELS,
  CATEGORY_5M_LABELS,
  ActionStatus,
  UrgencyLevel
} from '@/types';
import { format, differenceInDays, isAfter, isBefore, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import ActionFormDialog from '@/components/actions/ActionFormDialog';
import ActionDetailsDialog from '@/components/actions/ActionDetailsDialog';
import ActionsFilters from '@/components/actions/ActionsFilters';
import OperatorActionFormDialog from '@/components/actions/OperatorActionFormDialog';
import ExportDropdown from '@/components/common/ExportDropdown';
import { ExportColumn } from '@/lib/exportUtils';

const ITEMS_PER_PAGE = 10;

interface FilterState {
  search: string;
  service: string;
  usine: string;
  ligne: string;
  equipe: string;
  poste: string;
  statut: string;
  urgence: string;
  type: string;
  periode: string;
}

const ActionsPage = () => {
  const { actions, deleteAction } = useData();
  const { user } = useAuth();
  const { toast } = useToast();

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    service: 'all',
    usine: 'all',
    ligne: 'all',
    equipe: 'all',
    poste: 'all',
    statut: 'all',
    urgence: 'all',
    type: 'all',
    periode: 'all',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isOperatorFormOpen, setIsOperatorFormOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // Check if date falls within period
  const isInPeriod = (date: string, period: string) => {
    const d = new Date(date);
    const now = new Date();
    
    switch (period) {
      case 'today':
        return d >= startOfDay(now) && d <= endOfDay(now);
      case 'week':
        return d >= startOfWeek(now, { locale: fr }) && d <= endOfWeek(now, { locale: fr });
      case 'month':
        return d >= startOfMonth(now) && d <= endOfMonth(now);
      case 'quarter':
        return d >= startOfQuarter(now) && d <= endOfQuarter(now);
      case 'year':
        return d >= startOfYear(now) && d <= endOfYear(now);
      default:
        return true;
    }
  };

  // Filter actions based on all filters - EXCLUDE archived actions (they only show in archive page)
  const filteredActions = useMemo(() => {
    return actions.filter(action => {
      // Exclude archived actions from this page
      if (action.status === 'archived') return false;
      
      // Search filter - searches in multiple fields
      const searchLower = filters.search.toLowerCase();
      const matchesSearch = filters.search === '' || 
        action.problem.toLowerCase().includes(searchLower) ||
        (action.rootCause?.toLowerCase().includes(searchLower) || false) ||
        action.title.toLowerCase().includes(searchLower) ||
        action.pilotName.toLowerCase().includes(searchLower) ||
        (action.serviceName?.toLowerCase().includes(searchLower) || false) ||
        (action.lineName?.toLowerCase().includes(searchLower) || false) ||
        (action.teamName?.toLowerCase().includes(searchLower) || false) ||
        (action.postName?.toLowerCase().includes(searchLower) || false) ||
        (action.category5M && CATEGORY_5M_LABELS[action.category5M].toLowerCase().includes(searchLower));

      // Hierarchical filters
      const matchesService = filters.service === 'all' || action.serviceId === filters.service;
      const matchesLigne = filters.ligne === 'all' || action.lineId === filters.ligne;
      const matchesEquipe = filters.equipe === 'all' || action.teamId === filters.equipe;
      const matchesPoste = filters.poste === 'all' || action.postId === filters.poste;

      // Operational filters
      const matchesStatut = filters.statut === 'all' || action.status === filters.statut;
      const matchesUrgence = filters.urgence === 'all' || action.urgency === filters.urgence;
      const matchesType = filters.type === 'all' || action.type === filters.type;
      const matchesPeriode = filters.periode === 'all' || isInPeriod(action.createdAt, filters.periode);

      return matchesSearch && matchesService && matchesLigne && matchesEquipe && 
             matchesPoste && matchesStatut && matchesUrgence && matchesType && matchesPeriode;
    });
  }, [actions, filters]);

  // Sorting
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedActions = useMemo(() => {
    if (!sortKey || !sortDirection) return filteredActions;

    return [...filteredActions].sort((a, b) => {
      let aVal: any = (a as any)[sortKey];
      let bVal: any = (b as any)[sortKey];

      // Handle dates
      if (sortKey === 'createdAt' || sortKey === 'dueDate') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredActions, sortKey, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedActions.length / ITEMS_PER_PAGE);
  const paginatedActions = sortedActions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleViewDetails = (action: Action) => {
    setSelectedAction(action);
    setIsDetailsOpen(true);
  };

  // Export columns configuration
  const exportColumns: ExportColumn[] = [
    { header: 'Problème', key: 'problem' },
    { header: 'Catégorie 5M', key: 'category5MLabel' },
    { header: 'Cause racine', key: 'rootCause' },
    { header: 'Action', key: 'title' },
    { header: 'Type', key: 'typeLabel' },
    { header: 'Urgence', key: 'urgencyLabel' },
    { header: 'Statut', key: 'statusLabel' },
    { header: 'Pilote', key: 'pilotName' },
    { header: 'Périmètre', key: 'perimeter' },
    { header: 'Date création', key: 'createdAtFormatted' },
    { header: 'Échéance', key: 'dueDateFormatted' },
    { header: 'Jours ouv.', key: 'daysOpen' },
    { header: '% Efficacité', key: 'efficiencyLabel' },
    { header: '% Avancement', key: 'progressLabel' },
  ];

  const exportData = filteredActions.map(action => ({
    ...action,
    category5MLabel: action.category5M ? CATEGORY_5M_LABELS[action.category5M] : '-',
    typeLabel: TYPE_LABELS[action.type],
    urgencyLabel: URGENCY_LABELS[action.urgency],
    statusLabel: STATUS_LABELS[action.status],
    perimeter: [action.serviceName, action.lineName, action.teamName, action.postName].filter(Boolean).join(' > '),
    createdAtFormatted: format(new Date(action.createdAt), 'dd/MM/yyyy'),
    dueDateFormatted: format(new Date(action.dueDate), 'dd/MM/yyyy'),
    daysOpen: Math.max(0, differenceInDays(new Date(action.dueDate), new Date(action.createdAt))),
    efficiencyLabel: action.efficiencyPercent ? `${action.efficiencyPercent}%` : '-',
    progressLabel: `${action.progressPercent}%`,
  }));

  const getStatusBadgeClass = (status: ActionStatus) => {
    switch (status) {
      case 'identified': return 'status-identified';
      case 'planned': return 'status-planned';
      case 'in_progress': return 'status-in-progress';
      case 'completed': return 'status-completed';
      case 'late': return 'status-late';
      case 'validated': return 'status-validated';
      case 'archived': return 'status-archived';
      default: return '';
    }
  };

  const getUrgencyBadgeClass = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'low': return 'urgency-low';
      case 'medium': return 'urgency-medium';
      case 'high': return 'urgency-high';
      default: return '';
    }
  };

  // Permission checks based on role
  const isOperator = user?.role === 'operator';
  const canCreate = !isOperator;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Actions</h1>
          <p className="text-muted-foreground">
            {filteredActions.length} action{filteredActions.length > 1 ? 's' : ''} trouvée{filteredActions.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportDropdown
            data={exportData}
            columns={exportColumns}
            filename="actions"
            title="Liste des Actions"
          />
          
          {canCreate && (
            <Button 
              className="gradient-primary text-primary-foreground gap-2"
              onClick={() => {
                setSelectedAction(null);
                setIsFormOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Ajouter</span>
            </Button>
          )}
          
          {isOperator && (
            <Button 
              className="gradient-primary text-primary-foreground gap-2"
              onClick={() => setIsOperatorFormOpen(true)}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Signaler</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filters - Sticky */}
      <div className="sticky top-0 z-10 bg-background pb-4">
        <ActionsFilters filters={filters} onFilterChange={handleFilterChange} />
      </div>

      {/* Table - Scrollable */}
      <div className="flex-1 bg-card rounded-xl border border-border shadow-card overflow-hidden max-w-full">
        <div className="overflow-x-auto max-w-full">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <SortableTableHeader label="Problème" sortKey="problem" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={handleSort} />
                <SortableTableHeader label="Cat. 5M" sortKey="category5M" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={handleSort} />
                <SortableTableHeader label="Cause racine" sortKey="rootCause" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={handleSort} />
                <SortableTableHeader label="Action" sortKey="title" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={handleSort} />
                <SortableTableHeader label="Type" sortKey="type" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={handleSort} />
                <SortableTableHeader label="Urgence" sortKey="urgency" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={handleSort} />
                <SortableTableHeader label="Statut" sortKey="status" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={handleSort} />
                <SortableTableHeader label="Pilote" sortKey="pilotName" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={handleSort} />
                <SortableTableHeader label="Périmètre" sortKey="serviceName" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={handleSort} />
                <SortableTableHeader label="Création" sortKey="createdAt" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={handleSort} />
                <SortableTableHeader label="Échéance" sortKey="dueDate" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={handleSort} />
                <SortableTableHeader label="Jours" sortKey="daysOpen" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={handleSort} className="text-center" />
                <SortableTableHeader label="Eff. %" sortKey="efficiencyPercent" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={handleSort} className="text-center" />
                <SortableTableHeader label="Avanc. %" sortKey="progressPercent" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={handleSort} className="text-center" />
                <TableHead className="font-semibold text-xs uppercase tracking-wide whitespace-nowrap text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedActions.length > 0 ? (
                paginatedActions.map((action) => {
                  // Days open = due_date - created_at (cannot be negative)
                  const daysOpenRaw = differenceInDays(new Date(action.dueDate), new Date(action.createdAt));
                  const daysOpen = Math.max(0, daysOpenRaw);
                  const perimeter = [action.serviceName, action.lineName, action.teamName, action.postName]
                    .filter(Boolean)
                    .join(' > ');

                  return (
                    <TableRow key={action.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="max-w-[150px] truncate text-sm" title={action.problem}>
                        {action.problem}
                      </TableCell>
                      <TableCell className="text-sm">
                        {action.category5M ? (
                          <Badge variant="secondary" className="text-xs">
                            {CATEGORY_5M_LABELS[action.category5M].split(' ')[0]}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="max-w-[120px] truncate text-sm text-muted-foreground" title={action.rootCause}>
                        {action.rootCause || '-'}
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate font-medium text-sm" title={action.title}>
                        {action.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(
                          'text-xs',
                          action.type === 'corrective' ? 'border-primary text-primary' : 'border-accent text-accent'
                        )}>
                          {TYPE_LABELS[action.type]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('text-xs', getUrgencyBadgeClass(action.urgency))}>
                          {URGENCY_LABELS[action.urgency]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn('border text-xs', getStatusBadgeClass(action.status))}>
                          {STATUS_LABELS[action.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">{action.pilotName}</TableCell>
                      <TableCell className="max-w-[120px] truncate text-sm text-muted-foreground" title={perimeter}>
                        {perimeter || '-'}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {format(new Date(action.createdAt), 'dd/MM/yy', { locale: fr })}
                      </TableCell>
                      <TableCell className="text-sm whitespace-nowrap">
                        {format(new Date(action.dueDate), 'dd/MM/yy', { locale: fr })}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {daysOpen}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {action.efficiencyPercent !== undefined ? `${action.efficiencyPercent}%` : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${action.progressPercent}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground w-8">
                            {action.progressPercent}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewDetails(action)}
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={15} className="text-center py-12 text-muted-foreground">
                    Aucune action trouvée
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Affichage {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredActions.length)} sur {filteredActions.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <ActionFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        action={selectedAction}
      />
      
      <ActionDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        action={selectedAction}
      />
      
      <OperatorActionFormDialog
        open={isOperatorFormOpen}
        onOpenChange={setIsOperatorFormOpen}
      />
    </div>
  );
};

export default ActionsPage;
