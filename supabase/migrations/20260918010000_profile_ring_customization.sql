alter table public.profiles
  add column if not exists profile_ring_style text not null default 'none',
  add column if not exists profile_ring_primary_color text,
  add column if not exists profile_ring_secondary_color text;
