create table public.daily_vibe_status (
  profile_id uuid not null,
  vibe_date date not null default ((now() at time zone 'utc')::date),
  vibe text not null check (vibe in ('aura_up', 'real', 'mood', 'chaotic')),
  note text null check (char_length(note) <= 280),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint daily_vibe_status_pkey primary key (profile_id, vibe_date),
  constraint daily_vibe_status_profile_id_fkey foreign key (profile_id) references profile (id) on delete cascade
) TABLESPACE pg_default;

create index if not exists daily_vibe_status_vibe_date_vibe_idx
  on public.daily_vibe_status using btree (vibe_date, vibe);

create index if not exists daily_vibe_status_profile_date_idx
  on public.daily_vibe_status using btree (profile_id, vibe_date desc);

