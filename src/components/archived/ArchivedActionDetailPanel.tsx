import { Action, STATUS_LABELS, TYPE_LABELS, CATEGORY_5M_LABELS, URGENCY_LABELS } from "@/types";
import { X, Download, FileText, Calendar, User, MapPin, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface ArchivedActionDetailPanelProps {
  action: Action | null;
  onClose: () => void;
}

const ArchivedActionDetailPanel = ({ action, onClose }: ArchivedActionDetailPanelProps) => {
  if (!action) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd MMMM yyyy 'à' HH:mm", { locale: fr });
  };

  const getTypeBadgeClass = () => {
    return action.type === "corrective"
      ? "bg-danger/10 text-danger border-danger/30"
      : "bg-info/10 text-info border-info/30";
  };

  const timelineEvents = [
    { label: "Création", date: action.createdAt, icon: Calendar },
    { label: "Échéance", date: action.dueDate, icon: Clock },
    ...(action.completedAt ? [{ label: "Finalisation", date: action.completedAt, icon: CheckCircle }] : []),
    ...(action.validatedAt ? [{ label: "Archivage/Validation", date: action.validatedAt, icon: CheckCircle }] : []),
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-foreground/50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-full max-w-lg bg-card border-l border-border z-50 shadow-xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Détails de l'action</h2>
            <p className="text-sm text-muted-foreground">Action #{action.id}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-4 space-y-6">
            {/* Informations Générales */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Informations Générales
              </h3>
              <div className="grid grid-cols-2 gap-4 bg-muted/30 rounded-lg p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Type d'Action</p>
                  <Badge variant="outline" className={getTypeBadgeClass()}>
                    {TYPE_LABELS[action.type]}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Statut</p>
                  <Badge variant="outline" className="bg-muted">
                    {STATUS_LABELS[action.status]}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pilote</p>
                  <p className="text-sm font-medium">{action.pilotName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Catégorie 5M</p>
                  <Badge variant="outline">
                    {action.category5M ? CATEGORY_5M_LABELS[action.category5M] : "-"}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Urgence</p>
                  <Badge
                    variant="outline"
                    className={
                      action.urgency === "high"
                        ? "bg-danger/10 text-danger"
                        : action.urgency === "medium"
                        ? "bg-warning/10 text-warning"
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {URGENCY_LABELS[action.urgency]}
                  </Badge>
                </div>
              </div>
            </section>

            <Separator />

            {/* Description du Problème */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3">Description du Problème</h3>
              <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Problème identifié</p>
                  <p className="text-sm">{action.problem}</p>
                </div>
                {action.rootCause && (
                  <div>
                    <p className="text-xs text-muted-foreground">Cause racine</p>
                    <p className="text-sm">{action.rootCause}</p>
                  </div>
                )}
              </div>
            </section>

            <Separator />

            {/* Périmètre */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Périmètre
              </h3>
              <div className="grid grid-cols-2 gap-4 bg-muted/30 rounded-lg p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Service</p>
                  <p className="text-sm font-medium">{action.serviceName || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Ligne</p>
                  <p className="text-sm font-medium">{action.lineName || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Équipe</p>
                  <p className="text-sm font-medium">{action.teamName || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Poste</p>
                  <p className="text-sm font-medium">{action.postName || "-"}</p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Action Mise en Place */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-primary" />
                Action Mise en Place
              </h3>
              <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Description</p>
                  <p className="text-sm">{action.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Efficacité</p>
                    <Badge
                      className={
                        (action.efficiencyPercent || 0) >= 80
                          ? "bg-success text-success-foreground"
                          : "bg-warning text-warning-foreground"
                      }
                    >
                      {action.efficiencyPercent !== undefined ? `${action.efficiencyPercent}%` : "-"}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Avancement</p>
                    <Badge variant="outline">{action.progressPercent}%</Badge>
                  </div>
                </div>
              </div>
            </section>

            <Separator />

            {/* Dates Clés */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Dates Clés
              </h3>
              <div className="grid grid-cols-2 gap-4 bg-muted/30 rounded-lg p-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Création</p>
                  <p>{formatDate(action.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Échéance</p>
                  <p>{formatDate(action.dueDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Finalisation</p>
                  <p>{formatDate(action.completedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Archivage</p>
                  <p>{formatDate(action.validatedAt)}</p>
                </div>
              </div>
            </section>

            <Separator />

            {/* Pièces Jointes */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                Pièces Jointes
              </h3>
              {action.attachments && action.attachments.length > 0 ? (
                <div className="space-y-2">
                  {action.attachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4">
                  Aucune pièce jointe
                </p>
              )}
            </section>

            <Separator />

            {/* Historique Complet */}
            <section>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Historique Complet
              </h3>
              <div className="relative pl-6 space-y-4">
                {timelineEvents.map((event, index) => (
                  <div key={index} className="relative">
                    <div className="absolute -left-6 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                    {index < timelineEvents.length - 1 && (
                      <div className="absolute -left-[18px] top-4 w-0.5 h-full bg-border" />
                    )}
                    <div className="bg-muted/30 rounded-lg p-3">
                      <p className="text-sm font-medium">{event.label}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(event.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </ScrollArea>
      </div>
    </>
  );
};

export default ArchivedActionDetailPanel;
