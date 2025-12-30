import { useState } from "react";
import { Action, STATUS_LABELS, TYPE_LABELS, CATEGORY_5M_LABELS } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ArchivedActionsTableProps {
  actions: Action[];
  onViewDetails: (action: Action) => void;
}

type SortKey = "id" | "problem" | "category5M" | "type" | "pilotName" | "createdAt" | "completedAt" | "efficiencyPercent";
type SortOrder = "asc" | "desc";

const ArchivedActionsTable = ({ actions, onViewDetails }: ArchivedActionsTableProps) => {
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const sortedActions = [...actions].sort((a, b) => {
    let aValue: string | number = "";
    let bValue: string | number = "";

    switch (sortKey) {
      case "id":
        aValue = a.id;
        bValue = b.id;
        break;
      case "problem":
        aValue = a.problem.toLowerCase();
        bValue = b.problem.toLowerCase();
        break;
      case "category5M":
        aValue = a.category5M || "";
        bValue = b.category5M || "";
        break;
      case "type":
        aValue = a.type;
        bValue = b.type;
        break;
      case "pilotName":
        aValue = a.pilotName.toLowerCase();
        bValue = b.pilotName.toLowerCase();
        break;
      case "createdAt":
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case "completedAt":
        aValue = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        bValue = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        break;
      case "efficiencyPercent":
        aValue = a.efficiencyPercent || 0;
        bValue = b.efficiencyPercent || 0;
        break;
    }

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  const totalPages = Math.ceil(sortedActions.length / itemsPerPage);
  const paginatedActions = sortedActions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort("id")}
              >
                ID <SortIcon columnKey="id" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort("problem")}
              >
                Problème <SortIcon columnKey="problem" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort("category5M")}
              >
                Catégorie 5M <SortIcon columnKey="category5M" />
              </TableHead>
              <TableHead>Description</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort("type")}
              >
                Type <SortIcon columnKey="type" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort("pilotName")}
              >
                Pilote <SortIcon columnKey="pilotName" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort("createdAt")}
              >
                Création <SortIcon columnKey="createdAt" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort("completedAt")}
              >
                Finalisation <SortIcon columnKey="completedAt" />
              </TableHead>
              <TableHead>Archivage</TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => handleSort("efficiencyPercent")}
              >
                Efficacité <SortIcon columnKey="efficiencyPercent" />
              </TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedActions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                  Aucune action archivée trouvée
                </TableCell>
              </TableRow>
            ) : (
              paginatedActions.map((action) => (
                <TableRow key={action.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-sm">#{action.id}</TableCell>
                  <TableCell className="max-w-[150px] truncate" title={action.problem}>
                    {action.problem}
                  </TableCell>
                  <TableCell>
                    {action.category5M && (
                      <Badge variant="outline">
                        {CATEGORY_5M_LABELS[action.category5M]}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={action.description}>
                    {action.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant={action.type === "corrective" ? "destructive" : "secondary"}>
                      {TYPE_LABELS[action.type]}
                    </Badge>
                  </TableCell>
                  <TableCell>{action.pilotName}</TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(action.createdAt), "dd/MM/yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell className="text-sm">
                    {action.completedAt
                      ? format(new Date(action.completedAt), "dd/MM/yyyy", { locale: fr })
                      : "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {action.validatedAt
                      ? format(new Date(action.validatedAt), "dd/MM/yyyy", { locale: fr })
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {action.efficiencyPercent !== undefined ? (
                      <Badge
                        variant={action.efficiencyPercent >= 80 ? "default" : "secondary"}
                        className={
                          action.efficiencyPercent >= 80
                            ? "bg-success text-success-foreground"
                            : ""
                        }
                      >
                        {action.efficiencyPercent}%
                      </Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-muted text-muted-foreground">
                      {STATUS_LABELS[action.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(action)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Voir Détails
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Affichage {(currentPage - 1) * itemsPerPage + 1} -{" "}
            {Math.min(currentPage * itemsPerPage, sortedActions.length)} sur{" "}
            {sortedActions.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArchivedActionsTable;
