import { describe, expect, it } from 'vitest';
import { partitionDeliverablesByReview, pendingDeliverablesInReviewRound } from './deliverableReview';

describe('partitionDeliverablesByReview', () => {
  it('keeps only deliveries with no evaluation in the pending list', () => {
    const deliveries = [{ id: 'unrated' }, { id: 'thumbs' }, { id: 'stars' }, { id: 'superstar' }];
    const ratings = new Map<string, unknown[]>([
      ['thumbs', [{ rating_type: 'thumbs' }]],
      ['stars', [{ rating_type: 'star' }]],
      ['superstar', [{ rating_type: 'superstar' }]],
    ]);

    expect(partitionDeliverablesByReview(deliveries, ratings)).toEqual({
      pending: [{ id: 'unrated' }],
      reviewed: deliveries.slice(1),
    });
  });

  it('keeps deliveries evaluated in the current round visible until the page is refreshed', () => {
    const deliveries = [{ id: 'just-rated' }, { id: 'unrated' }, { id: 'old-rating' }];
    const ratings = new Map<string, unknown[]>([
      ['just-rated', [{ rating_type: 'star' }]],
      ['old-rating', [{ rating_type: 'thumbs' }]],
    ]);

    expect(pendingDeliverablesInReviewRound(deliveries, ratings, new Set(['just-rated'])))
      .toEqual(deliveries.slice(0, 2));
  });
});
