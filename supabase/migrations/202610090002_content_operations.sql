BEGIN;
CREATE OR REPLACE FUNCTION public.levelup_content_catalog() RETURNS jsonb LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT jsonb_build_object('exams',coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY sort_order,code) FROM public.exams t WHERE status='ACTIVE'),'[]'::jsonb),'sections',coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY sort_order,code) FROM public.exam_sections t WHERE status='ACTIVE'),'[]'::jsonb),'domains',coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY sort_order,code) FROM public.domains t WHERE status='ACTIVE'),'[]'::jsonb),'topics',coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY sort_order,code) FROM public.topics t WHERE status='ACTIVE'),'[]'::jsonb),'subtopics',coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY sort_order,code) FROM public.subtopics t WHERE status='ACTIVE'),'[]'::jsonb),'published_count',(SELECT count(*) FROM public.questions q JOIN public.question_versions v ON v.id=q.current_version_id WHERE q.status='ACTIVE' AND v.status='PUBLISHED'));
$$;
CREATE OR REPLACE FUNCTION public.levelup_question_detail(p_id uuid) RETURNS jsonb LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT to_jsonb(q)||jsonb_build_object('versions',coalesce((SELECT jsonb_agg(to_jsonb(v)||jsonb_build_object('source',(SELECT to_jsonb(cs) FROM public.content_sources cs WHERE cs.id=v.source_id),'options',coalesce((SELECT jsonb_agg(to_jsonb(o) ORDER BY sort_order) FROM public.question_options o WHERE o.question_version_id=v.id),'[]'::jsonb),'explanation',(SELECT to_jsonb(e) FROM public.question_explanations e WHERE e.question_version_id=v.id),'media',coalesce((SELECT jsonb_agg(to_jsonb(m)||jsonb_build_object('role',qm.role) ORDER BY qm.sort_order) FROM public.question_media qm JOIN public.media_assets m ON m.id=qm.media_asset_id WHERE qm.question_version_id=v.id),'[]'::jsonb),'reviews',coalesce((SELECT jsonb_agg(to_jsonb(r) ORDER BY created_at DESC) FROM public.content_reviews r WHERE r.entity_type='QUESTION_VERSION' AND r.entity_id=v.id),'[]'::jsonb)) ORDER BY version_number DESC) FROM public.question_versions v WHERE v.question_id=q.id),'[]'::jsonb)) FROM public.questions q WHERE q.id=p_id;
$$;
CREATE OR REPLACE FUNCTION public.levelup_admin_content(p_actor uuid,p_action text,p jsonb DEFAULT '{}') RETURNS jsonb LANGUAGE plpgsql SET search_path='' AS $$
DECLARE actor_role text; q public.questions; v public.question_versions; sid uuid; qid uuid; vid uuid; item jsonb; j public.import_jobs; r public.import_rows; answer text; count_rows integer; result jsonb;
BEGIN
 SELECT role INTO actor_role FROM public.levelup_roles WHERE user_id=p_actor;
 IF p_action='role' THEN RETURN jsonb_build_object('role',coalesce(actor_role,'STUDENT')); END IF;
 IF actor_role IS NULL OR actor_role NOT IN ('ADMIN','REVIEWER') THEN RAISE EXCEPTION 'forbidden'; END IF;
 IF p_action='catalog' THEN RETURN public.levelup_content_catalog(); END IF;
 IF p_action='list' THEN
  RETURN jsonb_build_object('rows',coalesce((SELECT jsonb_agg(to_jsonb(b)) FROM (SELECT * FROM public.levelup_question_bank b WHERE b.logical_status<>'TEST_ONLY' AND (coalesce(p->>'search','')='' OR b.code ILIKE '%'||(p->>'search')||'%' OR b.stem_md ILIKE '%'||(p->>'search')||'%') AND (coalesce(p->>'exam_id','')='' OR b.exam_id::text=p->>'exam_id') AND (coalesce(p->>'section_id','')='' OR b.section_id::text=p->>'section_id') AND (coalesce(p->>'domain_id','')='' OR b.domain_id::text=p->>'domain_id') AND (coalesce(p->>'topic_id','')='' OR b.topic_id::text=p->>'topic_id') AND (coalesce(p->>'subtopic_id','')='' OR b.subtopic_id::text=p->>'subtopic_id') AND (coalesce(p->>'difficulty','')='' OR b.difficulty=p->>'difficulty') AND (coalesce(p->>'status','')='' OR b.status=p->>'status') AND (coalesce(p->>'source_type','')='' OR b.source_type=p->>'source_type') ORDER BY updated_at DESC,id LIMIT 100 OFFSET least(100000,greatest(0,coalesce((p->>'offset')::integer,0)))) b),'[]'::jsonb));
 END IF;
 IF p_action='detail' THEN result:=public.levelup_question_detail((p->>'id')::uuid);IF result IS NULL THEN RAISE EXCEPTION 'question not found'; END IF;RETURN result;END IF;
 IF p_action='qa_list' THEN RETURN coalesce((SELECT jsonb_agg(to_jsonb(b)) FROM public.levelup_question_bank b WHERE status='IN_REVIEW' AND logical_status<>'TEST_ONLY'),'[]'::jsonb);END IF;
 IF p_action='media_list' THEN RETURN coalesce((SELECT jsonb_agg(to_jsonb(m) ORDER BY created_at DESC) FROM public.media_assets m),'[]'::jsonb);END IF;
 IF p_action='review' THEN
  SELECT * INTO v FROM public.question_versions WHERE id=(p->>'version_id')::uuid FOR UPDATE;
  IF NOT FOUND OR v.status<>'IN_REVIEW' THEN RAISE EXCEPTION 'version must be in review'; END IF;
  IF v.created_by=p_actor OR v.updated_by=p_actor THEN RAISE EXCEPTION 'independent reviewer required'; END IF;
  IF p->>'outcome' NOT IN ('APPROVED','REJECTED','CHANGES_REQUESTED') OR length(trim(coalesce(p->>'notes','')))=0 THEN RAISE EXCEPTION 'review outcome and notes required'; END IF;
  IF p->>'outcome'='APPROVED' AND NOT(coalesce(p->'checks','{}'::jsonb) @> '{"math":true,"key":true,"wording":true,"difficulty":true,"taxonomy":true,"explanation":true,"distractors":true}'::jsonb) THEN RAISE EXCEPTION 'complete QA checklist required'; END IF;
  INSERT INTO public.content_reviews(entity_type,entity_id,review_type,status,reviewer_id,notes) VALUES('QUESTION_VERSION',v.id,'MATH',p->>'outcome',p_actor,p->>'notes');
  UPDATE public.question_versions SET status=CASE WHEN p->>'outcome'='APPROVED' THEN 'QA_PASSED' ELSE 'DRAFT' END,updated_at=clock_timestamp() WHERE id=v.id;
  RETURN public.levelup_question_detail(v.question_id);
 END IF;
 IF actor_role<>'ADMIN' THEN RAISE EXCEPTION 'forbidden'; END IF;
 IF p_action IN ('create','save') THEN
  IF jsonb_typeof(p->'options')<>'array' OR jsonb_array_length(p->'options')>5 THEN RAISE EXCEPTION 'invalid options'; END IF;
  IF p_action='create' THEN
   INSERT INTO public.questions(code,created_by,source_type) VALUES(coalesce(nullif(p->>'code',''),'Q-'||upper(replace(gen_random_uuid()::text,'-',''))),p_actor,coalesce(p->>'source_type','ORIGINAL')) RETURNING * INTO q;
   INSERT INTO public.question_versions(question_id,version_number,section_id,subtopic_id,difficulty,created_by) VALUES(q.id,1,(p->>'section_id')::uuid,(p->>'subtopic_id')::uuid,p->>'difficulty',p_actor) RETURNING * INTO v;
   UPDATE public.questions SET current_version_id=v.id WHERE id=q.id;
  ELSE
   SELECT * INTO v FROM public.question_versions WHERE id=(p->>'version_id')::uuid FOR UPDATE;
   IF NOT FOUND OR v.status<>'DRAFT' THEN RAISE EXCEPTION 'only draft can be edited'; END IF;
   IF p->>'expected_updated_at' IS NULL OR (p->>'expected_updated_at')::timestamptz<>v.updated_at THEN RAISE EXCEPTION 'concurrent content update' USING ERRCODE='40001'; END IF;
   SELECT * INTO q FROM public.questions WHERE id=v.question_id FOR UPDATE;
  END IF;
  IF length(coalesce(p->>'source_title',''))>0 THEN
   SELECT id INTO sid FROM public.content_sources WHERE title=p->>'source_title' AND source_type=p->>'source_type' ORDER BY created_at LIMIT 1;
   IF sid IS NULL THEN INSERT INTO public.content_sources(source_type,title,file_name,source_url,notes) VALUES(p->>'source_type',p->>'source_title',nullif(p->>'source_file',''),nullif(p->>'source_url',''),nullif(p->>'source_notes','')) RETURNING id INTO sid;END IF;
  ELSE sid:=nullif(p->>'source_id','')::uuid; END IF;
  UPDATE public.question_versions SET section_id=(p->>'section_id')::uuid,subtopic_id=(p->>'subtopic_id')::uuid,difficulty=p->>'difficulty',instruction_md=p->>'instruction_md',stimulus_md=p->>'stimulus_md',stem_md=coalesce(p->>'stem_md',''),primary_skill=p->>'primary_skill',source_id=sid,source_page=p->>'source_page',updated_by=p_actor,updated_at=clock_timestamp() WHERE id=v.id;
  UPDATE public.questions SET source_type=coalesce(p->>'source_type','ORIGINAL'),updated_at=clock_timestamp() WHERE id=q.id;
  DELETE FROM public.question_options WHERE question_version_id=v.id;
  FOR item IN SELECT value FROM jsonb_array_elements(p->'options') LOOP INSERT INTO public.question_options(question_version_id,option_key,content_md,sort_order,is_correct) VALUES(v.id,item->>'option_key',item->>'content_md',ascii(item->>'option_key')-65,coalesce((item->>'is_correct')::boolean,false));END LOOP;
  DELETE FROM public.question_explanations WHERE question_version_id=v.id;
  item:=coalesce(p->'explanation','{}'::jsonb);
  INSERT INTO public.question_explanations(question_version_id,understanding_md,known_md,asked_md,concept_md,first_step_md,solution_md,final_answer_md,shortcut_md,common_mistake_md,option_analysis_md) VALUES(v.id,coalesce(item->>'understanding_md',''),item->>'known_md',item->>'asked_md',coalesce(item->>'concept_md',''),coalesce(item->>'first_step_md',''),coalesce(item->>'solution_md',''),coalesce(item->>'final_answer_md',''),item->>'shortcut_md',item->>'common_mistake_md',item->>'option_analysis_md');
  DELETE FROM public.question_media WHERE question_version_id=v.id;
  FOR item IN SELECT value FROM jsonb_array_elements(coalesce(p->'media_ids','[]')) LOOP INSERT INTO public.question_media(question_version_id,media_asset_id,role) VALUES(v.id,(item#>>'{}')::uuid,'QUESTION');END LOOP;
  RETURN public.levelup_question_detail(q.id);
 END IF;
 IF p_action='revision' THEN
  SELECT * INTO q FROM public.questions WHERE id=(p->>'id')::uuid FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'question not found'; END IF;
  SELECT * INTO v FROM public.question_versions WHERE question_id=q.id ORDER BY version_number DESC LIMIT 1;
  IF v.status='DRAFT' OR v.status='IN_REVIEW' THEN RAISE EXCEPTION 'finish existing draft or review first'; END IF;
  INSERT INTO public.question_versions(question_id,version_number,section_id,subtopic_id,difficulty,instruction_md,stimulus_md,stem_md,primary_skill,source_id,source_page,created_by) VALUES(q.id,v.version_number+1,v.section_id,v.subtopic_id,v.difficulty,v.instruction_md,v.stimulus_md,v.stem_md,v.primary_skill,v.source_id,v.source_page,p_actor) RETURNING id INTO vid;
  INSERT INTO public.question_options(question_version_id,option_key,content_md,sort_order,is_correct) SELECT vid,option_key,content_md,sort_order,is_correct FROM public.question_options WHERE question_version_id=v.id;
  INSERT INTO public.question_explanations(question_version_id,understanding_md,known_md,asked_md,concept_md,first_step_md,solution_md,final_answer_md,shortcut_md,common_mistake_md,option_analysis_md) SELECT vid,understanding_md,known_md,asked_md,concept_md,first_step_md,solution_md,final_answer_md,shortcut_md,common_mistake_md,option_analysis_md FROM public.question_explanations WHERE question_version_id=v.id;
  INSERT INTO public.question_media(question_version_id,media_asset_id,role,sort_order) SELECT vid,media_asset_id,role,sort_order FROM public.question_media WHERE question_version_id=v.id;
  UPDATE public.questions SET updated_at=clock_timestamp() WHERE id=q.id;
  RETURN public.levelup_question_detail(q.id);
 END IF;
 IF p_action IN ('send_qa','publish','delete_draft') THEN
  SELECT * INTO v FROM public.question_versions WHERE id=(p->>'version_id')::uuid FOR UPDATE;IF NOT FOUND THEN RAISE EXCEPTION 'version not found'; END IF;
  IF p_action='send_qa' THEN IF v.status<>'DRAFT' THEN RAISE EXCEPTION 'draft required'; END IF;UPDATE public.question_versions SET status='IN_REVIEW',updated_at=clock_timestamp() WHERE id=v.id;
  ELSIF p_action='publish' THEN IF v.status<>'QA_PASSED' THEN RAISE EXCEPTION 'QA approval required before publication'; END IF;UPDATE public.question_versions SET status='PUBLISHED',published_at=clock_timestamp(),updated_at=clock_timestamp() WHERE id=v.id;UPDATE public.questions SET current_version_id=v.id,updated_at=clock_timestamp() WHERE id=v.question_id;
  ELSE IF v.status<>'DRAFT' THEN RAISE EXCEPTION 'only draft can be deleted'; END IF;UPDATE public.questions SET current_version_id=(SELECT id FROM public.question_versions WHERE question_id=v.question_id AND id<>v.id ORDER BY (status='PUBLISHED') DESC,version_number DESC LIMIT 1) WHERE id=v.question_id AND current_version_id=v.id;DELETE FROM public.question_versions WHERE id=v.id;IF NOT EXISTS(SELECT 1 FROM public.question_versions WHERE question_id=v.question_id) THEN DELETE FROM public.questions WHERE id=v.question_id;END IF;RETURN jsonb_build_object('deleted',true);END IF;
  RETURN public.levelup_question_detail(v.question_id);
 END IF;
 IF p_action='archive' THEN UPDATE public.questions SET status='ARCHIVED',updated_at=clock_timestamp() WHERE id=(p->>'id')::uuid;RETURN jsonb_build_object('archived',true);END IF;
 IF p_action='media_create' THEN INSERT INTO public.media_assets(kind,original_filename,storage_provider,storage_path,mime_type,width,height,file_size,alt_text,source_url,created_by) VALUES(p->>'kind',p->>'original_filename','SUPABASE',p->>'storage_path',p->>'mime_type',nullif(p->>'width','')::integer,nullif(p->>'height','')::integer,(p->>'file_size')::bigint,p->>'alt_text',p->>'source_url',p_actor) RETURNING to_jsonb(media_assets.*) INTO result;RETURN result;END IF;
 IF p_action='codes' THEN RETURN coalesce((SELECT jsonb_agg(code) FROM public.questions),'[]'::jsonb);END IF;
 IF p_action='import_begin' THEN INSERT INTO public.import_jobs(file_name,status,created_by) VALUES(p->>'file_name','UPLOADED',p_actor) RETURNING to_jsonb(import_jobs.*) INTO result;RETURN result;END IF;
 IF p_action='import_parsing' THEN UPDATE public.import_jobs SET status='PARSING' WHERE id=(p->>'id')::uuid AND status='UPLOADED';RETURN jsonb_build_object('parsing',true);END IF;
 IF p_action='import_failed' THEN UPDATE public.import_jobs SET status='FAILED',completed_at=clock_timestamp(),summary_json=jsonb_build_object('error',p->>'error') WHERE id=(p->>'id')::uuid AND status IN ('UPLOADED','PARSING');RETURN jsonb_build_object('failed',true);END IF;
 IF p_action='imports' THEN RETURN coalesce((SELECT jsonb_agg(to_jsonb(ij) ORDER BY created_at DESC) FROM public.import_jobs ij),'[]'::jsonb);END IF;
 IF p_action='import_detail' THEN RETURN (SELECT to_jsonb(ij)||jsonb_build_object('rows',coalesce((SELECT jsonb_agg(to_jsonb(ir) ORDER BY row_number) FROM public.import_rows ir WHERE ir.import_job_id=ij.id),'[]'::jsonb)) FROM public.import_jobs ij WHERE id=(p->>'id')::uuid);END IF;
 IF p_action='import_preview' THEN
  IF jsonb_array_length(p->'rows') NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'import requires 1 to 200 rows';END IF;
  IF p->>'id' IS NOT NULL THEN SELECT * INTO j FROM public.import_jobs WHERE id=(p->>'id')::uuid FOR UPDATE;IF NOT FOUND OR j.status<>'PARSING' THEN RAISE EXCEPTION 'job must be parsing';END IF;UPDATE public.import_jobs SET summary_json=p->'summary',status=CASE WHEN (p->'summary'->>'invalid')::integer>0 OR (p->'summary'->>'valid')::integer=0 THEN 'VALIDATION_FAILED' ELSE 'READY_FOR_REVIEW' END WHERE id=j.id RETURNING * INTO j;
  ELSE INSERT INTO public.import_jobs(file_name,status,created_by,summary_json) VALUES(p->>'file_name',CASE WHEN (p->'summary'->>'invalid')::integer>0 OR (p->'summary'->>'valid')::integer=0 THEN 'VALIDATION_FAILED' ELSE 'READY_FOR_REVIEW' END,p_actor,p->'summary') RETURNING * INTO j;END IF;
  FOR item IN SELECT value FROM jsonb_array_elements(p->'rows') LOOP INSERT INTO public.import_rows(import_job_id,row_number,raw_json,parsed_json,status,error_message) VALUES(j.id,(item->>'row_number')::integer,item->'raw',item->'parsed',item->>'status',item->>'error_message');END LOOP;
  RETURN to_jsonb(j);
 END IF;
 IF p_action='import_confirm' THEN
  SELECT * INTO j FROM public.import_jobs WHERE id=(p->>'id')::uuid FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'import job not found';END IF;
  IF j.status='IMPORTED' THEN RETURN to_jsonb(j);END IF;
  IF j.status<>'READY_FOR_REVIEW' OR EXISTS(SELECT 1 FROM public.import_rows WHERE import_job_id=j.id AND status='INVALID') THEN RAISE EXCEPTION 'invalid rows must be corrected before import'; END IF;
  FOR r IN SELECT * FROM public.import_rows WHERE import_job_id=j.id AND status='VALID' ORDER BY row_number LOOP
   result:=public.levelup_admin_content(p_actor,'create',r.parsed_json);UPDATE public.import_rows SET status='IMPORTED',question_id=(result->>'id')::uuid WHERE id=r.id;
  END LOOP;
  UPDATE public.import_jobs SET status='IMPORTED',completed_at=clock_timestamp() WHERE id=j.id RETURNING * INTO j;RETURN to_jsonb(j);
 END IF;
 RAISE EXCEPTION 'unknown content action';
END $$;
CREATE OR REPLACE FUNCTION public.levelup_published_questions(p_test_only boolean DEFAULT false) RETURNS jsonb LANGUAGE sql STABLE SET search_path='' AS $$
 SELECT coalesce(jsonb_agg(jsonb_build_object('id',q.id,'version_id',v.id,'version',v.version_number,'topic',v.subtopic_id,'section',s.code,'difficulty',v.difficulty,'instruction',v.instruction_md,'stimulus',v.stimulus_md,'stem',v.stem_md,'options',(SELECT jsonb_agg(to_jsonb(o) ORDER BY sort_order) FROM public.question_options o WHERE o.question_version_id=v.id),'explanation',(SELECT to_jsonb(e) FROM public.question_explanations e WHERE e.question_version_id=v.id),'media',coalesce((SELECT jsonb_agg(to_jsonb(m)||jsonb_build_object('role',qm.role)) FROM public.question_media qm JOIN public.media_assets m ON m.id=qm.media_asset_id WHERE qm.question_version_id=v.id),'[]'::jsonb))),'[]'::jsonb)
 FROM public.questions q JOIN public.question_versions v ON v.id=q.current_version_id JOIN public.exam_sections s ON s.id=v.section_id JOIN public.exams x ON x.id=s.exam_id JOIN public.subtopics st ON st.id=v.subtopic_id JOIN public.topics t ON t.id=st.topic_id JOIN public.domains d ON d.id=t.domain_id WHERE (q.status='ACTIVE' OR (p_test_only AND q.status='TEST_ONLY')) AND v.status='PUBLISHED' AND s.status='ACTIVE' AND x.status='ACTIVE' AND st.status='ACTIVE' AND t.status='ACTIVE' AND d.status='ACTIVE';
$$;
REVOKE ALL ON FUNCTION public.levelup_content_catalog(),public.levelup_question_detail(uuid),public.levelup_admin_content(uuid,text,jsonb),public.levelup_published_questions(boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.levelup_content_catalog(),public.levelup_question_detail(uuid),public.levelup_admin_content(uuid,text,jsonb),public.levelup_published_questions(boolean) TO service_role;
COMMIT;
