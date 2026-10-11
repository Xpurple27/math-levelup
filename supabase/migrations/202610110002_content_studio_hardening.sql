BEGIN;
ALTER TABLE public.question_versions DROP CONSTRAINT IF EXISTS question_versions_question_type_check;
ALTER TABLE public.question_versions ADD CONSTRAINT question_versions_question_type_check CHECK (question_type IN ('SINGLE_CHOICE','MULTIPLE_CHOICE','TRUE_FALSE'));
ALTER TABLE public.import_rows DROP CONSTRAINT IF EXISTS import_rows_status_check;
ALTER TABLE public.import_rows ADD CONSTRAINT import_rows_status_check CHECK (status IN ('VALID','NEEDS_MAPPING','INVALID','SKIPPED','IMPORTED'));

CREATE OR REPLACE FUNCTION public.levelup_question_ready(vid uuid) RETURNS boolean LANGUAGE sql STABLE SET search_path='' AS $$
 WITH base AS (
   SELECT v.question_type FROM public.question_versions v
   JOIN public.exam_sections s ON s.id=v.section_id JOIN public.exams x ON x.id=s.exam_id
   JOIN public.subtopics st ON st.id=v.subtopic_id JOIN public.topics t ON t.id=st.topic_id JOIN public.domains d ON d.id=t.domain_id
   JOIN public.question_explanations e ON e.question_version_id=v.id
   WHERE v.id=vid AND length(trim(v.stem_md))>0 AND s.status='ACTIVE' AND x.status='ACTIVE' AND st.status='ACTIVE' AND t.status='ACTIVE' AND d.status='ACTIVE'
   AND length(trim(e.understanding_md))>0 AND length(trim(e.concept_md))>0 AND length(trim(e.first_step_md))>0 AND length(trim(e.solution_md))>0 AND length(trim(e.final_answer_md))>0
 ), option_stats AS (
   SELECT count(*)::integer total,count(*) FILTER (WHERE is_correct)::integer correct,count(DISTINCT lower(trim(content_md)))::integer distinct_content,coalesce(bool_and(length(trim(content_md))>0),false) nonempty
   FROM public.question_options WHERE question_version_id=vid
 )
 SELECT EXISTS(SELECT 1 FROM base b CROSS JOIN option_stats o WHERE o.nonempty AND o.distinct_content=o.total AND (
   (b.question_type='SINGLE_CHOICE' AND o.total BETWEEN 4 AND 5 AND o.correct=1) OR
   (b.question_type='MULTIPLE_CHOICE' AND o.total BETWEEN 4 AND 5 AND o.correct BETWEEN 1 AND o.total-1) OR
   (b.question_type='TRUE_FALSE' AND o.total BETWEEN 2 AND 5)
 ));
$$;
CREATE OR REPLACE FUNCTION public.levelup_option_guard() RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
DECLARE vid uuid:=CASE WHEN TG_OP='DELETE' THEN OLD.question_version_id ELSE NEW.question_version_id END;
BEGIN
 IF EXISTS(SELECT 1 FROM public.question_versions WHERE id=vid AND status IN ('IN_REVIEW','QA_PASSED','PUBLISHED')) AND NOT public.levelup_question_ready(vid) THEN RAISE EXCEPTION 'question incomplete or invalid answer'; END IF;
 RETURN NULL;
END $$;
CREATE OR REPLACE FUNCTION public.levelup_question_set_type(p_actor uuid,p_version uuid,p_type text) RETURNS jsonb LANGUAGE plpgsql SET search_path='' AS $$
DECLARE actor_role text; qid uuid;
BEGIN
 SELECT role INTO actor_role FROM public.levelup_roles WHERE user_id=p_actor; IF actor_role<>'ADMIN' THEN RAISE EXCEPTION 'forbidden'; END IF;
 IF p_type NOT IN ('SINGLE_CHOICE','MULTIPLE_CHOICE','TRUE_FALSE') THEN RAISE EXCEPTION 'invalid question type'; END IF;
 SELECT question_id INTO qid FROM public.question_versions WHERE id=p_version AND status='DRAFT' FOR UPDATE; IF qid IS NULL THEN RAISE EXCEPTION 'only draft question type can be changed'; END IF;
 UPDATE public.question_versions SET question_type=p_type,updated_by=p_actor,updated_at=clock_timestamp() WHERE id=p_version;
 RETURN public.levelup_question_detail(qid);
END $$;
CREATE OR REPLACE FUNCTION public.levelup_taxonomy_create(p_actor uuid,p_kind text,p_parent uuid,p_name text,p_code text) RETURNS jsonb LANGUAGE plpgsql SET search_path='' AS $$
DECLARE actor_role text; result jsonb; clean_name text:=trim(p_name); clean_code text:=upper(trim(p_code)); slug_value text;
BEGIN
 SELECT role INTO actor_role FROM public.levelup_roles WHERE user_id=p_actor; IF actor_role<>'ADMIN' THEN RAISE EXCEPTION 'forbidden'; END IF;
 IF length(clean_name)<2 OR clean_code !~ '^[A-Z0-9][A-Z0-9_-]{1,31}$' THEN RAISE EXCEPTION 'invalid taxonomy name/code'; END IF;
 slug_value:=trim(both '-' from lower(regexp_replace(clean_name,'[^a-zA-Z0-9]+','-','g')));
 IF p_kind='DOMAIN' THEN INSERT INTO public.domains(code,name) VALUES(clean_code,clean_name) RETURNING to_jsonb(domains.*) INTO result;
 ELSIF p_kind='TOPIC' THEN IF p_parent IS NULL OR NOT EXISTS(SELECT 1 FROM public.domains WHERE id=p_parent AND status='ACTIVE') THEN RAISE EXCEPTION 'domain parent required'; END IF; INSERT INTO public.topics(domain_id,code,slug,name) VALUES(p_parent,clean_code,slug_value,clean_name) RETURNING to_jsonb(topics.*) INTO result;
 ELSIF p_kind='SUBTOPIC' THEN IF p_parent IS NULL OR NOT EXISTS(SELECT 1 FROM public.topics WHERE id=p_parent AND status='ACTIVE') THEN RAISE EXCEPTION 'topic parent required'; END IF; INSERT INTO public.subtopics(topic_id,code,slug,name) VALUES(p_parent,clean_code,slug_value,clean_name) RETURNING to_jsonb(subtopics.*) INTO result;
 ELSE RAISE EXCEPTION 'invalid taxonomy kind'; END IF; RETURN result;
END $$;
CREATE OR REPLACE FUNCTION public.levelup_published_questions(p_test_only boolean DEFAULT false) RETURNS jsonb LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',q.id,'version_id',v.id,'version',v.version_number,'topic',v.subtopic_id,'section',s.code,'difficulty',v.difficulty,'instruction',v.instruction_md,'stimulus',v.stimulus_md,'stem',v.stem_md,'options',(SELECT jsonb_agg(to_jsonb(o) ORDER BY sort_order) FROM public.question_options o WHERE o.question_version_id=v.id),'explanation',(SELECT to_jsonb(e) FROM public.question_explanations e WHERE e.question_version_id=v.id),'media',coalesce((SELECT jsonb_agg(to_jsonb(m)||jsonb_build_object('role',qm.role)) FROM public.question_media qm JOIN public.media_assets m ON m.id=qm.media_asset_id WHERE qm.question_version_id=v.id),'[]'::jsonb))),'[]'::jsonb)
 FROM public.questions q JOIN public.question_versions v ON v.id=q.current_version_id JOIN public.exam_sections s ON s.id=v.section_id JOIN public.exams x ON x.id=s.exam_id JOIN public.subtopics st ON st.id=v.subtopic_id JOIN public.topics t ON t.id=st.topic_id JOIN public.domains d ON d.id=t.domain_id
 WHERE (q.status='ACTIVE' OR (p_test_only AND q.status='TEST_ONLY')) AND v.status='PUBLISHED' AND v.question_type='SINGLE_CHOICE' AND s.status='ACTIVE' AND x.status='ACTIVE' AND st.status='ACTIVE' AND t.status='ACTIVE' AND d.status='ACTIVE';
$$;
REVOKE ALL ON FUNCTION public.levelup_question_set_type(uuid,uuid,text), public.levelup_taxonomy_create(uuid,text,uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.levelup_question_set_type(uuid,uuid,text), public.levelup_taxonomy_create(uuid,text,uuid,text,text) TO service_role;
COMMIT;
