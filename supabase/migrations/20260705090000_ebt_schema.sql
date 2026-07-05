-- EBT domain migrated into the fleet project under the `ebt` schema.
-- Audit feature removed. Pilots unified onto public.pilots (+ ebt.pilot_ext).
-- Generated from `pg_dump --schema public` of project omicxkfwdsadyycetmsk.

set check_function_bodies = false;

create schema if not exists "ebt";
grant usage on schema "ebt" to "anon", "authenticated", "service_role";




CREATE TYPE "ebt"."app_role" AS ENUM (
    'examiner',
    'fleet_manager',
    'admin'
);


ALTER TYPE "ebt"."app_role" OWNER TO "postgres";


CREATE TYPE "ebt"."eval_result" AS ENUM (
    'pass',
    'fail',
    'incomplete'
);


ALTER TYPE "ebt"."eval_result" OWNER TO "postgres";


CREATE TYPE "ebt"."remedial_status" AS ENUM (
    'required',
    'scheduled',
    'in_progress',
    'completed',
    'waived'
);


ALTER TYPE "ebt"."remedial_status" OWNER TO "postgres";


CREATE TYPE "ebt"."report_phase" AS ENUM (
    'EVAL',
    'MV',
    'SBT',
    'ISI'
);


ALTER TYPE "ebt"."report_phase" OWNER TO "postgres";


CREATE TYPE "ebt"."report_status" AS ENUM (
    'draft',
    'submitted',
    'signed_off',
    'finalized'
);


ALTER TYPE "ebt"."report_status" OWNER TO "postgres";


CREATE TYPE "ebt"."signature_kind" AS ENUM (
    'examiner',
    'trainee',
    'fleet_manager',
    'emfts'
);


ALTER TYPE "ebt"."signature_kind" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "ebt"."app_role"() RETURNS "text"
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $$
  select nullif(auth.jwt() ->> 'user_role','null');
$$;


ALTER FUNCTION "ebt"."app_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "ebt"."can_access_report"("p_report" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
  select exists (
    select 1 from ebt.training_reports r
     where r.id = p_report
       and (r.examiner_id = (select auth.uid()) or ebt.is_fleet_manager()));
$$;


ALTER FUNCTION "ebt"."can_access_report"("p_report" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "ebt"."enforce_lifecycle"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if old.status = 'finalized' then
    raise exception 'Report is finalized and immutable' using errcode = 'P0001';
  end if;

  if new.status is distinct from old.status then
    if not exists (select 1 from ebt.state_transitions
                    where from_status = old.status and to_status = new.status) then
      raise exception 'Illegal status transition % -> %', old.status, new.status
        using errcode = 'P0001';
    end if;
    if new.status in ('submitted', 'signed_off', 'finalized')
       and (new.training_date is null or new.module_no is null) then
      raise exception 'Cannot move report to % without a training date and module number', new.status
        using errcode = 'P0001';
    end if;
  else
    if old.status = 'signed_off' then
      raise exception 'Signed-off report is locked except for status transitions'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;


ALTER FUNCTION "ebt"."enforce_lifecycle"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "ebt"."enforce_min_one_admin"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if not exists (select 1 from ebt.user_roles where role = 'admin') then
    raise exception 'Cannot remove the last admin: at least one user must hold the admin role';
  end if;
  return null; -- AFTER trigger: return value is ignored
end;
$$;


ALTER FUNCTION "ebt"."enforce_min_one_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "ebt"."enforce_release_block"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  if coalesce(new.declaration_released,false) = true then
    if exists (select 1 from ebt.remedial_requirements
                where pilot_id = new.pilot_id
                  and status in ('required','scheduled','in_progress')) then
      raise exception 'Cannot release for line operations while a remedial requirement is open'
        using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "ebt"."enforce_release_block"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "ebt"."evaluate_eval_result"("p_report" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_pilot  uuid;
  v_status ebt.report_status;
  v_fail   boolean := false;
  r record;
begin
  select pilot_id, status into v_pilot, v_status
    from ebt.training_reports where id = p_report;
  if v_pilot is null then return; end if;

  -- 1) Consecutive ≤2 (this EVAL grade ≤2 AND carryover previous_grade ≤2) => fail + remedial.
  --    Re-open a remedial this same report previously auto-closed if the grade toggles back to ≤2.
  for r in
    select g.competency_code, g.grade as current_grade, c.previous_grade
      from ebt.report_competency_grades g
      join ebt.report_carryover_focus c
        on c.report_id = g.report_id and c.competency_code = g.competency_code
     where g.report_id = p_report and g.phase = 'EVAL'
       and g.grade is not null and g.grade <= 2
       and c.previous_grade <= 2
  loop
    v_fail := true;
    insert into ebt.remedial_requirements
      (pilot_id, competency_code, triggered_by_report_id, previous_grade, current_grade, reason, status)
    values
      (v_pilot, r.competency_code, p_report, r.previous_grade, r.current_grade,
       'Two consecutive grades of 1 or 2 in the same competency', 'required')
    on conflict (pilot_id, competency_code, triggered_by_report_id) do update
       set status = 'required',
           current_grade = excluded.current_grade,
           resolved_by_report_id = null,
           resolved_at = null
     where ebt.remedial_requirements.status = 'completed'
       and ebt.remedial_requirements.resolved_by_report_id = p_report;
  end loop;

  -- 1b) Self-heal: close any remedial THIS report raised whose competency is no longer a current
  --     consecutive ≤2 (i.e. it was corrected to ≥3 within this report).
  update ebt.remedial_requirements rr
     set status = 'completed', resolved_by_report_id = p_report, resolved_at = now()
   where rr.triggered_by_report_id = p_report
     and rr.status in ('required','scheduled','in_progress')
     and not exists (
       select 1 from ebt.report_competency_grades g
         join ebt.report_carryover_focus c
           on c.report_id = g.report_id and c.competency_code = g.competency_code
        where g.report_id = p_report and g.phase = 'EVAL'
          and g.competency_code = rr.competency_code
          and g.grade is not null and g.grade <= 2
          and c.previous_grade <= 2);

  -- 2) A ≥3 clears OTHER reports' open remedials for that competency — ONLY when THIS report is a
  --    completed check (signed_off|finalized), per spec §8(c). A draft ≥3 must not clear prematurely.
  if v_status in ('signed_off','finalized') then
    update ebt.remedial_requirements rr
       set status = 'completed', resolved_by_report_id = p_report, resolved_at = now()
     where rr.pilot_id = v_pilot
       and rr.status in ('required','scheduled','in_progress')
       and rr.triggered_by_report_id <> p_report
       and exists (
         select 1 from ebt.report_competency_grades g
          where g.report_id = p_report and g.phase = 'EVAL'
            and g.competency_code = rr.competency_code
            and g.grade is not null and g.grade >= 3);
  end if;

  -- 3) Reflect the result: force 'fail' while the rule holds; clear a stale auto-'fail' to null when
  --    it no longer holds (examiner re-confirms). Leave an explicit 'pass'/'incomplete' alone.
  update ebt.report_phases
     set result = case
                    when v_fail then 'fail'::ebt.eval_result
                    when result = 'fail' then null
                    else result
                  end
   where report_id = p_report and phase = 'EVAL';
end;
$$;


ALTER FUNCTION "ebt"."evaluate_eval_result"("p_report" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "ebt"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $$
  select ebt.app_role() = 'admin';
$$;


ALTER FUNCTION "ebt"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "ebt"."is_fleet_manager"() RETURNS boolean
    LANGUAGE "sql" STABLE
    SET "search_path" TO ''
    AS $$
  select ebt.app_role() in ('fleet_manager','admin');
$$;


ALTER FUNCTION "ebt"."is_fleet_manager"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "ebt"."populate_report_snapshot"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_full_name text; v_staff_no text; v_rank text; v_aircraft text;
  v_lic_type text; v_lic_no text;
  v_med_class text; v_med_expiry date;
  v_ir date; v_prof date;
begin
  select p.full_name, p.staff_no, p.rank, at.name
    into v_full_name, v_staff_no, v_rank, v_aircraft
    from ebt.pilots p
    left join ebt.aircraft_types at on at.id = p.aircraft_type_id
   where p.id = new.pilot_id;
  if not found then
    return new;  -- unknown pilot: leave snapshot empty; the FK on pilot_id rejects the row anyway
  end if;

  new.snap_name          := coalesce(new.snap_name, v_full_name);
  new.snap_staff_no      := coalesce(new.snap_staff_no, v_staff_no);
  new.snap_rank          := coalesce(new.snap_rank, v_rank);
  new.snap_aircraft_type := coalesce(new.snap_aircraft_type, v_aircraft);

  select l.licence_type, l.licence_no into v_lic_type, v_lic_no
    from ebt.licences l
   where l.pilot_id = new.pilot_id
   order by l.issue_date desc nulls last
   limit 1;
  if new.snap_licence is null and v_lic_type is not null then
    new.snap_licence := v_lic_type || ' · ' || coalesce(v_lic_no, '');
  end if;

  select m.medical_class, m.expiry into v_med_class, v_med_expiry
    from ebt.medicals m
   where m.pilot_id = new.pilot_id
   order by m.issue_date desc nulls last
   limit 1;
  new.snap_medical_class  := coalesce(new.snap_medical_class, v_med_class);
  new.snap_medical_expiry := coalesce(new.snap_medical_expiry, v_med_expiry);

  select max(pq.valid_to) into v_ir
    from ebt.pilot_qualifications pq
    join ebt.qualifications q on q.id = pq.qualification_id
   where pq.pilot_id = new.pilot_id and q.code = 'INSTRUMENT_RATING';
  select max(pq.valid_to) into v_prof
    from ebt.pilot_qualifications pq
    join ebt.qualifications q on q.id = pq.qualification_id
   where pq.pilot_id = new.pilot_id and q.code = 'PROFICIENCY';
  new.snap_next_ir_expiry          := coalesce(new.snap_next_ir_expiry, v_ir);
  new.snap_next_proficiency_expiry := coalesce(new.snap_next_proficiency_expiry, v_prof);

  return new;
end;
$$;


ALTER FUNCTION "ebt"."populate_report_snapshot"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "ebt"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.version := coalesce(old.version, 0) + 1;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "ebt"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "ebt"."snapshot_carryover"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
declare
  v_src    uuid;
  v_module int;
begin
  -- most recent completed report for this pilot, excluding the new one
  select r.id, r.module_no into v_src, v_module
    from ebt.training_reports r
   where r.pilot_id = new.pilot_id
     and r.id <> new.id
     and r.status in ('signed_off','finalized')
     and r.deleted_at is null
   order by r.training_date desc nulls last, r.created_at desc
   limit 1;

  if v_src is null then
    return new;
  end if;

  insert into ebt.report_carryover_focus
    (report_id, competency_code, previous_grade, previous_module_no, source_report_id)
  select new.id, g.competency_code, g.grade, v_module, v_src
    from ebt.report_competency_grades g
   where g.report_id = v_src and g.phase = 'EVAL'
     and g.grade is not null and g.grade <= 2
  on conflict (report_id, competency_code) do nothing;

  return new;
end;
$$;


ALTER FUNCTION "ebt"."snapshot_carryover"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "ebt"."touch_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
begin
  new.updated_at := now();
  return new;
end;
$$;


ALTER FUNCTION "ebt"."touch_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "ebt"."trg_grade_changed"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if coalesce(new.phase, old.phase) = 'EVAL' then
    perform ebt.evaluate_eval_result(coalesce(new.report_id, old.report_id));
  end if;
  return coalesce(new, old);
end;
$$;


ALTER FUNCTION "ebt"."trg_grade_changed"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "ebt"."trg_report_completed"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
begin
  if new.status is distinct from old.status and new.status in ('signed_off','finalized') then
    perform ebt.evaluate_eval_result(new.id);
  end if;
  return new;
end;
$$;


ALTER FUNCTION "ebt"."trg_report_completed"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "ebt"."aircraft_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "ebt"."aircraft_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "ebt"."check_types" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "active" boolean DEFAULT true NOT NULL
);


ALTER TABLE "ebt"."check_types" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "ebt"."competencies" (
    "code" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "display_name" "text" NOT NULL,
    "sort_order" integer NOT NULL,
    "effective_from" "date" DEFAULT '2024-01-01'::"date" NOT NULL,
    "effective_to" "date"
);


ALTER TABLE "ebt"."competencies" OWNER TO "postgres";


COMMENT ON TABLE "ebt"."competencies" IS 'The 9 ICAO/IATA EBT pilot competencies. KNO is canonical; APK is an alias, never a 10th competency.';



CREATE TABLE IF NOT EXISTS "ebt"."grade_descriptors" (
    "grade" smallint NOT NULL,
    "label" "text" NOT NULL,
    "is_pass_threshold" boolean DEFAULT false NOT NULL,
    CONSTRAINT "grade_descriptors_grade_check" CHECK ((("grade" >= 1) AND ("grade" <= 5)))
);


ALTER TABLE "ebt"."grade_descriptors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "ebt"."licences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pilot_id" "uuid" NOT NULL,
    "licence_type" "text",
    "licence_no" "text",
    "issuing_authority" "text",
    "issue_date" "date",
    "expiry" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "ebt"."licences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "ebt"."medicals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pilot_id" "uuid" NOT NULL,
    "medical_class" "text",
    "issue_date" "date",
    "expiry" "date",
    "limitations" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "ebt"."medicals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "ebt"."observable_behaviours" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "competency_code" "text" NOT NULL,
    "code" "text" NOT NULL,
    "description" "text" NOT NULL,
    "sort_order" integer,
    "effective_from" "date" DEFAULT '2024-01-01'::"date" NOT NULL,
    "effective_to" "date"
);


ALTER TABLE "ebt"."observable_behaviours" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "ebt"."pilot_qualifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pilot_id" "uuid" NOT NULL,
    "qualification_id" "uuid" NOT NULL,
    "valid_from" "date",
    "valid_to" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "ebt"."pilot_qualifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "ebt"."profiles" (
    "id" "uuid" NOT NULL,
    "full_name" "text",
    "ioa_number" "text",
    "active" boolean DEFAULT true NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "ebt"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "ebt"."qualifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "sort_order" integer
);


ALTER TABLE "ebt"."qualifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "ebt"."record_retention" (
    "record_type" "text" NOT NULL,
    "retention_months" integer,
    "retention_note" "text",
    "legal_basis" "text"
);


ALTER TABLE "ebt"."record_retention" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "ebt"."remedial_requirements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pilot_id" "uuid" NOT NULL,
    "competency_code" "text" NOT NULL,
    "triggered_by_report_id" "uuid" NOT NULL,
    "previous_grade" smallint,
    "current_grade" smallint,
    "reason" "text" NOT NULL,
    "status" "ebt"."remedial_status" DEFAULT 'required'::"ebt"."remedial_status" NOT NULL,
    "resolved_by_report_id" "uuid",
    "resolved_at" timestamp with time zone,
    "notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "ebt"."remedial_requirements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "ebt"."report_carryover_focus" (
    "report_id" "uuid" NOT NULL,
    "competency_code" "text" NOT NULL,
    "previous_grade" smallint NOT NULL,
    "previous_module_no" integer,
    "source_report_id" "uuid",
    "acknowledged_at" timestamp with time zone,
    "acknowledged_by" "uuid",
    CONSTRAINT "report_carryover_focus_previous_grade_check" CHECK ((("previous_grade" >= 1) AND ("previous_grade" <= 5)))
);


ALTER TABLE "ebt"."report_carryover_focus" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "ebt"."report_competency_grades" (
    "report_id" "uuid" NOT NULL,
    "phase" "ebt"."report_phase" NOT NULL,
    "competency_code" "text" NOT NULL,
    "grade" smallint,
    CONSTRAINT "report_competency_grades_grade_check" CHECK ((("grade" >= 1) AND ("grade" <= 5)))
);


ALTER TABLE "ebt"."report_competency_grades" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "ebt"."report_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "report_id" "uuid" NOT NULL,
    "kind" "text" DEFAULT 'finalized_pdf'::"text" NOT NULL,
    "storage_path" "text",
    "sha256" "text",
    "template_version" "text",
    "generated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "ebt"."report_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "ebt"."report_observed_behaviours" (
    "report_id" "uuid" NOT NULL,
    "phase" "ebt"."report_phase" NOT NULL,
    "competency_code" "text" NOT NULL,
    "observable_behaviour_id" "uuid" NOT NULL
);


ALTER TABLE "ebt"."report_observed_behaviours" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "ebt"."report_phases" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "report_id" "uuid" NOT NULL,
    "phase" "ebt"."report_phase" NOT NULL,
    "progress" "text",
    "result" "ebt"."eval_result",
    "technical_events" "text",
    "non_technical_events" "text",
    "overall_comments" "text"
);


ALTER TABLE "ebt"."report_phases" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "ebt"."report_qualifications" (
    "report_id" "uuid" NOT NULL,
    "qualification_id" "uuid" NOT NULL
);


ALTER TABLE "ebt"."report_qualifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "ebt"."report_signatures" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "report_id" "uuid" NOT NULL,
    "kind" "ebt"."signature_kind" NOT NULL,
    "storage_path" "text",
    "signed_by" "uuid",
    "signed_at" timestamp with time zone,
    "content_hash" "text"
);


ALTER TABLE "ebt"."report_signatures" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "ebt"."report_specialised_training" (
    "report_id" "uuid" NOT NULL,
    "specialised_training_id" "uuid" NOT NULL
);


ALTER TABLE "ebt"."report_specialised_training" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "ebt"."specialised_training" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "name" "text" NOT NULL,
    "active" boolean DEFAULT true NOT NULL,
    "sort_order" integer
);


ALTER TABLE "ebt"."specialised_training" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "ebt"."state_transitions" (
    "from_status" "ebt"."report_status" NOT NULL,
    "to_status" "ebt"."report_status" NOT NULL
);


ALTER TABLE "ebt"."state_transitions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "ebt"."training_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "pilot_id" "uuid" NOT NULL,
    "check_type_id" "uuid",
    "training_date" "date",
    "is_resit" boolean DEFAULT false NOT NULL,
    "module_no" integer,
    "status" "ebt"."report_status" DEFAULT 'draft'::"ebt"."report_status" NOT NULL,
    "examiner_id" "uuid" NOT NULL,
    "day2_deferred" boolean DEFAULT false NOT NULL,
    "declaration_released" boolean,
    "additional_comments" "text",
    "ioa_number" "text",
    "sim_hours" "text",
    "if_hours" "text",
    "sim_location" "text",
    "sim_level" "text",
    "sign_off_date" "date",
    "signed_off_by" "uuid",
    "finalized_at" timestamp with time zone,
    "form_version" "text" DEFAULT 'ANGTER RF-293 v1.1'::"text" NOT NULL,
    "snap_name" "text",
    "snap_staff_no" "text",
    "snap_rank" "text",
    "snap_licence" "text",
    "snap_medical_class" "text",
    "snap_medical_expiry" "date",
    "snap_next_ir_expiry" "date",
    "snap_next_proficiency_expiry" "date",
    "snap_aircraft_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "version" integer DEFAULT 1 NOT NULL,
    "deleted_at" timestamp with time zone,
    "submitted_at" timestamp with time zone,
    "source_response_id" "text"
);


ALTER TABLE "ebt"."training_reports" OWNER TO "postgres";


COMMENT ON COLUMN "ebt"."training_reports"."submitted_at" IS 'Original ANGTER form submission timestamp (from CSV export Submit Date); null for app-native reports.';



COMMENT ON COLUMN "ebt"."training_reports"."source_response_id" IS 'External Form Response ID from the ANGTER export; unique idempotency key for historical import.';



CREATE TABLE IF NOT EXISTS "ebt"."user_roles" (
    "user_id" "uuid" NOT NULL,
    "role" "ebt"."app_role" NOT NULL
);


ALTER TABLE "ebt"."user_roles" OWNER TO "postgres";

-- EBT-only pilot attributes (the rest live on public.pilots).
create table if not exists "ebt"."pilot_ext" (
  "pilot_id" "uuid" primary key references "public"."pilots"("id") on delete restrict,
  "aircraft_type_id" "uuid",
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);
alter table "ebt"."pilot_ext" enable row level security;
create policy "pilot_ext_read" on "ebt"."pilot_ext" for select to "authenticated" using (true);

-- Compatibility view: presents fleet public.pilots in the historic ebt.pilots shape so
-- every EBT view/function/trigger keeps working unchanged. FKs point at public.pilots.
create or replace view "ebt"."pilots"
  with ("security_invoker"='true') as
select
  p."id",
  p."employee_id"::text as "staff_no",
  btrim(coalesce(p."first_name"::text,'') || ' ' || coalesce(p."last_name"::text,'')) as "full_name",
  p."role"::text as "rank",
  pe."aircraft_type_id",
  case when p."is_active" then 'active' else 'inactive' end as "employment_status",
  p."created_at",
  p."updated_at",
  1 as "version",
  null::timestamp with time zone as "deleted_at"
from "public"."pilots" p
left join "ebt"."pilot_ext" pe on pe."pilot_id" = p."id";

grant select on "ebt"."pilots" to "anon", "authenticated", "service_role";
grant select on "ebt"."pilot_ext" to "anon";
grant select, insert, update, delete on "ebt"."pilot_ext" to "authenticated", "service_role";



CREATE OR REPLACE VIEW "ebt"."v_fleet_competency_health" WITH ("security_invoker"='true') AS
 SELECT "g"."competency_code",
    "round"("avg"("g"."grade"), 2) AS "avg_grade",
    "round"(((100.0 * ("count"(*) FILTER (WHERE ("g"."grade" < 3)))::numeric) / (NULLIF("count"(*), 0))::numeric), 1) AS "pct_below_3",
    "count"(*) AS "n_graded"
   FROM ("ebt"."report_competency_grades" "g"
     JOIN "ebt"."training_reports" "r" ON (("r"."id" = "g"."report_id")))
  WHERE (("g"."phase" = 'EVAL'::"ebt"."report_phase") AND ("g"."grade" IS NOT NULL) AND ("r"."status" = ANY (ARRAY['signed_off'::"ebt"."report_status", 'finalized'::"ebt"."report_status"])) AND ("r"."deleted_at" IS NULL))
  GROUP BY "g"."competency_code";


ALTER VIEW "ebt"."v_fleet_competency_health" OWNER TO "postgres";


CREATE OR REPLACE VIEW "ebt"."v_fleet_competency_health_active" WITH ("security_invoker"='true') AS
 SELECT "g"."competency_code",
    "round"("avg"("g"."grade"), 2) AS "avg_grade",
    "round"(((100.0 * ("count"(*) FILTER (WHERE ("g"."grade" < 3)))::numeric) / (NULLIF("count"(*), 0))::numeric), 1) AS "pct_below_3",
    "count"(*) AS "n_graded"
   FROM (("ebt"."report_competency_grades" "g"
     JOIN "ebt"."training_reports" "r" ON (("r"."id" = "g"."report_id")))
     JOIN "ebt"."pilots" "p" ON (("p"."id" = "r"."pilot_id")))
  WHERE (("g"."phase" = 'EVAL'::"ebt"."report_phase") AND ("g"."grade" IS NOT NULL) AND ("r"."status" = ANY (ARRAY['signed_off'::"ebt"."report_status", 'finalized'::"ebt"."report_status"])) AND ("r"."deleted_at" IS NULL) AND ("p"."employment_status" = 'active'::"text") AND ("p"."deleted_at" IS NULL))
  GROUP BY "g"."competency_code";


ALTER VIEW "ebt"."v_fleet_competency_health_active" OWNER TO "postgres";


CREATE OR REPLACE VIEW "ebt"."v_fleet_competency_health_grouped" WITH ("security_invoker"='true') AS
 SELECT "g"."competency_code",
    "p"."aircraft_type_id",
    "p"."rank",
    "round"("avg"("g"."grade"), 2) AS "avg_grade",
    "round"(((100.0 * ("count"(*) FILTER (WHERE ("g"."grade" < 3)))::numeric) / (NULLIF("count"(*), 0))::numeric), 1) AS "pct_below_3",
    "round"(((100.0 * ("count"(*) FILTER (WHERE ("g"."grade" = 1)))::numeric) / (NULLIF("count"(*), 0))::numeric), 1) AS "pct_not_competent",
    "count"(*) AS "n_graded"
   FROM (("ebt"."report_competency_grades" "g"
     JOIN "ebt"."training_reports" "r" ON (("r"."id" = "g"."report_id")))
     JOIN "ebt"."pilots" "p" ON (("p"."id" = "r"."pilot_id")))
  WHERE (("g"."phase" = 'EVAL'::"ebt"."report_phase") AND ("g"."grade" IS NOT NULL) AND ("r"."status" = ANY (ARRAY['signed_off'::"ebt"."report_status", 'finalized'::"ebt"."report_status"])) AND ("r"."deleted_at" IS NULL) AND ("p"."employment_status" = 'active'::"text") AND ("p"."deleted_at" IS NULL))
  GROUP BY "g"."competency_code", "p"."aircraft_type_id", "p"."rank";


ALTER VIEW "ebt"."v_fleet_competency_health_grouped" OWNER TO "postgres";


CREATE OR REPLACE VIEW "ebt"."v_fleet_first_vs_resit_grouped" WITH ("security_invoker"='true') AS
 SELECT "g"."competency_code",
    "p"."aircraft_type_id",
    "p"."rank",
    "count"(*) FILTER (WHERE (NOT "r"."is_resit")) AS "first_n",
    "round"("avg"("g"."grade") FILTER (WHERE (NOT "r"."is_resit")), 2) AS "first_avg_grade",
    "count"(*) FILTER (WHERE ((NOT "r"."is_resit") AND ("g"."grade" < 3))) AS "first_below",
    "count"(*) FILTER (WHERE "r"."is_resit") AS "resit_n",
    "round"("avg"("g"."grade") FILTER (WHERE "r"."is_resit"), 2) AS "resit_avg_grade",
    "count"(*) FILTER (WHERE ("r"."is_resit" AND ("g"."grade" < 3))) AS "resit_below"
   FROM (("ebt"."report_competency_grades" "g"
     JOIN "ebt"."training_reports" "r" ON (("r"."id" = "g"."report_id")))
     JOIN "ebt"."pilots" "p" ON (("p"."id" = "r"."pilot_id")))
  WHERE (("g"."phase" = 'EVAL'::"ebt"."report_phase") AND ("g"."grade" IS NOT NULL) AND ("r"."status" = ANY (ARRAY['signed_off'::"ebt"."report_status", 'finalized'::"ebt"."report_status"])) AND ("r"."deleted_at" IS NULL) AND ("p"."employment_status" = 'active'::"text") AND ("p"."deleted_at" IS NULL))
  GROUP BY "g"."competency_code", "p"."aircraft_type_id", "p"."rank";


ALTER VIEW "ebt"."v_fleet_first_vs_resit_grouped" OWNER TO "postgres";


CREATE OR REPLACE VIEW "ebt"."v_fleet_grade_distribution_grouped" WITH ("security_invoker"='true') AS
 SELECT "g"."competency_code",
    "p"."aircraft_type_id",
    "p"."rank",
    "count"(*) FILTER (WHERE ("g"."grade" = 1)) AS "g1",
    "count"(*) FILTER (WHERE ("g"."grade" = 2)) AS "g2",
    "count"(*) FILTER (WHERE ("g"."grade" = 3)) AS "g3",
    "count"(*) FILTER (WHERE ("g"."grade" = 4)) AS "g4",
    "count"(*) FILTER (WHERE ("g"."grade" = 5)) AS "g5",
    "count"(*) AS "total"
   FROM (("ebt"."report_competency_grades" "g"
     JOIN "ebt"."training_reports" "r" ON (("r"."id" = "g"."report_id")))
     JOIN "ebt"."pilots" "p" ON (("p"."id" = "r"."pilot_id")))
  WHERE (("g"."phase" = 'EVAL'::"ebt"."report_phase") AND ("g"."grade" IS NOT NULL) AND ("r"."status" = ANY (ARRAY['signed_off'::"ebt"."report_status", 'finalized'::"ebt"."report_status"])) AND ("r"."deleted_at" IS NULL) AND ("p"."employment_status" = 'active'::"text") AND ("p"."deleted_at" IS NULL))
  GROUP BY "g"."competency_code", "p"."aircraft_type_id", "p"."rank";


ALTER VIEW "ebt"."v_fleet_grade_distribution_grouped" OWNER TO "postgres";


CREATE OR REPLACE VIEW "ebt"."v_fleet_ob_frequency" WITH ("security_invoker"='true') AS
 WITH "counts" AS (
         SELECT "ob"."competency_code",
            "ob"."observable_behaviour_id",
            "p"."aircraft_type_id",
            "p"."rank",
            "count"(*) AS "n"
           FROM ((("ebt"."report_observed_behaviours" "ob"
             JOIN "ebt"."training_reports" "r" ON (("r"."id" = "ob"."report_id")))
             JOIN "ebt"."pilots" "p" ON (("p"."id" = "r"."pilot_id")))
             JOIN "ebt"."report_competency_grades" "g" ON ((("g"."report_id" = "ob"."report_id") AND ("g"."phase" = "ob"."phase") AND ("g"."competency_code" = "ob"."competency_code"))))
          WHERE (("ob"."phase" = 'EVAL'::"ebt"."report_phase") AND ("r"."status" = ANY (ARRAY['signed_off'::"ebt"."report_status", 'finalized'::"ebt"."report_status"])) AND ("r"."deleted_at" IS NULL) AND ("g"."grade" = ANY (ARRAY[1, 2])) AND ("p"."employment_status" = 'active'::"text") AND ("p"."deleted_at" IS NULL))
          GROUP BY "ob"."competency_code", "ob"."observable_behaviour_id", "p"."aircraft_type_id", "p"."rank"
        )
 SELECT "competency_code",
    "observable_behaviour_id",
    "aircraft_type_id",
    "rank",
    "n",
    "round"((("n")::numeric / NULLIF("sum"("n") OVER (PARTITION BY "competency_code", "aircraft_type_id", "rank"), (0)::numeric)), 4) AS "share"
   FROM "counts" "c";


ALTER VIEW "ebt"."v_fleet_ob_frequency" OWNER TO "postgres";


CREATE OR REPLACE VIEW "ebt"."v_fleet_trend_monthly" WITH ("security_invoker"='true') AS
 SELECT "g"."competency_code",
    "date_trunc"('month'::"text", ("r"."training_date")::timestamp with time zone) AS "month",
    "p"."aircraft_type_id",
    "p"."rank",
    "round"("avg"("g"."grade"), 2) AS "avg_grade",
    "round"(((100.0 * ("count"(*) FILTER (WHERE ("g"."grade" < 3)))::numeric) / (NULLIF("count"(*), 0))::numeric), 1) AS "pct_below_3",
    "count"(*) AS "n_graded"
   FROM (("ebt"."report_competency_grades" "g"
     JOIN "ebt"."training_reports" "r" ON (("r"."id" = "g"."report_id")))
     JOIN "ebt"."pilots" "p" ON (("p"."id" = "r"."pilot_id")))
  WHERE (("g"."phase" = 'EVAL'::"ebt"."report_phase") AND ("g"."grade" IS NOT NULL) AND ("r"."status" = ANY (ARRAY['signed_off'::"ebt"."report_status", 'finalized'::"ebt"."report_status"])) AND ("r"."deleted_at" IS NULL) AND ("r"."training_date" IS NOT NULL) AND ("p"."employment_status" = 'active'::"text") AND ("p"."deleted_at" IS NULL))
  GROUP BY "g"."competency_code", ("date_trunc"('month'::"text", ("r"."training_date")::timestamp with time zone)), "p"."aircraft_type_id", "p"."rank";


ALTER VIEW "ebt"."v_fleet_trend_monthly" OWNER TO "postgres";


CREATE OR REPLACE VIEW "ebt"."v_module_outcomes_grouped" WITH ("security_invoker"='true') AS
 SELECT "r"."module_no",
    "p"."aircraft_type_id",
    "p"."rank",
    "count"(*) FILTER (WHERE ("ph"."result" = 'pass'::"ebt"."eval_result")) AS "pass",
    "count"(*) FILTER (WHERE ("ph"."result" = 'fail'::"ebt"."eval_result")) AS "fail",
    "count"(*) FILTER (WHERE ("ph"."result" = 'incomplete'::"ebt"."eval_result")) AS "incomplete",
    "count"(*) FILTER (WHERE "r"."is_resit") AS "resit",
    "count"(*) AS "total"
   FROM (("ebt"."training_reports" "r"
     JOIN "ebt"."report_phases" "ph" ON ((("ph"."report_id" = "r"."id") AND ("ph"."phase" = 'EVAL'::"ebt"."report_phase"))))
     JOIN "ebt"."pilots" "p" ON (("p"."id" = "r"."pilot_id")))
  WHERE (("r"."status" = ANY (ARRAY['signed_off'::"ebt"."report_status", 'finalized'::"ebt"."report_status"])) AND ("r"."deleted_at" IS NULL) AND ("p"."employment_status" = 'active'::"text") AND ("p"."deleted_at" IS NULL))
  GROUP BY "r"."module_no", "p"."aircraft_type_id", "p"."rank";


ALTER VIEW "ebt"."v_module_outcomes_grouped" OWNER TO "postgres";


CREATE OR REPLACE VIEW "ebt"."v_outcome_rates" WITH ("security_invoker"='true') AS
 SELECT "r"."module_no",
    "count"(*) FILTER (WHERE ("p"."result" = 'pass'::"ebt"."eval_result")) AS "pass_count",
    "count"(*) FILTER (WHERE ("p"."result" = 'fail'::"ebt"."eval_result")) AS "fail_count",
    "count"(*) FILTER (WHERE ("p"."result" = 'incomplete'::"ebt"."eval_result")) AS "incomplete_count",
    "count"(*) FILTER (WHERE "r"."is_resit") AS "resit_count",
    "count"(*) AS "total"
   FROM ("ebt"."training_reports" "r"
     JOIN "ebt"."report_phases" "p" ON ((("p"."report_id" = "r"."id") AND ("p"."phase" = 'EVAL'::"ebt"."report_phase"))))
  WHERE (("r"."status" = ANY (ARRAY['signed_off'::"ebt"."report_status", 'finalized'::"ebt"."report_status"])) AND ("r"."deleted_at" IS NULL))
  GROUP BY "r"."module_no";


ALTER VIEW "ebt"."v_outcome_rates" OWNER TO "postgres";


CREATE OR REPLACE VIEW "ebt"."v_pilot_carryover_deficiencies" WITH ("security_invoker"='true') AS
 WITH "latest" AS (
         SELECT DISTINCT ON ("r"."pilot_id") "r"."pilot_id",
            "r"."id" AS "report_id",
            "r"."module_no"
           FROM "ebt"."training_reports" "r"
          WHERE (("r"."status" = ANY (ARRAY['signed_off'::"ebt"."report_status", 'finalized'::"ebt"."report_status"])) AND ("r"."deleted_at" IS NULL))
          ORDER BY "r"."pilot_id", "r"."training_date" DESC NULLS LAST, "r"."created_at" DESC
        )
 SELECT "l"."pilot_id",
    "g"."competency_code",
    "g"."grade" AS "previous_grade",
    "l"."module_no" AS "source_module_no"
   FROM ("latest" "l"
     JOIN "ebt"."report_competency_grades" "g" ON ((("g"."report_id" = "l"."report_id") AND ("g"."phase" = 'EVAL'::"ebt"."report_phase"))))
  WHERE (("g"."grade" IS NOT NULL) AND ("g"."grade" <= 2));


ALTER VIEW "ebt"."v_pilot_carryover_deficiencies" OWNER TO "postgres";


CREATE OR REPLACE VIEW "ebt"."v_pilot_competency_trend" WITH ("security_invoker"='true') AS
 SELECT "r"."pilot_id",
    "g"."competency_code",
    "r"."id" AS "report_id",
    "g"."grade",
    "r"."module_no",
    "r"."training_date"
   FROM ("ebt"."training_reports" "r"
     JOIN "ebt"."report_competency_grades" "g" ON ((("g"."report_id" = "r"."id") AND ("g"."phase" = 'EVAL'::"ebt"."report_phase"))))
  WHERE (("r"."status" = ANY (ARRAY['signed_off'::"ebt"."report_status", 'finalized'::"ebt"."report_status"])) AND ("r"."deleted_at" IS NULL) AND ("g"."grade" IS NOT NULL))
  ORDER BY "r"."pilot_id", "g"."competency_code", "r"."training_date" DESC NULLS LAST, "r"."created_at" DESC;


ALTER VIEW "ebt"."v_pilot_competency_trend" OWNER TO "postgres";


CREATE OR REPLACE VIEW "ebt"."v_pilot_currency" WITH ("security_invoker"='true') AS
 SELECT "pq"."pilot_id",
    "q"."code" AS "qualification_code",
    "pq"."valid_to",
    ("pq"."valid_to" - CURRENT_DATE) AS "days_to_expiry",
        CASE
            WHEN ("pq"."valid_to" < CURRENT_DATE) THEN 'expired'::"text"
            WHEN ("pq"."valid_to" <= (CURRENT_DATE + 60)) THEN 'expiring'::"text"
            ELSE 'valid'::"text"
        END AS "alert_bucket"
   FROM (("ebt"."pilot_qualifications" "pq"
     JOIN "ebt"."qualifications" "q" ON (("q"."id" = "pq"."qualification_id")))
     JOIN "ebt"."pilots" "p" ON (("p"."id" = "pq"."pilot_id")))
  WHERE (("p"."employment_status" = 'active'::"text") AND ("p"."deleted_at" IS NULL))
UNION ALL
 SELECT "m"."pilot_id",
    'MEDICAL'::"text" AS "qualification_code",
    "m"."expiry" AS "valid_to",
    ("m"."expiry" - CURRENT_DATE) AS "days_to_expiry",
        CASE
            WHEN ("m"."expiry" < CURRENT_DATE) THEN 'expired'::"text"
            WHEN ("m"."expiry" <= (CURRENT_DATE + 60)) THEN 'expiring'::"text"
            ELSE 'valid'::"text"
        END AS "alert_bucket"
   FROM ("ebt"."medicals" "m"
     JOIN "ebt"."pilots" "p" ON (("p"."id" = "m"."pilot_id")))
  WHERE (("m"."expiry" IS NOT NULL) AND ("p"."employment_status" = 'active'::"text") AND ("p"."deleted_at" IS NULL));


ALTER VIEW "ebt"."v_pilot_currency" OWNER TO "postgres";


CREATE OR REPLACE VIEW "ebt"."v_pilot_latest_eval" WITH ("security_invoker"='true') AS
 WITH "latest" AS (
         SELECT DISTINCT ON ("r"."pilot_id") "r"."pilot_id",
            "r"."id" AS "report_id",
            "r"."module_no",
            "r"."training_date"
           FROM "ebt"."training_reports" "r"
          WHERE (("r"."status" = ANY (ARRAY['signed_off'::"ebt"."report_status", 'finalized'::"ebt"."report_status"])) AND ("r"."deleted_at" IS NULL))
          ORDER BY "r"."pilot_id", "r"."training_date" DESC NULLS LAST, "r"."created_at" DESC
        )
 SELECT "l"."pilot_id",
    "g"."competency_code",
    "g"."grade",
    "l"."module_no",
    "l"."training_date"
   FROM ("latest" "l"
     JOIN "ebt"."report_competency_grades" "g" ON ((("g"."report_id" = "l"."report_id") AND ("g"."phase" = 'EVAL'::"ebt"."report_phase"))))
  WHERE ("g"."grade" IS NOT NULL);


ALTER VIEW "ebt"."v_pilot_latest_eval" OWNER TO "postgres";


CREATE OR REPLACE VIEW "ebt"."v_pilot_module_progress" WITH ("security_invoker"='true') AS
 SELECT "pilot_id",
    "last_completed_module_no",
    "last_completed_date",
    "modules_completed",
        CASE
            WHEN ("last_completed_module_no" IS NULL) THEN 1
            ELSE (("last_completed_module_no" % 6) + 1)
        END AS "next_module_suggested"
   FROM ( SELECT "r"."pilot_id",
            ("array_agg"("r"."module_no" ORDER BY "r"."training_date" DESC NULLS LAST, "r"."created_at" DESC) FILTER (WHERE ("r"."status" = ANY (ARRAY['signed_off'::"ebt"."report_status", 'finalized'::"ebt"."report_status"]))))[1] AS "last_completed_module_no",
            "max"("r"."training_date") FILTER (WHERE ("r"."status" = ANY (ARRAY['signed_off'::"ebt"."report_status", 'finalized'::"ebt"."report_status"]))) AS "last_completed_date",
            "count"(*) FILTER (WHERE ("r"."status" = ANY (ARRAY['signed_off'::"ebt"."report_status", 'finalized'::"ebt"."report_status"]))) AS "modules_completed"
           FROM "ebt"."training_reports" "r"
          WHERE ("r"."deleted_at" IS NULL)
          GROUP BY "r"."pilot_id") "s";


ALTER VIEW "ebt"."v_pilot_module_progress" OWNER TO "postgres";


CREATE OR REPLACE VIEW "ebt"."v_pilot_ob_frequency" WITH ("security_invoker"='true') AS
 SELECT "r"."pilot_id",
    "ob"."competency_code",
    "ob"."observable_behaviour_id",
    "count"(*) AS "n",
        CASE
            WHEN ("g"."grade" <= 2) THEN 'development'::"text"
            ELSE 'exemplary'::"text"
        END AS "direction"
   FROM (("ebt"."report_observed_behaviours" "ob"
     JOIN "ebt"."training_reports" "r" ON (("r"."id" = "ob"."report_id")))
     JOIN "ebt"."report_competency_grades" "g" ON ((("g"."report_id" = "ob"."report_id") AND ("g"."phase" = "ob"."phase") AND ("g"."competency_code" = "ob"."competency_code"))))
  WHERE (("ob"."phase" = 'EVAL'::"ebt"."report_phase") AND ("r"."status" = ANY (ARRAY['signed_off'::"ebt"."report_status", 'finalized'::"ebt"."report_status"])) AND ("r"."deleted_at" IS NULL) AND ("g"."grade" = ANY (ARRAY[1, 2, 5])))
  GROUP BY "r"."pilot_id", "ob"."competency_code", "ob"."observable_behaviour_id",
        CASE
            WHEN ("g"."grade" <= 2) THEN 'development'::"text"
            ELSE 'exemplary'::"text"
        END;


ALTER VIEW "ebt"."v_pilot_ob_frequency" OWNER TO "postgres";


CREATE OR REPLACE VIEW "ebt"."v_pilot_standing_signals" WITH ("security_invoker"='true') AS
 WITH "assessed" AS (
         SELECT DISTINCT ON ("r"."pilot_id", "r"."module_no", "g"."competency_code") "r"."pilot_id",
            "r"."module_no",
            "g"."competency_code",
            "g"."grade"
           FROM ("ebt"."training_reports" "r"
             JOIN "ebt"."report_competency_grades" "g" ON ((("g"."report_id" = "r"."id") AND ("g"."phase" = 'EVAL'::"ebt"."report_phase"))))
          WHERE (("r"."status" = ANY (ARRAY['signed_off'::"ebt"."report_status", 'finalized'::"ebt"."report_status"])) AND ("r"."deleted_at" IS NULL) AND ("g"."grade" IS NOT NULL) AND ("r"."module_no" IS NOT NULL))
          ORDER BY "r"."pilot_id", "r"."module_no", "g"."competency_code", "r"."training_date" DESC NULLS LAST, "r"."created_at" DESC
        ), "module_dates" AS (
         SELECT "r"."pilot_id",
            "r"."module_no",
            "max"("r"."training_date") AS "module_date",
            "max"("r"."created_at") AS "module_created"
           FROM "ebt"."training_reports" "r"
          WHERE (("r"."status" = ANY (ARRAY['signed_off'::"ebt"."report_status", 'finalized'::"ebt"."report_status"])) AND ("r"."deleted_at" IS NULL) AND ("r"."module_no" IS NOT NULL))
          GROUP BY "r"."pilot_id", "r"."module_no"
        ), "modules" AS (
         SELECT "module_dates"."pilot_id",
            "module_dates"."module_no",
            "row_number"() OVER (PARTITION BY "module_dates"."pilot_id" ORDER BY "module_dates"."module_date" DESC NULLS LAST, "module_dates"."module_created" DESC) AS "rn"
           FROM "module_dates"
        ), "last_two" AS (
         SELECT "modules"."pilot_id",
            "max"("modules"."module_no") FILTER (WHERE ("modules"."rn" = 1)) AS "m_latest",
            "max"("modules"."module_no") FILTER (WHERE ("modules"."rn" = 2)) AS "m_prev"
           FROM "modules"
          GROUP BY "modules"."pilot_id"
        ), "latest_signals" AS (
         SELECT "a"."pilot_id",
            "bool_or"(("a"."grade" = 1)) AS "any_grade_one",
            "bool_or"(("a"."grade" = 2)) AS "any_grade_two",
            "count"(*) FILTER (WHERE ("a"."grade" = 1)) AS "not_competent_count",
            "count"(*) FILTER (WHERE ("a"."grade" <= 2)) AS "below_effective_count"
           FROM ("assessed" "a"
             JOIN "last_two" "lt" ON ((("lt"."pilot_id" = "a"."pilot_id") AND ("a"."module_no" = "lt"."m_latest"))))
          GROUP BY "a"."pilot_id"
        ), "recurring" AS (
         SELECT "a"."pilot_id",
            "a"."competency_code"
           FROM ("assessed" "a"
             JOIN "last_two" "lt" ON (("lt"."pilot_id" = "a"."pilot_id")))
          WHERE (("lt"."m_prev" IS NOT NULL) AND (((("lt"."m_prev" % 6) + 1) = "lt"."m_latest") OR ((("lt"."m_latest" % 6) + 1) = "lt"."m_prev")) AND (("a"."module_no" = "lt"."m_latest") OR ("a"."module_no" = "lt"."m_prev")) AND ("a"."grade" = 2))
          GROUP BY "a"."pilot_id", "a"."competency_code"
         HAVING ("count"(*) = 2)
        )
 SELECT "pilot_id",
    COALESCE("any_grade_one", false) AS "any_grade_one",
    COALESCE("any_grade_two", false) AS "any_grade_two",
    COALESCE(( SELECT "array_agg"("rc"."competency_code" ORDER BY "rc"."competency_code") AS "array_agg"
           FROM "recurring" "rc"
          WHERE ("rc"."pilot_id" = "ls"."pilot_id")), ARRAY[]::"text"[]) AS "recurring_twos",
    (COALESCE("not_competent_count", (0)::bigint))::integer AS "not_competent_count",
    (COALESCE("below_effective_count", (0)::bigint))::integer AS "below_effective_count"
   FROM "latest_signals" "ls";


ALTER VIEW "ebt"."v_pilot_standing_signals" OWNER TO "postgres";


ALTER TABLE ONLY "ebt"."aircraft_types"
    ADD CONSTRAINT "aircraft_types_code_key" UNIQUE ("code");



ALTER TABLE ONLY "ebt"."aircraft_types"
    ADD CONSTRAINT "aircraft_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "ebt"."check_types"
    ADD CONSTRAINT "check_types_code_key" UNIQUE ("code");



ALTER TABLE ONLY "ebt"."check_types"
    ADD CONSTRAINT "check_types_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "ebt"."competencies"
    ADD CONSTRAINT "competencies_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "ebt"."grade_descriptors"
    ADD CONSTRAINT "grade_descriptors_pkey" PRIMARY KEY ("grade");



ALTER TABLE ONLY "ebt"."licences"
    ADD CONSTRAINT "licences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "ebt"."medicals"
    ADD CONSTRAINT "medicals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "ebt"."observable_behaviours"
    ADD CONSTRAINT "observable_behaviours_competency_code_code_key" UNIQUE ("competency_code", "code");



ALTER TABLE ONLY "ebt"."observable_behaviours"
    ADD CONSTRAINT "observable_behaviours_id_competency_code_key" UNIQUE ("id", "competency_code");



ALTER TABLE ONLY "ebt"."observable_behaviours"
    ADD CONSTRAINT "observable_behaviours_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "ebt"."pilot_qualifications"
    ADD CONSTRAINT "pilot_qualifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "ebt"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "ebt"."qualifications"
    ADD CONSTRAINT "qualifications_code_key" UNIQUE ("code");



ALTER TABLE ONLY "ebt"."qualifications"
    ADD CONSTRAINT "qualifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "ebt"."record_retention"
    ADD CONSTRAINT "record_retention_pkey" PRIMARY KEY ("record_type");



ALTER TABLE ONLY "ebt"."remedial_requirements"
    ADD CONSTRAINT "remedial_requirements_pilot_id_competency_code_triggered_by_key" UNIQUE ("pilot_id", "competency_code", "triggered_by_report_id");



ALTER TABLE ONLY "ebt"."remedial_requirements"
    ADD CONSTRAINT "remedial_requirements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "ebt"."report_carryover_focus"
    ADD CONSTRAINT "report_carryover_focus_pkey" PRIMARY KEY ("report_id", "competency_code");



ALTER TABLE ONLY "ebt"."report_competency_grades"
    ADD CONSTRAINT "report_competency_grades_pkey" PRIMARY KEY ("report_id", "phase", "competency_code");



ALTER TABLE ONLY "ebt"."report_documents"
    ADD CONSTRAINT "report_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "ebt"."report_observed_behaviours"
    ADD CONSTRAINT "report_observed_behaviours_pkey" PRIMARY KEY ("report_id", "phase", "competency_code", "observable_behaviour_id");



ALTER TABLE ONLY "ebt"."report_phases"
    ADD CONSTRAINT "report_phases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "ebt"."report_phases"
    ADD CONSTRAINT "report_phases_report_id_phase_key" UNIQUE ("report_id", "phase");



ALTER TABLE ONLY "ebt"."report_qualifications"
    ADD CONSTRAINT "report_qualifications_pkey" PRIMARY KEY ("report_id", "qualification_id");



ALTER TABLE ONLY "ebt"."report_signatures"
    ADD CONSTRAINT "report_signatures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "ebt"."report_signatures"
    ADD CONSTRAINT "report_signatures_report_id_kind_key" UNIQUE ("report_id", "kind");



ALTER TABLE ONLY "ebt"."report_specialised_training"
    ADD CONSTRAINT "report_specialised_training_pkey" PRIMARY KEY ("report_id", "specialised_training_id");



ALTER TABLE ONLY "ebt"."specialised_training"
    ADD CONSTRAINT "specialised_training_code_key" UNIQUE ("code");



ALTER TABLE ONLY "ebt"."specialised_training"
    ADD CONSTRAINT "specialised_training_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "ebt"."state_transitions"
    ADD CONSTRAINT "state_transitions_pkey" PRIMARY KEY ("from_status", "to_status");



ALTER TABLE ONLY "ebt"."training_reports"
    ADD CONSTRAINT "training_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "ebt"."user_roles"
    ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id", "role");



CREATE INDEX "idx_carryover_source_report" ON "ebt"."report_carryover_focus" USING "btree" ("source_report_id");



CREATE INDEX "idx_documents_report" ON "ebt"."report_documents" USING "btree" ("report_id");



CREATE INDEX "idx_licences_pilot" ON "ebt"."licences" USING "btree" ("pilot_id");



CREATE INDEX "idx_medicals_pilot" ON "ebt"."medicals" USING "btree" ("pilot_id");



CREATE INDEX "idx_ob_competency" ON "ebt"."observable_behaviours" USING "btree" ("competency_code");



CREATE INDEX "idx_phases_report" ON "ebt"."report_phases" USING "btree" ("report_id");



CREATE INDEX "idx_pilotquals_pilot" ON "ebt"."pilot_qualifications" USING "btree" ("pilot_id");



CREATE INDEX "idx_pilotquals_validto" ON "ebt"."pilot_qualifications" USING "btree" ("valid_to");



CREATE INDEX "idx_remedials_pilot_open" ON "ebt"."remedial_requirements" USING "btree" ("pilot_id") WHERE ("status" = ANY (ARRAY['required'::"ebt"."remedial_status", 'scheduled'::"ebt"."remedial_status", 'in_progress'::"ebt"."remedial_status"]));



CREATE INDEX "idx_remedials_triggered_by_report" ON "ebt"."remedial_requirements" USING "btree" ("triggered_by_report_id");



CREATE INDEX "idx_reports_check_type" ON "ebt"."training_reports" USING "btree" ("check_type_id");



CREATE INDEX "idx_reports_examiner" ON "ebt"."training_reports" USING "btree" ("examiner_id");



CREATE INDEX "idx_reports_pilot" ON "ebt"."training_reports" USING "btree" ("pilot_id");



CREATE INDEX "idx_reports_status" ON "ebt"."training_reports" USING "btree" ("status");



CREATE INDEX "idx_rob_report" ON "ebt"."report_observed_behaviours" USING "btree" ("report_id");



CREATE UNIQUE INDEX "uq_reports_source_response_id" ON "ebt"."training_reports" USING "btree" ("source_response_id") WHERE ("source_response_id" IS NOT NULL);



CREATE OR REPLACE TRIGGER "trg_grades_evaluate" AFTER INSERT OR DELETE OR UPDATE ON "ebt"."report_competency_grades" FOR EACH ROW EXECUTE FUNCTION "ebt"."trg_grade_changed"();



CREATE OR REPLACE TRIGGER "trg_licences_updated" BEFORE UPDATE ON "ebt"."licences" FOR EACH ROW EXECUTE FUNCTION "ebt"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_medicals_updated" BEFORE UPDATE ON "ebt"."medicals" FOR EACH ROW EXECUTE FUNCTION "ebt"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_pilotquals_updated" BEFORE UPDATE ON "ebt"."pilot_qualifications" FOR EACH ROW EXECUTE FUNCTION "ebt"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_profiles_updated" BEFORE UPDATE ON "ebt"."profiles" FOR EACH ROW EXECUTE FUNCTION "ebt"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_remedials_updated" BEFORE UPDATE ON "ebt"."remedial_requirements" FOR EACH ROW EXECUTE FUNCTION "ebt"."touch_updated_at"();



CREATE OR REPLACE TRIGGER "trg_reports_carryover" AFTER INSERT ON "ebt"."training_reports" FOR EACH ROW EXECUTE FUNCTION "ebt"."snapshot_carryover"();



CREATE OR REPLACE TRIGGER "trg_reports_completed_evaluate" AFTER UPDATE ON "ebt"."training_reports" FOR EACH ROW EXECUTE FUNCTION "ebt"."trg_report_completed"();



CREATE OR REPLACE TRIGGER "trg_reports_lifecycle" BEFORE UPDATE ON "ebt"."training_reports" FOR EACH ROW EXECUTE FUNCTION "ebt"."enforce_lifecycle"();



CREATE OR REPLACE TRIGGER "trg_reports_release" BEFORE INSERT OR UPDATE ON "ebt"."training_reports" FOR EACH ROW EXECUTE FUNCTION "ebt"."enforce_release_block"();



CREATE OR REPLACE TRIGGER "trg_reports_snapshot" BEFORE INSERT ON "ebt"."training_reports" FOR EACH ROW EXECUTE FUNCTION "ebt"."populate_report_snapshot"();



CREATE OR REPLACE TRIGGER "trg_reports_updated" BEFORE UPDATE ON "ebt"."training_reports" FOR EACH ROW EXECUTE FUNCTION "ebt"."set_updated_at"();



CREATE OR REPLACE TRIGGER "trg_user_roles_min_one_admin" AFTER DELETE OR UPDATE ON "ebt"."user_roles" FOR EACH ROW EXECUTE FUNCTION "ebt"."enforce_min_one_admin"();



ALTER TABLE ONLY "ebt"."licences"
    ADD CONSTRAINT "licences_pilot_id_fkey" FOREIGN KEY ("pilot_id") REFERENCES "public"."pilots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "ebt"."medicals"
    ADD CONSTRAINT "medicals_pilot_id_fkey" FOREIGN KEY ("pilot_id") REFERENCES "public"."pilots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "ebt"."observable_behaviours"
    ADD CONSTRAINT "observable_behaviours_competency_code_fkey" FOREIGN KEY ("competency_code") REFERENCES "ebt"."competencies"("code");



ALTER TABLE ONLY "ebt"."pilot_qualifications"
    ADD CONSTRAINT "pilot_qualifications_pilot_id_fkey" FOREIGN KEY ("pilot_id") REFERENCES "public"."pilots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "ebt"."pilot_qualifications"
    ADD CONSTRAINT "pilot_qualifications_qualification_id_fkey" FOREIGN KEY ("qualification_id") REFERENCES "ebt"."qualifications"("id");



ALTER TABLE ONLY "ebt"."remedial_requirements"
    ADD CONSTRAINT "remedial_requirements_competency_code_fkey" FOREIGN KEY ("competency_code") REFERENCES "ebt"."competencies"("code");



ALTER TABLE ONLY "ebt"."remedial_requirements"
    ADD CONSTRAINT "remedial_requirements_pilot_id_fkey" FOREIGN KEY ("pilot_id") REFERENCES "public"."pilots"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "ebt"."remedial_requirements"
    ADD CONSTRAINT "remedial_requirements_resolved_by_report_id_fkey" FOREIGN KEY ("resolved_by_report_id") REFERENCES "ebt"."training_reports"("id");



ALTER TABLE ONLY "ebt"."remedial_requirements"
    ADD CONSTRAINT "remedial_requirements_triggered_by_report_id_fkey" FOREIGN KEY ("triggered_by_report_id") REFERENCES "ebt"."training_reports"("id");



ALTER TABLE ONLY "ebt"."report_carryover_focus"
    ADD CONSTRAINT "report_carryover_focus_competency_code_fkey" FOREIGN KEY ("competency_code") REFERENCES "ebt"."competencies"("code");



ALTER TABLE ONLY "ebt"."report_carryover_focus"
    ADD CONSTRAINT "report_carryover_focus_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "ebt"."training_reports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "ebt"."report_carryover_focus"
    ADD CONSTRAINT "report_carryover_focus_source_report_id_fkey" FOREIGN KEY ("source_report_id") REFERENCES "ebt"."training_reports"("id");



ALTER TABLE ONLY "ebt"."report_competency_grades"
    ADD CONSTRAINT "report_competency_grades_competency_code_fkey" FOREIGN KEY ("competency_code") REFERENCES "ebt"."competencies"("code");



ALTER TABLE ONLY "ebt"."report_competency_grades"
    ADD CONSTRAINT "report_competency_grades_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "ebt"."training_reports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "ebt"."report_documents"
    ADD CONSTRAINT "report_documents_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "ebt"."training_reports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "ebt"."report_observed_behaviours"
    ADD CONSTRAINT "report_observed_behaviours_competency_code_fkey" FOREIGN KEY ("competency_code") REFERENCES "ebt"."competencies"("code");



ALTER TABLE ONLY "ebt"."report_observed_behaviours"
    ADD CONSTRAINT "report_observed_behaviours_observable_behaviour_id_compete_fkey" FOREIGN KEY ("observable_behaviour_id", "competency_code") REFERENCES "ebt"."observable_behaviours"("id", "competency_code");



ALTER TABLE ONLY "ebt"."report_observed_behaviours"
    ADD CONSTRAINT "report_observed_behaviours_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "ebt"."training_reports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "ebt"."report_phases"
    ADD CONSTRAINT "report_phases_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "ebt"."training_reports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "ebt"."report_qualifications"
    ADD CONSTRAINT "report_qualifications_qualification_id_fkey" FOREIGN KEY ("qualification_id") REFERENCES "ebt"."qualifications"("id");



ALTER TABLE ONLY "ebt"."report_qualifications"
    ADD CONSTRAINT "report_qualifications_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "ebt"."training_reports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "ebt"."report_signatures"
    ADD CONSTRAINT "report_signatures_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "ebt"."training_reports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "ebt"."report_specialised_training"
    ADD CONSTRAINT "report_specialised_training_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "ebt"."training_reports"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "ebt"."report_specialised_training"
    ADD CONSTRAINT "report_specialised_training_specialised_training_id_fkey" FOREIGN KEY ("specialised_training_id") REFERENCES "ebt"."specialised_training"("id");



ALTER TABLE ONLY "ebt"."training_reports"
    ADD CONSTRAINT "training_reports_check_type_id_fkey" FOREIGN KEY ("check_type_id") REFERENCES "ebt"."check_types"("id");



ALTER TABLE ONLY "ebt"."training_reports"
    ADD CONSTRAINT "training_reports_pilot_id_fkey" FOREIGN KEY ("pilot_id") REFERENCES "public"."pilots"("id");



ALTER TABLE "ebt"."aircraft_types" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "aircraft_types_read" ON "ebt"."aircraft_types" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "auth admin reads roles" ON "ebt"."user_roles" FOR SELECT TO "supabase_auth_admin" USING (true);



ALTER TABLE "ebt"."check_types" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "check_types_read" ON "ebt"."check_types" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "ebt"."competencies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "competencies_read" ON "ebt"."competencies" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "ebt"."grade_descriptors" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "grade_descriptors_read" ON "ebt"."grade_descriptors" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "ebt"."licences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "licences_admin_write" ON "ebt"."licences" TO "authenticated" USING (( SELECT "ebt"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "ebt"."is_admin"() AS "is_admin"));



CREATE POLICY "licences_read" ON "ebt"."licences" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "ebt"."medicals" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "medicals_admin_write" ON "ebt"."medicals" TO "authenticated" USING (( SELECT "ebt"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "ebt"."is_admin"() AS "is_admin"));



CREATE POLICY "medicals_read" ON "ebt"."medicals" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "ebt"."observable_behaviours" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "observable_behaviours_read" ON "ebt"."observable_behaviours" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "ebt"."pilot_qualifications" ENABLE ROW LEVEL SECURITY;



CREATE POLICY "pq_admin_write" ON "ebt"."pilot_qualifications" TO "authenticated" USING (( SELECT "ebt"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "ebt"."is_admin"() AS "is_admin"));



CREATE POLICY "pq_read" ON "ebt"."pilot_qualifications" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "ebt"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_read" ON "ebt"."profiles" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "profiles_self_update" ON "ebt"."profiles" FOR UPDATE TO "authenticated" USING (("id" = ( SELECT "auth"."uid"() AS "uid"))) WITH CHECK (("id" = ( SELECT "auth"."uid"() AS "uid")));



ALTER TABLE "ebt"."qualifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "qualifications_read" ON "ebt"."qualifications" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "ebt"."record_retention" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "record_retention_read" ON "ebt"."record_retention" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "ebt"."remedial_requirements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "remedial_requirements_read_staff" ON "ebt"."remedial_requirements" FOR SELECT TO "authenticated" USING ((( SELECT "ebt"."app_role"() AS "app_role") = ANY (ARRAY['examiner'::"text", 'fleet_manager'::"text", 'admin'::"text"])));



CREATE POLICY "remedials_read" ON "ebt"."remedial_requirements" FOR SELECT TO "authenticated" USING ((( SELECT "ebt"."is_fleet_manager"() AS "is_fleet_manager") OR (EXISTS ( SELECT 1
   FROM "ebt"."training_reports" "r"
  WHERE (("r"."pilot_id" = "remedial_requirements"."pilot_id") AND ("r"."examiner_id" = ( SELECT "auth"."uid"() AS "uid")))))));



CREATE POLICY "remedials_write" ON "ebt"."remedial_requirements" TO "authenticated" USING (( SELECT "ebt"."is_fleet_manager"() AS "is_fleet_manager")) WITH CHECK (( SELECT "ebt"."is_fleet_manager"() AS "is_fleet_manager"));



ALTER TABLE "ebt"."report_carryover_focus" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "report_carryover_focus_access" ON "ebt"."report_carryover_focus" TO "authenticated" USING ("ebt"."can_access_report"("report_id")) WITH CHECK ("ebt"."can_access_report"("report_id"));



CREATE POLICY "report_carryover_focus_read_staff" ON "ebt"."report_carryover_focus" FOR SELECT TO "authenticated" USING ((( SELECT "ebt"."app_role"() AS "app_role") = ANY (ARRAY['examiner'::"text", 'fleet_manager'::"text", 'admin'::"text"])));



ALTER TABLE "ebt"."report_competency_grades" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "report_competency_grades_access" ON "ebt"."report_competency_grades" TO "authenticated" USING ("ebt"."can_access_report"("report_id")) WITH CHECK ("ebt"."can_access_report"("report_id"));



CREATE POLICY "report_competency_grades_read_staff" ON "ebt"."report_competency_grades" FOR SELECT TO "authenticated" USING ((( SELECT "ebt"."app_role"() AS "app_role") = ANY (ARRAY['examiner'::"text", 'fleet_manager'::"text", 'admin'::"text"])));



ALTER TABLE "ebt"."report_documents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "report_documents_access" ON "ebt"."report_documents" TO "authenticated" USING ("ebt"."can_access_report"("report_id")) WITH CHECK ("ebt"."can_access_report"("report_id"));



ALTER TABLE "ebt"."report_observed_behaviours" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "report_observed_behaviours_access" ON "ebt"."report_observed_behaviours" TO "authenticated" USING ("ebt"."can_access_report"("report_id")) WITH CHECK ("ebt"."can_access_report"("report_id"));



CREATE POLICY "report_observed_behaviours_read_staff" ON "ebt"."report_observed_behaviours" FOR SELECT TO "authenticated" USING ((( SELECT "ebt"."app_role"() AS "app_role") = ANY (ARRAY['examiner'::"text", 'fleet_manager'::"text", 'admin'::"text"])));



ALTER TABLE "ebt"."report_phases" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "report_phases_access" ON "ebt"."report_phases" TO "authenticated" USING ("ebt"."can_access_report"("report_id")) WITH CHECK ("ebt"."can_access_report"("report_id"));



CREATE POLICY "report_phases_read_staff" ON "ebt"."report_phases" FOR SELECT TO "authenticated" USING ((( SELECT "ebt"."app_role"() AS "app_role") = ANY (ARRAY['examiner'::"text", 'fleet_manager'::"text", 'admin'::"text"])));



ALTER TABLE "ebt"."report_qualifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "report_qualifications_access" ON "ebt"."report_qualifications" TO "authenticated" USING ("ebt"."can_access_report"("report_id")) WITH CHECK ("ebt"."can_access_report"("report_id"));



ALTER TABLE "ebt"."report_signatures" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "report_signatures_access" ON "ebt"."report_signatures" TO "authenticated" USING ("ebt"."can_access_report"("report_id")) WITH CHECK ("ebt"."can_access_report"("report_id"));



ALTER TABLE "ebt"."report_specialised_training" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "report_specialised_training_access" ON "ebt"."report_specialised_training" TO "authenticated" USING ("ebt"."can_access_report"("report_id")) WITH CHECK ("ebt"."can_access_report"("report_id"));



CREATE POLICY "reports_delete_admin" ON "ebt"."training_reports" FOR DELETE TO "authenticated" USING (( SELECT "ebt"."is_admin"() AS "is_admin"));



CREATE POLICY "reports_insert" ON "ebt"."training_reports" FOR INSERT TO "authenticated" WITH CHECK (("examiner_id" = ( SELECT "auth"."uid"() AS "uid")));



CREATE POLICY "reports_read_staff" ON "ebt"."training_reports" FOR SELECT TO "authenticated" USING ((( SELECT "ebt"."app_role"() AS "app_role") = ANY (ARRAY['examiner'::"text", 'fleet_manager'::"text", 'admin'::"text"])));



CREATE POLICY "reports_select" ON "ebt"."training_reports" FOR SELECT TO "authenticated" USING ((("examiner_id" = ( SELECT "auth"."uid"() AS "uid")) OR ( SELECT "ebt"."is_fleet_manager"() AS "is_fleet_manager")));



CREATE POLICY "reports_update_owner" ON "ebt"."training_reports" FOR UPDATE TO "authenticated" USING ((("examiner_id" = ( SELECT "auth"."uid"() AS "uid")) OR "ebt"."is_fleet_manager"())) WITH CHECK ((("examiner_id" = ( SELECT "auth"."uid"() AS "uid")) OR "ebt"."is_fleet_manager"()));



CREATE POLICY "roles_admin_write" ON "ebt"."user_roles" TO "authenticated" USING (( SELECT "ebt"."is_admin"() AS "is_admin")) WITH CHECK (( SELECT "ebt"."is_admin"() AS "is_admin"));



CREATE POLICY "roles_self_read" ON "ebt"."user_roles" FOR SELECT TO "authenticated" USING ((("user_id" = ( SELECT "auth"."uid"() AS "uid")) OR ( SELECT "ebt"."is_admin"() AS "is_admin")));



ALTER TABLE "ebt"."specialised_training" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "specialised_training_read" ON "ebt"."specialised_training" FOR SELECT TO "authenticated" USING (true);



ALTER TABLE "ebt"."state_transitions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "ebt"."training_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "ebt"."user_roles" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "ebt"."app_role"() TO "anon";
GRANT ALL ON FUNCTION "ebt"."app_role"() TO "authenticated";
GRANT ALL ON FUNCTION "ebt"."app_role"() TO "service_role";



GRANT ALL ON FUNCTION "ebt"."can_access_report"("p_report" "uuid") TO "anon";
GRANT ALL ON FUNCTION "ebt"."can_access_report"("p_report" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "ebt"."can_access_report"("p_report" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "ebt"."enforce_lifecycle"() TO "anon";
GRANT ALL ON FUNCTION "ebt"."enforce_lifecycle"() TO "authenticated";
GRANT ALL ON FUNCTION "ebt"."enforce_lifecycle"() TO "service_role";



REVOKE ALL ON FUNCTION "ebt"."enforce_min_one_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "ebt"."enforce_min_one_admin"() TO "service_role";



GRANT ALL ON FUNCTION "ebt"."enforce_release_block"() TO "anon";
GRANT ALL ON FUNCTION "ebt"."enforce_release_block"() TO "authenticated";
GRANT ALL ON FUNCTION "ebt"."enforce_release_block"() TO "service_role";



REVOKE ALL ON FUNCTION "ebt"."evaluate_eval_result"("p_report" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "ebt"."evaluate_eval_result"("p_report" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "ebt"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "ebt"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "ebt"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "ebt"."is_fleet_manager"() TO "anon";
GRANT ALL ON FUNCTION "ebt"."is_fleet_manager"() TO "authenticated";
GRANT ALL ON FUNCTION "ebt"."is_fleet_manager"() TO "service_role";



REVOKE ALL ON FUNCTION "ebt"."populate_report_snapshot"() FROM PUBLIC;
GRANT ALL ON FUNCTION "ebt"."populate_report_snapshot"() TO "service_role";



GRANT ALL ON FUNCTION "ebt"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "ebt"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "ebt"."set_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "ebt"."snapshot_carryover"() FROM PUBLIC;
GRANT ALL ON FUNCTION "ebt"."snapshot_carryover"() TO "service_role";



GRANT ALL ON FUNCTION "ebt"."touch_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "ebt"."touch_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "ebt"."touch_updated_at"() TO "service_role";



REVOKE ALL ON FUNCTION "ebt"."trg_grade_changed"() FROM PUBLIC;
GRANT ALL ON FUNCTION "ebt"."trg_grade_changed"() TO "service_role";



REVOKE ALL ON FUNCTION "ebt"."trg_report_completed"() FROM PUBLIC;
GRANT ALL ON FUNCTION "ebt"."trg_report_completed"() TO "service_role";



GRANT ALL ON TABLE "ebt"."aircraft_types" TO "anon";
GRANT ALL ON TABLE "ebt"."aircraft_types" TO "authenticated";
GRANT ALL ON TABLE "ebt"."aircraft_types" TO "service_role";



GRANT ALL ON TABLE "ebt"."check_types" TO "anon";
GRANT ALL ON TABLE "ebt"."check_types" TO "authenticated";
GRANT ALL ON TABLE "ebt"."check_types" TO "service_role";



GRANT ALL ON TABLE "ebt"."competencies" TO "anon";
GRANT ALL ON TABLE "ebt"."competencies" TO "authenticated";
GRANT ALL ON TABLE "ebt"."competencies" TO "service_role";



GRANT ALL ON TABLE "ebt"."grade_descriptors" TO "anon";
GRANT ALL ON TABLE "ebt"."grade_descriptors" TO "authenticated";
GRANT ALL ON TABLE "ebt"."grade_descriptors" TO "service_role";



GRANT ALL ON TABLE "ebt"."licences" TO "anon";
GRANT ALL ON TABLE "ebt"."licences" TO "authenticated";
GRANT ALL ON TABLE "ebt"."licences" TO "service_role";



GRANT ALL ON TABLE "ebt"."medicals" TO "anon";
GRANT ALL ON TABLE "ebt"."medicals" TO "authenticated";
GRANT ALL ON TABLE "ebt"."medicals" TO "service_role";



GRANT ALL ON TABLE "ebt"."observable_behaviours" TO "anon";
GRANT ALL ON TABLE "ebt"."observable_behaviours" TO "authenticated";
GRANT ALL ON TABLE "ebt"."observable_behaviours" TO "service_role";



GRANT ALL ON TABLE "ebt"."pilot_qualifications" TO "anon";
GRANT ALL ON TABLE "ebt"."pilot_qualifications" TO "authenticated";
GRANT ALL ON TABLE "ebt"."pilot_qualifications" TO "service_role";



GRANT ALL ON TABLE "ebt"."profiles" TO "anon";
GRANT ALL ON TABLE "ebt"."profiles" TO "authenticated";
GRANT ALL ON TABLE "ebt"."profiles" TO "service_role";



GRANT ALL ON TABLE "ebt"."qualifications" TO "anon";
GRANT ALL ON TABLE "ebt"."qualifications" TO "authenticated";
GRANT ALL ON TABLE "ebt"."qualifications" TO "service_role";



GRANT ALL ON TABLE "ebt"."record_retention" TO "anon";
GRANT ALL ON TABLE "ebt"."record_retention" TO "authenticated";
GRANT ALL ON TABLE "ebt"."record_retention" TO "service_role";



GRANT ALL ON TABLE "ebt"."remedial_requirements" TO "anon";
GRANT ALL ON TABLE "ebt"."remedial_requirements" TO "authenticated";
GRANT ALL ON TABLE "ebt"."remedial_requirements" TO "service_role";



GRANT ALL ON TABLE "ebt"."report_carryover_focus" TO "anon";
GRANT ALL ON TABLE "ebt"."report_carryover_focus" TO "authenticated";
GRANT ALL ON TABLE "ebt"."report_carryover_focus" TO "service_role";



GRANT ALL ON TABLE "ebt"."report_competency_grades" TO "anon";
GRANT ALL ON TABLE "ebt"."report_competency_grades" TO "authenticated";
GRANT ALL ON TABLE "ebt"."report_competency_grades" TO "service_role";



GRANT ALL ON TABLE "ebt"."report_documents" TO "anon";
GRANT ALL ON TABLE "ebt"."report_documents" TO "authenticated";
GRANT ALL ON TABLE "ebt"."report_documents" TO "service_role";



GRANT ALL ON TABLE "ebt"."report_observed_behaviours" TO "anon";
GRANT ALL ON TABLE "ebt"."report_observed_behaviours" TO "authenticated";
GRANT ALL ON TABLE "ebt"."report_observed_behaviours" TO "service_role";



GRANT ALL ON TABLE "ebt"."report_phases" TO "anon";
GRANT ALL ON TABLE "ebt"."report_phases" TO "authenticated";
GRANT ALL ON TABLE "ebt"."report_phases" TO "service_role";



GRANT ALL ON TABLE "ebt"."report_qualifications" TO "anon";
GRANT ALL ON TABLE "ebt"."report_qualifications" TO "authenticated";
GRANT ALL ON TABLE "ebt"."report_qualifications" TO "service_role";



GRANT ALL ON TABLE "ebt"."report_signatures" TO "anon";
GRANT ALL ON TABLE "ebt"."report_signatures" TO "authenticated";
GRANT ALL ON TABLE "ebt"."report_signatures" TO "service_role";



GRANT ALL ON TABLE "ebt"."report_specialised_training" TO "anon";
GRANT ALL ON TABLE "ebt"."report_specialised_training" TO "authenticated";
GRANT ALL ON TABLE "ebt"."report_specialised_training" TO "service_role";



GRANT ALL ON TABLE "ebt"."specialised_training" TO "anon";
GRANT ALL ON TABLE "ebt"."specialised_training" TO "authenticated";
GRANT ALL ON TABLE "ebt"."specialised_training" TO "service_role";



GRANT ALL ON TABLE "ebt"."state_transitions" TO "anon";
GRANT ALL ON TABLE "ebt"."state_transitions" TO "authenticated";
GRANT ALL ON TABLE "ebt"."state_transitions" TO "service_role";



GRANT ALL ON TABLE "ebt"."training_reports" TO "anon";
GRANT ALL ON TABLE "ebt"."training_reports" TO "authenticated";
GRANT ALL ON TABLE "ebt"."training_reports" TO "service_role";



GRANT ALL ON TABLE "ebt"."user_roles" TO "anon";
GRANT ALL ON TABLE "ebt"."user_roles" TO "authenticated";
GRANT ALL ON TABLE "ebt"."user_roles" TO "service_role";
GRANT SELECT ON TABLE "ebt"."user_roles" TO "supabase_auth_admin";



GRANT ALL ON TABLE "ebt"."v_fleet_competency_health" TO "anon";
GRANT ALL ON TABLE "ebt"."v_fleet_competency_health" TO "authenticated";
GRANT ALL ON TABLE "ebt"."v_fleet_competency_health" TO "service_role";



GRANT ALL ON TABLE "ebt"."v_fleet_competency_health_active" TO "anon";
GRANT ALL ON TABLE "ebt"."v_fleet_competency_health_active" TO "authenticated";
GRANT ALL ON TABLE "ebt"."v_fleet_competency_health_active" TO "service_role";



GRANT ALL ON TABLE "ebt"."v_fleet_competency_health_grouped" TO "anon";
GRANT ALL ON TABLE "ebt"."v_fleet_competency_health_grouped" TO "authenticated";
GRANT ALL ON TABLE "ebt"."v_fleet_competency_health_grouped" TO "service_role";



GRANT ALL ON TABLE "ebt"."v_fleet_first_vs_resit_grouped" TO "anon";
GRANT ALL ON TABLE "ebt"."v_fleet_first_vs_resit_grouped" TO "authenticated";
GRANT ALL ON TABLE "ebt"."v_fleet_first_vs_resit_grouped" TO "service_role";



GRANT ALL ON TABLE "ebt"."v_fleet_grade_distribution_grouped" TO "anon";
GRANT ALL ON TABLE "ebt"."v_fleet_grade_distribution_grouped" TO "authenticated";
GRANT ALL ON TABLE "ebt"."v_fleet_grade_distribution_grouped" TO "service_role";



GRANT ALL ON TABLE "ebt"."v_fleet_ob_frequency" TO "anon";
GRANT ALL ON TABLE "ebt"."v_fleet_ob_frequency" TO "authenticated";
GRANT ALL ON TABLE "ebt"."v_fleet_ob_frequency" TO "service_role";



GRANT ALL ON TABLE "ebt"."v_fleet_trend_monthly" TO "anon";
GRANT ALL ON TABLE "ebt"."v_fleet_trend_monthly" TO "authenticated";
GRANT ALL ON TABLE "ebt"."v_fleet_trend_monthly" TO "service_role";



GRANT ALL ON TABLE "ebt"."v_module_outcomes_grouped" TO "anon";
GRANT ALL ON TABLE "ebt"."v_module_outcomes_grouped" TO "authenticated";
GRANT ALL ON TABLE "ebt"."v_module_outcomes_grouped" TO "service_role";



GRANT ALL ON TABLE "ebt"."v_outcome_rates" TO "anon";
GRANT ALL ON TABLE "ebt"."v_outcome_rates" TO "authenticated";
GRANT ALL ON TABLE "ebt"."v_outcome_rates" TO "service_role";



GRANT ALL ON TABLE "ebt"."v_pilot_carryover_deficiencies" TO "anon";
GRANT ALL ON TABLE "ebt"."v_pilot_carryover_deficiencies" TO "authenticated";
GRANT ALL ON TABLE "ebt"."v_pilot_carryover_deficiencies" TO "service_role";



GRANT ALL ON TABLE "ebt"."v_pilot_competency_trend" TO "anon";
GRANT ALL ON TABLE "ebt"."v_pilot_competency_trend" TO "authenticated";
GRANT ALL ON TABLE "ebt"."v_pilot_competency_trend" TO "service_role";



GRANT ALL ON TABLE "ebt"."v_pilot_currency" TO "anon";
GRANT ALL ON TABLE "ebt"."v_pilot_currency" TO "authenticated";
GRANT ALL ON TABLE "ebt"."v_pilot_currency" TO "service_role";



GRANT ALL ON TABLE "ebt"."v_pilot_latest_eval" TO "anon";
GRANT ALL ON TABLE "ebt"."v_pilot_latest_eval" TO "authenticated";
GRANT ALL ON TABLE "ebt"."v_pilot_latest_eval" TO "service_role";



GRANT ALL ON TABLE "ebt"."v_pilot_module_progress" TO "anon";
GRANT ALL ON TABLE "ebt"."v_pilot_module_progress" TO "authenticated";
GRANT ALL ON TABLE "ebt"."v_pilot_module_progress" TO "service_role";



GRANT ALL ON TABLE "ebt"."v_pilot_ob_frequency" TO "anon";
GRANT ALL ON TABLE "ebt"."v_pilot_ob_frequency" TO "authenticated";
GRANT ALL ON TABLE "ebt"."v_pilot_ob_frequency" TO "service_role";



GRANT ALL ON TABLE "ebt"."v_pilot_standing_signals" TO "anon";
GRANT ALL ON TABLE "ebt"."v_pilot_standing_signals" TO "authenticated";
GRANT ALL ON TABLE "ebt"."v_pilot_standing_signals" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";








alter table "ebt"."pilot_ext"
  add constraint "pilot_ext_aircraft_type_id_fkey"
  foreign key ("aircraft_type_id") references "ebt"."aircraft_types"("id");
