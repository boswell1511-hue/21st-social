-- 21st Social / Community Topics
-- Make optional topic fields genuinely optional.

begin;

alter table public.community_topics
  alter column description drop not null,
  alter column icon drop not null;

commit;
