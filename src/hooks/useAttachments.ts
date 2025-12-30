import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Attachment } from '@/types';

export const useAttachments = (actionId: string | undefined | null) => {
  const queryClient = useQueryClient();

  // Subscribe to realtime changes
  useEffect(() => {
    if (!actionId) return;

    const channel = supabase
      .channel(`attachments-${actionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attachments',
          filter: `action_id=eq.${actionId}`,
        },
        () => {
          // Invalidate and refetch when any change occurs
          queryClient.invalidateQueries({ queryKey: ['attachments', actionId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [actionId, queryClient]);

  return useQuery({
    queryKey: ['attachments', actionId],
    queryFn: async (): Promise<Attachment[]> => {
      if (!actionId) return [];
      
      const { data, error } = await supabase
        .from('attachments')
        .select('*, profiles:uploaded_by_id(first_name, last_name)')
        .eq('action_id', actionId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return (data || []).map(a => ({
        id: a.id,
        name: a.name,
        type: a.type,
        size: a.size,
        url: a.url,
        path: a.url,
        uploadedAt: a.created_at,
        uploadedById: a.uploaded_by_id,
        uploadedByName: a.profiles ? `${a.profiles.first_name} ${a.profiles.last_name}` : undefined,
      }));
    },
    enabled: !!actionId,
  });
};
