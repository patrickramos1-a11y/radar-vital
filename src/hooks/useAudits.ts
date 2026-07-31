import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  mapAudit,
  mapAuditClientResult,
  mapAuditClientItem,
  mapAuditCriterion,
  summarizeAudit,
} from "@/lib/audit";
import type {
  Audit,
  AuditClientResult,
  AuditClientItem,
  AuditClientStatus,
  AuditCriterion,
  AuditCriterionResultStatus,
  AuditFormData,
} from "@/types/audit";

export function useAudits() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [items, setItems] = useState<AuditClientItem[]>([]);
  const [criteria, setCriteria] = useState<AuditCriterion[]>([]);
  const [results, setResults] = useState<AuditClientResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAudits = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [auditResult, itemResult, criteriaResult, resultResult] = await Promise.all([
        supabase.from("audits").select("*").order("created_at", {
          ascending: false,
        }),
        supabase.from("audit_client_items").select("*"),
        supabase
          .from("audit_criteria")
          .select("*")
          .order("display_order"),
        supabase.from("audit_client_results").select("*"),
      ]);

      if (auditResult.error) throw auditResult.error;
      if (itemResult.error) throw itemResult.error;
      if (criteriaResult.error) throw criteriaResult.error;
      if (resultResult.error) throw resultResult.error;

      setAudits((auditResult.data ?? []).map(mapAudit));
      setItems((itemResult.data ?? []).map(mapAuditClientItem));
      setCriteria((criteriaResult.data ?? []).map(mapAuditCriterion));
      setResults((resultResult.data ?? []).map(mapAuditClientResult));
    } catch (caught) {
      console.error("Error fetching audits:", caught);
      setError("Não foi possível carregar as auditorias.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAudits();
    const channel = supabase
      .channel("audits_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "audits" },
        () => void fetchAudits(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "audit_client_items" },
        () => void fetchAudits(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "audit_criteria" },
        () => void fetchAudits(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "audit_client_results" },
        () => void fetchAudits(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchAudits]);

  const itemsByAudit = useMemo(() => {
    const result = new Map<string, AuditClientItem[]>();
    items.forEach((item) => {
      const current = result.get(item.auditId) ?? [];
      current.push(item);
      result.set(item.auditId, current);
    });
    return result;
  }, [items]);

  const openAudit = useCallback(
    async (data: AuditFormData) => {
      const result = await supabase.rpc("open_audit", {
        p_title: data.title,
        p_description: data.description || null,
        p_objective: data.objective || null,
        p_starts_at: data.startsAt
          ? new Date(data.startsAt).toISOString()
          : new Date().toISOString(),
        p_due_at: data.dueAt
          ? new Date(`${data.dueAt}T23:59:59`).toISOString()
          : null,
        p_criteria: data.criteria,
      });

      if (result.error) {
        console.error("Error opening audit:", result.error);
        toast.error("Erro ao abrir auditoria");
        return null;
      }

      await fetchAudits();
      toast.success("Auditoria aberta");
      return result.data;
    },
    [fetchAudits],
  );

  const updateClientItem = useCallback(
    async (
      itemId: string,
      status: AuditClientStatus,
      notes?: string | null,
    ) => {
      const result = await supabase.rpc("update_audit_client_item", {
        p_item_id: itemId,
        p_status: status,
        p_notes: notes || null,
      });
      if (result.error) {
        console.error("Error updating audit client:", result.error);
        toast.error("Erro ao atualizar cliente da auditoria");
        return false;
      }
      await fetchAudits();
      return true;
    },
    [fetchAudits],
  );

  const closeAudit = useCallback(
    async (auditId: string) => {
      const result = await supabase.rpc("close_audit", {
        p_audit_id: auditId,
      });
      if (result.error) {
        console.error("Error closing audit:", result.error);
        toast.error(
          "Valide todos os clientes antes de encerrar a auditoria.",
        );
        return false;
      }
      await fetchAudits();
      toast.success("Auditoria encerrada");
      return true;
    },
    [fetchAudits],
  );

  const updateClientResult = useCallback(
    async (
      resultId: string,
      resultStatus: AuditCriterionResultStatus,
      notes?: string | null,
      evidenceUrl?: string | null,
    ) => {
      const result = await supabase.rpc("update_audit_client_result", {
        p_result_id: resultId,
        p_result: resultStatus,
        p_notes: notes || null,
        p_evidence_url: evidenceUrl || null,
      });
      if (result.error) {
        console.error("Error updating audit criterion:", result.error);
        toast.error("Erro ao avaliar critério");
        return false;
      }
      await fetchAudits();
      toast.success("Critério atualizado");
      return true;
    },
    [fetchAudits],
  );

  const getItemsForAudit = useCallback(
    (auditId: string) => itemsByAudit.get(auditId) ?? [],
    [itemsByAudit],
  );

  const getSummary = useCallback(
    (auditId: string) => summarizeAudit(getItemsForAudit(auditId)),
    [getItemsForAudit],
  );

  return {
    audits,
    items,
    criteria,
    results,
    isLoading,
    error,
    openAudit,
    updateClientItem,
    closeAudit,
    updateClientResult,
    getItemsForAudit,
    getSummary,
    refetch: fetchAudits,
  };
}
