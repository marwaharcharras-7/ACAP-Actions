import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Action, 
  STATUS_LABELS, 
  TYPE_LABELS, 
  URGENCY_LABELS,
  CATEGORY_5M_LABELS
} from '@/types';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  Calendar, 
  User, 
  Building2, 
  MapPin, 
  Tag, 
  Clock,
  Target,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Image,
  Download,
  History,
  Circle,
  Paperclip,
  Factory,
  Edit,
  Loader2,
  RefreshCw,
  Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ActionEditDialog, { canUserEdit } from './ActionEditDialog';
import { useAttachments } from '@/hooks/useAttachments';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useActionHistory } from '@/hooks/useActionHistory';
import { toast } from 'sonner';

interface ActionDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: Action | null;
}

// Map event types to icons
const getHistoryEventIcon = (eventType: string) => {
  switch (eventType) {
    case 'created':
      return <Plus className="w-3 h-3 text-success" />;
    case 'status_changed':
      return <RefreshCw className="w-3 h-3 text-primary" />;
    case 'updated':
      return <Edit className="w-3 h-3 text-info" />;
    default:
      return <Circle className="w-3 h-3 text-muted-foreground" />;
  }
};

const ActionDetailsDialog = ({ open, onOpenChange, action }: ActionDetailsDialogProps) => {
  const { user } = useAuth();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  // Fetch real attachments from database
  const { data: attachments = [], isLoading: attachmentsLoading } = useAttachments(action?.id ?? null);
  const { getSignedUrl } = useFileUpload();
  
  // Fetch real history from database
  const { history, isLoading: historyLoading } = useActionHistory(action?.id ?? null);

  if (!action) return null;

  // Archived actions are read-only
  const isArchived = action.status === 'archived';
  
  const userCanEdit = !isArchived && canUserEdit(
    user?.role, 
    user?.id, 
    action,
    user?.serviceId,
    user?.lineId,
    user?.teamId
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'identified': return 'status-identified';
      case 'planned': return 'status-planned';
      case 'in_progress': return 'status-in-progress';
      case 'completed': return 'status-completed';
      case 'late': return 'status-late';
      case 'validated': return 'status-validated';
      case 'archived': return 'status-archived';
      default: return '';
    }
  };

  const getUrgencyBadgeClass = (urgency: string) => {
    switch (urgency) {
      case 'low': return 'urgency-low';
      case 'medium': return 'urgency-medium';
      case 'high': return 'urgency-high';
      default: return '';
    }
  };


  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4 text-success" />;
    if (mimeType.includes('pdf')) return <FileText className="w-4 h-4 text-danger" />;
    return <FileText className="w-4 h-4 text-primary" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = async (attachment: typeof attachments[0]) => {
    setDownloadingId(attachment.id);
    try {
      const signedUrl = await getSignedUrl('attachments', attachment.path);
      if (!signedUrl) {
        toast.error('Impossible de télécharger le fichier');
        return;
      }

      // Force download (otherwise the browser may just preview PDFs)
      const response = await fetch(signedUrl);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(objectUrl);
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    } finally {
      setDownloadingId(null);
    }
  };

  // Days open = difference between due date and created date (cannot be negative)
  const daysOpenRaw = differenceInDays(new Date(action.dueDate), new Date(action.createdAt));
  const daysOpen = Math.max(0, daysOpenRaw);
  const daysUntilDue = differenceInDays(new Date(action.dueDate), new Date());
  // isLate = today > due_date, not based on days open
  const isLate = daysUntilDue < 0 && action.status !== 'completed' && action.status !== 'validated' && action.status !== 'archived';
  const showEfficiency = action.status === 'completed' || action.status === 'validated' || action.status === 'archived';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <ScrollArea className="max-h-[90vh]">
          <div className="p-6">
            <DialogHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <DialogTitle className="text-xl font-bold text-foreground">
                    {action.title}
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <Badge className={cn('border', getStatusBadgeClass(action.status))}>
                      {STATUS_LABELS[action.status]}
                    </Badge>
                    <Badge variant="outline" className={action.type === 'corrective' ? 'border-primary text-primary' : 'border-accent text-accent'}>
                      {TYPE_LABELS[action.type]}
                    </Badge>
                    <Badge className={cn(getUrgencyBadgeClass(action.urgency))}>
                      {URGENCY_LABELS[action.urgency]}
                    </Badge>
                    {action.category5M && (
                      <Badge variant="secondary">
                        {CATEGORY_5M_LABELS[action.category5M]}
                      </Badge>
                    )}
                  </div>
                </div>
                {/* Edit Button */}
                {userCanEdit && (
                  <Button 
                    onClick={() => setEditDialogOpen(true)}
                    className="gradient-primary text-primary-foreground"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Modifier
                  </Button>
                )}
              </div>
            </DialogHeader>

            <div className="space-y-6 mt-6">
              {/* Section A: Informations générales */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <Tag className="w-4 h-4 text-primary" />
                  Informations générales
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Problème</p>
                    <p className="text-sm font-medium text-foreground">{action.problem}</p>
                  </div>
                  {action.category5M && (
                    <div className="p-4 rounded-lg bg-muted/30 border border-border">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Catégorie 5M</p>
                      <p className="text-sm font-medium text-foreground">{CATEGORY_5M_LABELS[action.category5M]}</p>
                    </div>
                  )}
                  {action.rootCause && (
                    <div className="p-4 rounded-lg bg-muted/30 border border-border md:col-span-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Cause racine</p>
                      <p className="text-sm font-medium text-foreground">{action.rootCause}</p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Section B: Informations opérationnelles */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <Building2 className="w-4 h-4 text-primary" />
                  Informations opérationnelles
                </h3>
                
                {/* Description & Action proposée */}
                <div className="space-y-4 mb-4">
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Description du problème
                    </p>
                    <p className="text-sm text-foreground">{action.problem}</p>
                  </div>
                  {action.description && (
                    <div className="p-4 rounded-lg bg-muted/30 border border-border">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Action proposée
                      </p>
                      <p className="text-sm text-foreground">{action.description}</p>
                    </div>
                  )}
                </div>

                {/* Grid of operational info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Périmètre */}
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Factory className="w-3 h-3" />
                      Usine
                    </p>
                    <p className="text-sm font-medium text-foreground mt-1">Usine 1</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      Service
                    </p>
                    <p className="text-sm font-medium text-foreground mt-1">{action.serviceName || '-'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Ligne
                    </p>
                    <p className="text-sm font-medium text-foreground mt-1">{action.lineName || '-'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      Poste
                    </p>
                    <p className="text-sm font-medium text-foreground mt-1">{action.postName || '-'}</p>
                  </div>

                  {/* Pilote */}
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Pilote
                    </p>
                    <p className="text-sm font-medium text-foreground mt-1">{action.pilotName}</p>
                  </div>

                  {/* Dates */}
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Date création
                    </p>
                    <p className="text-sm font-medium text-foreground mt-1">
                      {format(new Date(action.createdAt), 'dd/MM/yyyy', { locale: fr })}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Échéance
                    </p>
                    <p className={cn(
                      'text-sm font-medium mt-1',
                      daysUntilDue < 0 ? 'text-danger' : daysUntilDue <= 3 ? 'text-warning' : 'text-foreground'
                    )}>
                      {format(new Date(action.dueDate), 'dd/MM/yyyy', { locale: fr })}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Jours d'ouverture
                    </p>
                    <p className="text-sm font-medium text-foreground mt-1">{daysOpen} jours</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Section C: Suivi & Avancement */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <Target className="w-4 h-4 text-primary" />
                  Suivi & Avancement
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-muted/30 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Avancement</span>
                      <span className="text-lg font-bold text-primary">{action.progressPercent}%</span>
                    </div>
                    <Progress value={action.progressPercent} className="h-3" />
                  </div>
                  
                  {showEfficiency && (
                    <div className="p-4 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Efficacité</span>
                        <span className={cn(
                          'text-lg font-bold',
                          (action.efficiencyPercent || 0) >= 80 ? 'text-success' : 
                          (action.efficiencyPercent || 0) >= 50 ? 'text-warning' : 'text-danger'
                        )}>
                          {action.efficiencyPercent || 0}%
                        </span>
                      </div>
                      <Progress 
                        value={action.efficiencyPercent || 0} 
                        className="h-3"
                      />
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Section D: Pièces jointes */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <Paperclip className="w-4 h-4 text-primary" />
                  Pièces jointes
                </h3>
                {attachmentsLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Chargement...</span>
                  </div>
                ) : attachments.length > 0 ? (
                  <div className="space-y-2">
                    {attachments.map((file) => (
                      <div 
                        key={file.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {getFileIcon(file.type)}
                          <div>
                            <p className="text-sm font-medium text-foreground">{file.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                              {file.uploadedByName && ` • ${file.uploadedByName}`}
                            </p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => handleDownload(file)}
                          disabled={downloadingId === file.id}
                        >
                          {downloadingId === file.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Aucune pièce jointe</p>
                )}
              </div>

              <Separator />

              {/* Section E: Historique */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2 uppercase tracking-wide">
                  <History className="w-4 h-4 text-primary" />
                  Historique
                </h3>
                {historyLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Chargement...</span>
                  </div>
                ) : history.length > 0 ? (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[5px] top-2 bottom-2 w-0.5 bg-border" />
                    
                    <div className="space-y-4">
                      {history.map((item) => (
                        <div key={item.id} className="flex items-start gap-3 relative">
                          <div className="relative z-10 bg-card p-0.5">
                            {getHistoryEventIcon(item.eventType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground">{item.details || item.eventType}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                              </span>
                              {item.userName && (
                                <>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <span className="text-xs text-muted-foreground">{item.userName}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Aucun historique disponible</p>
                )}
              </div>

              {/* Comments */}
              {action.comments && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Commentaires</h3>
                    <p className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg border border-border">
                      {action.comments}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>

      {/* Edit Dialog */}
      <ActionEditDialog 
        open={editDialogOpen} 
        onOpenChange={setEditDialogOpen} 
        action={action} 
      />
    </Dialog>
  );
};

export default ActionDetailsDialog;
