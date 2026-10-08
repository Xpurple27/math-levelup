-- Read-only operator verification; does not expose answer content or modify data.
SELECT name FROM (VALUES ('exams'),('exam_sections'),('domains'),('topics'),('subtopics'),('questions'),('question_versions'),('question_options'),('question_explanations'),('content_sources'),('media_assets'),('question_media'),('learning_modules'),('learning_lessons'),('lesson_blocks'),('lesson_question_assignments'),('content_reviews'),('import_jobs'),('import_rows'),('levelup_roles')) AS expected(name) WHERE to_regclass('public.'||name) IS NULL;
-- Expected zero missing relations, zero browser grants, all tables RLS enabled.
SELECT table_name,grantee,privilege_type FROM information_schema.role_table_grants WHERE table_schema='public' AND table_name IN ('questions','question_versions','question_options','question_explanations','levelup_roles','import_jobs','import_rows') AND grantee IN ('anon','authenticated','PUBLIC');
SELECT relname,relrowsecurity FROM pg_class WHERE relnamespace='public'::regnamespace AND relname IN ('questions','question_versions','question_options','question_explanations','levelup_roles','content_reviews','import_jobs','import_rows');
SELECT role,count(*) FROM public.levelup_roles GROUP BY role;
SELECT status,count(*) FROM public.question_versions GROUP BY status;
SELECT count(*) AS production_published FROM public.questions q JOIN public.question_versions v ON v.id=q.current_version_id WHERE q.status='ACTIVE' AND v.status='PUBLISHED';
SELECT count(*) AS invalid_published FROM public.question_versions v WHERE v.status='PUBLISHED' AND NOT public.levelup_question_ready(v.id);
SELECT has_function_privilege('authenticated','public.levelup_admin_content(uuid,text,jsonb)','execute') AS browser_admin_rpc,has_function_privilege('anon','public.levelup_published_questions(boolean)','execute') AS browser_private_bank_rpc;
-- Both function flags false; invalid_published zero. Before human authoring, published count zero.
