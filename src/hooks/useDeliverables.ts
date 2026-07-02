import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Deliverable, DeliverableFormData, DeliverableStatus, DeliverableItem } from '@/types/deliverable';
import { toast } from 'sonner';
import { ActivityLogger } from '@/lib/activityLogger';

const getCurrentUserName = () => localStorage.getItem('painel_ac_user') || 'Sistema';

export function useDeliverables() {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetch = useCallback(async () => {
    try {
      const [{ data: dels, error: e1 }, { data: items, error: e2 }] = await Promise.all([
        supabase.from('deliverables').select('*').order('created_at', { ascending: false }),
        supabase.from('deliverable_items').select('*'),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      const byDeliv = new Map<string, DeliverableItem[]>();
      (items || []).forEach((it: any) => {
        const arr = byDeliv.get(it.deliverable_id) || [];
        arr.push(it as DeliverableItem);
        byDeliv.set(it.deliverable_id, arr);
      });
      setDeliverables((dels || []).map((d: any) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        assigned_to: Array.isArray(d.assigned_to) ? d.assigned_to : [],
        due_date: d.due_date,
        status: d.status as DeliverableStatus,
        created_by: d.created_by,
        created_at: d.created_at,
        updated_at: d.updated_at,
        completed_at: d.completed_at,
        items: byDeliv.get(d.id) || [],
      })));
    } catch (e) {
      console.error(e);
      toast.error('Erro ao carregar entregáveis');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    const ch = supabase
      .channel('deliverables_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliverables' }, () => setTimeout(fetch, 100))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deliverable_items' }, () => setTimeout(fetch, 100))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetch]);

  const addDeliverable = useCallback(async (data: DeliverableFormData) => {
    try {
      const { data: inserted, error } = await supabase.from('deliverables').insert({
        name: data.name,
        description: data.description || null,
        assigned_to: data.assigned_to || [],
        due_date: data.due_date || null,
        status: data.status || 'aberto',
        created_by: getCurrentUserName(),
      }).select().single();
      if (error) throw error;
      if (data.items && data.items.length > 0) {
        await supabase.from('deliverable_items').insert(
          data.items.map(it => ({ deliverable_id: inserted.id, item_type: it.item_type, item_id: it.item_id }))
        );
      }
      await fetch();
      toast.success('Entregável criado');
      ActivityLogger.createDeliverable(getCurrentUserName(), data.name);
      return inserted;
    } catch (e) {
      console.error(e);
      toast.error('Erro ao criar entregável');
      return null;
    }
  }, [fetch]);

  const updateDeliverable = useCallback(async (id: string, data: Partial<DeliverableFormData>) => {
    try {
      const patch: any = { ...data };
      delete patch.items;
      if (data.status === 'concluido') patch.completed_at = new Date().toISOString();
      if (data.status && data.status !== 'concluido') patch.completed_at = null;
      const { error } = await supabase.from('deliverables').update(patch).eq('id', id);
      if (error) throw error;
      if (data.items) {
        await supabase.from('deliverable_items').delete().eq('deliverable_id', id);
        if (data.items.length > 0) {
          await supabase.from('deliverable_items').insert(
            data.items.map(it => ({ deliverable_id: id, item_type: it.item_type, item_id: it.item_id }))
          );
        }
      }
      await fetch();
      toast.success('Entregável atualizado');
      return true;
    } catch (e) {
      console.error(e);
      toast.error('Erro ao atualizar entregável');
      return false;
    }
  }, [fetch]);

  const deleteDeliverable = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('deliverables').delete().eq('id', id);
      if (error) throw error;
      await fetch();
      toast.success('Entregável excluído');
      return true;
    } catch (e) {
      console.error(e);
      toast.error('Erro ao excluir entregável');
      return false;
    }
  }, [fetch]);

  return { deliverables, isLoading, addDeliverable, updateDeliverable, deleteDeliverable, refetch: fetch };
}
