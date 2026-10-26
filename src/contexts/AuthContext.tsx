import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Collaborator } from "@/types/collaborator";

const STORAGE_KEY = "painel_ac_user";

interface AuthContextType {
  currentUser: Collaborator | null;
  collaborators: Collaborator[];
  loading: boolean;
  isAdmin: boolean;
  selectUser: (collaborator: Collaborator) => void;
  clearUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function isPatrickProfile(name: string): boolean {
  return name.trim().toLocaleLowerCase("pt-BR").startsWith("patrick");
}

function mapCollaborator(row: Record<string, unknown>): Collaborator {
  const name = row.name as string;
  return {
    id: row.id as string,
    name,
    email: (row.email as string | null) ?? null,
    color: row.color as string,
    initials: row.initials as string,
    userId: (row.user_id as string | null) ?? null,
    isActive: Boolean(row.is_active),
    // The current product uses the selected operational profile, not login.
    role: isPatrickProfile(name) ? "admin" : "colaborador",
    isCentralOnly: Boolean(row.is_central_only),
    photoUrl: (row.photo_url as string | null) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Collaborator | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCollaborators = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("collaborators")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;

      const mapped = (data ?? []).map((row) =>
        mapCollaborator(row as Record<string, unknown>),
      );
      const visibleCollaborators = mapped.filter(
        (collaborator) => !collaborator.isCentralOnly,
      );
      const savedUserName = localStorage.getItem(STORAGE_KEY);

      setCollaborators(visibleCollaborators);
      setCurrentUser((previous) => {
        const preferredName = previous?.name ?? savedUserName;
        return mapped.find((collaborator) => collaborator.name === preferredName) ?? null;
      });
    } catch (error) {
      console.error("Error fetching collaborators:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCollaborators();

    const channel = supabase
      .channel("collaborators-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "collaborators" },
        () => void fetchCollaborators(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchCollaborators]);

  const selectUser = useCallback((collaborator: Collaborator) => {
    setCurrentUser(collaborator);
    localStorage.setItem(STORAGE_KEY, collaborator.name);
  }, []);

  const clearUser = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<AuthContextType>(() => {
    return {
      currentUser,
      collaborators,
      loading,
      isAdmin: currentUser?.role === "admin",
      selectUser,
      clearUser,
    };
  }, [clearUser, collaborators, currentUser, loading, selectUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

export function getCurrentUserName() {
  return localStorage.getItem(STORAGE_KEY) || "Sistema";
}
