-- World History 1750 Map Game — Supabase schema
-- All tables are prefixed whp_ to live safely alongside your other
-- projects (e.g. County Quest) in the same Supabase project.
--
-- Run this whole file once in the Supabase SQL Editor on a fresh setup.
-- It is safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE) except
-- for the seed INSERT at the bottom, which only runs if whp_units is empty.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- TABLES
-- ---------------------------------------------------------------------

create table if not exists whp_teachers (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists whp_classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references whp_teachers(id) on delete cascade,
  name text not null,
  class_code text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists whp_students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references whp_classes(id) on delete cascade,
  name text not null,
  pin text,                       -- set by the student on first login
  session_token uuid,             -- refreshed each login; guards progress writes
  created_at timestamptz not null default now()
);

create table if not exists whp_units (
  id serial primary key,
  unit_number int not null unique,
  title text not null,
  years text
);

create table if not exists whp_class_units (
  class_id uuid not null references whp_classes(id) on delete cascade,
  unit_id int not null references whp_units(id) on delete cascade,
  is_open boolean not null default false,
  primary key (class_id, unit_id)
);

create table if not exists whp_unit_locations (
  id serial primary key,
  unit_id int not null references whp_units(id) on delete cascade,
  name text not null,
  region text,
  lat double precision not null,
  lng double precision not null,
  group_number int not null default 1,
  fun_fact text,
  created_at timestamptz not null default now()
);

create table if not exists whp_progress (
  student_id uuid not null references whp_students(id) on delete cascade,
  location_id int not null references whp_unit_locations(id) on delete cascade,
  attempts int not null default 0,
  mastered boolean not null default false,
  last_attempt timestamptz,
  primary key (student_id, location_id)
);

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
-- Teachers authenticate via Supabase Auth, so their reads/writes are
-- scoped with auth.uid(). Students are NOT Supabase Auth users (PIN-only,
-- like County Quest) — all student reads/writes go through the RPC
-- functions below (security definer), and the underlying tables are
-- otherwise locked to anon.

alter table whp_teachers enable row level security;
alter table whp_classes enable row level security;
alter table whp_students enable row level security;
alter table whp_units enable row level security;
alter table whp_class_units enable row level security;
alter table whp_unit_locations enable row level security;
alter table whp_progress enable row level security;

drop policy if exists "teachers manage own row" on whp_teachers;
create policy "teachers manage own row" on whp_teachers
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "teachers manage own classes" on whp_classes;
create policy "teachers manage own classes" on whp_classes
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

drop policy if exists "teachers manage own students" on whp_students;
create policy "teachers manage own students" on whp_students
  for all using (
    exists (select 1 from whp_classes c where c.id = class_id and c.teacher_id = auth.uid())
  ) with check (
    exists (select 1 from whp_classes c where c.id = class_id and c.teacher_id = auth.uid())
  );

-- Units and their locations are shared reference content that any signed-in
-- teacher in the department can read and maintain.
drop policy if exists "any teacher reads units" on whp_units;
create policy "any teacher reads units" on whp_units
  for select using (true);

drop policy if exists "signed-in teachers edit units" on whp_units;
create policy "signed-in teachers edit units" on whp_units
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "any teacher reads locations" on whp_unit_locations;
create policy "any teacher reads locations" on whp_unit_locations
  for select using (true);

drop policy if exists "signed-in teachers edit locations" on whp_unit_locations;
create policy "signed-in teachers edit locations" on whp_unit_locations
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

drop policy if exists "teachers manage own class_units" on whp_class_units;
create policy "teachers manage own class_units" on whp_class_units
  for all using (
    exists (select 1 from whp_classes c where c.id = class_id and c.teacher_id = auth.uid())
  ) with check (
    exists (select 1 from whp_classes c where c.id = class_id and c.teacher_id = auth.uid())
  );

drop policy if exists "teachers view own students progress" on whp_progress;
create policy "teachers view own students progress" on whp_progress
  for select using (
    exists (
      select 1 from whp_students s
      join whp_classes c on c.id = s.class_id
      where s.id = student_id and c.teacher_id = auth.uid()
    )
  );

-- No direct anon policies on whp_students, whp_class_units (read) or
-- whp_progress (write) — those go through the RPCs below, which run as
-- SECURITY DEFINER and therefore bypass RLS deliberately and narrowly.

-- ---------------------------------------------------------------------
-- RPC FUNCTIONS (used by the student-facing app with the anon key)
-- ---------------------------------------------------------------------

-- Look up a class by its code. Returns nothing if the code doesn't exist.
create or replace function whp_find_class(p_class_code text)
returns table (class_id uuid, class_name text)
language sql security definer as $$
  select id, name from whp_classes where class_code = upper(p_class_code);
$$;
grant execute on function whp_find_class(text) to anon;

-- Roster for a class code (names only — no PINs exposed).
create or replace function whp_get_roster(p_class_code text)
returns table (student_id uuid, name text, has_pin boolean)
language sql security definer as $$
  select s.id, s.name, (s.pin is not null)
  from whp_students s
  join whp_classes c on c.id = s.class_id
  where c.class_code = upper(p_class_code)
  order by s.name;
$$;
grant execute on function whp_get_roster(text) to anon;

-- First login for a student sets their PIN; later logins verify it.
-- Returns a fresh session_token on success, or an error message.
create or replace function whp_student_auth(p_student_id uuid, p_pin text)
returns table (success boolean, session_token uuid, error text)
language plpgsql security definer as $$
declare
  v_pin text;
  v_token uuid;
begin
  select pin into v_pin from whp_students where id = p_student_id;
  if v_pin is null then
    v_token := gen_random_uuid();
    update whp_students set pin = p_pin, session_token = v_token where id = p_student_id;
    return query select true, v_token, null::text;
  elsif v_pin = p_pin then
    v_token := gen_random_uuid();
    update whp_students set session_token = v_token where id = p_student_id;
    return query select true, v_token, null::text;
  else
    return query select false, null::uuid, 'Incorrect PIN'::text;
  end if;
end;
$$;
grant execute on function whp_student_auth(uuid, text) to anon;

-- Units currently open for a given class.
create or replace function whp_open_units(p_class_id uuid)
returns table (unit_id int, unit_number int, title text, years text)
language sql security definer as $$
  select u.id, u.unit_number, u.title, u.years
  from whp_units u
  join whp_class_units cu on cu.unit_id = u.id
  where cu.class_id = p_class_id and cu.is_open = true
  order by u.unit_number;
$$;
grant execute on function whp_open_units(uuid) to anon;

-- Locations for a unit, plus this student's progress on each.
create or replace function whp_unit_state(p_student_id uuid, p_unit_id int)
returns table (
  location_id int, name text, region text, lat double precision,
  lng double precision, group_number int, fun_fact text,
  attempts int, mastered boolean
)
language sql security definer as $$
  select l.id, l.name, l.region, l.lat, l.lng, l.group_number, l.fun_fact,
         coalesce(p.attempts, 0), coalesce(p.mastered, false)
  from whp_unit_locations l
  left join whp_progress p on p.location_id = l.id and p.student_id = p_student_id
  where l.unit_id = p_unit_id
  order by l.group_number, l.name;
$$;
grant execute on function whp_unit_state(uuid, int) to anon;

-- Records one attempt at a location. Requires a valid session_token so a
-- student can only write their own progress.
create or replace function whp_record_progress(
  p_student_id uuid, p_session_token uuid, p_location_id int, p_correct boolean
) returns boolean
language plpgsql security definer as $$
declare
  v_token uuid;
begin
  select session_token into v_token from whp_students where id = p_student_id;
  if v_token is null or v_token != p_session_token then
    return false;
  end if;

  insert into whp_progress (student_id, location_id, attempts, mastered, last_attempt)
  values (p_student_id, p_location_id, 1, p_correct, now())
  on conflict (student_id, location_id) do update
    set attempts = whp_progress.attempts + 1,
        mastered = whp_progress.mastered or p_correct,
        last_attempt = now();
  return true;
end;
$$;
grant execute on function whp_record_progress(uuid, uuid, int, boolean) to anon;

-- Teacher-facing progress summary for one class: mastered/total per
-- student per unit. Checks class ownership itself since it runs as
-- SECURITY DEFINER.
create or replace function whp_teacher_progress(p_class_id uuid)
returns table (
  student_id uuid, student_name text, unit_id int, unit_number int,
  unit_title text, mastered_count bigint, total_count bigint
)
language plpgsql security definer as $$
begin
  if not exists (select 1 from whp_classes c where c.id = p_class_id and c.teacher_id = auth.uid()) then
    raise exception 'not authorized';
  end if;

  return query
  select s.id, s.name, u.id, u.unit_number, u.title,
    count(p.location_id) filter (where p.mastered) as mastered_count,
    (select count(*) from whp_unit_locations l where l.unit_id = u.id) as total_count
  from whp_students s
  cross join whp_units u
  left join whp_unit_locations l2 on l2.unit_id = u.id
  left join whp_progress p on p.student_id = s.id and p.location_id = l2.id
  where s.class_id = p_class_id
  group by s.id, s.name, u.id, u.unit_number, u.title
  order by s.name, u.unit_number;
end;
$$;
grant execute on function whp_teacher_progress(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- SEED: the 9 units (safe to run once; skipped if already seeded)
-- ---------------------------------------------------------------------

insert into whp_units (unit_number, title, years)
select * from (values
  (1, 'The World in 1750', '— 1750 CE'),
  (2, 'Liberal and National Revolutions', '1750 – 1850 CE'),
  (3, 'Industrialization', '1750 – 1900 CE'),
  (4, 'Reform Movements', '1750 – 1900 CE'),
  (5, 'Industrial Empires', '1750 – 1914 CE'),
  (6, 'World War I', '1914 – 1919 CE'),
  (7, 'Interwar and World War II', '1919 – 1945 CE'),
  (8, 'Cold War and Decolonization', '1945 – 1991 CE'),
  (9, 'Globalization', '1900 CE – present')
) as v(unit_number, title, years)
where not exists (select 1 from whp_units);
