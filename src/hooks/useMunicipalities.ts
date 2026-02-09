import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Municipality {
  id: string;
  name: string;
  state: string;
  created_at: string;
}

export function useMunicipalities() {
  const queryClient = useQueryClient();

  const { data: municipalities = [], isLoading } = useQuery({
    queryKey: ['municipalities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('municipalities')
        .select('*')
        .order('state', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return data as Municipality[];
    },
  });

  const addMunicipality = useMutation({
    mutationFn: async ({ name, state }: { name: string; state: string }) => {
      const { data, error } = await supabase
        .from('municipalities')
        .insert({ name: name.trim(), state: state.trim().toUpperCase() })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['municipalities'] });
      toast.success('Município cadastrado!');
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate') || error.code === '23505') {
        toast.error('Este município já está cadastrado neste estado.');
      } else {
        toast.error('Erro ao cadastrar município.');
      }
    },
  });

  const deleteMunicipality = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('municipalities').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['municipalities'] });
      toast.success('Município removido!');
    },
    onError: () => {
      toast.error('Erro ao remover município.');
    },
  });

  // Group by state
  const byState = municipalities.reduce<Record<string, Municipality[]>>((acc, m) => {
    if (!acc[m.state]) acc[m.state] = [];
    acc[m.state].push(m);
    return acc;
  }, {});

  // Unique states
  const states = Object.keys(byState).sort();

  return {
    municipalities,
    byState,
    states,
    isLoading,
    addMunicipality,
    deleteMunicipality,
  };
}
