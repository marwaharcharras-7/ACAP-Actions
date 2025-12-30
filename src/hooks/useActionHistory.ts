import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ActionHistoryEntry {
  id: string;
  actionId: string;
  userId: string | null;
  userName: string | null;
  eventType: string;
  oldValue: string | null;
  newValue: string | null;
  fieldName: string | null;
  details: string | null;
  createdAt: string;
}

export const useActionHistory = (actionId: string | null) => {
  const [history, setHistory] = useState<ActionHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!actionId) {
      setHistory([]);
      return;
    }

    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('action_history')
          .select('*')
          .eq('action_id', actionId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching action history:', error);
          return;
        }

        setHistory(
          (data || []).map((item: any) => ({
            id: item.id,
            actionId: item.action_id,
            userId: item.user_id,
            userName: item.user_name,
            eventType: item.event_type,
            oldValue: item.old_value,
            newValue: item.new_value,
            fieldName: item.field_name,
            details: item.details,
            createdAt: item.created_at,
          }))
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [actionId]);

  return { history, isLoading };
};
