import { useState, useEffect } from 'react';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useAttachments } from '@/hooks/useAttachments';
import { usePilotFilter, getRoleLabel } from '@/hooks/usePilotFilter';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Action, 
  ActionStatus, 
  ActionType, 
  UrgencyLevel, 
  Category5M,
  STATUS_LABELS,
  TYPE_LABELS,
  URGENCY_LABELS,
  CATEGORY_5M_LABELS,
  UserRole
} from '@/types';
import { Upload, Info, Lock, Download, FileText, Image, Loader2, Paperclip, Trash2 } from 'lucide-react';

interface ActionEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: Action | null;
}

// Define permissions per role
const getEditPermissions = (userRole: UserRole | undefined, userId: string | undefined, action: Action) => {
  const isPilot = action.pilotId === userId;
  
  // Default: no permissions (operator standard)
  const permissions = {
    canEditStatus: false,
    canEditProgress: false,
    canAddAttachments: false,
    canEditCreationFields: false, // problem, cause, pilot, deadline
    canEditEfficiency: false,
    canValidate: false,
    allowedStatusTransitions: [] as ActionStatus[],
    roleLabel: 'Lecture seule',
  };

  if (!userRole) return permissions;

  switch (userRole) {
    case 'operator':
      // Opérateur pilote: can update status, progress, attachments
      if (isPilot) {
        permissions.canEditStatus = true;
        permissions.canEditProgress = true;
        permissions.canAddAttachments = true;
        permissions.allowedStatusTransitions = ['identified', 'planned', 'in_progress', 'completed'];
        permissions.roleLabel = 'Opérateur Pilote';
      } else {
        permissions.roleLabel = 'Opérateur (Lecture seule)';
      }
      break;

    case 'team_leader':
      // Chef d'équipe: can modify all creation fields and manage status transitions
      permissions.canEditStatus = true;
      permissions.canEditProgress = true;
      permissions.canAddAttachments = true;
      permissions.canEditCreationFields = true;
      permissions.allowedStatusTransitions = ['identified', 'planned', 'in_progress', 'completed', 'late'];
      permissions.roleLabel = 'Chef d\'équipe';
      break;

    case 'supervisor':
    case 'manager':
      // Supervisor/Manager: full access including efficiency evaluation and final validation
      permissions.canEditStatus = true;
      permissions.canEditProgress = true;
      permissions.canAddAttachments = true;
      permissions.canEditCreationFields = true;
      permissions.canEditEfficiency = true;
      permissions.canValidate = true;
      permissions.allowedStatusTransitions = ['identified', 'planned', 'in_progress', 'completed', 'late', 'validated', 'archived'];
      permissions.roleLabel = userRole === 'supervisor' ? 'Superviseur' : 'Manager';
      break;

    case 'admin':
      // Admin has full access
      permissions.canEditStatus = true;
      permissions.canEditProgress = true;
      permissions.canAddAttachments = true;
      permissions.canEditCreationFields = true;
      permissions.canEditEfficiency = true;
      permissions.canValidate = true;
      permissions.allowedStatusTransitions = ['identified', 'planned', 'in_progress', 'completed', 'late', 'validated', 'archived'];
      permissions.roleLabel = 'Administrateur';
      break;
  }

  return permissions;
};

/**
 * Check if user can edit an action based on:
 * 1. Their role
 * 2. Their scope/perimeter (service, line, team)
 * 3. Whether they are the pilot or creator
 * 
 * Rules:
 * - Operator: can only edit if they are the pilot
 * - Team leader: can edit actions in their team/line/service scope
 * - Supervisor: can edit actions in their line/service scope
 * - Manager: can edit actions in their service scope
 * - Admin: can edit all actions
 */
export const canUserEdit = (
  userRole: UserRole | undefined, 
  userId: string | undefined, 
  action: Action,
  userServiceId?: string,
  userLineId?: string,
  userTeamId?: string
): boolean => {
  if (!userRole || !userId) return false;
  
  // Check if user is the pilot or creator (always allowed to edit)
  const isPilot = action.pilotId === userId;
  const isCreator = action.createdById === userId;
  
  switch (userRole) {
    case 'operator':
      // Operator can only edit if they are the pilot
      return isPilot;
    
    case 'team_leader':
      // Team leader can edit if:
      // - They are the pilot or creator
      // - OR the action is in their scope (team/line/service)
      if (isPilot || isCreator) return true;
      
      // Check scope: action must be in the team leader's team, line, or service
      if (userTeamId && action.teamId === userTeamId) return true;
      if (userLineId && action.lineId === userLineId) return true;
      if (userServiceId && action.serviceId === userServiceId) return true;
      
      return false;
    
    case 'supervisor':
      // Supervisor can edit if:
      // - They are the pilot or creator
      // - OR the action is in their line/service scope
      if (isPilot || isCreator) return true;
      
      // Check scope: action must be in the supervisor's line or service
      if (userLineId && action.lineId === userLineId) return true;
      if (userServiceId && action.serviceId === userServiceId) return true;
      
      // Also check if action's team is under the supervisor's line
      // This is handled by the line check since teams belong to lines
      
      return false;
    
    case 'manager':
      // Manager can edit if:
      // - They are the pilot or creator
      // - OR the action is in their service scope
      if (isPilot || isCreator) return true;
      
      // Check scope: action must be in the manager's service
      if (userServiceId && action.serviceId === userServiceId) return true;
      
      return false;
    
    case 'admin':
      // Admin can edit all actions
      return true;
    
    default:
      return false;
  }
};

const ActionEditDialog = ({ open, onOpenChange, action }: ActionEditDialogProps) => {
  const { updateAction, services, lines, teams, posts, users } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const { uploadAttachment, isUploading, getSignedUrl, deleteAttachment } = useFileUpload();

  // Fetch existing attachments from DB
  const { data: existingAttachments = [], isLoading: attachmentsLoading, refetch: refetchAttachments } = useAttachments(action?.id ?? null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  const [loadingPreviews, setLoadingPreviews] = useState<Set<string>>(new Set());

  // Load image previews for image attachments
  useEffect(() => {
    const loadPreviews = async () => {
      for (const attachment of existingAttachments) {
        if (attachment.type.startsWith('image/') && !imagePreviews[attachment.id] && !loadingPreviews.has(attachment.id)) {
          setLoadingPreviews(prev => new Set(prev).add(attachment.id));
          const url = await getSignedUrl('attachments', attachment.path);
          if (url) {
            setImagePreviews(prev => ({ ...prev, [attachment.id]: url }));
          }
          setLoadingPreviews(prev => {
            const next = new Set(prev);
            next.delete(attachment.id);
            return next;
          });
        }
      }
    };
    if (existingAttachments.length > 0) {
      loadPreviews();
    }
  }, [existingAttachments, getSignedUrl]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    problem: '',
    rootCause: '',
    type: 'corrective' as ActionType,
    status: 'identified' as ActionStatus,
    urgency: 'medium' as UrgencyLevel,
    category5M: '' as Category5M | '',
    pilotId: '',
    serviceId: '',
    lineId: '',
    teamId: '',
    postId: '',
    dueDate: '',
    progressPercent: 0,
    efficiencyPercent: 0,
    comments: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAttachment, setNewAttachment] = useState<File | null>(null);

  const permissions = action ? getEditPermissions(user?.role, user?.id, action) : null;

  useEffect(() => {
    if (action) {
      setFormData({
        title: action.title,
        description: action.description,
        problem: action.problem,
        rootCause: action.rootCause || '',
        type: action.type,
        status: action.status,
        urgency: action.urgency,
        category5M: action.category5M || '',
        pilotId: action.pilotId,
        serviceId: action.serviceId || '',
        lineId: action.lineId || '',
        teamId: action.teamId || '',
        postId: action.postId || '',
        dueDate: action.dueDate.split('T')[0],
        progressPercent: action.progressPercent,
        efficiencyPercent: action.efficiencyPercent || 0,
        comments: action.comments || '',
      });
    }
  }, [action, open]);

  if (!action || !permissions) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const updates: Partial<Action> = {};
      
      // Only include fields the user can edit based on permissions
      if (permissions.canEditCreationFields) {
        updates.title = formData.title;
        updates.problem = formData.problem;
        updates.rootCause = formData.rootCause || undefined;
        updates.description = formData.description;
        updates.type = formData.type;
        updates.urgency = formData.urgency;
        updates.category5M = formData.category5M || undefined;
        updates.pilotId = formData.pilotId;
        updates.serviceId = formData.serviceId || undefined;
        updates.lineId = formData.lineId || undefined;
        updates.teamId = formData.teamId || undefined;
        updates.postId = formData.postId || undefined;
        updates.dueDate = formData.dueDate;
      }
      
      if (permissions.canEditStatus) {
        updates.status = formData.status;
        // Auto-set completedAt when status changes to completed
        if (formData.status === 'completed' && action.status !== 'completed') {
          updates.completedAt = new Date().toISOString();
        }
        // Auto-set validatedAt when status changes to validated
        if (formData.status === 'validated' && action.status !== 'validated') {
          updates.validatedAt = new Date().toISOString();
        }
      }
      
      if (permissions.canEditProgress) {
        updates.progressPercent = formData.progressPercent;
      }
      
      if (permissions.canEditEfficiency) {
        updates.efficiencyPercent = formData.efficiencyPercent;
      }
      
      updates.comments = formData.comments;

      // Wait for the update to complete - this will throw if RLS blocks it
      await updateAction(action.id, updates);

      const hadNewAttachment = !!newAttachment;
      let attachmentFailed = false;

      if (hadNewAttachment) {
        if (!user?.id) throw new Error('Vous devez être connecté pour ajouter une pièce jointe.');
        const res = await uploadAttachment(action.id, user.id, newAttachment!);
        if (!res) attachmentFailed = true;
      }

      setNewAttachment(null);

      toast({
        title: 'Action mise à jour',
        description: hadNewAttachment
          ? (attachmentFailed
              ? "Modifications enregistrées, mais la pièce jointe n'a pas pu être téléversée."
              : 'Modifications enregistrées et pièce jointe téléversée.')
          : 'Les modifications ont été synchronisées avec la base de données.',
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating action:', error);
      
      // Check for RLS policy violation error
      const isRLSError = error?.message?.includes('row-level security') || 
                          error?.message?.includes('policy') ||
                          error?.code === '42501' ||
                          error?.code === 'PGRST301';
      
      toast({
        title: 'Erreur de modification',
        description: isRLSError 
          ? "Vous n'avez pas les droits pour modifier cette action. Vérifiez que l'action appartient à votre périmètre."
          : error.message || 'Une erreur est survenue lors de l\'enregistrement.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewAttachment(e.target.files[0]);
      toast({
        title: 'Fichier sélectionné',
        description: `${e.target.files[0].name} sera ajouté lors de la sauvegarde.`,
      });
    }
  };

  const handleDownloadAttachment = async (attachment: typeof existingAttachments[0]) => {
    setDownloadingId(attachment.id);
    try {
      const signedUrl = await getSignedUrl('attachments', attachment.path);
      if (signedUrl) {
        // Force download using fetch and blob for all file types
        const response = await fetch(signedUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        toast({ title: 'Erreur', description: 'Impossible de télécharger le fichier', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({ title: 'Erreur', description: 'Erreur lors du téléchargement', variant: 'destructive' });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteAttachment = async (attachment: typeof existingAttachments[0]) => {
    if (!confirm(`Supprimer "${attachment.name}" ?`)) return;
    
    setDeletingId(attachment.id);
    try {
      const success = await deleteAttachment(attachment.id, attachment.path);
      if (success) {
        await refetchAttachments();
        toast({ title: 'Pièce jointe supprimée' });
      }
    } catch (error) {
      toast({ title: 'Erreur', description: 'Erreur lors de la suppression', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  // Check if user can delete a specific attachment
  const canDeleteAttachment = (attachment: typeof existingAttachments[0]) => {
    if (!user) return false;
    // User can delete if they uploaded it, or if they are admin/manager
    return attachment.uploadedById === user.id || user.role === 'admin' || user.role === 'manager';
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

  const filteredLines = formData.serviceId 
    ? lines.filter(l => l.serviceId === formData.serviceId)
    : [];

  const filteredTeams = formData.lineId
    ? teams.filter(t => t.lineId === formData.lineId)
    : [];

  const filteredPosts = formData.teamId
    ? posts.filter(p => p.teamId === formData.teamId)
    : [];

  // Filter pilots based on scope and role hierarchy
  const filteredPilots = usePilotFilter({
    users,
    currentUserRole: user?.role,
    serviceId: formData.serviceId,
    lineId: formData.lineId,
    teamId: formData.teamId,
    postId: formData.postId,
  });

  const renderField = (
    fieldName: string,
    label: string,
    canEdit: boolean,
    children: React.ReactNode
  ) => (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        {label}
        {!canEdit && <Lock className="w-3 h-3 text-muted-foreground" />}
      </Label>
      {canEdit ? children : (
        <div className="p-2 bg-muted/50 rounded-md text-sm text-muted-foreground border">
          {fieldName === 'dueDate' 
            ? formData.dueDate 
            : fieldName === 'pilotId' 
              ? users.find(u => u.id === formData.pilotId)?.firstName + ' ' + users.find(u => u.id === formData.pilotId)?.lastName
              : (formData as any)[fieldName] || '-'
          }
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier l'action</DialogTitle>
          <DialogDescription>
            Connecté en tant que: <span className="font-semibold text-primary">{permissions.roleLabel}</span>
          </DialogDescription>
        </DialogHeader>

        <Alert className="bg-info/10 border-info/20">
          <Info className="w-4 h-4 text-info" />
          <AlertDescription className="text-sm">
            Les champs verrouillés <Lock className="w-3 h-3 inline" /> ne sont pas modifiables selon votre rôle.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Creation Fields - Only editable by team_leader+ */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Informations générales</h3>
            
            <div className="grid grid-cols-1 gap-4">
              {renderField('title', 'Titre', permissions.canEditCreationFields, (
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              ))}

              {renderField('problem', 'Description du problème', permissions.canEditCreationFields, (
                <Textarea
                  value={formData.problem}
                  onChange={(e) => setFormData(prev => ({ ...prev, problem: e.target.value }))}
                  rows={3}
                />
              ))}

              {renderField('rootCause', 'Cause racine', permissions.canEditCreationFields, (
                <Input
                  value={formData.rootCause}
                  onChange={(e) => setFormData(prev => ({ ...prev, rootCause: e.target.value }))}
                />
              ))}
            </div>
          </div>

          {/* Classification */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Classification</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('type', 'Type', permissions.canEditCreationFields, (
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, type: v as ActionType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}

              {renderField('urgency', 'Urgence', permissions.canEditCreationFields, (
                <Select 
                  value={formData.urgency} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, urgency: v as UrgencyLevel }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(URGENCY_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}

              {/* Status - Editable based on allowed transitions */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Statut
                  {!permissions.canEditStatus && <Lock className="w-3 h-3 text-muted-foreground" />}
                </Label>
                {permissions.canEditStatus ? (
                  <Select 
                    value={formData.status} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as ActionStatus }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {permissions.allowedStatusTransitions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2 bg-muted/50 rounded-md text-sm text-muted-foreground border">
                    {STATUS_LABELS[formData.status]}
                  </div>
                )}
              </div>

              {renderField('category5M', 'Catégorie 5M', permissions.canEditCreationFields, (
                <Select 
                  value={formData.category5M} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, category5M: v as Category5M }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_5M_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
            </div>
          </div>

          {/* Location - Only editable by team_leader+ with cascading */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Emplacement</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('serviceId', 'Service *', permissions.canEditCreationFields, (
                <Select 
                  value={formData.serviceId} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, serviceId: v, lineId: '', teamId: '', postId: '' }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le service" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}

              {renderField('lineId', 'Ligne *', permissions.canEditCreationFields, (
                <Select 
                  value={formData.lineId} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, lineId: v, teamId: '', postId: '' }))}
                  disabled={!formData.serviceId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.serviceId ? "Sélectionner la ligne" : "Sélectionnez d'abord le service"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredLines.map((line) => (
                      <SelectItem key={line.id} value={line.id}>{line.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}

              {renderField('teamId', 'Équipe', permissions.canEditCreationFields, (
                <Select 
                  value={formData.teamId} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, teamId: v, postId: '' }))}
                  disabled={!formData.lineId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.lineId ? "Sélectionner l'équipe" : "Sélectionnez d'abord la ligne"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTeams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}

              {renderField('postId', 'Poste', permissions.canEditCreationFields, (
                <Select 
                  value={formData.postId} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, postId: v }))}
                  disabled={!formData.teamId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.teamId ? "Sélectionner le poste" : "Sélectionnez d'abord l'équipe"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPosts.map((post) => (
                      <SelectItem key={post.id} value={post.id}>{post.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ))}
            </div>
          </div>

          {/* Assignment */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Affectation & Suivi</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('pilotId', 'Pilote (selon périmètre)', permissions.canEditCreationFields, (
                <Select 
                  value={formData.pilotId} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, pilotId: v }))}
                  disabled={!formData.serviceId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.serviceId ? "Sélectionner le pilote" : "Sélectionnez d'abord le périmètre"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredPilots.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        Aucun pilote disponible dans ce périmètre
                      </div>
                    ) : (
                      filteredPilots.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.firstName} {u.lastName}
                          <span className="text-xs text-muted-foreground ml-2">({getRoleLabel(u.role)})</span>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              ))}

              {renderField('dueDate', 'Date d\'échéance', permissions.canEditCreationFields, (
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              ))}

              {/* Progress - Editable by pilot+ */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Avancement (%)
                  {!permissions.canEditProgress && <Lock className="w-3 h-3 text-muted-foreground" />}
                </Label>
                {permissions.canEditProgress ? (
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.progressPercent}
                    onChange={(e) => setFormData(prev => ({ ...prev, progressPercent: parseInt(e.target.value) || 0 }))}
                  />
                ) : (
                  <div className="p-2 bg-muted/50 rounded-md text-sm text-muted-foreground border">
                    {formData.progressPercent}%
                  </div>
                )}
              </div>

              {/* Efficiency - Only editable by supervisor/manager */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Efficacité (%)
                  {!permissions.canEditEfficiency && <Lock className="w-3 h-3 text-muted-foreground" />}
                </Label>
                {permissions.canEditEfficiency ? (
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.efficiencyPercent}
                    onChange={(e) => setFormData(prev => ({ ...prev, efficiencyPercent: parseInt(e.target.value) || 0 }))}
                  />
                ) : (
                  <div className="p-2 bg-muted/50 rounded-md text-sm text-muted-foreground border">
                    {formData.efficiencyPercent}% 
                    <span className="text-xs ml-2">(Superviseur/Manager uniquement)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Paperclip className="w-4 h-4" />
              Pièces jointes
            </h3>
            
            {/* Existing attachments from DB */}
            {attachmentsLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground p-4 bg-muted/30 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Chargement des pièces jointes...</span>
              </div>
            ) : existingAttachments.length > 0 ? (
              <div className="space-y-2">
                {existingAttachments.map((file) => (
                  <div 
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {file.type.startsWith('image/') ? (
                        loadingPreviews.has(file.id) ? (
                          <div className="w-12 h-12 rounded bg-muted/50 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          </div>
                        ) : imagePreviews[file.id] ? (
                          <img 
                            src={imagePreviews[file.id]} 
                            alt={file.name}
                            className="w-12 h-12 rounded object-cover border border-border"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-muted/50 flex items-center justify-center">
                            <Image className="w-5 h-5 text-success" />
                          </div>
                        )
                      ) : (
                        getFileIcon(file.type)
                      )}
                      <div>
                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                          {file.uploadedByName && ` • ${file.uploadedByName}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        type="button"
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => handleDownloadAttachment(file)}
                        disabled={downloadingId === file.id}
                        title="Télécharger"
                      >
                        {downloadingId === file.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </Button>
                      {canDeleteAttachment(file) && (
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteAttachment(file)}
                          disabled={deletingId === file.id}
                          title="Supprimer"
                        >
                          {deletingId === file.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic p-4 bg-muted/30 rounded-lg">
                Aucune pièce jointe
              </p>
            )}

            {/* Add new attachment */}
            {permissions.canAddAttachments && (
              <div className="border-2 border-dashed border-border rounded-lg p-4">
                <label className="flex flex-col items-center gap-2 cursor-pointer">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Cliquer pour ajouter une pièce jointe</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  />
                </label>
                {newAttachment && (
                  <p className="text-sm text-success mt-2 text-center">
                    ✓ {newAttachment.name}
                  </p>
                )}
              </div>
            )}
          </div>


          {/* Comments */}
          <div className="space-y-2">
            <Label>Commentaires</Label>
            <Textarea
              value={formData.comments}
              onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
              placeholder="Commentaires additionnels"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" className="gradient-primary text-primary-foreground" disabled={isSubmitting || isUploading}>
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ActionEditDialog;
