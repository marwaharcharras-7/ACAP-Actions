import React, { useRef } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Camera, Mail, Phone, Calendar } from 'lucide-react';
import { User } from '@/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface PersonalInfoTabProps {
  user: User;
  canEdit: boolean;
  onPhotoUpload: (file: File) => void;
}

const PersonalInfoTab: React.FC<PersonalInfoTabProps> = ({
  user,
  canEdit,
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
    <div className="space-y-6">
      {/* Photo de profil */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Photo de profil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
                  {getInitials(user.firstName, user.lastName)}
                </AvatarFallback>
              </Avatar>
              {canEdit && (
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-foreground/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera className="h-6 w-6 text-card" />
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
              <Button variant="outline" onClick={() => photoInputRef.current?.click()}>
                <Camera className="h-4 w-4 mr-2" />
                Changer la photo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Informations personnelles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Nom</label>
              <p className="text-foreground font-medium">{user.lastName}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground">Prénom</label>
              <p className="text-foreground font-medium">{user.firstName}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <p className="text-foreground font-medium">{user.email}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Téléphone
              </label>
              <p className="text-foreground font-medium">{user.phone || 'Non renseigné'}</p>
            </div>
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date de naissance
              </label>
              <p className="text-foreground font-medium">
                {user.dateOfBirth 
                  ? format(new Date(user.dateOfBirth), 'dd MMMM yyyy', { locale: fr })
                  : 'Non renseignée'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default PersonalInfoTab;
