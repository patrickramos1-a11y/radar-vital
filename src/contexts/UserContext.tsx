import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AppUserName = 'patrick' | 'celine' | 'gabi' | 'darley' | 'vanessa';

export interface AppUser {
  id: string;
  name: AppUserName;
  displayName: string;
}

interface UserContextType {
  currentUser: AppUser | null;
  login: (name: string) => boolean;
  logout: () => void;
  isLoggedIn: boolean;
}

const VALID_USERS: Record<string, AppUser> = {
  'patrick': { id: '1', name: 'patrick', displayName: 'Patrick' },
  'celine': { id: '2', name: 'celine', displayName: 'Celine' },
  'gabi': { id: '3', name: 'gabi', displayName: 'Gabi' },
  'darley': { id: '4', name: 'darley', displayName: 'Darley' },
  'vanessa': { id: '5', name: 'vanessa', displayName: 'Vanessa' },
};

const UserContext = createContext<UserContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'painel_ac_user';

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (VALID_USERS[parsed.name]) {
          setCurrentUser(VALID_USERS[parsed.name]);
        }
      } catch {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
    setIsInitialized(true);
  }, []);

  const login = (name: string): boolean => {
    const normalizedName = name.toLowerCase().trim();
    const user = VALID_USERS[normalizedName];
    
    if (user) {
      setCurrentUser(user);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ currentUser, login, logout, isLoggedIn: !!currentUser }}>
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
