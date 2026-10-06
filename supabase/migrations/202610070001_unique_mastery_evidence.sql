-- Apply after 202610060004_tryout_package_02.sql.
-- Rebuild only legacy confidence metadata from completed, answered snapshots.
-- Scores, attempt snapshots/results, mastery values and activity days stay intact.
BEGIN;
-- Keep the historical-read/backfill statement isolated from concurrent learning writes.
LOCK TABLE public.levelup_attempts, public.levelup_mastery IN SHARE ROW EXCLUSIVE MODE;
WITH answered AS (
 SELECT a.user_id,q->>'topic' topic,q->>'id' question_id,
 max(CASE q->>'difficulty' WHEN 'Hard' THEN 3 WHEN 'Medium' THEN 2 ELSE 1 END) level
 FROM public.levelup_attempts a CROSS JOIN LATERAL jsonb_array_elements(a.snapshot) q
 WHERE a.status='completed' AND a.answers ? (q->>'id')
 GROUP BY a.user_id,q->>'topic',q->>'id'
), summaries AS (
 SELECT user_id,topic,jsonb_object_agg(question_id,CASE level WHEN 3 THEN 'Hard' WHEN 2 THEN 'Medium' ELSE 'Basic' END) evidence,
 count(*) count, count(*) FILTER (WHERE level>=2) advanced,
 least(1::numeric,sum(CASE level WHEN 3 THEN 1.5 WHEN 2 THEN 1 ELSE 0.5 END)/20) confidence
 FROM answered GROUP BY user_id,topic
), upgrades AS (
 SELECT m.user_id,m.topic,coalesce(s.evidence,'{}'::jsonb) evidence,coalesce(s.count,0) count,coalesce(s.advanced,0) advanced,coalesce(s.confidence,0) confidence
 FROM public.levelup_mastery m LEFT JOIN summaries s ON s.user_id=m.user_id AND s.topic=m.topic
 WHERE NOT (m.data ? 'uniqueEvidence')
)
UPDATE public.levelup_mastery m SET data=m.data || jsonb_build_object('uniqueEvidence',u.evidence,'count',u.count,'advanced',u.advanced,'confidence',u.confidence)
FROM upgrades u WHERE m.user_id=u.user_id AND m.topic=u.topic AND NOT (m.data ? 'uniqueEvidence');
COMMIT;
