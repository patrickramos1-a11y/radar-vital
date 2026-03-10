import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Collaborator } from '@/types/collaborator';
import { useToast } from '@/hooks/use-toast';

export function useCollaborators() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCollaborators = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('collaborators')
        .select('*')
        .order('name');

      if (error) throw error;

      const mapped: Collaborator[] = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        email: row.email,
        color: row.color,
        initials: row.initials,
        userId: row.user_id,
        isActive: row.is_active,
        role: (row as any).role || 'colaborador',
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      setCollaborators(mapped);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  const addCollaborator = useCallback(async (
    name: string,
    color: string,
    initials: string,
    email?: string,
    role?: string
  ): Promise<Collaborator | null> => {
    try {
      const { data, error } = await supabase
        .from('collaborators')
        .insert({
          name,
          email: email || null,
          color,
          initials,
          role: role || 'colaborador',
        } as any)
        .select()
        .single();

      if (error) throw error;

      const newCollaborator: Collaborator = {
        id: data.id,
        name: data.name,
        email: data.email,
        color: data.color,
        initials: data.initials,
        userId: data.user_id,
        isActive: data.is_active,
        role: (data as any).role || 'colaborador',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setCollaborators(prev => [...prev, newCollaborator].sort((a, b) => a.name.localeCompare(b.name)));
      
      toast({
        title: 'Colaborador criado',
        description: `${name} foi adicionado ao sistema.`,
      });

      return newCollaborator;
    } catch (error: any) {
      console.error('Error adding collaborator:', error);
      toast({
        title: 'Erro ao criar colaborador',
        description: error.message || 'Não foi possível criar o colaborador.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const updateCollaborator = useCallback(async (
    id: string,
    updates: Partial<Pick<Collaborator, 'name' | 'email' | 'color' | 'initials' | 'isActive' | 'role'>>
  ): Promise<boolean> => {
    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.initials !== undefined) dbUpdates.initials = updates.initials;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (updates.role !== undefined) dbUpdates.role = updates.role;

      const { error } = await supabase
        .from('collaborators')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      setCollaborators(prev => prev.map(c => 
        c.id === id ? { ...c, ...updates } : c
      ));

      return true;
    } catch (error: any) {
      console.error('Error updating collaborator:', error);
      toast({
        title: 'Erro ao atualizar colaborador',
        description: error.message || 'Não foi possível atualizar o colaborador.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const deleteCollaborator = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('collaborators')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCollaborators(prev => prev.filter(c => c.id !== id));

      toast({
        title: 'Colaborador excluído',
        description: 'O colaborador foi removido do sistema.',
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting collaborator:', error);
      toast({
        title: 'Erro ao excluir colaborador',
        description: error.message || 'Não foi possível excluir o colaborador.',
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const linkCollaboratorToUser = useCallback(async (
    collaboratorId: string,
    userId: string
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('collaborators')
        .update({ user_id: userId })
        .eq('id', collaboratorId);

      if (error) throw error;

      setCollaborators(prev => prev.map(c => 
        c.id === collaboratorId ? { ...c, userId } : c
      ));

      return true;
    } catch (error: any) {
      console.error('Error linking collaborator:', error);
      return false;
    }
  }, []);

  return {
    collaborators,
    loading,
    refetch: fetchCollaborators,
    addCollaborator,
    updateCollaborator,
    deleteCollaborator,
    linkCollaboratorToUser,
  };
}
