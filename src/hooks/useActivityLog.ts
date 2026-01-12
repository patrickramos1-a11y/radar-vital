import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/contexts/UserContext';

export interface ActivityLog {
  id: string;
  user_name: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  description: string;
  created_at: string;
}

export function useActivityLog() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastReadAt, setLastReadAt] = useState<string | null>(null);
  const { currentUser } = useUser();

  // Load last read timestamp from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('activity_last_read');
    if (stored) {
      setLastReadAt(stored);
    }
  }, []);

  // Fetch activities
  useEffect(() => {
    fetchActivities();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('activity_logs_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'activity_logs',
        },
        (payload) => {
          const newActivity = payload.new as ActivityLog;
          setActivities((prev) => [newActivity, ...prev.slice(0, 49)]);
          
          // Increment unread if not from current user
          if (currentUser && newActivity.user_name.toLowerCase() !== currentUser.name) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // Calculate unread count when activities or lastReadAt changes
  useEffect(() => {
    if (lastReadAt && activities.length > 0) {
      const unread = activities.filter(
        (a) => new Date(a.created_at) > new Date(lastReadAt) &&
               currentUser && a.user_name.toLowerCase() !== currentUser.name
      ).length;
      setUnreadCount(unread);
    } else if (!lastReadAt && activities.length > 0) {
      // All are unread except current user's
      const unread = activities.filter(
        (a) => currentUser && a.user_name.toLowerCase() !== currentUser.name
      ).length;
      setUnreadCount(unread);
    }
  }, [activities, lastReadAt, currentUser]);

  async function fetchActivities() {
    setLoading(true);
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setActivities(data);
    }
    setLoading(false);
  }

  async function logActivity(
    actionType: string,
    entityType: string,
    description: string,
    entityId?: string,
    entityName?: string
  ) {
    if (!currentUser) return;

    const { error } = await supabase.from('activity_logs').insert({
      user_name: currentUser.displayName,
      action_type: actionType,
      entity_type: entityType,
      entity_id: entityId || null,
      entity_name: entityName || null,
      description,
    });

    if (error) {
      console.error('Error logging activity:', error);
    }
  }

  function markAsRead() {
    const now = new Date().toISOString();
    setLastReadAt(now);
    setUnreadCount(0);
    localStorage.setItem('activity_last_read', now);
  }

  return {
    activities,
    unreadCount,
    loading,
    logActivity,
    markAsRead,
    refetch: fetchActivities,
  };
}
