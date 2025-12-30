import { useState, useMemo } from 'react';
import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Action, STATUS_LABELS, URGENCY_LABELS } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import SortableTableHeader, { SortDirection } from '@/components/common/SortableTableHeader';

interface DayActionsTableProps {
  selectedDay: Date | null;
  actions: Action[];
  onActionClick: (action: Action) => void;
}

const DayActionsTable = ({ selectedDay, actions, onActionClick }: DayActionsTableProps) => {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const dayActions = selectedDay 
    ? actions.filter(action => isSameDay(new Date(action.dueDate), selectedDay))
    : [];

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
    if (!sortKey || !sortDirection) return dayActions;

    return [...dayActions].sort((a, b) => {
      const aVal = a[sortKey as keyof Action];
      const bVal = b[sortKey as keyof Action];

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
  }, [dayActions, sortKey, sortDirection]);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'late': return 'bg-danger text-danger-foreground';
      case 'in_progress': return 'bg-primary text-primary-foreground';
      case 'completed': return 'bg-success text-success-foreground';
      case 'validated': return 'bg-success/80 text-success-foreground';
      case 'planned': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getUrgencyBadgeClass = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-danger/10 text-danger border-danger/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarIcon className="w-5 h-5" />
          {selectedDay 
            ? `Actions du ${format(selectedDay, 'EEEE d MMMM', { locale: fr })}`
            : 'Sélectionnez un jour'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedDay ? (
          dayActions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableTableHeader
                      label="Action"
                      sortKey="title"
                      currentSortKey={sortKey}
                      currentSortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableTableHeader
                      label="Pilote"
                      sortKey="pilotName"
                      currentSortKey={sortKey}
                      currentSortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableTableHeader
                      label="Statut"
                      sortKey="status"
                      currentSortKey={sortKey}
                      currentSortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <SortableTableHeader
                      label="Urgence"
                      sortKey="urgency"
                      currentSortKey={sortKey}
                      currentSortDirection={sortDirection}
                      onSort={handleSort}
                    />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedActions.map((action) => (
                    <TableRow 
                      key={action.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onActionClick(action)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {action.urgency === 'high' && (
                            <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
                          )}
                          <span className="truncate max-w-[200px]">{action.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>{action.pilotName}</TableCell>
                      <TableCell>
                        <Badge className={cn('text-xs', getStatusBadgeClass(action.status))}>
                          {STATUS_LABELS[action.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('text-xs', getUrgencyBadgeClass(action.urgency))}>
                          {URGENCY_LABELS[action.urgency]}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Aucune action prévue ce jour</p>
            </div>
          )
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Cliquez sur un jour pour voir les actions</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DayActionsTable;
