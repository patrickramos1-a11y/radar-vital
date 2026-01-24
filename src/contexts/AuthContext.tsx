import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Collaborator } from '@/types/collaborator';

const STORAGE_KEY = 'painel_ac_user';

interface AuthContextType {
  currentUser: Collaborator | null;
  collaborators: Collaborator[];
  loading: boolean;
  selectUser: (collaborator: Collaborator) => void;
  clearUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Collaborator | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch collaborators from database
  const fetchCollaborators = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('collaborators')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching collaborators:', error);
        return;
      }

      const mapped: Collaborator[] = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        color: row.color,
        initials: row.initials,
        userId: row.user_id,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      setCollaborators(mapped);

      // Check if there's a saved user in localStorage
      const savedUserName = localStorage.getItem(STORAGE_KEY);
      if (savedUserName) {
        const savedUser = mapped.find(c => c.name === savedUserName);
        if (savedUser) {
          setCurrentUser(savedUser);
        }
      }
    } catch (error) {
      console.error('Error fetching collaborators:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  const selectUser = useCallback((collaborator: Collaborator) => {
    setCurrentUser(collaborator);
    localStorage.setItem(STORAGE_KEY, collaborator.name);
  }, []);

  const clearUser = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <AuthContext.Provider value={{
      currentUser,
      collaborators,
      loading,
      selectUser,
      clearUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper function for getting current user name (for activity logs, etc.)
export const getCurrentUserName = () => localStorage.getItem(STORAGE_KEY) || 'Sistema';
