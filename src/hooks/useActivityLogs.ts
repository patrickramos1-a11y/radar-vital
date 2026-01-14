import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser, AppUserName } from '@/contexts/UserContext';

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

export type ActionType = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'IMPORT' 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'TOGGLE_PRIORITY'
  | 'TOGGLE_HIGHLIGHT'
  | 'TOGGLE_ACTIVE'
  | 'TOGGLE_CHECKED'
  | 'STATUS_CHANGE'
  | 'ASSIGN';

export interface LogFilters {
  userName: AppUserName | 'all';
  actionType: ActionType | 'all';
  entityType: string | 'all';
  clientId: string | 'all';
}

const DEFAULT_FILTERS: LogFilters = {
  userName: 'all',
  actionType: 'all',
  entityType: 'all',
  clientId: 'all',
};

export function useActivityLogs() {
  const { currentUser } = useUser();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<LogFilters>(DEFAULT_FILTERS);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(() => {
    return localStorage.getItem('activity_logs_last_seen');
  });

  const isAdmin = currentUser?.name === 'Patrick';

  // Fetch logs from database
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      const { data, error } = await query;

      if (error) throw error;

      setLogs(data || []);

      // Calculate unread count
      if (lastSeenAt) {
        const unread = (data || []).filter(
          log => new Date(log.created_at) > new Date(lastSeenAt)
        ).length;
        setUnreadCount(unread);
      } else {
        setUnreadCount(data?.length || 0);
      }
    } catch (error) {
      console.error('Error fetching activity logs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [lastSeenAt]);

  // Initial fetch
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Subscribe to realtime updates
  useEffect(() => {
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
          const newLog = payload.new as ActivityLog;
          setLogs(prev => [newLog, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Mark as seen
  const markAsSeen = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem('activity_logs_last_seen', now);
    setLastSeenAt(now);
    setUnreadCount(0);
  }, []);

  // Filter logs based on user role and filters
  const filteredLogs = useMemo(() => {
    let result = [...logs];

    // Non-admin users can only see their own actions or actions related to their clients
    if (!isAdmin && currentUser) {
      result = result.filter(log => {
        // Always show own actions
        if (log.user_name === currentUser.name) return true;
        // For now, show all (could be refined to check client responsibility)
        return false;
      });
    }

    // Apply user filter
    if (filters.userName !== 'all') {
      result = result.filter(log => log.user_name === filters.userName);
    }

    // Apply action type filter
    if (filters.actionType !== 'all') {
      result = result.filter(log => log.action_type === filters.actionType);
    }

    // Apply entity type filter
    if (filters.entityType !== 'all') {
      result = result.filter(log => log.entity_type === filters.entityType);
    }

    // Apply client filter
    if (filters.clientId !== 'all') {
      result = result.filter(log => log.entity_id === filters.clientId);
    }

    return result;
  }, [logs, filters, isAdmin, currentUser]);

  // Get unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    const users = [...new Set(logs.map(l => l.user_name))];
    const actionTypes = [...new Set(logs.map(l => l.action_type))];
    const entityTypes = [...new Set(logs.map(l => l.entity_type))];
    const clients = logs
      .filter(l => l.entity_type === 'client' && l.entity_name)
      .reduce((acc, l) => {
        if (l.entity_id && l.entity_name && !acc.find(c => c.id === l.entity_id)) {
          acc.push({ id: l.entity_id, name: l.entity_name });
        }
        return acc;
      }, [] as { id: string; name: string }[]);

    return { users, actionTypes, entityTypes, clients };
  }, [logs]);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<LogFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return {
    logs: filteredLogs,
    allLogs: logs,
    isLoading,
    filters,
    filterOptions,
    updateFilters,
    clearFilters,
    markAsSeen,
    unreadCount,
    isAdmin,
    refetch: fetchLogs,
  };
}

// Utility function to log activity
export async function logActivity(params: {
  userName: string;
  actionType: ActionType | string;
  entityType: string;
  entityId?: string | null;
  entityName?: string | null;
  description: string;
}) {
  try {
    await supabase.from('activity_logs').insert({
      user_name: params.userName,
      action_type: params.actionType,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      entity_name: params.entityName || null,
      description: params.description,
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}
