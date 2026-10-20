-- BAOMS Dynamic Project Engine: additive configuration, collection and verification schema.
-- Existing project/activity/finance/document entities remain authoritative and are not replaced.

CREATE TABLE IF NOT EXISTS public.project_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.project_templates(id) ON DELETE RESTRICT,
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  config JSONB NOT NULL CHECK (jsonb_typeof(config) = 'object'),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'retired')),
  change_summary TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (template_id, version_number)
);

CREATE TABLE IF NOT EXISTS public.project_config_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  template_version_id UUID REFERENCES public.project_template_versions(id) ON DELETE SET NULL,
  config JSONB NOT NULL CHECK (jsonb_typeof(config) = 'object'),
  change_summary TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  effective_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, version_number)
);

CREATE TABLE IF NOT EXISTS public.project_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'count',
  baseline NUMERIC,
  target NUMERIC,
  calculation_type TEXT NOT NULL CHECK (calculation_type IN ('sum', 'percentage_of_target', 'average', 'latest_value_or_milestone_state')),
  source_field_key TEXT NOT NULL,
  aggregation TEXT NOT NULL CHECK (aggregation IN ('sum', 'average', 'latest')),
  config_version INTEGER NOT NULL DEFAULT 1 CHECK (config_version > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, code),
  CHECK (calculation_type <> 'percentage_of_target' OR target > 0),
  CHECK (calculation_type <> 'sum' OR aggregation = 'sum'),
  CHECK (calculation_type <> 'average' OR aggregation = 'average'),
  CHECK (calculation_type <> 'latest_value_or_milestone_state' OR aggregation = 'latest')
);

CREATE TABLE IF NOT EXISTS public.project_indicator_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  indicator_id UUID NOT NULL REFERENCES public.project_indicators(id) ON DELETE RESTRICT,
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  definition JSONB NOT NULL CHECK (jsonb_typeof(definition) = 'object'),
  change_summary TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (indicator_id, version_number)
);

CREATE TABLE IF NOT EXISTS public.project_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'retired')),
  current_version_id UUID,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_form_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES public.project_forms(id) ON DELETE RESTRICT,
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  form_schema JSONB NOT NULL CHECK (jsonb_typeof(form_schema) = 'object' AND jsonb_typeof(form_schema->'fields') = 'array'),
  schema_hash TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'retired')),
  change_summary TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (form_id, version_number)
);

ALTER TABLE public.project_forms
  ADD CONSTRAINT project_forms_current_version_fk
  FOREIGN KEY (current_version_id) REFERENCES public.project_form_versions(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.project_collection_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  form_id UUID NOT NULL REFERENCES public.project_forms(id) ON DELETE RESTRICT,
  form_version_id UUID NOT NULL REFERENCES public.project_form_versions(id) ON DELETE RESTRICT,
  assignee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  period_key TEXT NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'submitted', 'closed')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, form_id, assignee_id, period_key)
);

CREATE TABLE IF NOT EXISTS public.project_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  form_id UUID NOT NULL REFERENCES public.project_forms(id) ON DELETE RESTRICT,
  form_version_id UUID NOT NULL REFERENCES public.project_form_versions(id) ON DELETE RESTRICT,
  assignment_id UUID REFERENCES public.project_collection_assignments(id) ON DELETE RESTRICT,
  client_submission_id UUID NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision > 0),
  collected_on DATE NOT NULL,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(answers) = 'object'),
  indicator_versions JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(indicator_versions) = 'object'),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'verified', 'returned', 'rejected')),
  submitted_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  submitted_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  verified_at TIMESTAMPTZ,
  review_comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (submitted_by, client_submission_id),
  CHECK ((status <> 'verified') OR (verified_by IS NOT NULL AND verified_at IS NOT NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_project_submissions_assignment ON public.project_submissions(assignment_id) WHERE assignment_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.project_submission_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.project_submissions(id) ON DELETE RESTRICT,
  from_status TEXT CHECK (from_status IS NULL OR from_status IN ('draft', 'pending', 'verified', 'returned', 'rejected')),
  to_status TEXT NOT NULL CHECK (to_status IN ('draft', 'pending', 'verified', 'returned', 'rejected')),
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  comments TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_submission_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.project_submissions(id) ON DELETE RESTRICT,
  revision INTEGER NOT NULL CHECK (revision > 0),
  collected_on DATE NOT NULL,
  answers JSONB NOT NULL CHECK (jsonb_typeof(answers) = 'object'),
  indicator_versions JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(indicator_versions) = 'object'),
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending', 'verified', 'returned', 'rejected')),
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (submission_id, revision)
);

CREATE INDEX IF NOT EXISTS idx_project_indicators_project_status ON public.project_indicators(project_id, status);
CREATE INDEX IF NOT EXISTS idx_project_indicator_versions_indicator ON public.project_indicator_versions(indicator_id, version_number);
CREATE INDEX IF NOT EXISTS idx_project_forms_project_status ON public.project_forms(project_id, status);
CREATE INDEX IF NOT EXISTS idx_project_form_versions_form_status ON public.project_form_versions(form_id, status);
CREATE INDEX IF NOT EXISTS idx_project_assignments_assignee_status ON public.project_collection_assignments(assignee_id, status, due_date);
CREATE INDEX IF NOT EXISTS idx_project_submissions_project_status_date ON public.project_submissions(project_id, status, collected_on);
CREATE INDEX IF NOT EXISTS idx_project_submissions_answers ON public.project_submissions USING GIN (answers);
CREATE INDEX IF NOT EXISTS idx_project_submission_events_submission ON public.project_submission_events(submission_id, created_at);
CREATE INDEX IF NOT EXISTS idx_project_submission_revisions_submission ON public.project_submission_revisions(submission_id, revision);

CREATE OR REPLACE FUNCTION public.dynamic_project_member(p_project_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT public.is_admin() OR public.has_role('executive_director')
    OR public.has_permission('me.manage')
    OR public.is_project_member(p_project_id)
$$;

CREATE OR REPLACE FUNCTION public.dynamic_project_manager(p_project_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT public.is_admin() OR public.has_role('executive_director')
    OR (public.has_permission('projects.manage') AND public.is_project_member(p_project_id))
$$;

CREATE OR REPLACE FUNCTION public.dynamic_project_verifier(p_project_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT public.is_admin() OR public.has_role('executive_director')
    OR (public.has_permission('me.validate') AND public.dynamic_project_member(p_project_id))
$$;

CREATE OR REPLACE FUNCTION public.validate_dynamic_form_schema(p_schema JSONB)
RETURNS VOID LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE
  field JSONB;
  field_key TEXT;
  field_type TEXT;
  seen_keys TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF jsonb_typeof(p_schema) IS DISTINCT FROM 'object' OR jsonb_typeof(p_schema->'fields') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Form schema must contain a field array';
  END IF;
  IF jsonb_array_length(p_schema->'fields') < 1 OR jsonb_array_length(p_schema->'fields') > 100 THEN
    RAISE EXCEPTION 'Form schema must contain between 1 and 100 fields';
  END IF;
  FOR field IN SELECT value FROM jsonb_array_elements(p_schema->'fields') LOOP
    field_key := field->>'key';
    field_type := field->>'type';
    IF field_key IS NULL OR field_key !~ '^[a-z][a-z0-9_]{0,63}$' OR COALESCE(field->>'label', '') = '' THEN
      RAISE EXCEPTION 'Form fields require a valid stable key and label';
    END IF;
    IF field_key = ANY(seen_keys) THEN RAISE EXCEPTION 'Form field keys must be unique'; END IF;
    seen_keys := array_append(seen_keys, field_key);
    IF jsonb_typeof(field->'required') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'Form field required must be boolean'; END IF;
    IF (field ? 'min' AND jsonb_typeof(field->'min') <> 'number') OR (field ? 'max' AND jsonb_typeof(field->'max') <> 'number') THEN
      RAISE EXCEPTION 'Numeric field limits must be numbers';
    END IF;
    IF field ? 'min' AND field ? 'max' AND (field->>'min')::NUMERIC > (field->>'max')::NUMERIC THEN
      RAISE EXCEPTION 'Field minimum cannot exceed maximum';
    END IF;
    IF (field ? 'min' OR field ? 'max') AND field_type NOT IN ('integer', 'decimal') THEN
      RAISE EXCEPTION 'Numeric limits require an integer or decimal field';
    END IF;
    IF field_type IS NULL OR field_type NOT IN ('text', 'textarea', 'integer', 'decimal', 'date', 'select', 'multiselect', 'boolean') THEN
      RAISE EXCEPTION 'Unsupported dynamic form field type: %', field_type;
    END IF;
    IF field_type IN ('select', 'multiselect') THEN
      IF jsonb_typeof(field->'options') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Choice fields require an option array'; END IF;
      IF jsonb_array_length(field->'options') < 1 OR jsonb_array_length(field->'options') > 100 THEN
        RAISE EXCEPTION 'Choice fields require between 1 and 100 options';
      END IF;
      IF EXISTS (SELECT 1 FROM jsonb_array_elements(field->'options') AS choices(value) WHERE jsonb_typeof(choices.value) <> 'string') THEN
        RAISE EXCEPTION 'Choice options must be text';
      END IF;
      IF (SELECT count(*) FROM jsonb_array_elements_text(field->'options')) <> (SELECT count(DISTINCT value) FROM jsonb_array_elements_text(field->'options') AS choices(value)) THEN
        RAISE EXCEPTION 'Choice options must be unique';
      END IF;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_dynamic_template_config(p_config JSONB)
RETURNS VOID LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE
  indicator JSONB;
  form_def JSONB;
  indicator_code TEXT;
  seen_codes TEXT[] := ARRAY[]::TEXT[];
BEGIN
  IF jsonb_typeof(p_config) IS DISTINCT FROM 'object' OR jsonb_typeof(p_config->'indicators') IS DISTINCT FROM 'array'
    OR jsonb_typeof(p_config->'forms') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'Template configuration must contain indicators and forms arrays';
  END IF;
  IF jsonb_array_length(p_config->'indicators') > 250 OR jsonb_array_length(p_config->'forms') > 100 THEN
    RAISE EXCEPTION 'Template exceeds supported configuration limits';
  END IF;
  FOR indicator IN SELECT value FROM jsonb_array_elements(p_config->'indicators') LOOP
    indicator_code := upper(indicator->>'code');
    IF indicator_code IS NULL OR indicator_code = '' OR COALESCE(indicator->>'name', '') = ''
      OR COALESCE(indicator->>'sourceFieldKey', '') = '' THEN
      RAISE EXCEPTION 'Template indicators require a code, name, and source field key';
    END IF;
    IF indicator_code = ANY(seen_codes) THEN RAISE EXCEPTION 'Template indicator codes must be unique'; END IF;
    seen_codes := array_append(seen_codes, indicator_code);
    IF indicator->>'calculationType' NOT IN ('sum', 'percentage_of_target', 'average', 'latest_value_or_milestone_state') THEN
      RAISE EXCEPTION 'Template includes an unsupported indicator calculation';
    END IF;
    IF indicator->>'aggregation' NOT IN ('sum', 'average', 'latest') THEN
      RAISE EXCEPTION 'Template includes an unsupported indicator aggregation';
    END IF;
    IF indicator->>'calculationType' = 'sum' AND indicator->>'aggregation' <> 'sum' THEN
      RAISE EXCEPTION 'Sum indicators must use sum aggregation';
    END IF;
    IF indicator->>'calculationType' = 'average' AND indicator->>'aggregation' <> 'average' THEN
      RAISE EXCEPTION 'Average indicators must use average aggregation';
    END IF;
    IF indicator->>'calculationType' = 'latest_value_or_milestone_state' AND indicator->>'aggregation' <> 'latest' THEN
      RAISE EXCEPTION 'Latest indicators must use latest aggregation';
    END IF;
    IF indicator->>'calculationType' = 'percentage_of_target' AND COALESCE((indicator->>'target')::NUMERIC, 0) <= 0 THEN
      RAISE EXCEPTION 'Percentage indicators require a positive target';
    END IF;
  END LOOP;
  FOR form_def IN SELECT value FROM jsonb_array_elements(p_config->'forms') LOOP
    IF COALESCE(form_def->>'name', '') = '' THEN RAISE EXCEPTION 'Template forms require a name'; END IF;
    PERFORM public.validate_dynamic_form_schema(form_def->'schema');
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_dynamic_submission_answers()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  schema_doc JSONB;
  field JSONB;
  answer JSONB;
  field_key TEXT;
  field_type TEXT;
  answer_key TEXT;
  allow_pinned_version BOOLEAN := FALSE;
BEGIN
  IF NEW.status NOT IN ('pending', 'verified') THEN RETURN NEW; END IF;
  -- Preserve the form version pinned by an already-submitted record. The guard
  -- trigger may close its assignment before this validation trigger runs.
  IF TG_OP = 'UPDATE' THEN allow_pinned_version := OLD.status IN ('draft', 'returned', 'pending'); END IF;
  SELECT form_schema INTO schema_doc FROM public.project_form_versions
    WHERE id = NEW.form_version_id AND form_id = NEW.form_id AND (
      (status = 'published' AND (EXISTS (SELECT 1 FROM public.project_forms f WHERE f.id = NEW.form_id
        AND f.current_version_id = NEW.form_version_id) OR allow_pinned_version))
      OR (status IN ('published', 'retired') AND NEW.assignment_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.project_collection_assignments a WHERE a.id = NEW.assignment_id
          AND a.form_version_id = NEW.form_version_id AND a.status = 'open'
      ))
      OR (status = 'retired' AND allow_pinned_version)
    );
  IF schema_doc IS NULL THEN RAISE EXCEPTION 'Submission must reference a published form version'; END IF;
  PERFORM public.validate_dynamic_form_schema(schema_doc);
  FOR answer_key IN SELECT jsonb_object_keys(NEW.answers) LOOP
    IF NOT EXISTS (SELECT 1 FROM jsonb_array_elements(schema_doc->'fields') f WHERE f->>'key' = answer_key) THEN
      RAISE EXCEPTION 'Unknown form field: %', answer_key;
    END IF;
  END LOOP;
  FOR field IN SELECT value FROM jsonb_array_elements(schema_doc->'fields') LOOP
    field_key := field->>'key';
    field_type := field->>'type';
    answer := NEW.answers->field_key;
    IF (field->>'required')::BOOLEAN AND (answer IS NULL OR answer = 'null'::jsonb OR answer = '""'::jsonb) THEN
      RAISE EXCEPTION 'Required field is missing: %', field->>'label';
    END IF;
    IF answer IS NULL OR answer = 'null'::jsonb THEN CONTINUE; END IF;
    IF field_type IN ('text', 'textarea') AND jsonb_typeof(answer) <> 'string' THEN RAISE EXCEPTION 'Field % must be text', field_key; END IF;
    IF field_type = 'boolean' AND jsonb_typeof(answer) <> 'boolean' THEN RAISE EXCEPTION 'Field % must be boolean', field_key; END IF;
    IF field_type IN ('integer', 'decimal') AND jsonb_typeof(answer) <> 'number' THEN RAISE EXCEPTION 'Field % must be numeric', field_key; END IF;
    IF field_type = 'integer' AND (answer::TEXT)::NUMERIC <> trunc((answer::TEXT)::NUMERIC) THEN RAISE EXCEPTION 'Field % must be a whole number', field_key; END IF;
    IF field_type IN ('integer', 'decimal') AND field ? 'min' AND (answer::TEXT)::NUMERIC < (field->>'min')::NUMERIC THEN RAISE EXCEPTION 'Field % is below its minimum', field_key; END IF;
    IF field_type IN ('integer', 'decimal') AND field ? 'max' AND (answer::TEXT)::NUMERIC > (field->>'max')::NUMERIC THEN RAISE EXCEPTION 'Field % exceeds its maximum', field_key; END IF;
    IF field_type = 'date' THEN
      IF jsonb_typeof(answer) <> 'string' OR answer #>> '{}' !~ '^\d{4}-\d{2}-\d{2}$' THEN RAISE EXCEPTION 'Field % must be an ISO date', field_key; END IF;
      BEGIN PERFORM (answer #>> '{}')::DATE; EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION 'Field % must be a real calendar date', field_key; END;
    END IF;
    IF field_type = 'select' AND NOT (field->'options' ? (answer #>> '{}')) THEN RAISE EXCEPTION 'Field % contains an unknown option', field_key; END IF;
    IF field_type = 'multiselect' THEN
      IF jsonb_typeof(answer) <> 'array' THEN RAISE EXCEPTION 'Field % must be an array of choices', field_key; END IF;
      IF EXISTS (SELECT 1 FROM jsonb_array_elements_text(answer) AS choices(value) WHERE NOT (field->'options' ? choices.value)) THEN
        RAISE EXCEPTION 'Field % contains an unknown option', field_key;
      END IF;
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_dynamic_submission_answers ON public.project_submissions;
CREATE TRIGGER trg_validate_dynamic_submission_answers BEFORE INSERT OR UPDATE ON public.project_submissions
FOR EACH ROW EXECUTE FUNCTION public.validate_dynamic_submission_answers();

CREATE OR REPLACE FUNCTION public.guard_dynamic_submission()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Project submissions are retained and cannot be deleted';
  END IF;
  IF OLD.status IN ('pending', 'verified', 'rejected') THEN
    IF OLD.status = 'pending' AND NEW.status = 'returned' AND public.dynamic_project_verifier(OLD.project_id) THEN
      NEW.review_comments := COALESCE(NULLIF(NEW.review_comments, ''), 'Returned for correction');
      IF NEW.assignment_id IS NOT NULL THEN
        UPDATE public.project_collection_assignments SET status = 'open' WHERE id = NEW.assignment_id;
      END IF;
    ELSE
      RAISE EXCEPTION 'Submitted records are immutable; return the submission for correction before editing';
    END IF;
  END IF;
  IF NOT (
    (OLD.status = 'draft' AND NEW.status IN ('draft', 'pending'))
    OR (OLD.status = 'returned' AND NEW.status IN ('returned', 'draft', 'pending'))
    OR (OLD.status = 'pending' AND NEW.status IN ('pending', 'verified', 'returned', 'rejected'))
    OR (OLD.status IN ('verified', 'rejected') AND NEW.status = OLD.status AND NEW.answers = OLD.answers)
  ) THEN RAISE EXCEPTION 'Invalid submission status transition: % to %', OLD.status, NEW.status; END IF;
  IF NEW.status = 'verified' THEN
    IF OLD.status <> 'pending' THEN
      RAISE EXCEPTION 'Only pending submissions can be verified';
    END IF;
    IF NOT public.dynamic_project_verifier(NEW.project_id) THEN
      RAISE EXCEPTION 'You are not authorized to verify this submission';
    END IF;
    IF NEW.submitted_by = auth.uid() THEN
      RAISE EXCEPTION 'Submitters cannot verify their own submissions';
    END IF;
    NEW.verified_by := auth.uid();
    NEW.verified_at := now();
    IF NEW.assignment_id IS NOT NULL THEN
      UPDATE public.project_collection_assignments SET status = 'submitted' WHERE id = NEW.assignment_id;
    END IF;
  END IF;
  IF NEW.status = 'rejected' AND OLD.status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending submissions can be rejected';
  END IF;
  IF NEW.status = 'pending' AND (OLD.status = 'draft' OR OLD.status = 'returned') THEN
    NEW.submitted_at := now();
    NEW.verified_by := NULL;
    NEW.verified_at := NULL;
    NEW.review_comments := NULL;
    IF NEW.assignment_id IS NOT NULL THEN
      UPDATE public.project_collection_assignments SET status = 'submitted' WHERE id = NEW.assignment_id;
    END IF;
  END IF;
  IF NEW.project_id IS DISTINCT FROM OLD.project_id OR NEW.form_id IS DISTINCT FROM OLD.form_id
    OR NEW.form_version_id IS DISTINCT FROM OLD.form_version_id
    OR NEW.assignment_id IS DISTINCT FROM OLD.assignment_id
    OR NEW.submitted_by IS DISTINCT FROM OLD.submitted_by
    OR NEW.client_submission_id IS DISTINCT FROM OLD.client_submission_id THEN
    RAISE EXCEPTION 'Project, form version, assignment, submitter and idempotency identity are immutable';
  END IF;
  IF NEW.answers IS DISTINCT FROM OLD.answers OR NEW.collected_on IS DISTINCT FROM OLD.collected_on OR NEW.status IS DISTINCT FROM OLD.status
    OR NEW.indicator_versions IS DISTINCT FROM OLD.indicator_versions THEN
    INSERT INTO public.project_submission_revisions(submission_id, revision, collected_on, answers, indicator_versions, status, actor_id)
    VALUES (OLD.id, OLD.revision, OLD.collected_on, OLD.answers, OLD.indicator_versions, OLD.status, auth.uid())
    ON CONFLICT (submission_id, revision) DO NOTHING;
    NEW.revision := OLD.revision + 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.initialize_dynamic_submission()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('draft', 'pending') THEN
    RAISE EXCEPTION 'New submissions must be draft or pending';
  END IF;
  IF NEW.status = 'pending' THEN
    NEW.submitted_at := COALESCE(NEW.submitted_at, now());
  END IF;
  IF NEW.status = 'pending' THEN
    SELECT COALESCE(jsonb_object_agg(i.id::TEXT, i.config_version), '{}'::jsonb) INTO NEW.indicator_versions
    FROM public.project_indicators i WHERE i.project_id = NEW.project_id AND i.status = 'active';
  END IF;
  NEW.verified_by := NULL;
  NEW.verified_at := NULL;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.snapshot_dynamic_submission_indicators()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'pending' AND (OLD.status = 'draft' OR OLD.status = 'returned') THEN
    SELECT COALESCE(jsonb_object_agg(i.id::TEXT, i.config_version), '{}'::jsonb) INTO NEW.indicator_versions
    FROM public.project_indicators i WHERE i.project_id = NEW.project_id AND i.status = 'active';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prepare_project_indicator_version()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (
    NEW.name IS DISTINCT FROM OLD.name OR NEW.description IS DISTINCT FROM OLD.description
    OR NEW.unit IS DISTINCT FROM OLD.unit OR NEW.baseline IS DISTINCT FROM OLD.baseline
    OR NEW.target IS DISTINCT FROM OLD.target OR NEW.calculation_type IS DISTINCT FROM OLD.calculation_type
    OR NEW.source_field_key IS DISTINCT FROM OLD.source_field_key OR NEW.aggregation IS DISTINCT FROM OLD.aggregation
  ) THEN
    NEW.config_version := OLD.config_version + 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_project_indicator_version()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.config_version IS DISTINCT FROM OLD.config_version THEN
    INSERT INTO public.project_indicator_versions(indicator_id, version_number, definition, created_by)
    VALUES (NEW.id, NEW.config_version, jsonb_build_object(
      'code', NEW.code, 'name', NEW.name, 'description', NEW.description, 'unit', NEW.unit,
      'baseline', NEW.baseline, 'target', NEW.target, 'calculationType', NEW.calculation_type,
      'sourceFieldKey', NEW.source_field_key, 'aggregation', NEW.aggregation
    ), COALESCE(auth.uid(), NEW.created_by));
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_project_indicator_delete()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Indicators are retained; archive them instead of deleting'; END;
$$;

DROP TRIGGER IF EXISTS trg_prepare_project_indicator_version ON public.project_indicators;
CREATE TRIGGER trg_prepare_project_indicator_version BEFORE INSERT OR UPDATE ON public.project_indicators
FOR EACH ROW EXECUTE FUNCTION public.prepare_project_indicator_version();
DROP TRIGGER IF EXISTS trg_record_project_indicator_version ON public.project_indicators;
CREATE TRIGGER trg_record_project_indicator_version AFTER INSERT OR UPDATE ON public.project_indicators
FOR EACH ROW EXECUTE FUNCTION public.record_project_indicator_version();
DROP TRIGGER IF EXISTS trg_prevent_project_indicator_delete ON public.project_indicators;
CREATE TRIGGER trg_prevent_project_indicator_delete BEFORE DELETE ON public.project_indicators
FOR EACH ROW EXECUTE FUNCTION public.prevent_project_indicator_delete();

DROP TRIGGER IF EXISTS trg_initialize_dynamic_submission ON public.project_submissions;
CREATE TRIGGER trg_initialize_dynamic_submission BEFORE INSERT ON public.project_submissions
FOR EACH ROW EXECUTE FUNCTION public.initialize_dynamic_submission();

DROP TRIGGER IF EXISTS trg_guard_dynamic_submission ON public.project_submissions;
CREATE TRIGGER trg_guard_dynamic_submission BEFORE UPDATE OR DELETE ON public.project_submissions
FOR EACH ROW EXECUTE FUNCTION public.guard_dynamic_submission();
DROP TRIGGER IF EXISTS trg_snapshot_dynamic_submission_indicators ON public.project_submissions;
CREATE TRIGGER trg_snapshot_dynamic_submission_indicators BEFORE UPDATE ON public.project_submissions
FOR EACH ROW EXECUTE FUNCTION public.snapshot_dynamic_submission_indicators();

CREATE OR REPLACE FUNCTION public.append_dynamic_submission_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.project_submission_events(submission_id, from_status, to_status, actor_id, comments)
    VALUES (NEW.id, NULL, NEW.status, auth.uid(), NEW.review_comments);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.project_submission_events(submission_id, from_status, to_status, actor_id, comments)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid(), NEW.review_comments);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_append_dynamic_submission_event ON public.project_submissions;
CREATE TRIGGER trg_append_dynamic_submission_event AFTER INSERT OR UPDATE ON public.project_submissions
FOR EACH ROW EXECUTE FUNCTION public.append_dynamic_submission_event();

CREATE OR REPLACE FUNCTION public.guard_published_form_version()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD.status <> 'draft' THEN
    RAISE EXCEPTION 'Published form versions are immutable';
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status <> 'draft' AND NOT (
    OLD.status = 'published' AND NEW.status = 'retired'
    AND NEW.form_schema = OLD.form_schema AND NEW.form_id = OLD.form_id
    AND NEW.version_number = OLD.version_number AND NEW.schema_hash IS NOT DISTINCT FROM OLD.schema_hash
    AND NEW.change_summary IS NOT DISTINCT FROM OLD.change_summary AND NEW.created_by IS NOT DISTINCT FROM OLD.created_by
    AND NEW.created_at = OLD.created_at AND NEW.published_by IS NOT DISTINCT FROM OLD.published_by
    AND NEW.published_at IS NOT DISTINCT FROM OLD.published_at
  ) THEN
    RAISE EXCEPTION 'Published form versions are immutable';
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'draft' AND NEW.status = 'published' THEN
    PERFORM public.validate_dynamic_form_schema(NEW.form_schema);
    NEW.published_at := COALESCE(NEW.published_at, now());
    NEW.published_by := COALESCE(NEW.published_by, auth.uid());
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_published_template_version()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD.status <> 'draft' THEN RAISE EXCEPTION 'Published template versions are immutable'; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status <> 'draft' AND NOT (
    OLD.status = 'published' AND NEW.status = 'retired' AND NEW.config = OLD.config
    AND NEW.template_id = OLD.template_id AND NEW.version_number = OLD.version_number
    AND NEW.change_summary IS NOT DISTINCT FROM OLD.change_summary AND NEW.created_by IS NOT DISTINCT FROM OLD.created_by
    AND NEW.created_at = OLD.created_at AND NEW.published_by IS NOT DISTINCT FROM OLD.published_by
    AND NEW.published_at IS NOT DISTINCT FROM OLD.published_at
  ) THEN RAISE EXCEPTION 'Published template versions are immutable'; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status = 'draft' AND NEW.status = 'published' THEN
    IF NOT (public.is_admin() OR public.has_role('executive_director')) THEN
      RAISE EXCEPTION 'Only an Executive Director or System Administrator can publish an organization template';
    END IF;
    PERFORM public.validate_dynamic_template_config(NEW.config);
    NEW.published_at := COALESCE(NEW.published_at, now());
    NEW.published_by := COALESCE(NEW.published_by, auth.uid());
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_project_template_approval()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status <> 'draft' AND NOT (public.is_admin() OR public.has_role('executive_director')) THEN
    RAISE EXCEPTION 'Organization templates must be created as drafts';
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.status <> NEW.status AND NEW.status = 'active'
    AND NOT (public.is_admin() OR public.has_role('executive_director')) THEN
    RAISE EXCEPTION 'Only an Executive Director or System Administrator can activate a template';
  END IF;
  IF TG_OP = 'UPDATE' AND (NEW.approved_by IS DISTINCT FROM OLD.approved_by OR NEW.approved_at IS DISTINCT FROM OLD.approved_at)
    AND NOT (public.is_admin() OR public.has_role('executive_director')) THEN
    RAISE EXCEPTION 'Only an Executive Director or System Administrator can change template approval metadata';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.prevent_project_config_version_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Published project configuration versions are immutable'; END;
$$;

DROP TRIGGER IF EXISTS trg_guard_published_template_version ON public.project_template_versions;
CREATE TRIGGER trg_guard_published_template_version BEFORE UPDATE OR DELETE ON public.project_template_versions
FOR EACH ROW EXECUTE FUNCTION public.guard_published_template_version();
DROP TRIGGER IF EXISTS trg_guard_project_template_approval ON public.project_templates;
CREATE TRIGGER trg_guard_project_template_approval BEFORE INSERT OR UPDATE ON public.project_templates
FOR EACH ROW EXECUTE FUNCTION public.guard_project_template_approval();
DROP TRIGGER IF EXISTS trg_prevent_project_config_version_update ON public.project_config_versions;
CREATE TRIGGER trg_prevent_project_config_version_update BEFORE UPDATE OR DELETE ON public.project_config_versions
FOR EACH ROW EXECUTE FUNCTION public.prevent_project_config_version_change();

DROP TRIGGER IF EXISTS trg_guard_published_form_version ON public.project_form_versions;
CREATE TRIGGER trg_guard_published_form_version BEFORE UPDATE OR DELETE ON public.project_form_versions
FOR EACH ROW EXECUTE FUNCTION public.guard_published_form_version();

CREATE OR REPLACE FUNCTION public.publish_project_form_version(p_form_id UUID, p_version_id UUID)
RETURNS VOID LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  project_key UUID;
BEGIN
  SELECT project_id INTO project_key FROM public.project_forms WHERE id = p_form_id;
  IF project_key IS NULL THEN RAISE EXCEPTION 'Form not found'; END IF;
  IF NOT (public.dynamic_project_manager(project_key) OR (public.has_permission('me.manage') AND public.dynamic_project_member(project_key))) THEN
    RAISE EXCEPTION 'Not authorized to publish this form';
  END IF;
  UPDATE public.project_form_versions SET status = 'published', published_by = auth.uid(), published_at = now()
    WHERE id = p_version_id AND form_id = p_form_id AND status = 'draft';
  IF NOT FOUND THEN RAISE EXCEPTION 'Draft form version not found'; END IF;
  UPDATE public.project_forms SET status = 'published', current_version_id = p_version_id WHERE id = p_form_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.publish_project_form_version(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.approve_project_template(p_template_id UUID, p_version_id UUID)
RETURNS VOID LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NOT (public.is_admin() OR public.has_role('executive_director')) THEN
    RAISE EXCEPTION 'Only an Executive Director or System Administrator can approve organization templates';
  END IF;
  PERFORM public.validate_dynamic_template_config((SELECT config FROM public.project_template_versions WHERE id = p_version_id AND template_id = p_template_id AND status = 'draft'));
  UPDATE public.project_template_versions SET status = 'published', published_by = auth.uid(), published_at = now()
    WHERE id = p_version_id AND template_id = p_template_id AND status = 'draft';
  IF NOT FOUND THEN RAISE EXCEPTION 'Draft template version not found'; END IF;
  UPDATE public.project_templates SET status = 'active', approved_by = auth.uid(), approved_at = now()
    WHERE id = p_template_id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.approve_project_template(UUID, UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.apply_project_template(p_project_id UUID, p_template_version_id UUID)
RETURNS VOID LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  template_config JSONB;
  indicator JSONB;
  form_def JSONB;
  new_form_id UUID;
  new_version_id UUID;
  next_version INTEGER;
BEGIN
  IF NOT public.dynamic_project_manager(p_project_id) THEN RAISE EXCEPTION 'Not authorized to configure this project'; END IF;
  SELECT v.config INTO template_config FROM public.project_template_versions v
  JOIN public.project_templates t ON t.id = v.template_id
  WHERE v.id = p_template_version_id AND v.status = 'published' AND t.status = 'active';
  IF template_config IS NULL THEN RAISE EXCEPTION 'Approved template version not found'; END IF;
  IF EXISTS (SELECT 1 FROM public.project_indicators WHERE project_id = p_project_id)
    OR EXISTS (SELECT 1 FROM public.project_forms WHERE project_id = p_project_id) THEN
    RAISE EXCEPTION 'Template can only be applied to a project without existing dynamic configuration';
  END IF;
  PERFORM public.validate_dynamic_template_config(template_config);
  FOR indicator IN SELECT value FROM jsonb_array_elements(template_config->'indicators') LOOP
    INSERT INTO public.project_indicators(project_id, code, name, description, unit, baseline, target,
      calculation_type, source_field_key, aggregation, created_by)
    VALUES (p_project_id, indicator->>'code', indicator->>'name', indicator->>'description',
      COALESCE(indicator->>'unit', 'count'), NULLIF(indicator->>'baseline', '')::NUMERIC,
      NULLIF(indicator->>'target', '')::NUMERIC, indicator->>'calculationType',
      indicator->>'sourceFieldKey', indicator->>'aggregation', auth.uid());
  END LOOP;
  FOR form_def IN SELECT value FROM jsonb_array_elements(template_config->'forms') LOOP
    PERFORM public.validate_dynamic_form_schema(form_def->'schema');
    INSERT INTO public.project_forms(project_id, name, status, created_by)
      VALUES (p_project_id, form_def->>'name', 'published', auth.uid()) RETURNING id INTO new_form_id;
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version FROM public.project_form_versions WHERE form_id = new_form_id;
    INSERT INTO public.project_form_versions(form_id, version_number, form_schema, status, published_by, published_at, created_by)
      VALUES (new_form_id, next_version, form_def->'schema', 'draft', auth.uid(), now(), auth.uid()) RETURNING id INTO new_version_id;
    UPDATE public.project_form_versions SET status = 'published' WHERE id = new_version_id;
    UPDATE public.project_forms SET current_version_id = new_version_id WHERE id = new_form_id;
  END LOOP;
  SELECT COALESCE(MAX(version_number), 0) + 1 INTO next_version FROM public.project_config_versions WHERE project_id = p_project_id;
  INSERT INTO public.project_config_versions(project_id, version_number, template_version_id, config, created_by, change_summary)
    VALUES (p_project_id, next_version, p_template_version_id, template_config, auth.uid(), 'Initialized from approved organization template');
END;
$$;
GRANT EXECUTE ON FUNCTION public.apply_project_template(UUID, UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.dynamic_project_member(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.dynamic_project_manager(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.dynamic_project_verifier(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dynamic_project_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dynamic_project_manager(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.dynamic_project_verifier(UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.publish_project_form_version(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.approve_project_template(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.apply_project_template(UUID, UUID) FROM PUBLIC, anon;

ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_template_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_config_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_indicator_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_form_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_collection_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_submission_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "dynamic_templates_read" ON public.project_templates FOR SELECT TO authenticated
USING (status = 'active' OR public.is_admin() OR public.has_role('executive_director') OR public.has_permission('me.manage'));
CREATE POLICY "dynamic_templates_insert" ON public.project_templates FOR INSERT TO authenticated
WITH CHECK ((public.is_admin() OR public.has_role('executive_director') OR public.has_permission('me.manage')) AND status = 'draft');
CREATE POLICY "dynamic_templates_update" ON public.project_templates FOR UPDATE TO authenticated
USING (public.is_admin() OR public.has_role('executive_director') OR public.has_permission('me.manage'))
WITH CHECK ((public.is_admin() OR public.has_role('executive_director') OR public.has_permission('me.manage'))
  AND (status <> 'active' OR public.is_admin() OR public.has_role('executive_director')));
CREATE POLICY "dynamic_templates_delete_draft" ON public.project_templates FOR DELETE TO authenticated
USING (status = 'draft' AND (public.is_admin() OR public.has_role('executive_director') OR public.has_permission('me.manage')));
CREATE POLICY "dynamic_template_versions_read" ON public.project_template_versions FOR SELECT TO authenticated
USING (status = 'published' OR public.is_admin() OR public.has_role('executive_director') OR public.has_permission('me.manage'));
CREATE POLICY "dynamic_template_versions_insert_draft" ON public.project_template_versions FOR INSERT TO authenticated
WITH CHECK (status = 'draft' AND (public.is_admin() OR public.has_role('executive_director') OR public.has_permission('me.manage')));
CREATE POLICY "dynamic_template_versions_update" ON public.project_template_versions FOR UPDATE TO authenticated
USING (public.is_admin() OR public.has_role('executive_director') OR public.has_permission('me.manage'))
WITH CHECK ((public.is_admin() OR public.has_role('executive_director') OR public.has_permission('me.manage'))
  AND (status = 'draft' OR public.is_admin() OR public.has_role('executive_director')));
CREATE POLICY "dynamic_template_versions_delete_draft" ON public.project_template_versions FOR DELETE TO authenticated
USING (status = 'draft' AND (public.is_admin() OR public.has_role('executive_director') OR public.has_permission('me.manage')));

CREATE POLICY "dynamic_config_versions_read" ON public.project_config_versions FOR SELECT TO authenticated
USING (public.dynamic_project_member(project_id));
CREATE POLICY "dynamic_config_versions_insert" ON public.project_config_versions FOR INSERT TO authenticated
WITH CHECK (public.dynamic_project_manager(project_id));
CREATE POLICY "dynamic_indicators_read" ON public.project_indicators FOR SELECT TO authenticated
USING (public.dynamic_project_member(project_id));
CREATE POLICY "dynamic_indicators_manage" ON public.project_indicators FOR ALL TO authenticated
USING (public.dynamic_project_manager(project_id) OR (public.has_permission('me.manage') AND public.dynamic_project_member(project_id)))
WITH CHECK (public.dynamic_project_manager(project_id) OR (public.has_permission('me.manage') AND public.dynamic_project_member(project_id)));
CREATE POLICY "dynamic_indicator_versions_read" ON public.project_indicator_versions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.project_indicators i WHERE i.id = indicator_id AND public.dynamic_project_member(i.project_id)));
CREATE POLICY "dynamic_forms_read" ON public.project_forms FOR SELECT TO authenticated
USING (public.dynamic_project_member(project_id));
CREATE POLICY "dynamic_forms_manage" ON public.project_forms FOR ALL TO authenticated
USING (public.dynamic_project_manager(project_id) OR (public.has_permission('me.manage') AND public.dynamic_project_member(project_id)))
WITH CHECK (public.dynamic_project_manager(project_id) OR (public.has_permission('me.manage') AND public.dynamic_project_member(project_id)));
CREATE POLICY "dynamic_form_versions_read" ON public.project_form_versions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.project_forms f WHERE f.id = form_id AND public.dynamic_project_member(f.project_id)));
CREATE POLICY "dynamic_form_versions_manage" ON public.project_form_versions FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.project_forms f WHERE f.id = form_id AND (public.dynamic_project_manager(f.project_id) OR (public.has_permission('me.manage') AND public.dynamic_project_member(f.project_id)))))
WITH CHECK (EXISTS (SELECT 1 FROM public.project_forms f WHERE f.id = form_id AND (public.dynamic_project_manager(f.project_id) OR (public.has_permission('me.manage') AND public.dynamic_project_member(f.project_id)))));
CREATE POLICY "dynamic_assignments_read" ON public.project_collection_assignments FOR SELECT TO authenticated
USING (public.dynamic_project_member(project_id) OR assignee_id = auth.uid());
CREATE POLICY "dynamic_assignments_manage" ON public.project_collection_assignments FOR ALL TO authenticated
USING (public.dynamic_project_manager(project_id) OR (public.has_permission('me.manage') AND public.dynamic_project_member(project_id)))
WITH CHECK (public.dynamic_project_manager(project_id) OR (public.has_permission('me.manage') AND public.dynamic_project_member(project_id)));
CREATE POLICY "dynamic_submissions_read" ON public.project_submissions FOR SELECT TO authenticated
USING (public.dynamic_project_member(project_id) OR submitted_by = auth.uid());
CREATE POLICY "dynamic_submissions_insert" ON public.project_submissions FOR INSERT TO authenticated
WITH CHECK (
  submitted_by = auth.uid()
  AND status IN ('draft', 'pending')
  AND public.dynamic_project_member(project_id)
  AND EXISTS (SELECT 1 FROM public.project_forms f JOIN public.project_form_versions v ON v.form_id = f.id
    WHERE f.id = public.project_submissions.form_id AND f.project_id = public.project_submissions.project_id
      AND v.id = public.project_submissions.form_version_id AND (
        (v.status = 'published' AND f.current_version_id = v.id)
        OR (v.status IN ('published', 'retired') AND public.project_submissions.assignment_id IS NOT NULL
          AND EXISTS (SELECT 1 FROM public.project_collection_assignments a WHERE a.id = public.project_submissions.assignment_id
            AND a.form_version_id = v.id AND a.project_id = f.project_id AND a.assignee_id = auth.uid() AND a.status = 'open'))
      ))
  AND (assignment_id IS NULL OR EXISTS (
    SELECT 1 FROM public.project_collection_assignments a
    WHERE a.id = public.project_submissions.assignment_id AND a.project_id = public.project_submissions.project_id
      AND a.assignee_id = auth.uid() AND a.form_version_id = public.project_submissions.form_version_id AND a.status = 'open'
  ))
);
CREATE POLICY "dynamic_submissions_update" ON public.project_submissions FOR UPDATE TO authenticated
USING (
  (submitted_by = auth.uid() AND status IN ('draft', 'returned'))
  OR public.dynamic_project_verifier(project_id)
)
WITH CHECK (
  (submitted_by = auth.uid() AND status IN ('draft', 'pending', 'returned'))
  OR public.dynamic_project_verifier(project_id)
);
CREATE POLICY "dynamic_submissions_no_delete" ON public.project_submissions FOR DELETE TO authenticated USING (false);
CREATE POLICY "dynamic_submission_events_read" ON public.project_submission_events FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.project_submissions s WHERE s.id = submission_id AND public.dynamic_project_member(s.project_id)));
CREATE POLICY "dynamic_submission_events_no_client_write" ON public.project_submission_events FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "dynamic_submission_events_no_update" ON public.project_submission_events FOR UPDATE TO authenticated USING (false);
CREATE POLICY "dynamic_submission_events_no_delete" ON public.project_submission_events FOR DELETE TO authenticated USING (false);
ALTER TABLE public.project_submission_revisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dynamic_submission_revisions_read" ON public.project_submission_revisions FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.project_submissions s WHERE s.id = submission_id AND public.dynamic_project_member(s.project_id)));
CREATE POLICY "dynamic_submission_revisions_no_client_write" ON public.project_submission_revisions FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY "dynamic_submission_revisions_no_update" ON public.project_submission_revisions FOR UPDATE TO authenticated USING (false);
CREATE POLICY "dynamic_submission_revisions_no_delete" ON public.project_submission_revisions FOR DELETE TO authenticated USING (false);

CREATE TRIGGER trg_project_templates_updated_at BEFORE UPDATE ON public.project_templates
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_project_indicators_updated_at BEFORE UPDATE ON public.project_indicators
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_project_forms_updated_at BEFORE UPDATE ON public.project_forms
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_project_submissions_updated_at BEFORE UPDATE ON public.project_submissions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
