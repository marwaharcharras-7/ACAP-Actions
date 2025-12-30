import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Search,
} from 'lucide-react';
import { 
  format, 
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { Action, STATUS_LABELS, TYPE_LABELS, URGENCY_LABELS } from '@/types';
import CalendarFilters, { CalendarFilterState } from '@/components/calendar/CalendarFilters';
import CalendarKPIs from '@/components/calendar/CalendarKPIs';
import CalendarMonthGrid from '@/components/calendar/CalendarMonthGrid';
import CalendarWeekGrid from '@/components/calendar/CalendarWeekGrid';
import CalendarDayView from '@/components/calendar/CalendarDayView';
import DayActionsTable from '@/components/calendar/DayActionsTable';
import ActionDetailsDialog from '@/components/actions/ActionDetailsDialog';
import ExportDropdown from '@/components/common/ExportDropdown';
import { ExportColumn } from '@/lib/exportUtils';

type CalendarView = 'month' | 'week' | 'day';

const CalendarPage = () => {
  const navigate = useNavigate();
  const { actions, users } = useData();
  const { user } = useAuth();
  
  const [view, setView] = useState<CalendarView>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [filters, setFilters] = useState<CalendarFilterState>({
    usine: 'all',
    service: 'all',
    ligne: 'all',
    poste: 'all',
    pilote: 'all',
    statut: 'all',
  });

  // Get pilots (users who can be action pilots)
  const pilots = useMemo(() => {
    return users.filter(u => u.role !== 'admin');
  }, [users]);

  // Filter actions based on user's scope, filters, and search query - EXCLUDE archived actions
  const filteredActions = useMemo(() => {
    // Start by excluding archived actions
    let result = actions.filter(a => a.status !== 'archived');

    // Filter by user's scope (personalized view)
    if (user && user.role !== 'admin') {
      result = result.filter(action => {
        // User can see actions in their scope or assigned to them
        const isAssigned = action.pilotId === user.id;
        const inUserService = !user.serviceId || action.serviceId === user.serviceId;
        const inUserLine = !user.lineId || action.lineId === user.lineId;
        const inUserTeam = !user.teamId || action.teamId === user.teamId;
        const inUserPost = !user.postId || action.postId === user.postId;
        
        // Scope based on role
        switch (user.role) {
          case 'manager':
            return inUserService || isAssigned;
          case 'supervisor':
            return (inUserService && inUserLine) || isAssigned;
          case 'team_leader':
            return (inUserService && inUserLine && inUserTeam) || isAssigned;
          case 'operator':
            return isAssigned;
          default:
            return isAssigned;
        }
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(a => 
        a.title.toLowerCase().includes(query) || 
        a.problem.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filters.service !== 'all') {
      result = result.filter(a => 
        a.serviceName?.toLowerCase().includes(filters.service.toLowerCase())
      );
    }
    if (filters.ligne !== 'all') {
      result = result.filter(a => 
        a.lineName?.includes(filters.ligne) || a.lineId === filters.ligne
      );
    }
    if (filters.poste !== 'all') {
      result = result.filter(a => 
        a.postName?.includes(filters.poste) || a.postId === filters.poste
      );
    }
    if (filters.pilote !== 'all') {
      result = result.filter(a => a.pilotId === filters.pilote);
    }
    if (filters.statut !== 'all') {
      if (filters.statut === 'near_deadline') {
        const now = new Date();
        result = result.filter(a => {
          const dueDate = new Date(a.dueDate);
          const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          return daysUntilDue >= 0 && daysUntilDue <= 3 && 
            a.status !== 'completed' && a.status !== 'validated';
        });
      } else {
        result = result.filter(a => a.status === filters.statut);
      }
    }

    return result;
  }, [actions, user, filters, searchQuery]);

  // KPIs calculation
  const kpis = useMemo(() => {
    const now = new Date();
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const thisWeekActions = filteredActions.filter(action => {
      const dueDate = new Date(action.dueDate);
      return dueDate >= thisWeekStart && dueDate <= thisWeekEnd;
    });

    const lateActions = filteredActions.filter(action => action.status === 'late');
    
    const nearDeadline = filteredActions.filter(action => {
      const dueDate = new Date(action.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilDue >= 0 && daysUntilDue <= 3 && 
        action.status !== 'completed' && action.status !== 'validated';
    });

    return {
      total: filteredActions.length,
      thisWeek: thisWeekActions.length,
      late: lateActions.length,
      nearDeadline: nearDeadline.length,
    };
  }, [filteredActions]);

  // Handle filter change
  const handleFilterChange = useCallback((key: keyof CalendarFilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  // Navigation handlers
  const handlePrev = () => {
    switch (view) {
      case 'month':
        setCurrentDate(subMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(subDays(currentDate, 1));
        setSelectedDay(subDays(selectedDay || currentDate, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (view) {
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        setSelectedDay(addDays(selectedDay || currentDate, 1));
        break;
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(new Date());
  };

  const handleSelectDay = (date: Date) => {
    setSelectedDay(date);
  };

  const handleActionClick = (action: Action) => {
    setSelectedAction(action);
    setDetailsOpen(true);
  };

  // Get navigation title based on view
  const getNavigationTitle = () => {
    switch (view) {
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: fr });
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `${format(weekStart, 'd MMM', { locale: fr })} - ${format(weekEnd, 'd MMM yyyy', { locale: fr })}`;
      case 'day':
        return format(selectedDay || currentDate, 'EEEE d MMMM yyyy', { locale: fr });
    }
  };

  // Legend component
  const Legend = () => (
    <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-success" />
        <span className="text-xs text-muted-foreground">Finalisée</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-primary" />
        <span className="text-xs text-muted-foreground">En cours</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-warning" />
        <span className="text-xs text-muted-foreground">Prévue</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-warning/80" />
        <span className="text-xs text-muted-foreground">Délai proche</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-danger" />
        <span className="text-xs text-muted-foreground">En retard</span>
      </div>
    </div>
  );

  // Export configuration
  const exportColumns: ExportColumn[] = [
    { header: 'Titre', key: 'title' },
    { header: 'Problème', key: 'problem' },
    { header: 'Type', key: 'typeLabel' },
    { header: 'Statut', key: 'statusLabel' },
    { header: 'Urgence', key: 'urgencyLabel' },
    { header: 'Pilote', key: 'pilotName' },
    { header: 'Échéance', key: 'dueDateFormatted' },
  ];

  const exportData = filteredActions.map(action => ({
    ...action,
    typeLabel: TYPE_LABELS[action.type],
    statusLabel: STATUS_LABELS[action.status],
    urgencyLabel: URGENCY_LABELS[action.urgency],
    dueDateFormatted: format(new Date(action.dueDate), 'dd/MM/yyyy'),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendrier</h1>
          <p className="text-muted-foreground">Visualisez les échéances de vos actions</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher par titre ou problème..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <ExportDropdown
            data={exportData}
            columns={exportColumns}
            filename="calendrier_actions"
            title="Calendrier - Actions"
          />
        </div>
      </div>
      <CalendarKPIs 
        total={kpis.total}
        thisWeek={kpis.thisWeek}
        late={kpis.late}
        nearDeadline={kpis.nearDeadline}
      />

      {/* Calendar Card */}
      <Card className="shadow-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* View selector */}
            <Tabs value={view} onValueChange={(v) => setView(v as CalendarView)}>
              <TabsList>
                <TabsTrigger value="month">Mois</TabsTrigger>
                <TabsTrigger value="week">Semaine</TabsTrigger>
                <TabsTrigger value="day">Jour</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrev}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="min-w-[200px] text-center">
                <span className="text-lg font-semibold capitalize">
                  {getNavigationTitle()}
                </span>
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={handleNext}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleToday}
              >
                Aujourd'hui
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Calendar Views */}
          {view === 'month' && (
            <CalendarMonthGrid
              currentDate={currentDate}
              selectedDay={selectedDay}
              onSelectDay={handleSelectDay}
              actions={filteredActions}
              onActionClick={handleActionClick}
            />
          )}
          
          {view === 'week' && (
            <CalendarWeekGrid
              currentDate={currentDate}
              selectedDay={selectedDay}
              onSelectDay={handleSelectDay}
              actions={filteredActions}
              onActionClick={handleActionClick}
            />
          )}
          
          {view === 'day' && selectedDay && (
            <CalendarDayView
              selectedDay={selectedDay}
              actions={filteredActions}
              onActionClick={handleActionClick}
            />
          )}

          {/* Legend */}
          <Legend />
        </CardContent>
      </Card>

      {/* Day Actions Table (for month and week views) */}
      {(view === 'month' || view === 'week') && (
        <DayActionsTable
          selectedDay={selectedDay}
          actions={filteredActions}
          onActionClick={handleActionClick}
        />
      )}

      {/* Action Details Dialog */}
      {selectedAction && (
        <ActionDetailsDialog
          action={selectedAction}
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}
    </div>
  );
};

export default CalendarPage;
