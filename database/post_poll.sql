create table public.post_poll (
  post_id uuid not null,
  question text null,
  created_at timestamp with time zone not null default now(),
  constraint post_poll_pkey primary key (post_id),
  constraint post_poll_post_id_fkey foreign key (post_id) references post (id) on delete cascade
) TABLESPACE pg_default;

create table public.post_poll_option (
  id uuid not null default gen_random_uuid(),
  post_id uuid not null,
  label text not null,
  position smallint not null check (position between 1 and 4),
  constraint post_poll_option_pkey primary key (id),
  constraint post_poll_option_post_id_fkey foreign key (post_id) references post_poll (post_id) on delete cascade,
  constraint post_poll_option_post_id_position_key unique (post_id, position)
) TABLESPACE pg_default;

create table public.post_poll_vote (
  post_id uuid not null,
  option_id uuid not null,
  profile_id uuid not null,
  voted_at timestamp with time zone not null default now(),
  constraint post_poll_vote_pkey primary key (post_id, profile_id),
  constraint post_poll_vote_post_id_fkey foreign key (post_id) references post_poll (post_id) on delete cascade,
  constraint post_poll_vote_option_id_fkey foreign key (option_id) references post_poll_option (id) on delete cascade,
  constraint post_poll_vote_profile_id_fkey foreign key (profile_id) references profile (id) on delete cascade
) TABLESPACE pg_default;

create index if not exists post_poll_option_post_idx on public.post_poll_option using btree (post_id);
create index if not exists post_poll_vote_option_idx on public.post_poll_vote using btree (option_id);
create index if not exists post_poll_vote_profile_idx on public.post_poll_vote using btree (profile_id);
