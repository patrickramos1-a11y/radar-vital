import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { actorName } from "@/lib/auth";
import {
  mapChallenge,
  mapChallengeItem,
  mapChallengeCompletionCondition,
  mapChallengeParticipant,
} from "@/lib/challenge";
import type {
  Challenge,
  ChallengeFormData,
  ChallengeItem,
  ChallengeParticipant,
  ChallengeRewardConfig,
  ChallengeEditData,
  ChallengeValueRequest,
  ChallengeValueRequestStatus,
  ChallengeCompletionCondition,
  ChallengeDraftImportInput,
} from "@/types/challenge";

type RpcResponse<T> = Promise<{ data: T; error: { message?: string } | null }>;
const callRpc = <T = unknown>(name: string, args: Record<string, unknown>): RpcResponse<T> =>
  (supabase.rpc as unknown as (fn: string, params: Record<string, unknown>) => RpcResponse<T>)(name, args);

export function useChallenges() {
  const { currentUser } = useAuth();
  const currentUserName = actorName(currentUser);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [participants, setParticipants] = useState<ChallengeParticipant[]>([]);
  const [items, setItems] = useState<ChallengeItem[]>([]);
  const [valueRequests, setValueRequests] = useState<ChallengeValueRequest[]>([]);
  const [completionConditions, setCompletionConditions] = useState<ChallengeCompletionCondition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const refreshResult = await supabase.rpc("refresh_overdue_challenges", {
        p_actor_name: currentUserName,
      });
      if (refreshResult.error) throw refreshResult.error;

      const [challengeResult, participantResult, itemResult, requestResult, conditionResult] = await Promise.all([
        supabase.from("challenges").select("*").order("due_at"),
        supabase.from("challenge_participants").select("*"),
        supabase.from("challenge_items").select("*"),
        supabase.from("challenge_value_requests").select("*").order("requested_at", { ascending: false }),
        supabase.from("challenge_completion_conditions").select("*").order("sort_order"),
      ]);

      if (challengeResult.error) throw challengeResult.error;
      if (participantResult.error) throw participantResult.error;
      if (itemResult.error) throw itemResult.error;
      if (requestResult.error) throw requestResult.error;
      if (conditionResult.error) throw conditionResult.error;

      setChallenges((challengeResult.data ?? []).map(mapChallenge));
      setParticipants((participantResult.data ?? []).map(mapChallengeParticipant));
      setItems((itemResult.data ?? []).map(mapChallengeItem));
      setValueRequests((requestResult.data ?? []).map((request) => ({
        id: request.id,
        challengeId: request.challenge_id,
        collaboratorId: request.collaborator_id,
        justification: request.justification,
        status: request.status as ChallengeValueRequestStatus,
        adminNote: request.admin_note,
        requestedAt: request.requested_at,
        reviewedAt: request.reviewed_at,
        reviewedBy: request.reviewed_by,
      })));
      setCompletionConditions((conditionResult.data ?? []).map(mapChallengeCompletionCondition));
    } catch (caught) {
      console.error("Error fetching challenges:", caught);
      setError("Não foi possível carregar os desafios.");
    } finally {
      setIsLoading(false);
    }
  }, [currentUserName]);

  useEffect(() => {
    void refetch();
    const channel = supabase
      .channel("challenges_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "challenges" },
        () => void refetch(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "challenge_participants" },
        () => void refetch(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "challenge_items" },
        () => void refetch(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "challenge_value_requests" },
        () => void refetch(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "challenge_completion_conditions" },
        () => void refetch(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refetch]);

  const createChallenge = useCallback(
    async (data: ChallengeFormData): Promise<string | null> => {
      const { data: challengeId, error: createError } = await supabase.rpc(
        "create_challenge",
        {
          p_title: data.title,
          p_description: data.description ?? null,
          p_success_criteria: data.successCriteria,
          p_client_id: data.clientId ?? null,
          p_due_at: data.dueAt,
          p_reward_superstars: data.rewardSuperstars,
          p_penalty_stars: data.penaltyStars,
          p_participant_ids: data.participantIds,
          p_items: data.items.map((item) => ({
            item_type: item.itemType,
            item_id: item.itemId,
          })),
          p_actor_name: currentUserName,
        },
      );

      if (createError) {
        toast.error("Não foi possível criar o desafio.");
        console.error("Error creating challenge:", createError);
        return null;
      }

      await refetch();
      if (challengeId && data.conditions?.length && (data.completionMode ?? "guidance") !== "guidance") {
        const { error: conditionsError } = await callRpc("replace_challenge_completion_conditions", {
          p_challenge_id: challengeId,
          p_conditions: data.conditions,
          p_actor_name: currentUserName,
        });
        if (conditionsError) {
          toast.error("O desafio foi criado, mas as condições não puderam ser salvas.");
          return challengeId;
        }
        await refetch();
      }
      toast.success("Desafio criado e aguardando a entrega da equipe.");
      return challengeId;
    },
    [currentUserName, refetch],
  );

  // Universo Ramos allows an internal demand to be published without a
  // responsible person. The database assigns "open" in that case.
  const createUniverseChallenge = useCallback(
    async (data: ChallengeFormData): Promise<string | null> => {
      const { data: challengeId, error: createError } = await supabase.rpc(
        "create_universe_challenge",
        {
          p_title: data.title,
          p_description: data.description ?? null,
          p_success_criteria: data.successCriteria,
          p_client_id: data.clientId ?? null,
          p_challenge_kind: data.kind ?? "company_general",
          p_expected_deliverable: data.expectedDeliverable ?? null,
          p_evidence_requirements: data.evidenceRequirements ?? null,
          p_due_at: data.dueAt ?? null,
          p_reward_superstars: data.rewardSuperstars,
          p_penalty_stars: data.penaltyStars,
          p_participant_ids: data.participantIds,
          p_actor_name: currentUserName,
          p_completion_mode: data.completionMode ?? "guidance",
        },
      );

      if (createError) {
        toast.error("Não foi possível publicar o desafio.");
        console.error("Error creating Universo Ramos challenge:", createError);
        return null;
      }

      await refetch();
      if (challengeId && data.conditions?.length && (data.completionMode ?? "guidance") !== "guidance") {
        const { error: conditionsError } = await callRpc("replace_challenge_completion_conditions", {
          p_challenge_id: challengeId,
          p_conditions: data.conditions,
          p_actor_name: currentUserName,
        });
        if (conditionsError) {
          toast.error("O desafio foi criado, mas as condições não puderam ser salvas.");
          return challengeId;
        }
        await refetch();
      }
      toast.success(
        data.participantIds.length === 0
          ? "Desafio aberto publicado para a equipe."
          : "Desafio direcionado criado com sucesso.",
      );
      return challengeId;
    },
    [currentUserName, refetch],
  );

  const acceptUniverseChallenge = useCallback(
    async (challengeId: string, collaboratorId: string): Promise<boolean> => {
      const { error: acceptError } = await supabase.rpc(
        "accept_universe_challenge",
        {
          p_challenge_id: challengeId,
          p_collaborator_id: collaboratorId,
          p_actor_name: currentUserName,
        },
      );
      if (acceptError) {
        toast.error("Não foi possível aceitar este desafio.");
        console.error("Error accepting Universo Ramos challenge:", acceptError);
        return false;
      }
      await refetch();
      toast.success("Desafio aceito. Agora ele aparece nas suas entregas.");
      return true;
    },
    [currentUserName, refetch],
  );

  const resolveChallenge = useCallback(
    async (
      challengeId: string,
      outcome: "won" | "lost",
      notes?: string,
    ): Promise<boolean> => {
      const { error: resolveError } = await supabase.rpc("resolve_challenge", {
        p_challenge_id: challengeId,
        p_outcome: outcome,
        p_resolution_notes: notes ?? null,
        p_actor_name: currentUserName,
      });

      if (resolveError) {
        toast.error("Não foi possível validar o desafio.");
        console.error("Error resolving challenge:", resolveError);
        return false;
      }

      await refetch();
      toast.success(
        outcome === "won"
          ? "Desafio validado e crédito integral registrado no Tesouro."
          : "Desafio validado como não concluído e penalidade registrada no Tesouro.",
      );
      return true;
    },
    [currentUserName, refetch],
  );

  const importUniverseChallengeDrafts = useCallback(
    async (drafts: ChallengeDraftImportInput[]) => {
      const results: Array<{ importKey: string; challengeId?: string; error?: string }> = [];

      for (const draft of drafts) {
        const { data: challengeId, error: importError } = await callRpc<string | null>("import_universe_challenge", {
            p_import_key: draft.importKey,
            p_title: draft.title,
            p_description: draft.description,
            p_success_criteria: draft.successCriteria,
            p_client_id: draft.clientId,
            p_challenge_kind: draft.kind,
            p_expected_deliverable: draft.expectedDeliverable,
            p_evidence_requirements: draft.evidenceRequirements,
            p_due_at: null,
            p_reward_superstars: 0,
            p_penalty_stars: 0,
            p_participant_ids: draft.participantIds,
            p_status: "draft",
            p_actor_name: currentUserName,
            p_completion_mode: draft.completionMode,
          });

        if (importError || !challengeId) {
          results.push({ importKey: draft.importKey, error: importError?.message ?? "Não foi possível criar o rascunho." });
          continue;
        }

        if (draft.completionMode === "guidance" || !draft.conditions.length) {
          results.push({ importKey: draft.importKey, challengeId });
          continue;
        }

        const { error: conditionsError } = await callRpc("replace_challenge_completion_conditions", {
          p_challenge_id: challengeId,
          p_conditions: draft.conditions,
          p_actor_name: currentUserName,
        });
        if (conditionsError) {
          results.push({ importKey: draft.importKey, challengeId, error: "Rascunho criado, mas as condições não foram salvas." });
          continue;
        }

        results.push({ importKey: draft.importKey, challengeId });
      }

      await refetch();
      return results;
    },
    [currentUserName, refetch],
  );

  const requestChallengeValue = useCallback(
    async (challengeId: string, justification: string): Promise<boolean> => {
      if (!currentUser) {
        toast.error("Selecione seu usuário para solicitar um valor.");
        return false;
      }

      const { error: requestError } = await callRpc("request_challenge_value", {
          p_challenge_id: challengeId,
          p_collaborator_id: currentUser.id,
          p_justification: justification,
          p_actor_name: currentUserName,
        });

      if (requestError) {
        toast.error("Não foi possível enviar a solicitação de valor.");
        console.error("Error requesting challenge value:", requestError);
        return false;
      }

      await refetch();
      toast.success("Solicitação enviada para avaliação administrativa.");
      return true;
    },
    [currentUser, currentUserName, refetch],
  );

  const configureChallengeReward = useCallback(
    async (challengeIds: string[], config: ChallengeRewardConfig): Promise<boolean> => {
      const { error: configureError } = await callRpc("configure_challenge_reward", {
          p_challenge_ids: challengeIds,
          p_reward_stars: config.rewardStars,
          p_reward_superstars: config.rewardSuperstars,
          p_penalty_stars: config.penaltyStars,
          p_reward_status: config.rewardStatus,
          p_note: config.note ?? null,
          p_actor_name: currentUserName,
        });

      if (configureError) {
        toast.error("Não foi possível configurar os valores selecionados.");
        console.error("Error configuring challenge reward:", configureError);
        return false;
      }

      await refetch();
      toast.success(challengeIds.length === 1 ? "Valor do desafio configurado." : "Valores configurados em massa.");
      return true;
    },
    [currentUserName, refetch],
  );

  const reviewChallengeValueRequest = useCallback(
    async (
      requestId: string,
      status: Extract<ChallengeValueRequestStatus, "reviewed" | "declined">,
      note?: string,
    ): Promise<boolean> => {
      const { error: reviewError } = await callRpc("review_challenge_value_request", {
          p_request_id: requestId,
          p_status: status,
          p_admin_note: note ?? null,
          p_actor_name: currentUserName,
        });

      if (reviewError) {
        toast.error("Não foi possível atualizar a solicitação.");
        console.error("Error reviewing challenge value request:", reviewError);
        return false;
      }

      await refetch();
      toast.success(status === "declined" ? "Solicitação recusada." : "Solicitação atualizada.");
      return true;
    },
    [currentUserName, refetch],
  );

  const updateUniverseChallenge = useCallback(
    async (challengeId: string, data: ChallengeEditData): Promise<boolean> => {
      const { error: updateError } = await callRpc("update_universe_challenge", {
          p_challenge_id: challengeId,
          p_title: data.title,
          p_description: data.description ?? null,
          p_success_criteria: data.successCriteria,
          p_expected_deliverable: data.expectedDeliverable ?? null,
          p_evidence_requirements: data.evidenceRequirements ?? null,
          p_client_id: data.clientId ?? null,
          p_challenge_kind: data.kind ?? null,
          p_due_at: data.dueAt ?? null,
          p_actor_name: currentUserName,
          p_completion_mode: data.completionMode ?? null,
        });
      if (updateError) {
        toast.error("Não foi possível editar o desafio.");
        console.error("Error updating challenge:", updateError);
        return false;
      }
      const nextConditions = data.conditions?.filter((condition) => condition.title.trim()).map((condition) => ({ title: condition.title.trim(), isRequired: condition.isRequired !== false })) ?? [];
      const currentConditions = completionConditions.filter((condition) => condition.challengeId === challengeId).map((condition) => ({ title: condition.title, isRequired: condition.isRequired }));
      if (data.completionMode !== "guidance" && nextConditions.length && JSON.stringify(nextConditions) !== JSON.stringify(currentConditions)) {
        const { error: conditionsError } = await callRpc("replace_challenge_completion_conditions", {
          p_challenge_id: challengeId,
          p_conditions: nextConditions,
          p_actor_name: currentUserName,
        });
        if (conditionsError) {
          toast.error("Desafio atualizado, mas não foi possível salvar as condições.");
          return false;
        }
      }
      await refetch();
      toast.success("Desafio atualizado.");
      return true;
    },
    [completionConditions, currentUserName, refetch],
  );

  const setChallengeCompletionCondition = useCallback(async (conditionId: string, completed: boolean): Promise<boolean> => {
    const { error: updateError } = await supabase.rpc("set_challenge_completion_condition", { p_condition_id: conditionId, p_completed: completed, p_actor_name: currentUserName });
    if (updateError) { toast.error("Não foi possível atualizar a condição."); return false; }
    await refetch();
    return true;
  }, [currentUserName, refetch]);

  const deleteUniverseChallenges = useCallback(
    async (challengeIds: string[]): Promise<boolean> => {
      const { error: deleteError } = await callRpc("delete_universe_challenges", { p_challenge_ids: challengeIds, p_actor_name: currentUserName });
      if (deleteError) {
        toast.error("Não foi possível excluir os desafios selecionados.");
        console.error("Error deleting challenges:", deleteError);
        return false;
      }
      await refetch();
      toast.success(challengeIds.length === 1 ? "Desafio excluído." : "Desafios excluídos.");
      return true;
    },
    [currentUserName, refetch],
  );

  const participantsByChallenge = useMemo(() => {
    const result = new Map<string, ChallengeParticipant[]>();
    participants.forEach((participant) => {
      const current = result.get(participant.challengeId) ?? [];
      current.push(participant);
      result.set(participant.challengeId, current);
    });
    return result;
  }, [participants]);

  const itemsByChallenge = useMemo(() => {
    const result = new Map<string, ChallengeItem[]>();
    items.forEach((item) => {
      const current = result.get(item.challengeId) ?? [];
      current.push(item);
      result.set(item.challengeId, current);
    });
    return result;
  }, [items]);

  const conditionsByChallenge = useMemo(() => {
    const result = new Map<string, ChallengeCompletionCondition[]>();
    completionConditions.forEach((condition) => {
      const current = result.get(condition.challengeId) ?? [];
      current.push(condition);
      result.set(condition.challengeId, current);
    });
    return result;
  }, [completionConditions]);

  return {
    challenges,
    participants,
    items,
    completionConditions,
    valueRequests,
    participantsByChallenge,
    itemsByChallenge,
    conditionsByChallenge,
    isLoading,
    error,
    refetch,
    createChallenge,
    createUniverseChallenge,
    importUniverseChallengeDrafts,
    acceptUniverseChallenge,
    resolveChallenge,
    requestChallengeValue,
    configureChallengeReward,
    reviewChallengeValueRequest,
    updateUniverseChallenge,
    deleteUniverseChallenges,
    setChallengeCompletionCondition,
  };
}
