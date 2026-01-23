import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Collaborator } from '@/types/collaborator';

interface Profile {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  collaboratorId: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  collaborator: Collaborator | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<Profile, 'displayName' | 'avatarUrl' | 'collaboratorId'>>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [collaborator, setCollaborator] = useState<Collaborator | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, collaborators(*)')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile({
          id: data.id,
          userId: data.user_id,
          displayName: data.display_name,
          avatarUrl: data.avatar_url,
          collaboratorId: data.collaborator_id,
        });

        if (data.collaborators) {
          const collab = data.collaborators as any;
          setCollaborator({
            id: collab.id,
            name: collab.name,
            email: collab.email,
            color: collab.color,
            initials: collab.initials,
            userId: collab.user_id,
            isActive: collab.is_active,
            createdAt: collab.created_at,
            updatedAt: collab.updated_at,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid potential race conditions
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
          setCollaborator(null);
        }
        
        setLoading(false);
      }
    );

    // THEN get the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      // Create profile for the new user
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: data.user.id,
            display_name: displayName,
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { error: null };
    } catch (error: any) {
      return { error };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setCollaborator(null);
  }, []);

  const updateProfile = useCallback(async (
    updates: Partial<Pick<Profile, 'displayName' | 'avatarUrl' | 'collaboratorId'>>
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: updates.displayName,
          avatar_url: updates.avatarUrl,
          collaborator_id: updates.collaboratorId,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);

      // If collaborator was updated, fetch the new collaborator data
      if (updates.collaboratorId) {
        const { data: collabData } = await supabase
          .from('collaborators')
          .select('*')
          .eq('id', updates.collaboratorId)
          .single();

        if (collabData) {
          setCollaborator({
            id: collabData.id,
            name: collabData.name,
            email: collabData.email,
            color: collabData.color,
            initials: collabData.initials,
            userId: collabData.user_id,
            isActive: collabData.is_active,
            createdAt: collabData.created_at,
            updatedAt: collabData.updated_at,
          });
        }
      }

      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{
      session,
      user,
      profile,
      collaborator,
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile,
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
