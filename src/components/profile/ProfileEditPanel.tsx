import React, { useState, useRef } from 'react';
import { X, Camera, Upload, Save, Loader2 } from 'lucide-react';
import { User, UserRole, ROLE_LABELS } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useData } from '@/contexts/DataContext';

interface ProfileEditPanelProps {
  user: User;
  isAdmin: boolean;
  isOwnProfile: boolean;
  onClose: () => void;
  onSave: (updatedUser: Partial<User>) => void;
}

const ProfileEditPanel: React.FC<ProfileEditPanelProps> = ({
  user,
  isAdmin,
  isOwnProfile,
  onClose,
  onSave,
}) => {
  const { services, lines, teams, posts, factories } = useData();
  const { uploadAvatar, uploadCV, isUploading } = useFileUpload();
  
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || '',
    role: user.role,
    factoryId: user.factoryId || '',
    serviceId: user.serviceId || '',
    lineId: user.lineId || '',
    teamId: user.teamId || '',
    postId: user.postId || '',
  });
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(user.avatarUrl);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const photoInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCVChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCvFile(file);
    }
  };

  // Use real data from context
  const filteredLines = lines.filter(l => !formData.serviceId || l.serviceId === formData.serviceId);
  const filteredTeams = teams.filter(t => !formData.lineId || t.lineId === formData.lineId);
  const filteredPosts = posts.filter(p => !formData.teamId || p.teamId === formData.teamId);

  const handleSubmit = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword && newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setIsSaving(true);
    
    try {
      let newAvatarUrl = user.avatarUrl;
      let newCvUrl = user.cvUrl;

      // Upload avatar if changed
      if (avatarFile) {
        const result = await uploadAvatar(user.id, avatarFile);
        if (result) {
          newAvatarUrl = result.url;
        }
      }

      // Upload CV if changed
      if (cvFile) {
        const result = await uploadCV(user.id, cvFile);
        if (result) {
          newCvUrl = result.url;
        }
      }

      // Update password if provided
      if (newPassword) {
        const { supabase } = await import('@/integrations/supabase/client');
        const { error: passwordError } = await supabase.functions.invoke('reset-password', {
          body: { userId: user.id, newPassword }
        });

        if (passwordError) {
          toast.error('Erreur lors de la mise à jour du mot de passe');
          setIsSaving(false);
          return;
        }
        toast.success('Mot de passe mis à jour avec succès');
      }

      // Save profile data
      onSave({
        ...formData,
        avatarUrl: newAvatarUrl,
        cvUrl: newCvUrl,
      });

      toast.success('Profil mis à jour avec succès');
      onClose();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Erreur lors de la sauvegarde du profil');
    } finally {
      setIsSaving(false);
    }
  };

  // Can edit professional info only if admin viewing another user's profile
  const canEditProfessionalInfo = isAdmin && !isOwnProfile;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-lg bg-card border-l border-border shadow-xl h-full animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Modifier le profil</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-160px)] overflow-y-auto">
          <div className="p-6 pb-24 space-y-6">
            {/* Photo de profil */}
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Avatar className="h-20 w-20 border-4 border-primary/20">
                  <AvatarImage src={avatarPreview} alt="Preview" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
                    {getInitials(formData.firstName, formData.lastName)}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-foreground/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="h-5 w-5 text-card" />
                </button>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
              <Button variant="outline" onClick={() => photoInputRef.current?.click()}>
                <Camera className="h-4 w-4 mr-2" />
                Changer la photo
              </Button>
            </div>

            <Separator />

            {/* Informations personnelles */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Informations personnelles</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+212 6XX XXX XXX"
                />
              </div>
            </div>

            <Separator />

            {/* Mot de passe */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground">Modifier le mot de passe (optionnel)</h3>
              
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Laisser vide pour ne pas modifier"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmer le nouveau mot de passe"
                />
              </div>
            </div>

            {/* Professional Info - Admin only for other users */}
            {canEditProfessionalInfo && (
              <>
                <Separator />
                
                <div className="space-y-4">
                  <h3 className="font-medium text-foreground">Informations professionnelles</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="role">Rôle</Label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un rôle" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(ROLE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="factory">Usine</Label>
                    <Select 
                      value={formData.factoryId} 
                      onValueChange={(value) => setFormData({ ...formData, factoryId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une usine" />
                      </SelectTrigger>
                      <SelectContent>
                        {factories.map((factory) => (
                          <SelectItem key={factory.id} value={factory.id}>{factory.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service">Service</Label>
                    <Select 
                      value={formData.serviceId} 
                      onValueChange={(value) => setFormData({ ...formData, serviceId: value, lineId: '', teamId: '', postId: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="line">Ligne</Label>
                    <Select 
                      value={formData.lineId} 
                      onValueChange={(value) => setFormData({ ...formData, lineId: value, teamId: '', postId: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une ligne" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredLines.map((line) => (
                          <SelectItem key={line.id} value={line.id}>{line.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="team">Équipe</Label>
                    <Select 
                      value={formData.teamId} 
                      onValueChange={(value) => setFormData({ ...formData, teamId: value, postId: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une équipe" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredTeams.map((team) => (
                          <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="post">Poste</Label>
                    <Select 
                      value={formData.postId} 
                      onValueChange={(value) => setFormData({ ...formData, postId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un poste" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredPosts.map((post) => (
                          <SelectItem key={post.id} value={post.id}>{post.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditPanel;
