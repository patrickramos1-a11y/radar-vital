import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Collaborator names type for filters
export type CollaboratorFilterName = string;
// Action types for operational tracking
export type ActionType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'TOGGLE_PRIORITY'
  | 'TOGGLE_HIGHLIGHT'
  | 'TOGGLE_ACTIVE'
  | 'TOGGLE_CHECKED'
  | 'TOGGLE_COLLABORATOR'
  | 'TOGGLE_CLIENT_TYPE'
  | 'CREATE_COMMENT'
  | 'DELETE_COMMENT'
  | 'PIN_COMMENT'
  | 'CREATE_TASK'
  | 'COMPLETE_TASK'
  | 'DELETE_TASK'
  | 'UPDATE_TASK'
  | 'IMPORT_DEMANDS'
  | 'IMPORT_LICENSES'
  | 'IMPORT_PROCESSES'
  | 'IMPORT_DATA'
  | 'CREATE_CLIENT'
  | 'DELETE_CLIENT'
  | 'UPDATE_DEMAND_STATUS'
  | 'CREATE_DEMAND'
  | 'UPDATE_DEMAND'
  | 'CHANGE_RESPONSIBLE'
  | 'CHANGE_PROJECT_YEAR'
  | 'MOVE_CLIENT';

export interface ActivityLog {
  id: string;
  user_name: string;
  action_type: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  client_name: string | null;
  description: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export interface LogFilters {
  userName: CollaboratorFilterName | 'all';
  actionType: ActionType | 'all';
  entityType: string | 'all';
  clientId: string | 'all';
  onlyMine: boolean;
}

export const DEFAULT_FILTERS: LogFilters = {
  userName: 'all',
  actionType: 'all',
  entityType: 'all',
  clientId: 'all',
  onlyMine: false,
};

// Quick filter categories
export const QUICK_FILTER_CATEGORIES = {
  priority: ['TOGGLE_PRIORITY'],
  highlight: ['TOGGLE_HIGHLIGHT'],
  comments: ['CREATE_COMMENT', 'DELETE_COMMENT', 'PIN_COMMENT'],
  imports: ['IMPORT_DEMANDS', 'IMPORT_LICENSES', 'IMPORT_PROCESSES', 'IMPORT_DATA'],
  demands: ['CREATE_DEMAND', 'UPDATE_DEMAND', 'UPDATE_DEMAND_STATUS', 'CHANGE_RESPONSIBLE'],
  tasks: ['CREATE_TASK', 'COMPLETE_TASK', 'DELETE_TASK', 'UPDATE_TASK'],
  collaborators: ['TOGGLE_COLLABORATOR', 'CHANGE_RESPONSIBLE'],
  session: ['LOGIN', 'LOGOUT'],
};

const STORAGE_KEY = 'activity_logs_last_seen';

export function useActivityLogs() {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<LogFilters>(DEFAULT_FILTERS);
  const [lastSeenAt, setLastSeenAt] = useState<Date | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [quickFilter, setQuickFilter] = useState<keyof typeof QUICK_FILTER_CATEGORIES | null>(null);

  // Get current user name for filtering
  const currentUserName = currentUser?.name || null;
  // For now, we'll consider admin anyone with Patrick name - can be enhanced with roles later
  const isAdmin = currentUserName?.toLowerCase() === 'patrick';

  // Load last seen timestamp from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setLastSeenAt(new Date(stored));
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      const mappedLogs: ActivityLog[] = (data || []).map((row: any) => ({
        id: row.id,
        user_name: row.user_name,
        action_type: row.action_type,
        entity_type: row.entity_type,
        entity_id: row.entity_id,
        entity_name: row.entity_name,
        client_name: row.client_name,
        description: row.description,
        old_value: row.old_value,
        new_value: row.new_value,
        created_at: row.created_at,
      }));

      setLogs(mappedLogs);

      // Calculate unread count
      if (lastSeenAt) {
        const unread = mappedLogs.filter(
          log => new Date(log.created_at) > lastSeenAt
        ).length;
        setUnreadCount(unread);
      } else {
        setUnreadCount(mappedLogs.length > 0 ? mappedLogs.length : 0);
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
      .channel('activity_logs_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_logs' },
        (payload) => {
          const newLog: ActivityLog = {
            id: payload.new.id,
            user_name: payload.new.user_name,
            action_type: payload.new.action_type,
            entity_type: payload.new.entity_type,
            entity_id: payload.new.entity_id,
            entity_name: payload.new.entity_name,
            client_name: payload.new.client_name,
            description: payload.new.description,
            old_value: payload.new.old_value,
            new_value: payload.new.new_value,
            created_at: payload.new.created_at,
          };
          setLogs(prev => [newLog, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const markAsSeen = useCallback(() => {
    const now = new Date();
    localStorage.setItem(STORAGE_KEY, now.toISOString());
    setLastSeenAt(now);
    setUnreadCount(0);
  }, []);

  // Filter logs based on current filters and user role
  const filteredLogs = useMemo(() => {
    let result = logs;

    // Non-admin users only see their own actions or actions on their clients
    if (!isAdmin && currentUserName) {
      result = result.filter(log => 
        log.user_name === currentUserName ||
        log.entity_name?.toLowerCase().includes(currentUserName.toLowerCase())
      );
    }

    // Apply "only mine" filter
    if (filters.onlyMine && currentUserName) {
      result = result.filter(log => log.user_name === currentUserName);
    }

    // Apply user filter
    if (filters.userName !== 'all') {
      result = result.filter(log => log.user_name === filters.userName);
    }

    // Apply action type filter
    if (filters.actionType !== 'all') {
      result = result.filter(log => log.action_type === filters.actionType);
    }

    // Apply quick filter
    if (quickFilter) {
      const actionTypes = QUICK_FILTER_CATEGORIES[quickFilter];
      result = result.filter(log => actionTypes.includes(log.action_type));
    }

    // Apply entity type filter
    if (filters.entityType !== 'all') {
      result = result.filter(log => log.entity_type === filters.entityType);
    }

    // Apply client filter
    if (filters.clientId !== 'all') {
      result = result.filter(log => log.entity_id === filters.clientId || log.client_name === filters.clientId);
    }

    return result;
  }, [logs, filters, quickFilter, isAdmin, currentUserName]);

  // Build filter options from available logs
  const filterOptions = useMemo(() => {
    const users = [...new Set(logs.map(l => l.user_name))];
    const actionTypes = [...new Set(logs.map(l => l.action_type))];
    const entityTypes = [...new Set(logs.map(l => l.entity_type))];
    const clients = [...new Set(logs.filter(l => l.entity_type === 'client' && l.entity_name).map(l => ({
      id: l.entity_id || l.entity_name || '',
      name: l.entity_name || '',
    })))].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

    return { users, actionTypes, entityTypes, clients };
  }, [logs]);

  const updateFilters = useCallback((newFilters: Partial<LogFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setQuickFilter(null);
  }, []);

  const applyQuickFilter = useCallback((category: keyof typeof QUICK_FILTER_CATEGORIES | null) => {
    setQuickFilter(category);
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
    quickFilter,
    applyQuickFilter,
  };
}

// Utility function to log activities - call from anywhere in the app
export async function logActivity(params: {
  userName: string;
  actionType: ActionType | string;
  entityType: string;
  entityId?: string | null;
  entityName?: string | null;
  clientName?: string | null;
  description: string;
  oldValue?: string | null;
  newValue?: string | null;
}) {
  try {
    await supabase.from('activity_logs').insert({
      user_name: params.userName,
      action_type: params.actionType,
      entity_type: params.entityType,
      entity_id: params.entityId || null,
      entity_name: params.entityName || null,
      client_name: params.clientName || null,
      description: params.description,
      old_value: params.oldValue || null,
      new_value: params.newValue || null,
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}
