import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  isAdminRole,
  mapCollaborator,
  resolveAppRole,
  type AppRole,
} from "@/lib/auth";
import type { Collaborator } from "@/types/collaborator";

interface AuthContextType {
  session: Session | null;
  authUser: User | null;
  currentUser: Collaborator | null;
  collaborators: Collaborator[];
  role: AppRole | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  profileError: string | null;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signInWithMagicLink: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshIdentity: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [currentUser, setCurrentUser] = useState<Collaborator | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [role, setRole] = useState<AppRole | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const clearIdentity = useCallback(() => {
    setCurrentUser(null);
    setCollaborators([]);
    setRole(null);
    setProfileError(null);
  }, []);

  const hydrateIdentity = useCallback(async (user: User) => {
    setIdentityLoading(true);
    setProfileError(null);

    try {
      const bootstrapResult = await supabase.rpc("bootstrap_current_profile");
      if (bootstrapResult.error) {
        throw bootstrapResult.error;
      }

      const [collaboratorResult, profileResult, rolesResult] = await Promise.all([
        supabase
          .from("collaborators")
          .select("*")
          .eq("is_active", true)
          .order("name"),
        supabase
          .from("profiles")
          .select("collaborator_id")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);

      if (collaboratorResult.error) throw collaboratorResult.error;
      if (profileResult.error) throw profileResult.error;
      if (rolesResult.error) throw rolesResult.error;

      const mappedCollaborators = (collaboratorResult.data ?? []).map(
        mapCollaborator,
      );
      const visibleCollaborators = mappedCollaborators.filter(
        (collaborator) => !collaborator.isCentralOnly,
      );
      const linkedCollaborator =
        mappedCollaborators.find(
          (collaborator) => collaborator.userId === user.id,
        ) ??
        mappedCollaborators.find(
          (collaborator) =>
            collaborator.id === profileResult.data?.collaborator_id,
        ) ??
        null;

      setCollaborators(visibleCollaborators);
      setCurrentUser(linkedCollaborator);
      setRole(resolveAppRole(rolesResult.data?.map((item) => item.role)));

      if (!linkedCollaborator) {
        setProfileError(
          "Seu acesso existe, mas ainda nao esta vinculado a um colaborador ativo.",
        );
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar o perfil autenticado.";
      setProfileError(message);
      setCurrentUser(null);
      setCollaborators([]);
      setRole(null);
    } finally {
      setIdentityLoading(false);
    }
  }, []);

  const refreshIdentity = useCallback(async () => {
    if (authUser) {
      await hydrateIdentity(authUser);
    }
  }, [authUser, hydrateIdentity]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthUser(nextSession?.user ?? null);
      setAuthReady(true);
    });

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthUser(data.session?.user ?? null);
      setAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authReady) return;

    if (!authUser) {
      clearIdentity();
      return;
    }

    void hydrateIdentity(authUser);
  }, [authReady, authUser, clearIdentity, hydrateIdentity]);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
    },
    [],
  );

  const signInWithMagicLink = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
        shouldCreateUser: false,
      },
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    clearIdentity();
  }, [clearIdentity]);

  const value = useMemo<AuthContextType>(
    () => ({
      session,
      authUser,
      currentUser,
      collaborators,
      role,
      isAdmin: isAdminRole(role),
      isAuthenticated: Boolean(session),
      loading: !authReady || identityLoading,
      profileError,
      signInWithPassword,
      signInWithMagicLink,
      signOut,
      refreshIdentity,
    }),
    [
      session,
      authUser,
      currentUser,
      collaborators,
      role,
      authReady,
      identityLoading,
      profileError,
      signInWithPassword,
      signInWithMagicLink,
      signOut,
      refreshIdentity,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
