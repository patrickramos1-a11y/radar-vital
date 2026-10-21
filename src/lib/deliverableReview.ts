export function partitionDeliverablesByReview<T extends { id: string }>(
  deliverables: T[],
  ratingsByDeliverable: ReadonlyMap<string, readonly unknown[]>,
) {
  const pending: T[] = [];
  const reviewed: T[] = [];

  deliverables.forEach(deliverable => {
    const hasRating = (ratingsByDeliverable.get(deliverable.id)?.length ?? 0) > 0;
    (hasRating ? reviewed : pending).push(deliverable);
  });

  return { pending, reviewed };
}

export function pendingDeliverablesInReviewRound<T extends { id: string }>(
  deliverables: T[],
  ratingsByDeliverable: ReadonlyMap<string, readonly unknown[]>,
  reviewedInCurrentRound: ReadonlySet<string>,
) {
  return deliverables.filter(deliverable =>
    reviewedInCurrentRound.has(deliverable.id)
      || !(ratingsByDeliverable.get(deliverable.id)?.length ?? 0),
  );
}
