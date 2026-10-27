-- Read-only. Run on the intended math-levelup project, not an unrelated project.
-- No credentials, student records, answer keys or reviewer identities are emitted.
WITH current_questions AS (
  SELECT q.id,q.code,v.id AS version_id,v.subtopic_id,v.section_id,v.difficulty
  FROM public.questions q JOIN public.question_versions v ON v.id=q.current_version_id
  JOIN public.subtopics st ON st.id=v.subtopic_id AND st.status='ACTIVE'
  JOIN public.topics t ON t.id=st.topic_id AND t.status='ACTIVE'
  JOIN public.domains d ON d.id=t.domain_id AND d.status='ACTIVE'
  WHERE q.status='ACTIVE' AND v.status='PUBLISHED'
), packages AS (
  SELECT p.suite_code,p.code,p.status,p.access,p.question_count,p.duration_seconds,
    count(pq.id) AS references,count(c.id) AS current_references
  FROM public.tryout_packages p
  LEFT JOIN public.tryout_package_questions pq ON pq.tryout_package_id=p.id
  LEFT JOIN current_questions c ON c.version_id=pq.question_version_id
  GROUP BY p.id
), learning AS (
  SELECT m.code,m.subtopic_id,m.status,count(DISTINCT l.id) AS published_lessons,
    count(DISTINCT b.id) AS blocks
  FROM public.learning_modules m
  LEFT JOIN public.learning_lessons l ON l.module_id=m.id AND l.status='PUBLISHED'
  LEFT JOIN public.lesson_blocks b ON b.lesson_id=l.id
  GROUP BY m.id
)
SELECT jsonb_build_object(
  'checked_at',now(),
  'versions',(SELECT jsonb_agg(x) FROM (SELECT status,count(*) AS total FROM public.question_versions GROUP BY status)x),
  'current_questions',(SELECT count(*) FROM current_questions),
  'packages',(SELECT jsonb_agg(p ORDER BY suite_code,code) FROM packages p),
  'learning',(SELECT jsonb_agg(l ORDER BY code) FROM learning l),
  'current_missing_approval_records',(SELECT count(*) FROM current_questions c WHERE NOT EXISTS(
    SELECT 1 FROM public.content_reviews r WHERE r.entity_type='QUESTION_VERSION' AND r.entity_id=c.version_id AND r.status='APPROVED')),
  'waiting',(SELECT jsonb_agg(x) FROM (
    SELECT q.code,v.id AS version_id,v.version_number,v.status FROM public.question_versions v
    JOIN public.questions q ON q.id=v.question_id WHERE v.status='IN_REVIEW' ORDER BY q.code
  )x)
) AS readiness;
