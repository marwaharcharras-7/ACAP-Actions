import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Action, STATUS_LABELS } from '@/types';
import { AlertTriangle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface UrgentActionsTableProps {
  actions: Action[];
  title?: string;
}

const UrgentActionsTable = ({ actions, title = 'Actions urgentes' }: UrgentActionsTableProps) => {
  const urgentActions = actions
    .filter(a => a.urgency === 'high' || a.status === 'late')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'identified': return 'status-identified';
      case 'planned': return 'status-planned';
      case 'in_progress': return 'status-in-progress';
      case 'completed': return 'status-completed';
      case 'late': return 'status-late';
      case 'validated': return 'status-validated';
      default: return 'status-archived';
    }
  };

  return (
    <Card className="shadow-card border-border/50 animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-danger" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {urgentActions.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-medium">Action</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Responsable</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Statut</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Échéance</TableHead>
                  <TableHead className="text-muted-foreground font-medium text-center">Urgence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {urgentActions.map((action) => (
                  <TableRow 
                    key={action.id} 
                    className="border-border hover:bg-muted/50 cursor-pointer"
                  >
                    <TableCell className="font-medium text-foreground max-w-[200px] truncate">
                      {action.title}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {action.pilotName}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={cn('text-xs', getStatusBadgeClass(action.status))}
                      >
                        {STATUS_LABELS[action.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(action.dueDate), 'dd MMM yyyy', { locale: fr })}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {(action.status === 'late' || action.urgency === 'high') && (
                        <AlertTriangle className="w-5 h-5 text-danger mx-auto" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucune action urgente</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UrgentActionsTable;
