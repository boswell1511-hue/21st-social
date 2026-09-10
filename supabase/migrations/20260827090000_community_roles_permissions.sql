-- 21st Social / Community Roles, Moderation & Access Control
-- Migration: 20260827090000_community_roles_permissions.sql
--
-- Adds custom community roles, owner-controlled permissions,
-- moderation permissions, member role assignments, and per-role
-- section/topic visibility controls.
--
-- Existing ownership is preserved:
--   communities.owner_id -> auth.users.id
-- Existing community_members.role is NOT changed.

begin;

create table if not exists public.community_roles (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  name text not null,
  description text,
  is_moderator boolean not null default false,
  is_system boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint community_roles_name_length check (char_length(trim(name)) between 1 and 100),
  constraint community_roles_unique_name unique (community_id, name)
);

create index if not exists idx_community_roles_community
  on public.community_roles(community_id);

create table if not exists public.community_permissions (
  id uuid primary key default gen_random_uuid(),
  permission_key text not null unique,
  name text not null,
  description text,
  category text not null,
  moderator_only boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.community_role_permissions (
  role_id uuid not null references public.community_roles(id) on delete cascade,
  permission_id uuid not null references public.community_permissions(id) on delete cascade,
  granted_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table if not exists public.community_member_roles (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  member_id uuid not null references public.community_members(id) on delete cascade,
  role_id uuid not null references public.community_roles(id) on delete cascade,
  assigned_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint community_member_roles_unique_assignment unique (member_id, role_id)
);

create index if not exists idx_member_roles_member
  on public.community_member_roles(member_id);

create index if not exists idx_member_roles_role
  on public.community_member_roles(role_id);

create table if not exists public.community_role_section_access (
  role_id uuid not null references public.community_roles(id) on delete cascade,
  section_id uuid not null references public.community_sections(id) on delete cascade,
  can_access boolean not null default true,
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (role_id, section_id)
);

create table if not exists public.community_role_topic_access (
  role_id uuid not null references public.community_roles(id) on delete cascade,
  topic_id uuid not null references public.community_topics(id) on delete cascade,
  can_access boolean not null default true,
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now(),
  primary key (role_id, topic_id)
);

-- Permission catalog.
insert into public.community_permissions
  (permission_key, name, description, category, moderator_only)
values
  ('invite_members', 'Invite members', 'Invite users to join the community.', 'membership', false),
  ('remove_members', 'Remove members', 'Remove members from the community.', 'membership', true),
  ('manage_member_roles', 'Manage member roles', 'Assign and remove community roles from members.', 'roles', true),
  ('create_polls', 'Start polls', 'Create a community poll.', 'polls', false),
  ('edit_polls', 'Edit polls', 'Edit polls created in the community.', 'polls', false),
  ('delete_polls', 'Delete polls', 'Delete community polls.', 'polls', true),
  ('create_events', 'Create community events', 'Create an event with a date and time.', 'events', false),
  ('approve_events', 'Approve community events', 'Approve or reject events submitted for approval.', 'events', true),
  ('edit_events', 'Edit community events', 'Edit community events.', 'events', false),
  ('delete_events', 'Delete community events', 'Delete community events.', 'events', true),
  ('moderate_posts', 'Moderate posts', 'Moderate community posts.', 'moderation', true),
  ('moderate_comments', 'Moderate comments', 'Moderate community comments.', 'moderation', true),
  ('manage_sections', 'Manage sections', 'Manage community sections.', 'community', true),
  ('manage_topics', 'Manage topics', 'Manage community topics.', 'community', true),
  ('manage_role_permissions', 'Manage role permissions', 'Configure permissions for community roles.', 'roles', true)
on conflict (permission_key) do nothing;

create or replace function public.community_roles_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_community_roles_updated_at on public.community_roles;
create trigger trg_community_roles_updated_at
before update on public.community_roles
for each row execute function public.community_roles_set_updated_at();

create or replace function public.validate_community_role_permission()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  role_is_moderator boolean;
  permission_is_moderator_only boolean;
begin
  select is_moderator into role_is_moderator
    from public.community_roles where id = new.role_id;

  select moderator_only into permission_is_moderator_only
    from public.community_permissions where id = new.permission_id;

  if permission_is_moderator_only and not coalesce(role_is_moderator, false) then
    raise exception 'This permission is reserved for moderator roles';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_community_role_permission
  on public.community_role_permissions;
create trigger trg_validate_community_role_permission
before insert or update on public.community_role_permissions
for each row execute function public.validate_community_role_permission();

create or replace function public.validate_community_member_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  member_community uuid;
  role_community uuid;
begin
  select community_id into member_community
    from public.community_members where id = new.member_id;

  select community_id into role_community
    from public.community_roles where id = new.role_id;

  if member_community is null or role_community is null
     or member_community <> role_community
     or new.community_id <> role_community then
    raise exception 'Member role assignment must belong to the same community';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_community_member_role
  on public.community_member_roles;
create trigger trg_validate_community_member_role
before insert or update on public.community_member_roles
for each row execute function public.validate_community_member_role();

-- Verified ownership relationship:
-- communities.owner_id -> auth.users.id.
create or replace function public.is_community_owner(target_community uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.communities c
    where c.id = target_community
      and c.owner_id = auth.uid()
  );
$$;

create or replace function public.has_community_permission(
  target_community uuid,
  requested_permission text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if public.is_community_owner(target_community) then
    return true;
  end if;

  return exists (
    select 1
      from public.community_member_roles cmr
      join public.community_members cm
        on cm.id = cmr.member_id
       and cm.community_id = target_community
      join public.community_role_permissions crp
        on crp.role_id = cmr.role_id
      join public.community_permissions cp
        on cp.id = crp.permission_id
     where cmr.community_id = target_community
       and cm.user_id = auth.uid()
       and cp.permission_key = requested_permission
  );
end;
$$;

-- Deny-by-exception access:
-- no row means the role can access the section/topic.
create or replace function public.role_can_access_section(
  target_role uuid,
  target_section uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select can_access from public.community_role_section_access
      where role_id = target_role and section_id = target_section),
    true
  );
$$;

create or replace function public.role_can_access_topic(
  target_role uuid,
  target_topic uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select can_access from public.community_role_topic_access
      where role_id = target_role and topic_id = target_topic),
    true
  );
$$;

alter table public.community_roles enable row level security;
alter table public.community_permissions enable row level security;
alter table public.community_role_permissions enable row level security;
alter table public.community_member_roles enable row level security;
alter table public.community_role_section_access enable row level security;
alter table public.community_role_topic_access enable row level security;

drop policy if exists "Anyone can read community permissions"
  on public.community_permissions;
create policy "Anyone can read community permissions"
on public.community_permissions
for select to authenticated
using (true);

drop policy if exists "Members can read community roles" on public.community_roles;
create policy "Members can read community roles"
on public.community_roles
for select to authenticated
using (
  exists (
    select 1 from public.community_members cm
    where cm.community_id = community_roles.community_id
      and cm.user_id = auth.uid()
  )
  or public.is_community_owner(community_id)
);

drop policy if exists "Owners can create community roles" on public.community_roles;
create policy "Owners can create community roles"
on public.community_roles
for insert to authenticated
with check (
  public.is_community_owner(community_id)
  and created_by = auth.uid()
);

drop policy if exists "Owners can update community roles" on public.community_roles;
create policy "Owners can update community roles"
on public.community_roles
for update to authenticated
using (public.is_community_owner(community_id))
with check (public.is_community_owner(community_id));

drop policy if exists "Owners can delete community roles" on public.community_roles;
create policy "Owners can delete community roles"
on public.community_roles
for delete to authenticated
using (public.is_community_owner(community_id));

drop policy if exists "Members can read role permissions"
  on public.community_role_permissions;
create policy "Members can read role permissions"
on public.community_role_permissions
for select to authenticated
using (
  exists (
    select 1
      from public.community_roles r
      join public.community_members cm on cm.community_id = r.community_id
     where r.id = community_role_permissions.role_id
       and cm.user_id = auth.uid()
  )
);

drop policy if exists "Owners manage role permissions"
  on public.community_role_permissions;
create policy "Owners manage role permissions"
on public.community_role_permissions
for all to authenticated
using (
  exists (
    select 1 from public.community_roles r
    where r.id = community_role_permissions.role_id
      and public.is_community_owner(r.community_id)
  )
)
with check (
  granted_by = auth.uid()
  and exists (
    select 1 from public.community_roles r
    where r.id = community_role_permissions.role_id
      and public.is_community_owner(r.community_id)
  )
);

drop policy if exists "Members can read member roles"
  on public.community_member_roles;
create policy "Members can read member roles"
on public.community_member_roles
for select to authenticated
using (
  exists (
    select 1 from public.community_members cm
    where cm.id = community_member_roles.member_id
      and cm.user_id = auth.uid()
  )
  or public.is_community_owner(community_id)
);

drop policy if exists "Owners manage member roles"
  on public.community_member_roles;
create policy "Owners manage member roles"
on public.community_member_roles
for all to authenticated
using (public.is_community_owner(community_id))
with check (
  assigned_by = auth.uid()
  and public.is_community_owner(community_id)
);

drop policy if exists "Members can read role section access"
  on public.community_role_section_access;
create policy "Members can read role section access"
on public.community_role_section_access
for select to authenticated
using (
  exists (
    select 1
      from public.community_roles r
      join public.community_members cm on cm.community_id = r.community_id
     where r.id = community_role_section_access.role_id
       and cm.user_id = auth.uid()
  )
);

drop policy if exists "Owners manage role section access"
  on public.community_role_section_access;
create policy "Owners manage role section access"
on public.community_role_section_access
for all to authenticated
using (
  exists (
    select 1 from public.community_roles r
    where r.id = community_role_section_access.role_id
      and public.is_community_owner(r.community_id)
  )
)
with check (
  updated_by = auth.uid()
  and exists (
    select 1 from public.community_roles r
    where r.id = community_role_section_access.role_id
      and public.is_community_owner(r.community_id)
  )
);

drop policy if exists "Members can read role topic access"
  on public.community_role_topic_access;
create policy "Members can read role topic access"
on public.community_role_topic_access
for select to authenticated
using (
  exists (
    select 1
      from public.community_roles r
      join public.community_members cm on cm.community_id = r.community_id
     where r.id = community_role_topic_access.role_id
       and cm.user_id = auth.uid()
  )
);

drop policy if exists "Owners manage role topic access"
  on public.community_role_topic_access;
create policy "Owners manage role topic access"
on public.community_role_topic_access
for all to authenticated
using (
  exists (
    select 1 from public.community_roles r
    where r.id = community_role_topic_access.role_id
      and public.is_community_owner(r.community_id)
  )
)
with check (
  updated_by = auth.uid()
  and exists (
    select 1 from public.community_roles r
    where r.id = community_role_topic_access.role_id
      and public.is_community_owner(r.community_id)
  )
);

commit;
