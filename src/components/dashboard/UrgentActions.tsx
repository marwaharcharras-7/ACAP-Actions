import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Action, STATUS_LABELS, URGENCY_LABELS } from '@/types';
import { AlertTriangle, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface UrgentActionsProps {
  actions: Action[];
  title?: string;
}

const UrgentActions = ({ actions, title = 'Actions urgentes' }: UrgentActionsProps) => {
  const urgentActions = actions
    .filter(a => a.urgency === 'high' || a.status === 'late')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 5);

  const getUrgencyClass = (action: Action) => {
    if (action.status === 'late') return 'border-l-danger';
    if (action.urgency === 'high') return 'border-l-warning';
    return 'border-l-info';
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
          <div className="space-y-3">
            {urgentActions.map((action) => (
              <div
                key={action.id}
                className={cn(
                  'p-4 rounded-lg border border-border bg-background/50 border-l-4 hover:bg-muted/50 transition-colors cursor-pointer',
                  getUrgencyClass(action)
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground truncate">{action.title}</h4>
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {action.problem}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'shrink-0',
                      action.status === 'late' ? 'status-late' : 
                      action.urgency === 'high' ? 'urgency-high' : 'urgency-medium'
                    )}
                  >
                    {action.status === 'late' ? 'En retard' : URGENCY_LABELS[action.urgency]}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{action.pilotName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{format(new Date(action.dueDate), 'dd MMM yyyy', { locale: fr })}</span>
                  </div>
                </div>
              </div>
            ))}
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

export default UrgentActions;
