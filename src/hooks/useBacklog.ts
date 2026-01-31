import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth, getCurrentUserName } from '@/contexts/AuthContext';
import type {
  BacklogItem,
  BacklogItemCreate,
  BacklogItemUpdate,
  BacklogAttachment,
  BacklogHistory,
  BacklogImplementation,
  BacklogFilters,
  BacklogKPIs,
  BacklogEventType
} from '@/types/backlog';

const DEFAULT_FILTERS: BacklogFilters = {
  search: '',
  status: 'TODOS',
  categoria: 'TODOS',
  modulo: 'TODOS',
  prioridade: 'TODOS',
  dependenteDeCreditos: null
};

export function useBacklog() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<BacklogFilters>(DEFAULT_FILTERS);

  const userName = getCurrentUserName();
  // Fetch all backlog items
  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ['backlog-items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backlog_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BacklogItem[];
    }
  });

  // Calculate KPIs
  const kpis: BacklogKPIs = {
    total: items.length,
    aguardandoCreditos: items.filter(i => i.status_backlog === 'AGUARDANDO_CREDITOS').length,
    emImplementacao: items.filter(i => i.status_backlog === 'EM_IMPLEMENTACAO').length,
    implementados: items.filter(i => i.status_backlog === 'IMPLEMENTADO').length,
    lancados: items.filter(i => i.status_backlog === 'LANCADO').length
  };

  // Filter items
  const filteredItems = items.filter(item => {
    if (filters.search) {
      const search = filters.search.toLowerCase();
      if (!item.titulo.toLowerCase().includes(search) &&
          !item.descricao_detalhada?.toLowerCase().includes(search)) {
        return false;
      }
    }
    if (filters.status !== 'TODOS' && item.status_backlog !== filters.status) return false;
    if (filters.categoria !== 'TODOS' && item.categoria !== filters.categoria) return false;
    if (filters.prioridade !== 'TODOS' && item.prioridade !== filters.prioridade) return false;
    if (filters.modulo !== 'TODOS' && !item.modulos_impactados.includes(filters.modulo)) return false;
    if (filters.dependenteDeCreditos !== null && item.dependente_de_creditos !== filters.dependenteDeCreditos) return false;
    return true;
  });

  // Log history
  const logHistory = async (
    backlogItemId: string,
    eventType: BacklogEventType,
    description: string,
    oldValue?: string | null,
    newValue?: string | null
  ) => {
    await supabase.from('backlog_history').insert([{
      backlog_item_id: backlogItemId,
      event_type: eventType,
      description,
      user_name: userName,
      old_value: oldValue || null,
      new_value: newValue || null
    }]);
  };

  // Create item mutation
  const createMutation = useMutation({
    mutationFn: async (data: BacklogItemCreate) => {
      const { data: item, error } = await supabase
        .from('backlog_items')
        .insert(data)
        .select()
        .single();

      if (error) throw error;

      await logHistory(item.id, 'CREATED', `Item "${data.titulo}" criado`);
      return item as BacklogItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog-items'] });
      toast({ title: 'Item criado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao criar item', description: error.message, variant: 'destructive' });
    }
  });

  // Update item mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data, oldItem }: { id: string; data: BacklogItemUpdate; oldItem: BacklogItem }) => {
      const { data: item, error } = await supabase
        .from('backlog_items')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Log specific changes
      if (data.status_backlog && data.status_backlog !== oldItem.status_backlog) {
        const eventType: BacklogEventType = 
          data.status_backlog === 'IMPLEMENTADO' ? 'MARKED_IMPLEMENTED' :
          data.status_backlog === 'LANCADO' ? 'MARKED_LAUNCHED' : 'STATUS_CHANGED';
        await logHistory(id, eventType, `Status alterado`, oldItem.status_backlog, data.status_backlog);
      }
      if (data.prioridade && data.prioridade !== oldItem.prioridade) {
        await logHistory(id, 'PRIORITY_CHANGED', 'Prioridade alterada', oldItem.prioridade, data.prioridade);
      }
      if (data.data_inicio_implementacao !== undefined || data.data_conclusao !== undefined || data.data_lancamento !== undefined) {
        await logHistory(id, 'DATE_CHANGED', 'Datas atualizadas');
      }

      return item as BacklogItem;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog-items'] });
      toast({ title: 'Item atualizado com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao atualizar item', description: error.message, variant: 'destructive' });
    }
  });

  // Delete item mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('backlog_items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlog-items'] });
      toast({ title: 'Item excluído com sucesso!' });
    },
    onError: (error) => {
      toast({ title: 'Erro ao excluir item', description: error.message, variant: 'destructive' });
    }
  });

  // Change status shortcut
  const changeStatus = useCallback(async (id: string, newStatus: BacklogItem['status_backlog']) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    await updateMutation.mutateAsync({ id, data: { status_backlog: newStatus }, oldItem: item });
  }, [items, updateMutation]);

  return {
    items: filteredItems,
    allItems: items,
    isLoading,
    refetch,
    kpis,
    filters,
    setFilters,
    resetFilters: () => setFilters(DEFAULT_FILTERS),
    createItem: createMutation.mutateAsync,
    updateItem: (id: string, data: BacklogItemUpdate, oldItem: BacklogItem) => 
      updateMutation.mutateAsync({ id, data, oldItem }),
    deleteItem: deleteMutation.mutateAsync,
    changeStatus,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
}

// Hook for single item with history, attachments, implementations
export function useBacklogItem(itemId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userName = getCurrentUserName();

  // Fetch item
  const { data: item, isLoading: isLoadingItem } = useQuery({
    queryKey: ['backlog-item', itemId],
    queryFn: async () => {
      if (!itemId) return null;
      const { data, error } = await supabase
        .from('backlog_items')
        .select('*')
        .eq('id', itemId)
        .single();

      if (error) throw error;
      return data as BacklogItem;
    },
    enabled: !!itemId
  });

  // Fetch history
  const { data: history = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ['backlog-history', itemId],
    queryFn: async () => {
      if (!itemId) return [];
      const { data, error } = await supabase
        .from('backlog_history')
        .select('*')
        .eq('backlog_item_id', itemId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BacklogHistory[];
    },
    enabled: !!itemId
  });

  // Fetch attachments
  const { data: attachments = [], isLoading: isLoadingAttachments } = useQuery({
    queryKey: ['backlog-attachments', itemId],
    queryFn: async () => {
      if (!itemId) return [];
      const { data, error } = await supabase
        .from('backlog_attachments')
        .select('*')
        .eq('backlog_item_id', itemId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BacklogAttachment[];
    },
    enabled: !!itemId
  });

  // Fetch implementations
  const { data: implementations = [], isLoading: isLoadingImplementations } = useQuery({
    queryKey: ['backlog-implementations', itemId],
    queryFn: async () => {
      if (!itemId) return [];
      const { data, error } = await supabase
        .from('backlog_implementations')
        .select('*')
        .eq('backlog_item_id', itemId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as BacklogImplementation[];
    },
    enabled: !!itemId
  });

  // Log history helper
  const logHistory = async (eventType: BacklogEventType, description: string, oldValue?: string, newValue?: string) => {
    if (!itemId) return;
    await supabase.from('backlog_history').insert([{
      backlog_item_id: itemId,
      event_type: eventType,
      description,
      user_name: userName,
      old_value: oldValue || null,
      new_value: newValue || null
    }]);
    queryClient.invalidateQueries({ queryKey: ['backlog-history', itemId] });
  };

  // Upload attachment
  const uploadAttachment = async (file: File) => {
    if (!itemId) return;

    const fileName = `${itemId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('backlog-files')
      .upload(fileName, file);

    if (uploadError) {
      toast({ title: 'Erro no upload', description: uploadError.message, variant: 'destructive' });
      return;
    }

    const { data: urlData } = supabase.storage.from('backlog-files').getPublicUrl(fileName);

    const { error: insertError } = await supabase.from('backlog_attachments').insert([{
      backlog_item_id: itemId,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_type: file.type,
      file_size: file.size,
      uploaded_by: userName
    }]);

    if (insertError) {
      toast({ title: 'Erro ao salvar anexo', description: insertError.message, variant: 'destructive' });
      return;
    }

    await logHistory('ATTACHMENT_ADDED', `Anexo "${file.name}" adicionado`);
    queryClient.invalidateQueries({ queryKey: ['backlog-attachments', itemId] });
    toast({ title: 'Anexo enviado com sucesso!' });
  };

  // Delete attachment
  const deleteAttachment = async (attachmentId: string, fileName: string) => {
    const { error } = await supabase.from('backlog_attachments').delete().eq('id', attachmentId);
    if (error) {
      toast({ title: 'Erro ao excluir anexo', description: error.message, variant: 'destructive' });
      return;
    }

    await logHistory('ATTACHMENT_REMOVED', `Anexo "${fileName}" removido`);
    queryClient.invalidateQueries({ queryKey: ['backlog-attachments', itemId] });
    toast({ title: 'Anexo excluído!' });
  };

  // Add implementation
  const addImplementation = async (descricao: string, responsavel: string) => {
    if (!itemId) return;

    const { error } = await supabase.from('backlog_implementations').insert([{
      backlog_item_id: itemId,
      descricao,
      responsavel,
      status: 'NAO_EXECUTADO'
    }]);

    if (error) {
      toast({ title: 'Erro ao adicionar implementação', description: error.message, variant: 'destructive' });
      return;
    }

    await logHistory('IMPLEMENTATION_ADDED', `Implementação adicionada: "${descricao}"`);
    queryClient.invalidateQueries({ queryKey: ['backlog-implementations', itemId] });
    toast({ title: 'Implementação adicionada!' });
  };

  // Update implementation
  const updateImplementation = async (implId: string, data: { status?: 'EXECUTADO' | 'NAO_EXECUTADO'; data_execucao?: string | null }) => {
    const { error } = await supabase
      .from('backlog_implementations')
      .update(data)
      .eq('id', implId);

    if (error) {
      toast({ title: 'Erro ao atualizar implementação', description: error.message, variant: 'destructive' });
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['backlog-implementations', itemId] });
    toast({ title: 'Implementação atualizada!' });
  };

  // Delete implementation
  const deleteImplementation = async (implId: string, descricao: string) => {
    const { error } = await supabase.from('backlog_implementations').delete().eq('id', implId);
    if (error) {
      toast({ title: 'Erro ao excluir implementação', description: error.message, variant: 'destructive' });
      return;
    }

    await logHistory('IMPLEMENTATION_REMOVED', `Implementação removida: "${descricao}"`);
    queryClient.invalidateQueries({ queryKey: ['backlog-implementations', itemId] });
    toast({ title: 'Implementação excluída!' });
  };

  return {
    item,
    history,
    attachments,
    implementations,
    isLoading: isLoadingItem || isLoadingHistory || isLoadingAttachments || isLoadingImplementations,
    uploadAttachment,
    deleteAttachment,
    addImplementation,
    updateImplementation,
    deleteImplementation,
    logHistory
  };
}
