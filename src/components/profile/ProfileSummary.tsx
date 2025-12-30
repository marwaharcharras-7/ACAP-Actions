import React, { useRef } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Camera, Edit, CheckCircle, XCircle } from 'lucide-react';
import { User, ROLE_LABELS } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ProfileSummaryProps {
  user: User;
  isOwnProfile: boolean;
  canEdit: boolean;
  onEditClick: () => void;
  onPhotoUpload: (file: File) => void;
}

const ProfileSummary: React.FC<ProfileSummaryProps> = ({
  user,
  isOwnProfile,
  canEdit,
  onEditClick,
  onPhotoUpload,
}) => {
  const photoInputRef = useRef<HTMLInputElement>(null);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onPhotoUpload(file);
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-card">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Photo Section */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <Avatar className="h-32 w-32 border-4 border-primary/20">
              <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-semibold">
                {getInitials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
            {canEdit && (
              <button
                onClick={() => photoInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-foreground/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="h-8 w-8 text-card" />
              </button>
            )}
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={() => photoInputRef.current?.click()}>
              <Camera className="h-4 w-4 mr-2" />
              Changer la photo
            </Button>
          )}
        </div>

        {/* Info Section */}
        <div className="flex-1 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {user.firstName} {user.lastName}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {ROLE_LABELS[user.role]}
                </Badge>
                <Badge 
                  variant={user.isActive ? 'default' : 'destructive'}
                  className={user.isActive ? 'bg-success text-success-foreground' : ''}
                >
                  {user.isActive ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Actif
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      Inactif
                    </>
                  )}
                </Badge>
              </div>
            </div>
            {canEdit && (
              <Button onClick={onEditClick}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier le profil
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Email</span>
              <p className="font-medium text-foreground">{user.email}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Téléphone</span>
              <p className="font-medium text-foreground">{user.phone || 'Non renseigné'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Date de création du compte</span>
              <p className="font-medium text-foreground">
                {format(new Date(user.createdAt), 'dd MMMM yyyy', { locale: fr })}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Dernière connexion</span>
              <p className="font-medium text-foreground">
                {user.lastLoginAt 
                  ? format(new Date(user.lastLoginAt), 'dd MMMM yyyy à HH:mm', { locale: fr })
                  : 'Non disponible'}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfileSummary;
