import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  type: 'user_created' | 'user_updated' | 'action_created' | 'action_completed' | 'action_late' | 'role_changed';
  message: string;
  relatedUserId?: string;
  relatedActionId?: string;
  isRead: boolean;
  createdAt: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return (data || []).map((n: any) => ({
        id: n.id,
        type: n.type,
        message: n.message,
        relatedUserId: n.related_user_id,
        relatedActionId: n.related_action_id,
        isRead: n.is_read,
        createdAt: n.created_at,
      }));
    },
    enabled: isAdmin,
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
  });

  // Subscribe to realtime changes
  useEffect(() => {
    if (!isAdmin) return;

    console.log('Setting up realtime notifications subscription...');

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          console.log('New notification received:', payload);
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe((status) => {
        console.log('Notifications subscription status:', status);
      });

    return () => {
      console.log('Cleaning up notifications subscription');
      supabase.removeChannel(channel);
    };
  }, [isAdmin, queryClient]);

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('is_read', false);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    isAdmin,
  };
};
