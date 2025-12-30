import { useMemo } from 'react';
import { 
  format, 
  eachDayOfInterval, 
  isSameDay,
  isToday,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Action } from '@/types';
import { cn } from '@/lib/utils';
import ActionTag from './ActionTag';

interface CalendarWeekGridProps {
  currentDate: Date;
  selectedDay: Date | null;
  onSelectDay: (date: Date) => void;
  actions: Action[];
  onActionClick: (action: Action) => void;
}

const CalendarWeekGrid = ({ 
  currentDate, 
  selectedDay, 
  onSelectDay, 
  actions,
  onActionClick 
}: CalendarWeekGridProps) => {
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: weekStart, end: weekEnd });
  }, [currentDate]);

  const getActionsForDay = (date: Date) => {
    return actions.filter(action => isSameDay(new Date(action.dueDate), date));
  };

  return (
    <div className="grid grid-cols-7 gap-2">
      {weekDays.map((day, index) => {
        const dayActions = getActionsForDay(day);
        const isSelected = selectedDay && isSameDay(day, selectedDay);
        const today = isToday(day);

        return (
          <div
            key={index}
            onClick={() => onSelectDay(day)}
            className={cn(
              'min-h-[300px] p-3 rounded-lg border transition-all cursor-pointer flex flex-col',
              'bg-card hover:bg-muted/50',
              isSelected && 'border-primary ring-2 ring-primary/20',
              today && 'border-primary',
              !isSelected && !today && 'border-border'
            )}
          >
            <div className="text-center mb-3">
              <div className="text-xs text-muted-foreground uppercase">
                {format(day, 'EEE', { locale: fr })}
              </div>
              <div className={cn(
                'text-lg font-semibold mt-1',
                today && 'bg-primary text-primary-foreground w-8 h-8 rounded-full flex items-center justify-center mx-auto'
              )}>
                {format(day, 'd')}
              </div>
            </div>
            
            <div className="flex-1 space-y-1 overflow-y-auto">
              {dayActions.map((action) => (
                <ActionTag
                  key={action.id}
                  action={action}
                  onClick={() => onActionClick(action)}
                />
              ))}
              {dayActions.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-4 opacity-50">
                  Aucune action
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CalendarWeekGrid;
