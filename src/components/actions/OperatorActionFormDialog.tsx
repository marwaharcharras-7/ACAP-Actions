import { useState, useRef } from 'react';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useFileUpload } from '@/hooks/useFileUpload';
import { supabase } from '@/integrations/supabase/client';
import { Paperclip, X, Loader2, Upload } from 'lucide-react';
import { format, addDays } from 'date-fns';

interface OperatorActionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PendingFile {
  file: File;
  name: string;
}

const OperatorActionFormDialog = ({ open, onOpenChange }: OperatorActionFormDialogProps) => {
  const { addAction } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const { uploadAttachment, isUploading } = useFileUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    problem: '',
    description: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.problem.trim() || !formData.description.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
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
      // Create action with minimal data - status = identified
      // Team leader will complete the details
      const actionData = {
        title: formData.description.slice(0, 100), // Use first 100 chars of description as title
        description: formData.description,
        problem: formData.problem,
        type: 'corrective' as const,
        status: 'identified' as const,
        urgency: 'medium' as const,
        pilotId: user.id, // Operator is initially the pilot
        createdById: user.id,
        dueDate: format(addDays(new Date(), 14), 'yyyy-MM-dd'), // Default 2 weeks
        progressPercent: 0,
        // Use user's team/line/post if available
        teamId: user.teamId,
        lineId: user.lineId,
        postId: user.postId,
        serviceId: user.serviceId,
      };

      // First insert the action
      const { data: insertedAction, error: actionError } = await supabase
        .from('actions')
        .insert({
          title: actionData.title,
          description: actionData.description,
          problem: actionData.problem,
          type: actionData.type,
          status: actionData.status,
          urgency: actionData.urgency,
          pilot_id: actionData.pilotId,
          created_by_id: actionData.createdById,
          due_date: actionData.dueDate,
          progress_percent: actionData.progressPercent,
          team_id: actionData.teamId || null,
          line_id: actionData.lineId || null,
          post_id: actionData.postId || null,
          service_id: actionData.serviceId || null,
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
          ? "Votre action a été soumise, mais certaines pièces jointes n'ont pas pu être téléversées."
          : "Votre action a été soumise. Le chef d'équipe complètera les détails.",
      });

      // Reset form
      setFormData({ problem: '', description: '' });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Signaler un problème</DialogTitle>
          <DialogDescription>
            Décrivez le problème identifié et proposez une action. Le chef d'équipe complètera les détails.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="problem">Problème identifié *</Label>
              <Textarea
                id="problem"
                value={formData.problem}
                onChange={(e) => setFormData(prev => ({ ...prev, problem: e.target.value }))}
                placeholder="Décrivez le problème que vous avez identifié..."
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Action proposée *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez l'action que vous proposez pour résoudre ce problème..."
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Attachments */}
            <div className="space-y-2">
              <Label>Pièces jointes (optionnel)</Label>
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
              <p className="text-xs text-muted-foreground">
                Formats acceptés: images, PDF, Word, Excel
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              className="gradient-primary text-primary-foreground" 
              disabled={isSubmitting || isUploading}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Envoi...
                </>
              ) : (
                'Soumettre'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OperatorActionFormDialog;
