import { Action } from '@/types';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ActionTagProps {
  action: Action;
  onClick?: () => void;
  compact?: boolean;
}

const ActionTag = ({ action, onClick, compact = false }: ActionTagProps) => {
  const getStatusColor = () => {
    // Check for near deadline (within 3 days)
    const dueDate = new Date(action.dueDate);
    const now = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isNearDeadline = daysUntilDue >= 0 && daysUntilDue <= 3 && 
      action.status !== 'completed' && action.status !== 'validated';

    if (action.status === 'late') return 'bg-danger text-danger-foreground';
    if (isNearDeadline) return 'bg-warning text-warning-foreground';
    if (action.status === 'completed' || action.status === 'validated') return 'bg-success text-success-foreground';
    if (action.status === 'in_progress') return 'bg-primary text-primary-foreground';
    if (action.status === 'planned') return 'bg-warning/80 text-warning-foreground';
    return 'bg-muted text-muted-foreground';
  };

  const lineDisplay = action.lineName ? `L${action.lineName.replace('Ligne ', '')}` : '';
  const postDisplay = action.postName ? `/ ${action.postName}` : '';

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={cn(
          'h-1.5 rounded-full cursor-pointer transition-all hover:scale-110',
          getStatusColor()
        )}
        title={`${action.title} ${lineDisplay} ${postDisplay}`}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'px-2 py-1 rounded text-xs font-medium cursor-pointer transition-all hover:opacity-80 flex items-center gap-1 truncate',
        getStatusColor()
      )}
    >
      {action.urgency === 'high' && (
        <AlertTriangle className="w-3 h-3 shrink-0" />
      )}
      <span className="truncate">{action.title}</span>
      {(lineDisplay || postDisplay) && (
        <span className="text-[10px] opacity-80 shrink-0">{lineDisplay} {postDisplay}</span>
      )}
    </div>
  );
};

export default ActionTag;
