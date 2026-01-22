import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  AptDemand, 
  AptFilters, 
  FeitoResponsavelStatus, 
  AprovadoGestorStatus,
  getDefaultFilters 
} from '@/types/apt';

// The apt_demands table exists but types might not be regenerated yet
// Using explicit typing with 'any' to work around this

export function useAptDemands() {
  const [demands, setDemands] = useState<AptDemand[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<AptFilters>(getDefaultFilters());
  const { toast } = useToast();

  const fetchDemands = useCallback(async () => {
    setLoading(true);
    try {
      let query = (supabase as any)
        .from('apt_demands')
        .select('*')
        .order('numero', { ascending: true });

      if (filters.apenas_ativos) {
        query = query.eq('is_active', true);
      }
      if (filters.responsaveis.length > 0) {
        query = query.in('responsavel', filters.responsaveis);
      }
      if (filters.setores.length > 0) {
        query = query.in('setor', filters.setores);
      }
      if (filters.meses.length > 0) {
        query = query.in('mes', filters.meses);
      }
      if (filters.anos.length > 0) {
        query = query.in('ano', filters.anos);
      }
      if (filters.semanas.length > 0) {
        query = query.in('semana_limite', filters.semanas);
      }
      if (filters.status_responsavel) {
        query = query.eq('feito_responsavel', filters.status_responsavel);
      }
      if (filters.status_gestor) {
        query = query.eq('aprovado_gestor', filters.status_gestor);
      }
      if (filters.busca) {
        query = query.ilike('descricao', `%${filters.busca}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      setDemands((data || []) as AptDemand[]);
    } catch (error) {
      console.error('Error fetching APT demands:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as demandas APT.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    fetchDemands();
  }, [fetchDemands]);

  const updateFeitoResponsavel = useCallback(async (id: string, status: FeitoResponsavelStatus) => {
    try {
      const { error } = await (supabase as any)
        .from('apt_demands')
        .update({ feito_responsavel: status })
        .eq('id', id);

      if (error) throw error;

      setDemands(prev => prev.map(d => 
        d.id === id ? { ...d, feito_responsavel: status } : d
      ));

      toast({
        title: 'Status atualizado',
        description: 'O status da demanda foi atualizado.',
      });
    } catch (error) {
      console.error('Error updating feito_responsavel:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const updateAprovadoGestor = useCallback(async (id: string, status: AprovadoGestorStatus) => {
    try {
      const { error } = await (supabase as any)
        .from('apt_demands')
        .update({ aprovado_gestor: status })
        .eq('id', id);

      if (error) throw error;

      setDemands(prev => prev.map(d => 
        d.id === id ? { ...d, aprovado_gestor: status } : d
      ));

      toast({
        title: 'Aprovação atualizada',
        description: 'O status de aprovação foi atualizado.',
      });
    } catch (error) {
      console.error('Error updating aprovado_gestor:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a aprovação.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const createDemand = useCallback(async (demand: Omit<AptDemand, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await (supabase as any)
        .from('apt_demands')
        .insert(demand)
        .select()
        .single();

      if (error) throw error;

      setDemands(prev => [...prev, data as AptDemand].sort((a, b) => a.numero - b.numero));

      toast({
        title: 'Demanda criada',
        description: 'A nova demanda foi adicionada à APT.',
      });

      return data as AptDemand;
    } catch (error) {
      console.error('Error creating demand:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a demanda.',
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const updateDemand = useCallback(async (id: string, updates: Partial<AptDemand>) => {
    try {
      const { error } = await (supabase as any)
        .from('apt_demands')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setDemands(prev => prev.map(d => 
        d.id === id ? { ...d, ...updates } : d
      ));

      toast({
        title: 'Demanda atualizada',
        description: 'As alterações foram salvas.',
      });
    } catch (error) {
      console.error('Error updating demand:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a demanda.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const deleteDemand = useCallback(async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('apt_demands')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDemands(prev => prev.filter(d => d.id !== id));

      toast({
        title: 'Demanda removida',
        description: 'A demanda foi excluída da APT.',
      });
    } catch (error) {
      console.error('Error deleting demand:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a demanda.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const getUniqueValues = useCallback(() => {
    const setores = [...new Set(demands.map(d => d.setor))].filter(Boolean).sort();
    const responsaveis = [...new Set(demands.map(d => d.responsavel))].filter(Boolean).sort();
    return { setores, responsaveis };
  }, [demands]);

  return {
    demands,
    loading,
    filters,
    setFilters,
    fetchDemands,
    updateFeitoResponsavel,
    updateAprovadoGestor,
    createDemand,
    updateDemand,
    deleteDemand,
    getUniqueValues,
  };
}
