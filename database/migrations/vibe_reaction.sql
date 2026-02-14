create table public.vibe_reaction (
  post_id uuid not null,
  profile_id uuid not null,
  vibe text not null check (vibe in ('aura_up', 'real', 'mood', 'chaotic')),
  reacted_at timestamp with time zone not null default now(),
  constraint vibe_reaction_pkey primary key (post_id, profile_id),
  constraint vibe_reaction_post_id_fkey foreign key (post_id) references post (id) on delete cascade,
  constraint vibe_reaction_profile_id_fkey foreign key (profile_id) references profile (id) on delete cascade
) TABLESPACE pg_default;

create index if not exists vibe_reaction_post_vibe_idx on public.vibe_reaction using btree (post_id, vibe);
create index if not exists vibe_reaction_profile_idx on public.vibe_reaction using btree (profile_id);
