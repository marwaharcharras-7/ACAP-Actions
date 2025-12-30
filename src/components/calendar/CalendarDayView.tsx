import { format, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Action, STATUS_LABELS, URGENCY_LABELS } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, AlertTriangle, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarDayViewProps {
  selectedDay: Date;
  actions: Action[];
  onActionClick: (action: Action) => void;
}

const CalendarDayView = ({ selectedDay, actions, onActionClick }: CalendarDayViewProps) => {
  const dayActions = actions.filter(action => 
    isSameDay(new Date(action.dueDate), selectedDay)
  );

  // Sort by urgency (high first) then by status
  const sortedActions = [...dayActions].sort((a, b) => {
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }
    const statusOrder = { late: 0, in_progress: 1, planned: 2, identified: 3, completed: 4, validated: 5 };
    return (statusOrder[a.status] || 6) - (statusOrder[b.status] || 6);
  });

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

  return (
    <div className="space-y-4">
      <div className="text-center py-4 border-b border-border">
        <h2 className="text-2xl font-bold text-foreground">
          {format(selectedDay, 'EEEE d MMMM yyyy', { locale: fr })}
        </h2>
        <p className="text-muted-foreground mt-1">
          {dayActions.length} action{dayActions.length !== 1 ? 's' : ''} prévue{dayActions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {sortedActions.length > 0 ? (
        <div className="space-y-3">
          {sortedActions.map((action) => (
            <Card 
              key={action.id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onActionClick(action)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {action.urgency === 'high' && (
                        <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
                      )}
                      <h3 className="font-semibold text-foreground truncate">
                        {action.title}
                      </h3>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {action.description}
                    </p>

                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{action.pilotName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{action.lineName || 'N/A'} / {action.postName || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{format(new Date(action.dueDate), 'HH:mm', { locale: fr })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge className={cn(getStatusBadgeClass(action.status))}>
                      {STATUS_LABELS[action.status]}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {URGENCY_LABELS[action.urgency]}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <Calendar className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">Aucune action prévue ce jour</p>
        </div>
      )}
    </div>
  );
};

export default CalendarDayView;
