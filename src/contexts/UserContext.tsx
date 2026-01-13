import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { COLLABORATOR_COLORS } from '@/types/client';

export type AppUserName = 'Patrick' | 'Celine' | 'Gabi' | 'Darley' | 'Vanessa';

export interface AppUser {
  name: AppUserName;
  color: string;
  initials: string;
}

export const APP_USERS: AppUser[] = [
  { name: 'Patrick', color: '#6366f1', initials: 'PA' },
  { name: 'Celine', color: COLLABORATOR_COLORS.celine, initials: 'CE' },
  { name: 'Gabi', color: COLLABORATOR_COLORS.gabi, initials: 'GA' },
  { name: 'Darley', color: COLLABORATOR_COLORS.darley, initials: 'DA' },
  { name: 'Vanessa', color: COLLABORATOR_COLORS.vanessa, initials: 'VA' },
];

interface UserContextType {
  currentUser: AppUser | null;
  isLoggedIn: boolean;
  selectUser: (name: AppUserName) => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = 'painel_ac_user';

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEY);
    if (storedUser) {
      const user = APP_USERS.find(u => u.name === storedUser);
      if (user) {
        setCurrentUser(user);
      }
    }
    setInitialized(true);
  }, []);

  const selectUser = useCallback(async (name: AppUserName) => {
    const user = APP_USERS.find(u => u.name === name);
    if (!user) return;

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, name);
    setCurrentUser(user);

    // Log activity
    try {
      await supabase.from('activity_logs').insert({
        user_name: name,
        action_type: 'LOGIN',
        entity_type: 'session',
        description: `${name} entrou no sistema`,
      });
    } catch (error) {
      console.error('Error logging login:', error);
    }
  }, []);

  const logout = useCallback(() => {
    const userName = currentUser?.name;
    localStorage.removeItem(STORAGE_KEY);
    setCurrentUser(null);

    // Log activity (async, don't await)
    if (userName) {
      (async () => {
        try {
          await supabase.from('activity_logs').insert({
            user_name: userName,
            action_type: 'LOGOUT',
            entity_type: 'session',
            description: `${userName} saiu do sistema`,
          });
        } catch (error) {
          console.error('Error logging logout:', error);
        }
      })();
    }
  }, [currentUser]);

  // Don't render children until we've checked localStorage
  if (!initialized) {
    return null;
  }

  return (
    <UserContext.Provider value={{
      currentUser,
      isLoggedIn: !!currentUser,
      selectUser,
      logout,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
