import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { Action, STATUS_LABELS, TYPE_LABELS, URGENCY_LABELS, CATEGORY_5M_LABELS } from "@/types";
import { Archive } from "lucide-react";
import ArchivedActionsFilters from "@/components/archived/ArchivedActionsFilters";
import ArchivedActionsKPIs from "@/components/archived/ArchivedActionsKPIs";
import ArchivedActionsTable from "@/components/archived/ArchivedActionsTable";
import ArchivedActionDetailPanel from "@/components/archived/ArchivedActionDetailPanel";
import ExportDropdown from "@/components/common/ExportDropdown";
import { ExportColumn } from "@/lib/exportUtils";
import { format } from "date-fns";
import { toast } from "sonner";

interface ArchivedFilters {
  dateStart: string;
  dateEnd: string;
  factory: string;
  service: string;
  line: string;
  team: string;
  post: string;
  search: string;
}

const ArchivedActionsPage = () => {
  const { user } = useAuth();
  const { actions } = useData();
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [filters, setFilters] = useState<ArchivedFilters>({
    dateStart: "",
    dateEnd: "",
    factory: "all",
    service: "all",
    line: "all",
    team: "all",
    post: "all",
    search: "",
  });

  // Filter archived actions based on user scope
  const archivedActions = useMemo(() => {
    if (!user) return [];

    // Get only archived actions
    let filtered = actions.filter((action) => action.status === "archived");

    // Filter by user scope
    switch (user.role) {
      case "operator":
        filtered = filtered.filter(
          (a) =>
            a.pilotId === user.id ||
            (a.postId === user.postId && a.teamId === user.teamId)
        );
        break;
      case "team_leader":
        filtered = filtered.filter(
          (a) => a.teamId === user.teamId || a.lineId === user.lineId
        );
        break;
      case "supervisor":
        filtered = filtered.filter(
          (a) => a.lineId === user.lineId || a.serviceId === user.serviceId
        );
        break;
      case "manager":
        filtered = filtered.filter((a) => a.serviceId === user.serviceId);
        break;
    }

    return filtered;
  }, [actions, user]);

  // Apply filters
  const filteredActions = useMemo(() => {
    let result = [...archivedActions];

    // Date range filter
    if (filters.dateStart) {
      const startDate = new Date(filters.dateStart);
      result = result.filter((a) => new Date(a.createdAt) >= startDate);
    }
    if (filters.dateEnd) {
      const endDate = new Date(filters.dateEnd);
      endDate.setHours(23, 59, 59, 999);
      result = result.filter((a) => new Date(a.createdAt) <= endDate);
    }

    // Service filter
    if (filters.service !== "all") {
      result = result.filter((a) => a.serviceId === filters.service);
    }

    // Line filter
    if (filters.line !== "all") {
      result = result.filter((a) => a.lineId === filters.line);
    }

    // Team filter
    if (filters.team !== "all") {
      result = result.filter((a) => a.teamId === filters.team);
    }

    // Post filter
    if (filters.post !== "all") {
      result = result.filter((a) => a.postId === filters.post);
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (a) =>
          a.problem.toLowerCase().includes(searchLower) ||
          a.description.toLowerCase().includes(searchLower) ||
          a.pilotName.toLowerCase().includes(searchLower) ||
          (a.category5M && a.category5M.toLowerCase().includes(searchLower))
      );
    }

    return result;
  }, [archivedActions, filters]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const archivedThisMonth = filteredActions.filter((a) =>
      a.validatedAt ? new Date(a.validatedAt) >= thisMonth : false
    ).length;

    const withCompletion = filteredActions.filter(
      (a) => a.completedAt && a.dueDate
    );
    const onTime = withCompletion.filter(
      (a) => new Date(a.completedAt!) <= new Date(a.dueDate)
    ).length;
    const late = withCompletion.length - onTime;

    const onTimePercent =
      withCompletion.length > 0
        ? Math.round((onTime / withCompletion.length) * 100)
        : 0;
    const latePercent =
      withCompletion.length > 0
        ? Math.round((late / withCompletion.length) * 100)
        : 0;

    return {
      totalArchived: filteredActions.length,
      archivedThisMonth,
      onTimePercent,
      latePercent,
    };
  }, [filteredActions]);

  const handleFilterChange = (key: keyof ArchivedFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleViewDetails = (action: Action) => {
    setSelectedAction(action);
  };

  const handleCloseDetails = () => {
    setSelectedAction(null);
  };

  // Export configuration
  const exportColumns: ExportColumn[] = [
    { header: 'Titre', key: 'title' },
    { header: 'Problème', key: 'problem' },
    { header: 'Type', key: 'typeLabel' },
    { header: 'Catégorie 5M', key: 'category5MLabel' },
    { header: 'Pilote', key: 'pilotName' },
    { header: 'Date création', key: 'createdAtFormatted' },
    { header: 'Date validation', key: 'validatedAtFormatted' },
    { header: 'Efficacité', key: 'efficiencyLabel' },
  ];

  const exportData = filteredActions.map(action => ({
    ...action,
    typeLabel: TYPE_LABELS[action.type],
    category5MLabel: action.category5M ? CATEGORY_5M_LABELS[action.category5M] : '-',
    createdAtFormatted: format(new Date(action.createdAt), 'dd/MM/yyyy'),
    validatedAtFormatted: action.validatedAt ? format(new Date(action.validatedAt), 'dd/MM/yyyy') : '-',
    efficiencyLabel: action.efficiencyPercent ? `${action.efficiencyPercent}%` : '-',
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <Archive className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Actions Archivées</h1>
            <p className="text-sm text-muted-foreground">
              Historique des actions correctives et préventives finalisées
            </p>
          </div>
        </div>
        <ExportDropdown
          data={exportData}
          columns={exportColumns}
          filename="actions_archivees"
          title="Actions Archivées"
        />
      </div>

      {/* Filters */}
      <ArchivedActionsFilters
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* KPIs */}
      <ArchivedActionsKPIs
        totalArchived={kpis.totalArchived}
        archivedThisMonth={kpis.archivedThisMonth}
        onTimePercent={kpis.onTimePercent}
        latePercent={kpis.latePercent}
      />

      {/* Table */}
      <ArchivedActionsTable
        actions={filteredActions}
        onViewDetails={handleViewDetails}
      />

      {/* Detail Panel */}
      <ArchivedActionDetailPanel
        action={selectedAction}
        onClose={handleCloseDetails}
      />
    </div>
  );
};

export default ArchivedActionsPage;
