import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import StatsCard from '@/components/dashboard/StatsCard';
import StatusChart from '@/components/dashboard/StatusChart';
import MonthlyChart from '@/components/dashboard/MonthlyChart';
import DeadlineChart from '@/components/dashboard/DeadlineChart';
import UrgentActionsTable from '@/components/dashboard/UrgentActionsTable';
import TopPerformers from '@/components/dashboard/TopPerformers';
import DashboardFilters from '@/components/dashboard/DashboardFilters';
import ExportDropdown from '@/components/common/ExportDropdown';
import { getStatusChartData, getMonthlyChartData } from '@/data/mockData';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Target,
} from 'lucide-react';
import { STATUS_LABELS, TYPE_LABELS, URGENCY_LABELS, CATEGORY_5M_LABELS } from '@/types';
import { ExportColumn } from '@/lib/exportUtils';

const DashboardPage = () => {
  const { actions, users } = useData();
  const { user } = useAuth();

  const [filters, setFilters] = useState({
    service: 'all',
    usine: 'all',
    ligne: 'all',
    poste: 'all',
    equipe: 'all',
    statut: 'all',
    periode: 'all',
  });

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Filter actions based on filters
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

  // Exclude archived actions from dashboard - they only show in archive page
  const filteredActions = useMemo(() => {
    return actions.filter(action => {
      // Exclude archived actions
      if (action.status === 'archived') return false;
      
      const matchesService = filters.service === 'all' || action.serviceId === filters.service;
      const matchesLigne = filters.ligne === 'all' || action.lineId === filters.ligne;
      const matchesEquipe = filters.equipe === 'all' || action.teamId === filters.equipe;
      const matchesPoste = filters.poste === 'all' || action.postId === filters.poste;
      const matchesStatut = filters.statut === 'all' || action.status === filters.statut;
      const matchesPeriode = filters.periode === 'all' || isInPeriod(action.createdAt, filters.periode);

      return matchesService && matchesLigne && matchesEquipe && matchesPoste && matchesStatut && matchesPeriode;
    });
  }, [actions, filters]);

  // Calculate stats from filtered actions
  const stats = useMemo(() => {
    const total = filteredActions.length;
    const inProgress = filteredActions.filter(a => a.status === 'in_progress').length;
    const planned = filteredActions.filter(a => a.status === 'planned').length;
    const late = filteredActions.filter(a => a.status === 'late').length;
    const completed = filteredActions.filter(a => a.status === 'completed').length;
    const validated = filteredActions.filter(a => a.status === 'validated').length;
    
    const onTimeActions = filteredActions.filter(a => 
      (a.status === 'completed' || a.status === 'validated') && 
      new Date(a.completedAt || a.validatedAt || a.updatedAt) <= new Date(a.dueDate)
    ).length;
    const finishedActions = completed + validated;
    const onTimeRate = finishedActions > 0 ? Math.round((onTimeActions / finishedActions) * 100) : 0;
    
    const efficiencies = filteredActions
      .filter(a => a.efficiencyPercent !== null && a.efficiencyPercent !== undefined)
      .map(a => a.efficiencyPercent as number);
    const avgEfficiency = efficiencies.length > 0 
      ? Math.round(efficiencies.reduce((sum, e) => sum + e, 0) / efficiencies.length) 
      : 0;

    return {
      totalActions: total,
      inProgress,
      planned,
      late,
      completed,
      validated,
      onTimeRate,
      avgEfficiency,
    };
  }, [filteredActions]);

  // Export configuration
  const exportColumns: ExportColumn[] = [
    { header: 'Titre', key: 'title' },
    { header: 'Problème', key: 'problem' },
    { header: 'Type', key: 'typeLabel' },
    { header: 'Statut', key: 'statusLabel' },
    { header: 'Urgence', key: 'urgencyLabel' },
    { header: 'Pilote', key: 'pilotName' },
    { header: 'Échéance', key: 'dueDateFormatted' },
    { header: 'Avancement', key: 'progressLabel' },
  ];

  const exportData = filteredActions.map(action => ({
    ...action,
    typeLabel: TYPE_LABELS[action.type],
    statusLabel: STATUS_LABELS[action.status],
    urgencyLabel: URGENCY_LABELS[action.urgency],
    dueDateFormatted: format(new Date(action.dueDate), 'dd/MM/yyyy'),
    progressLabel: `${action.progressPercent}%`,
  }));

  const statusChartData = getStatusChartData(filteredActions);
  const monthlyChartData = getMonthlyChartData(filteredActions);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Welcome message */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-up">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">
            Bonjour, {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Voici l'état actuel de vos actions correctives et préventives
          </p>
        </div>
        <ExportDropdown
          data={exportData}
          columns={exportColumns}
          filename="dashboard_actions"
          title="Tableau de Bord - Actions"
        />
      </div>

      {/* Global Filters */}
      <DashboardFilters filters={filters} onFilterChange={handleFilterChange} />

      {/* KPI Cards - Max 3 per row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <StatsCard
          title="Nombre total d'actions"
          value={stats.totalActions}
          subtitle="Toutes les actions"
          icon={ClipboardList}
          variant="primary"
        />
        <StatsCard
          title="Actions en cours"
          value={stats.inProgress}
          subtitle={`${stats.planned} prévues`}
          icon={Clock}
          variant="info"
        />
        <StatsCard
          title="Actions en retard"
          value={stats.late}
          subtitle="À traiter en priorité"
          icon={AlertTriangle}
          variant="danger"
        />
        <StatsCard
          title="Actions finalisées"
          value={stats.completed + stats.validated}
          subtitle={`${stats.validated} validées`}
          icon={CheckCircle2}
          variant="success"
        />
        <StatsCard
          title="Performance (respect délais)"
          value={`${stats.onTimeRate}%`}
          icon={TrendingUp}
          variant="success"
          trend={{ value: 5, isPositive: true }}
        />
        <StatsCard
          title="Taux d'efficacité"
          value={`${stats.avgEfficiency}%`}
          icon={Target}
          variant="primary"
        />
      </div>

      {/* Charts - Full width */}
      <div className="space-y-4 md:space-y-6">
        <MonthlyChart 
          data={monthlyChartData} 
          title="Actions créées / finalisées / validées par mois" 
        />
        <StatusChart 
          data={statusChartData} 
          title="Répartition des actions par statut" 
        />
        <DeadlineChart actions={filteredActions} />
      </div>

      {/* Urgent Actions Table - Full width */}
      <UrgentActionsTable actions={filteredActions} />

      {/* Top Performers - Full width */}
      <TopPerformers actions={filteredActions} users={users} />
    </div>
  );
};

export default DashboardPage;
