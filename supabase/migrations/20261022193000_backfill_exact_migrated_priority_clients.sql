-- Restore only legacy migrated priority/client links that can be proven by an
-- exact client name in the priority title. Ambiguous records remain unassigned.
WITH exact_client_links (priority_id, client_id) AS (
  VALUES
    ('f7169329-862c-4d3d-b5c8-8a3ee284d1c5'::uuid, 'f8a17af4-6c04-4b79-a74f-1f561a6e417e'::uuid),
    ('e59770a5-1487-461a-a756-6259c725eb67'::uuid, '3db84ead-3012-498e-85f1-3aca144475a9'::uuid),
    ('ff26b3fc-be30-40f6-95d6-c5df10ab383e'::uuid, '13675a87-bc4d-4da5-8cd3-2e794fc86269'::uuid),
    ('265d7f82-ae31-4be9-afd7-cb00ccfe0e2c'::uuid, '04c2651b-15f9-446d-830b-c566d13f58af'::uuid),
    ('7e766b14-4d21-4f05-b316-5c1a2cbdf64f'::uuid, 'c94ddef3-d7e8-4445-97bc-6b78b1556b19'::uuid)
)
UPDATE public.priorities AS priority
SET client_id = link.client_id
FROM exact_client_links AS link
WHERE priority.id = link.priority_id
  AND priority.category = 'entregavel_migrado'
  AND priority.client_id IS NULL;

-- The current synchronization trigger creates future deliverables with the
-- priority client. These existing generated deliverables need the same repair.
WITH exact_client_links (priority_id, client_id) AS (
  VALUES
    ('f7169329-862c-4d3d-b5c8-8a3ee284d1c5'::uuid, 'f8a17af4-6c04-4b79-a74f-1f561a6e417e'::uuid),
    ('e59770a5-1487-461a-a756-6259c725eb67'::uuid, '3db84ead-3012-498e-85f1-3aca144475a9'::uuid),
    ('ff26b3fc-be30-40f6-95d6-c5df10ab383e'::uuid, '13675a87-bc4d-4da5-8cd3-2e794fc86269'::uuid),
    ('265d7f82-ae31-4be9-afd7-cb00ccfe0e2c'::uuid, '04c2651b-15f9-446d-830b-c566d13f58af'::uuid),
    ('7e766b14-4d21-4f05-b316-5c1a2cbdf64f'::uuid, 'c94ddef3-d7e8-4445-97bc-6b78b1556b19'::uuid)
)
UPDATE public.deliverables AS deliverable
SET client_id = link.client_id
FROM exact_client_links AS link
WHERE deliverable.source_priority_id = link.priority_id
  AND deliverable.client_id IS NULL;
