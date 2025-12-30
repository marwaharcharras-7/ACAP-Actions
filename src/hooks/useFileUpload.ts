import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UploadResult {
  url: string;
  path: string;
}

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadAvatar = async (userId: string, file: File): Promise<UploadResult | null> => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', userId);
      
      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }
      
      return { url: urlData.publicUrl, path: fileName };
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast.error('Erreur lors du téléversement de la photo');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadCV = async (userId: string, file: File): Promise<UploadResult | null> => {
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/cv.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('cvs')
        .upload(fileName, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // For private bucket, store the path (not public URL)
      // Update profile with CV path for signed URL generation
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ cv_url: fileName })
        .eq('id', userId);
      
      if (updateError) {
        console.error('Profile update error:', updateError);
        throw updateError;
      }
      
      return { url: fileName, path: fileName };
    } catch (error: any) {
      console.error('CV upload error:', error);
      toast.error('Erreur lors du téléversement du CV');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadAttachment = async (actionId: string, userId: string, file: File): Promise<UploadResult | null> => {
    setIsUploading(true);
    try {
      const fileName = `${userId}/${actionId}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(fileName, file);
      
      if (uploadError) throw uploadError;
      
      // Store the path (not public URL) since bucket is private
      // Insert into attachments table with path for signed URL generation
      const { error: dbError } = await supabase.from('attachments').insert({
        action_id: actionId,
        uploaded_by_id: userId,
        name: file.name,
        url: fileName, // Store path as url field for backward compat
        type: file.type,
        size: file.size,
      });
      
      if (dbError) throw dbError;
      
      return { url: fileName, path: fileName };
    } catch (error: any) {
      console.error('Attachment upload error:', error);
      toast.error('Erreur lors du téléversement de la pièce jointe');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const getSignedUrl = async (bucket: string, path: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600); // 1 hour expiry
      
      if (error) throw error;
      
      // Ensure we have a complete URL (some SDK versions return relative paths)
      if (data.signedUrl.startsWith('/')) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        return `${supabaseUrl}/storage/v1${data.signedUrl}`;
      }
      
      return data.signedUrl;
    } catch (error: any) {
      console.error('Signed URL error:', error);
      return null;
    }
  };

  const downloadCV = async (userId: string): Promise<void> => {
    try {
      // Get CV path from profile
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('cv_url')
        .eq('id', userId)
        .maybeSingle();
      
      if (fetchError) throw fetchError;
      
      if (!profile?.cv_url) {
        toast.error('Aucun CV disponible');
        return;
      }
      
      // Generate signed URL for private bucket
      const signedUrl = await getSignedUrl('cvs', profile.cv_url);
      
      if (!signedUrl) {
        toast.error('Impossible de générer le lien de téléchargement');
        return;
      }
      
      // Open in new tab for download
      window.open(signedUrl, '_blank');
    } catch (error: any) {
      console.error('CV download error:', error);
      toast.error('Erreur lors du téléchargement du CV');
    }
  };

  const deleteAttachment = async (attachmentId: string, storagePath: string): Promise<boolean> => {
    try {
      // Delete from storage first
      const { error: storageError } = await supabase.storage
        .from('attachments')
        .remove([storagePath]);
      
      if (storageError) {
        console.error('Storage delete error:', storageError);
        // Continue to try DB delete even if storage fails
      }
      
      // Delete from database
      const { error: dbError } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachmentId);
      
      if (dbError) throw dbError;
      
      return true;
    } catch (error: any) {
      console.error('Attachment delete error:', error);
      toast.error('Erreur lors de la suppression de la pièce jointe');
      return false;
    }
  };

  return {
    isUploading,
    uploadAvatar,
    uploadCV,
    uploadAttachment,
    downloadCV,
    getSignedUrl,
    deleteAttachment,
  };
};
