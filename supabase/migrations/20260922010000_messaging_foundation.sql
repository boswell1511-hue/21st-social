-- 21st Social / Messaging Foundation
-- Repository migration for the messaging tables already created in Supabase.

begin;

create extension if not exists pgcrypto;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz null
);

create index if not exists conversations_created_by_idx on public.conversations (created_by);
create index if not exists conversations_updated_at_idx on public.conversations (updated_at desc);
create index if not exists conversation_members_conversation_id_idx on public.conversation_members (conversation_id);
create index if not exists conversation_members_user_id_idx on public.conversation_members (user_id);
create unique index if not exists conversation_members_unique_user_idx on public.conversation_members (conversation_id, user_id);
create index if not exists messages_conversation_created_at_idx on public.messages (conversation_id, created_at);
create index if not exists messages_sender_id_idx on public.messages (sender_id);

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Conversation members can view conversations" on public.conversations;
create policy "Conversation members can view conversations"
  on public.conversations for select to authenticated
  using (exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = conversations.id and cm.user_id = auth.uid()
  ));

drop policy if exists "Users can create conversations" on public.conversations;
create policy "Users can create conversations"
  on public.conversations for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists "Members can view conversation members" on public.conversation_members;
create policy "Members can view conversation members"
  on public.conversation_members for select to authenticated
  using (exists (
    select 1 from public.conversation_members own_members
    where own_members.conversation_id = conversation_members.conversation_id
      and own_members.user_id = auth.uid()
  ));

drop policy if exists "Conversation creators can add members" on public.conversation_members;
create policy "Conversation creators can add members"
  on public.conversation_members for insert to authenticated
  with check (exists (
    select 1 from public.conversations c
    where c.id = conversation_members.conversation_id and c.created_by = auth.uid()
  ));

drop policy if exists "Users can join conversations" on public.conversation_members;
create policy "Users can join conversations"
  on public.conversation_members for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Conversation members can view messages" on public.messages;
create policy "Conversation members can view messages"
  on public.messages for select to authenticated
  using (exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid()
  ));

drop policy if exists "Members can send messages" on public.messages;
create policy "Members can send messages"
  on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversation_members cm
      where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid()
    )
  );

drop policy if exists "Recipients can mark messages read" on public.messages;
create policy "Recipients can mark messages read"
  on public.messages for update to authenticated
  using (exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = messages.conversation_id
      and cm.user_id = auth.uid() and cm.user_id <> messages.sender_id
  ))
  with check (exists (
    select 1 from public.conversation_members cm
    where cm.conversation_id = messages.conversation_id
      and cm.user_id = auth.uid() and cm.user_id <> messages.sender_id
  ));

commit;
