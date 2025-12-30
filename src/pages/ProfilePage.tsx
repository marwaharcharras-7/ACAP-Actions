import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { User } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User as UserIcon, Briefcase, Activity } from "lucide-react";
import ProfileSummary from "@/components/profile/ProfileSummary";
import PersonalInfoTab from "@/components/profile/PersonalInfoTab";
import ProfessionalInfoTab from "@/components/profile/ProfessionalInfoTab";
import ActivityPermissionsTab from "@/components/profile/ActivityPermissionsTab";
import ProfileEditPanel from "@/components/profile/ProfileEditPanel";
import { useFileUpload } from "@/hooks/useFileUpload";
import { toast } from "sonner";

const ProfilePage: React.FC = () => {
  const { user: currentUser, refreshUser } = useAuth();
  const { actions, updateUser } = useData();
  const { uploadAvatar } = useFileUpload();
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);

  const viewedUser: User | null = currentUser
    ? {
        ...currentUser,
        phone: currentUser.phone || "+212 6XX XXX XXX",
        dateOfBirth: currentUser.dateOfBirth || "1990-05-15",
        hireDate: currentUser.hireDate || "2022-03-01",
        skills: currentUser.skills || ["Gestion de projet", "Lean Manufacturing"],
        factoryId: currentUser.factoryId || "1",
        lastLoginAt: currentUser.lastLoginAt || new Date().toISOString(),
      }
    : null;

  if (!viewedUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Chargement du profil...</p>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === viewedUser.id;
  const isAdmin = currentUser?.role === "admin";
  const canEdit = isOwnProfile || isAdmin;

  const handlePhotoUpload = async (file: File) => {
    if (!currentUser?.id) return;
    const result = await uploadAvatar(currentUser.id, file);
    if (result) {
      await refreshUser();
      toast.success("Photo de profil mise à jour");
    }
  };

  const handleProfileUpdate = (updatedUser: Partial<User>) => {
    if (!currentUser?.id) return;
    updateUser(currentUser.id, updatedUser);
    toast.success("Profil mis à jour avec succès");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isOwnProfile ? "Mon Profil" : `Profil de ${viewedUser.firstName} ${viewedUser.lastName}`}
          </h1>
          <p className="text-muted-foreground mt-1">Consultez et gérez les informations du profil</p>
        </div>
      </div>

      {/* Profile Summary */}
      <ProfileSummary
        user={viewedUser}
        isOwnProfile={isOwnProfile}
        canEdit={canEdit}
        onEditClick={() => setIsEditPanelOpen(true)}
        onPhotoUpload={handlePhotoUpload}
      />

      {/* Tabs */}
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="personal" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Informations personnelles</span>
            <span className="sm:hidden">Personnel</span>
          </TabsTrigger>
          <TabsTrigger value="professional" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            <span className="hidden sm:inline">Informations professionnelles</span>
            <span className="sm:hidden">Professionnel</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Activité </span>
            <span className="sm:hidden">Activité</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <PersonalInfoTab
            user={viewedUser}
            canEdit={canEdit}
            onPhotoUpload={handlePhotoUpload}
          />
        </TabsContent>

        <TabsContent value="professional">
          <ProfessionalInfoTab user={viewedUser} />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityPermissionsTab user={viewedUser} actions={actions} />
        </TabsContent>
      </Tabs>

      {/* Edit Panel */}
      {isEditPanelOpen && (
        <ProfileEditPanel
          user={viewedUser}
          isAdmin={isAdmin}
          isOwnProfile={isOwnProfile}
          onClose={() => setIsEditPanelOpen(false)}
          onSave={handleProfileUpdate}
        />
      )}
    </div>
  );
};

export default ProfilePage;
