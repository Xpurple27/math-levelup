BEGIN;

CREATE OR REPLACE FUNCTION public.levelup_seed_practice_package(p_payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SET search_path=''
AS $$
DECLARE
  v_admin uuid;
  v_section uuid;
  v_domain uuid;
  v_package uuid;
  v_q jsonb;
  v_question uuid;
  v_version uuid;
  v_subtopic uuid;
  v_option jsonb;
  v_idx integer;
  v_key text;
  v_count integer := 0;
BEGIN
  SELECT user_id INTO v_admin FROM public.levelup_roles WHERE role='ADMIN' ORDER BY created_at LIMIT 1;
  IF v_admin IS NULL THEN RAISE EXCEPTION 'admin user not found'; END IF;

  SELECT s.id INTO v_section
  FROM public.exam_sections s JOIN public.exams e ON e.id=s.exam_id
  WHERE e.code='SNBT' AND s.code=upper(p_payload->>'section_code') AND s.status='ACTIVE';
  IF v_section IS NULL THEN RAISE EXCEPTION 'section not found'; END IF;

  SELECT id INTO v_domain FROM public.domains WHERE code=p_payload->>'domain_code' AND status='ACTIVE';
  IF v_domain IS NULL THEN RAISE EXCEPTION 'domain not found'; END IF;

  INSERT INTO public.practice_packages(section_id,domain_id,subtopic_id,code,slug,title,description,access,status,estimated_minutes,sort_order)
  VALUES(v_section,v_domain,NULL,p_payload->'package'->>'code',p_payload->'package'->>'slug',p_payload->'package'->>'title',coalesce(p_payload->'package'->>'description',''),'FREE','DRAFT',coalesce((p_payload->'package'->>'estimated_minutes')::integer,15),coalesce((p_payload->'package'->>'sort_order')::integer,0))
  ON CONFLICT(code) DO UPDATE SET
    section_id=excluded.section_id,domain_id=excluded.domain_id,subtopic_id=NULL,slug=excluded.slug,title=excluded.title,description=excluded.description,
    access='FREE',status='DRAFT',estimated_minutes=excluded.estimated_minutes,sort_order=excluded.sort_order,published_at=NULL,updated_at=now()
  RETURNING id INTO v_package;

  DELETE FROM public.practice_package_questions WHERE practice_package_id=v_package;

  FOR v_q IN SELECT value FROM jsonb_array_elements(p_payload->'questions') LOOP
    v_count := v_count + 1;
    IF jsonb_array_length(v_q->'options') <> 5 THEN RAISE EXCEPTION 'question % must have five options',v_q->>'code'; END IF;
    v_key := upper(v_q->>'answer');
    IF v_key NOT IN ('A','B','C','D','E') THEN RAISE EXCEPTION 'invalid answer key for %',v_q->>'code'; END IF;

    SELECT id INTO v_subtopic FROM public.subtopics WHERE code=v_q->>'subtopic_code' AND status='ACTIVE';
    IF v_subtopic IS NULL THEN RAISE EXCEPTION 'subtopic not found for %',v_q->>'code'; END IF;
    IF NOT EXISTS(
      SELECT 1 FROM public.subtopics st JOIN public.topics t ON t.id=st.topic_id
      WHERE st.id=v_subtopic AND t.domain_id=v_domain
    ) THEN RAISE EXCEPTION 'subtopic outside package domain for %',v_q->>'code'; END IF;

    INSERT INTO public.questions(code,status,source_type,created_by)
    VALUES(v_q->>'code','ACTIVE','AI_ASSISTED',v_admin)
    ON CONFLICT(code) DO UPDATE SET status='ACTIVE',updated_at=now()
    RETURNING id INTO v_question;

    UPDATE public.question_versions SET status='DRAFT',published_at=NULL,updated_at=now()
    WHERE question_id=v_question AND status<>'DRAFT';
    DELETE FROM public.question_versions WHERE question_id=v_question AND version_number=1;

    INSERT INTO public.question_versions(question_id,version_number,question_type,section_id,subtopic_id,difficulty,instruction_md,stimulus_md,stem_md,primary_skill,status,metadata,created_by,updated_by)
    VALUES(v_question,1,'SINGLE_CHOICE',v_section,v_subtopic,upper(v_q->>'difficulty'),nullif(v_q->>'instruction',''),nullif(v_q->>'stimulus',''),v_q->>'stem',nullif(v_q->>'primary_skill',''),'DRAFT',coalesce(v_q->'metadata','{}'::jsonb),v_admin,v_admin)
    RETURNING id INTO v_version;

    v_idx := 0;
    FOR v_option IN SELECT value FROM jsonb_array_elements(v_q->'options') LOOP
      INSERT INTO public.question_options(question_version_id,option_key,content_md,sort_order,is_correct)
      VALUES(v_version,chr(65+v_idx),v_option#>>'{}',(v_idx+1)*10,chr(65+v_idx)=v_key);
      v_idx := v_idx + 1;
    END LOOP;

    INSERT INTO public.question_explanations(question_version_id,understanding_md,known_md,asked_md,concept_md,first_step_md,solution_md,final_answer_md,shortcut_md,common_mistake_md,option_analysis_md)
    VALUES(
      v_version,
      coalesce(v_q->'explanation'->>'understanding','Pahami informasi dan hubungan utama pada soal.'),
      nullif(v_q->'explanation'->>'known',''),
      nullif(v_q->'explanation'->>'asked',''),
      coalesce(v_q->'explanation'->>'concept','Gunakan konsep yang sesuai dengan taxonomy soal.'),
      coalesce(v_q->'explanation'->>'first_step','Identifikasi informasi yang paling menentukan.'),
      coalesce(v_q->'explanation'->>'solution','Ikuti hubungan yang diberikan sampai diperoleh jawaban.'),
      coalesce(v_q->'explanation'->>'final_answer',v_key),
      nullif(v_q->'explanation'->>'shortcut',''),
      coalesce(v_q->'explanation'->>'mistake','Periksa kembali syarat, satuan, dan arah hubungan.'),
      nullif(v_q->'explanation'->>'option_analysis','')
    );

    IF NOT public.levelup_question_ready(v_version) THEN RAISE EXCEPTION 'question not ready: %',v_q->>'code'; END IF;
    UPDATE public.question_versions SET status='PUBLISHED',published_at=now(),updated_at=now() WHERE id=v_version;
    UPDATE public.questions SET current_version_id=v_version,status='ACTIVE',updated_at=now() WHERE id=v_question;
    INSERT INTO public.practice_package_questions(practice_package_id,question_version_id,sort_order)
    VALUES(v_package,v_version,v_count*10);
  END LOOP;

  IF v_count <> 10 THEN RAISE EXCEPTION 'practice package must contain exactly 10 questions'; END IF;
  UPDATE public.practice_packages SET status='PUBLISHED',published_at=now(),updated_at=now() WHERE id=v_package;
  RETURN jsonb_build_object('package_id',v_package,'questions',v_count);
END $$;

REVOKE ALL ON FUNCTION public.levelup_seed_practice_package(jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.levelup_seed_practice_package(jsonb) TO service_role;

COMMIT;
