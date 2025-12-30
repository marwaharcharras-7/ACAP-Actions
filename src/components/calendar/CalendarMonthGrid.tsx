import { useMemo } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  isToday,
  startOfWeek,
  endOfWeek
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Action } from '@/types';
import { cn } from '@/lib/utils';
import ActionTag from './ActionTag';

interface CalendarMonthGridProps {
  currentDate: Date;
  selectedDay: Date | null;
  onSelectDay: (date: Date) => void;
  actions: Action[];
  onActionClick: (action: Action) => void;
}

const CalendarMonthGrid = ({ 
  currentDate, 
  selectedDay, 
  onSelectDay, 
  actions,
  onActionClick 
}: CalendarMonthGridProps) => {
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const getActionsForDay = (date: Date) => {
    return actions.filter(action => isSameDay(new Date(action.dueDate), date));
  };

  return (
    <div>
      {/* Week days header */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const dayActions = getActionsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          const today = isToday(day);

          return (
            <button
              key={index}
              onClick={() => onSelectDay(day)}
              className={cn(
                'relative min-h-[100px] p-2 rounded-lg border transition-all text-left flex flex-col',
                isCurrentMonth 
                  ? 'bg-card hover:bg-muted/50' 
                  : 'bg-muted/30 text-muted-foreground',
                isSelected && 'border-primary ring-2 ring-primary/20',
                today && 'border-primary',
                !isSelected && !today && 'border-border'
              )}
            >
              <span className={cn(
                'text-sm font-medium mb-1',
                today && 'bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center',
                !isCurrentMonth && 'text-muted-foreground'
              )}>
                {format(day, 'd')}
              </span>
              
              {dayActions.length > 0 && (
                <div className="flex-1 space-y-1 overflow-hidden">
                  {dayActions.slice(0, 3).map((action) => (
                    <ActionTag
                      key={action.id}
                      action={action}
                      onClick={() => onActionClick(action)}
                    />
                  ))}
                  {dayActions.length > 3 && (
                    <span className="text-xs text-muted-foreground font-medium">
                      +{dayActions.length - 3} autres
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarMonthGrid;
