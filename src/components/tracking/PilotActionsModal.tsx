import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Download, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileSpreadsheet, FileText } from "lucide-react";
import { Action, User, STATUS_LABELS, TYPE_LABELS, URGENCY_LABELS } from "@/types";
import { cn } from "@/lib/utils";
import ActionDetailsDialog from "@/components/actions/ActionDetailsDialog";
import { exportToCSV, exportToPDF, ExportColumn } from "@/lib/exportUtils";
import { toast } from "sonner";
import SortableTableHeader, { SortDirection } from "@/components/common/SortableTableHeader";

interface PilotActionsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pilot: User | null;
  actions: Action[];
}

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50];

const PilotActionsModal = ({ open, onOpenChange, pilot, actions }: PilotActionsModalProps) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Filter actions
  const filteredActions = useMemo(() => {
    let result = actions.filter((a) => a.pilotId === pilot?.id);

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.problem.toLowerCase().includes(searchLower) ||
          a.title.toLowerCase().includes(searchLower) ||
          a.description?.toLowerCase().includes(searchLower) ||
          (a.rootCause && a.rootCause.toLowerCase().includes(searchLower)),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((a) => a.status === statusFilter);
    }

    return result;
  }, [actions, pilot?.id, search, statusFilter]);

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
    if (!sortKey || !sortDirection) return filteredActions;

    return [...filteredActions].sort((a, b) => {
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
  }, [filteredActions, sortKey, sortDirection]);

  const totalPages = Math.ceil(sortedActions.length / itemsPerPage);
  const paginatedActions = sortedActions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleViewDetails = (action: Action) => {
    setSelectedAction(action);
    setDetailsOpen(true);
  };

  // Export columns definition
  const exportColumns: ExportColumn[] = [
    { header: "Problème", key: "problem", width: 40 },
    { header: "Cause racine", key: "rootCause", width: 30 },
    { header: "Action", key: "title", width: 40 },
    { header: "Type", key: "typeLabel", width: 15 },
    { header: "Urgence", key: "urgencyLabel", width: 15 },
    { header: "Statut", key: "statusLabel", width: 15 },
  ];

  // Prepare data for export
  const getExportData = () => {
    return sortedActions.map((action) => ({
      problem: action.problem,
      rootCause: action.rootCause || "-",
      title: action.title,
      typeLabel: TYPE_LABELS[action.type],
      urgencyLabel: URGENCY_LABELS[action.urgency],
      statusLabel: STATUS_LABELS[action.status],
    }));
  };

  const handleExportCSV = () => {
    try {
      const data = getExportData();
      const filename = `actions_${pilot?.firstName}_${pilot?.lastName}`;
      exportToCSV(data, exportColumns, filename);
      toast.success("Export Excel réussi");
    } catch (error) {
      toast.error("Erreur lors de l'export");
    }
  };

  const handleExportPDF = () => {
    try {
      const data = getExportData();
      const title = `Actions de ${pilot?.firstName} ${pilot?.lastName}`;
      const filename = `actions_${pilot?.firstName}_${pilot?.lastName}`;
      exportToPDF(data, exportColumns, title, filename);
      toast.success("Export PDF réussi");
    } catch (error) {
      toast.error("Erreur lors de l'export PDF");
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "identified":
        return "status-identified";
      case "planned":
        return "status-planned";
      case "in_progress":
        return "status-in-progress";
      case "completed":
        return "status-completed";
      case "late":
        return "status-late";
      case "validated":
        return "status-validated";
      case "archived":
        return "status-archived";
      default:
        return "";
    }
  };

  const getUrgencyBadgeClass = (urgency: string) => {
    switch (urgency) {
      case "low":
        return "urgency-low";
      case "medium":
        return "urgency-medium";
      case "high":
        return "urgency-high";
      default:
        return "";
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  if (!pilot) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] w-[95vw] sm:w-auto p-0 flex flex-col">
          <DialogHeader className="p-4 sm:p-6 pb-0 shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">
                Actions de {pilot.firstName} {pilot.lastName}
              </DialogTitle>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-auto">
            <div className="p-4 sm:p-6 pt-4 space-y-4">
              {/* Filters - Mobile optimized */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={statusFilter}
                      onValueChange={(v) => {
                        setStatusFilter(v);
                        setCurrentPage(1);
                      }}
                    >
                      <SelectTrigger className="w-full sm:w-[150px]">
                        <SelectValue placeholder="Statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous statuts</SelectItem>
                        <SelectItem value="identified">Identifiée</SelectItem>
                        <SelectItem value="planned">Prévue</SelectItem>
                        <SelectItem value="in_progress">En cours</SelectItem>
                        <SelectItem value="completed">Finalisée</SelectItem>
                        <SelectItem value="late">En retard</SelectItem>
                        <SelectItem value="validated">Validée</SelectItem>
                      </SelectContent>
                    </Select>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="shrink-0">
                          <Download className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="bg-card border-border">
                        <DropdownMenuItem onClick={handleExportCSV}>
                          <FileSpreadsheet className="w-4 h-4 mr-2" />
                          Export Excel (CSV)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExportPDF}>
                          <FileText className="w-4 h-4 mr-2" />
                          Export PDF
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="block sm:hidden space-y-3">
                {paginatedActions.length > 0 ? (
                  paginatedActions.map((action) => (
                    <div
                      key={action.id}
                      className="border rounded-lg p-4 space-y-3 bg-card"
                      onClick={() => handleViewDetails(action)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-sm line-clamp-2 flex-1">{action.title}</h4>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{action.problem}</p>
                      {action.rootCause && (
                        <p className="text-xs text-muted-foreground/80 line-clamp-1">
                          Cause: {action.rootCause}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            action.type === "corrective"
                              ? "border-primary text-primary"
                              : "border-accent text-accent",
                          )}
                        >
                          {TYPE_LABELS[action.type]}
                        </Badge>
                        <Badge className={cn("text-xs", getUrgencyBadgeClass(action.urgency))}>
                          {URGENCY_LABELS[action.urgency]}
                        </Badge>
                        <Badge className={cn("text-xs border", getStatusBadgeClass(action.status))}>
                          {STATUS_LABELS[action.status]}
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune action trouvée
                  </div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <SortableTableHeader
                        label="Problème"
                        sortKey="problem"
                        currentSortKey={sortKey}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                        className="min-w-[150px]"
                      />
                      <SortableTableHeader
                        label="Cause racine"
                        sortKey="rootCause"
                        currentSortKey={sortKey}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                        className="min-w-[120px] hidden lg:table-cell"
                      />
                      <SortableTableHeader
                        label="Action"
                        sortKey="title"
                        currentSortKey={sortKey}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                        className="min-w-[150px]"
                      />
                      <SortableTableHeader
                        label="Type"
                        sortKey="type"
                        currentSortKey={sortKey}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                        className="min-w-[80px] hidden md:table-cell"
                      />
                      <SortableTableHeader
                        label="Urgence"
                        sortKey="urgency"
                        currentSortKey={sortKey}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                        className="min-w-[80px]"
                      />
                      <SortableTableHeader
                        label="Statut"
                        sortKey="status"
                        currentSortKey={sortKey}
                        currentSortDirection={sortDirection}
                        onSort={handleSort}
                        className="min-w-[100px]"
                      />
                      <SortableTableHeader
                        label="Actions"
                        sortKey=""
                        currentSortKey={sortKey}
                        currentSortDirection={sortDirection}
                        onSort={() => {}}
                        className="w-16 text-center"
                      />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedActions.length > 0 ? (
                      paginatedActions.map((action) => (
                        <TableRow key={action.id} className="hover:bg-muted/30">
                          <TableCell className="max-w-[200px]">
                            <span className="line-clamp-2 text-sm">{action.problem}</span>
                          </TableCell>
                          <TableCell className="max-w-[150px] hidden lg:table-cell">
                            <span className="line-clamp-2 text-sm text-muted-foreground">
                              {action.rootCause || "-"}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[200px]">
                            <span className="line-clamp-2 text-sm">{action.title}</span>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                action.type === "corrective"
                                  ? "border-primary text-primary"
                                  : "border-accent text-accent",
                              )}
                            >
                              {TYPE_LABELS[action.type]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("text-xs", getUrgencyBadgeClass(action.urgency))}>
                              {URGENCY_LABELS[action.urgency]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("text-xs border", getStatusBadgeClass(action.status))}>
                              {STATUS_LABELS[action.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleViewDetails(action)}
                              title="Voir les détails"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Aucune action trouvée
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination - Mobile optimized */}
              {sortedActions.length > 0 && (
                <div className="flex flex-col gap-3 pt-4 border-t">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">
                      {sortedActions.length} action(s)
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs sm:text-sm text-muted-foreground">Afficher</span>
                      <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
                        <SelectTrigger className="w-[60px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                            <SelectItem key={option} value={String(option)}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <span className="text-xs sm:text-sm text-muted-foreground">par page</span>
                    </div>
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        title="Première page"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        title="Page précédente"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      
                      <span className="px-2 sm:px-3 text-xs sm:text-sm text-muted-foreground">
                        {currentPage} / {totalPages}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        title="Page suivante"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        title="Dernière page"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Action Details Dialog */}
      <ActionDetailsDialog open={detailsOpen} onOpenChange={setDetailsOpen} action={selectedAction} />
    </>
  );
};

export default PilotActionsModal;
