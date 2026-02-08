import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PanelLink, PanelLinkFormData } from "@/types/panelLink";
import { toast } from "sonner";

export function usePanelLinks() {
  const queryClient = useQueryClient();

  const { data: panelLinks = [], isLoading } = useQuery({
    queryKey: ["panel-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("panel_links")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data as PanelLink[];
    },
  });

  const activeLinks = panelLinks.filter((l) => l.is_active);

  const addLink = useMutation({
    mutationFn: async (formData: PanelLinkFormData) => {
      const { error } = await supabase.from("panel_links").insert({
        name: formData.name,
        description: formData.description || null,
        url: formData.url,
        panel_type: formData.panel_type,
        display_order: formData.display_order,
        is_active: formData.is_active,
        icon_name: formData.icon_name || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["panel-links"] });
      toast.success("Painel adicionado com sucesso!");
    },
    onError: () => toast.error("Erro ao adicionar painel"),
  });

  const updateLink = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PanelLinkFormData> }) => {
      const { error } = await supabase
        .from("panel_links")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["panel-links"] });
      toast.success("Painel atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar painel"),
  });

  const deleteLink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("panel_links")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["panel-links"] });
      toast.success("Painel removido!");
    },
    onError: () => toast.error("Erro ao remover painel"),
  });

  return {
    panelLinks,
    activeLinks,
    isLoading,
    addLink,
    updateLink,
    deleteLink,
  };
}
