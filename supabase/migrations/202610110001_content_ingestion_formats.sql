BEGIN;

ALTER TABLE public.content_sources
  DROP CONSTRAINT IF EXISTS content_sources_source_type_check;
ALTER TABLE public.content_sources
  ADD CONSTRAINT content_sources_source_type_check
  CHECK (source_type IN ('ORIGINAL','PAST_EXAM','ADAPTED','PDF','EXCEL','DOCX','AI_ASSISTED','OTHER'));

ALTER TABLE public.questions
  DROP CONSTRAINT IF EXISTS questions_source_type_check;
ALTER TABLE public.questions
  ADD CONSTRAINT questions_source_type_check
  CHECK (source_type IN ('ORIGINAL','PAST_EXAM','ADAPTED','PDF','EXCEL','DOCX','AI_ASSISTED','OTHER'));

CREATE OR REPLACE FUNCTION public.levelup_import_source_type()
RETURNS trigger
LANGUAGE plpgsql
SET search_path=''
AS $$
BEGIN
  IF lower(NEW.file_name) LIKE '%.docx' THEN
    NEW.source_type := 'DOCX';
  ELSIF lower(NEW.file_name) LIKE '%.pdf' THEN
    NEW.source_type := 'PDF';
  ELSIF lower(NEW.file_name) LIKE '%.xlsx' THEN
    NEW.source_type := 'EXCEL';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS infer_import_source_type ON public.import_jobs;
CREATE TRIGGER infer_import_source_type
BEFORE INSERT OR UPDATE OF file_name ON public.import_jobs
FOR EACH ROW EXECUTE FUNCTION public.levelup_import_source_type();

REVOKE ALL ON FUNCTION public.levelup_import_source_type() FROM PUBLIC, anon, authenticated;

COMMIT;
