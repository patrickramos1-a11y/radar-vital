import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  mapChallenge,
  mapChallengeItem,
  mapChallengeParticipant,
} from "@/lib/challenge";
import type {
  Challenge,
  ChallengeFormData,
  ChallengeItem,
  ChallengeParticipant,
} from "@/types/challenge";

export function useChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [participants, setParticipants] = useState<ChallengeParticipant[]>([]);
  const [items, setItems] = useState<ChallengeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const refreshResult = await supabase.rpc("refresh_overdue_challenges");
      if (refreshResult.error) throw refreshResult.error;

      const [challengeResult, participantResult, itemResult] = await Promise.all([
        supabase.from("challenges").select("*").order("due_at"),
        supabase.from("challenge_participants").select("*"),
        supabase.from("challenge_items").select("*"),
      ]);

      if (challengeResult.error) throw challengeResult.error;
      if (participantResult.error) throw participantResult.error;
      if (itemResult.error) throw itemResult.error;

      setChallenges((challengeResult.data ?? []).map(mapChallenge));
      setParticipants((participantResult.data ?? []).map(mapChallengeParticipant));
      setItems((itemResult.data ?? []).map(mapChallengeItem));
    } catch (caught) {
      console.error("Error fetching challenges:", caught);
      setError("Não foi possível carregar os desafios.");
    } finally {
      setIsLoading(false);
    }
  }, []);

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
        },
      );

      if (createError) {
        toast.error("Não foi possível criar o desafio.");
        console.error("Error creating challenge:", createError);
        return null;
      }

      await refetch();
      toast.success("Desafio criado e aguardando a entrega da equipe.");
      return challengeId;
    },
    [refetch],
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
      });

      if (resolveError) {
        toast.error("Não foi possível validar o desafio.");
        console.error("Error resolving challenge:", resolveError);
        return false;
      }

      await refetch();
      toast.success(
        outcome === "won"
          ? "Desafio validado. O Tesouro registrará o crédito na próxima fase."
          : "Desafio validado como não concluído. A penalidade aguarda o Tesouro.",
      );
      return true;
    },
    [refetch],
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

  return {
    challenges,
    participants,
    items,
    participantsByChallenge,
    itemsByChallenge,
    isLoading,
    error,
    refetch,
    createChallenge,
    resolveChallenge,
  };
}
