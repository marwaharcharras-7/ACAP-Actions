import { useState, useEffect, useRef } from 'react';
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
import { usePilotFilter, getRoleLabel } from '@/hooks/usePilotFilter';
import { supabase } from '@/integrations/supabase/client';
import { Paperclip, X, Upload } from 'lucide-react';
import { 
  Action, 
  ActionStatus, 
  ActionType, 
  UrgencyLevel, 
  Category5M,
  STATUS_LABELS,
  TYPE_LABELS,
  URGENCY_LABELS,
  CATEGORY_5M_LABELS
} from '@/types';

interface PendingFile {
  file: File;
  name: string;
}

interface ActionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action?: Action | null;
}

const ActionFormDialog = ({ open, onOpenChange, action }: ActionFormDialogProps) => {
  const { addAction, updateAction, services, lines, teams, posts, users } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const { uploadAttachment, isUploading } = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files).map(file => ({ file, name: file.name }));
      setPendingFiles(prev => [...prev, ...newFiles]);
    }
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

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
    } else {
      setFormData({
        title: '',
        description: '',
        problem: '',
        rootCause: '',
        type: 'corrective',
        status: 'identified',
        urgency: 'medium',
        category5M: '',
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
    }
  }, [action, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.problem || !formData.pilotId || !formData.dueDate || !formData.serviceId || !formData.lineId) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires (titre, problème, pilote, date, service, ligne)',
        variant: 'destructive',
      });
      return;
    }

    if (!user?.id) {
      toast({
        title: 'Erreur',
        description: 'Vous devez être connecté pour créer une action.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const actionData = {
        title: formData.title,
        description: formData.description,
        problem: formData.problem,
        rootCause: formData.rootCause || undefined,
        type: formData.type,
        status: formData.status,
        urgency: formData.urgency,
        category5M: formData.category5M || undefined,
        pilotId: formData.pilotId,
        createdById: user.id,
        serviceId: formData.serviceId || undefined,
        lineId: formData.lineId || undefined,
        teamId: formData.teamId || undefined,
        postId: formData.postId || undefined,
        dueDate: formData.dueDate,
        progressPercent: formData.progressPercent,
        efficiencyPercent: formData.efficiencyPercent || undefined,
        comments: formData.comments || undefined,
      };

      if (action) {
        updateAction(action.id, actionData);
        
        // Upload new attachments for existing action
        let attachmentsFailed = false;
        if (pendingFiles.length > 0) {
          for (const pendingFile of pendingFiles) {
            const res = await uploadAttachment(action.id, user.id, pendingFile.file);
            if (!res) attachmentsFailed = true;
          }
        }
        
        toast({
          title: 'Action mise à jour',
          description: attachmentsFailed
            ? "Les modifications ont été enregistrées, mais certaines pièces jointes n'ont pas pu être téléversées."
            : 'Les modifications ont été enregistrées avec succès.',
        });
      } else {
        // Create action and get ID for attachments
        const { data: insertedAction, error: actionError } = await supabase
          .from('actions')
          .insert({
            title: actionData.title,
            description: actionData.description,
            problem: actionData.problem,
            root_cause: actionData.rootCause,
            type: actionData.type,
            status: actionData.status,
            urgency: actionData.urgency,
            category_5m: actionData.category5M,
            pilot_id: actionData.pilotId,
            created_by_id: actionData.createdById,
            service_id: actionData.serviceId || null,
            line_id: actionData.lineId || null,
            team_id: actionData.teamId || null,
            post_id: actionData.postId || null,
            due_date: actionData.dueDate,
            progress_percent: actionData.progressPercent,
            efficiency_percent: actionData.efficiencyPercent,
            comments: actionData.comments,
          })
          .select('id')
          .single();

        if (actionError) throw actionError;

        // Upload attachments if any
        let attachmentsFailed = false;
        if (pendingFiles.length > 0 && insertedAction?.id) {
          for (const pendingFile of pendingFiles) {
            const res = await uploadAttachment(insertedAction.id, user.id, pendingFile.file);
            if (!res) attachmentsFailed = true;
          }
        }

        toast({
          title: 'Action créée',
          description: attachmentsFailed
            ? "La nouvelle action a été ajoutée, mais certaines pièces jointes n'ont pas pu être téléversées."
            : 'La nouvelle action a été ajoutée à la base de données.',
        });
      }
      
      setPendingFiles([]);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving action:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Une erreur est survenue lors de l\'enregistrement.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{action ? 'Modifier l\'action' : 'Nouvelle action'}</DialogTitle>
          <DialogDescription>
            {action ? 'Modifiez les informations de l\'action' : 'Remplissez le formulaire pour créer une nouvelle action'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Informations générales</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Titre *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Titre de l'action"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="problem">Description du problème *</Label>
                <Textarea
                  id="problem"
                  value={formData.problem}
                  onChange={(e) => setFormData(prev => ({ ...prev, problem: e.target.value }))}
                  placeholder="Décrivez le problème identifié"
                  rows={3}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Action proposée</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Décrivez l'action à mener"
                  rows={2}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="rootCause">Cause racine</Label>
                <Input
                  id="rootCause"
                  value={formData.rootCause}
                  onChange={(e) => setFormData(prev => ({ ...prev, rootCause: e.target.value }))}
                  placeholder="Cause racine identifiée"
                />
              </div>
            </div>
          </div>

          {/* Classification */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Classification</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type *</Label>
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
              </div>

              <div className="space-y-2">
                <Label>Urgence *</Label>
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
              </div>

              <div className="space-y-2">
                <Label>Statut</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, status: v as ActionStatus }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Catégorie 5M</Label>
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
              </div>
            </div>
          </div>

          {/* Location - Cascading selects */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Emplacement</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Service *</Label>
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
              </div>

              <div className="space-y-2">
                <Label>Ligne *</Label>
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
              </div>

              <div className="space-y-2">
                <Label>Équipe</Label>
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
              </div>

              <div className="space-y-2">
                <Label>Poste</Label>
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
              </div>
            </div>
          </div>

          {/* Assignment */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Affectation</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Pilote * <span className="text-xs text-muted-foreground">(selon périmètre)</span></Label>
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
              </div>

              <div className="space-y-2">
                <Label>Date d'échéance *</Label>
                <Input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Avancement (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progressPercent}
                  onChange={(e) => setFormData(prev => ({ ...prev, progressPercent: parseInt(e.target.value) || 0 }))}
                />
              </div>

              {(user?.role === 'supervisor' || user?.role === 'manager' || user?.role === 'admin') && (
                <div className="space-y-2">
                  <Label>Efficacité (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.efficiencyPercent}
                    onChange={(e) => setFormData(prev => ({ ...prev, efficiencyPercent: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label>Pièces jointes</Label>
            <div className="border border-dashed border-border rounded-lg p-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full gap-2"
                disabled={isUploading}
              >
                <Upload className="h-4 w-4" />
                Ajouter des fichiers
              </Button>
              
              {pendingFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  {pendingFiles.map((pf, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2 text-sm">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate max-w-[200px]">{pf.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments">Commentaires</Label>
            <Textarea
              id="comments"
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
            <Button type="submit" className="gradient-primary text-primary-foreground" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement...' : (action ? 'Mettre à jour' : 'Créer')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ActionFormDialog;
