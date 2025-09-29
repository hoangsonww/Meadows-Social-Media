create table public.bookmark (
  profile_id uuid not null,
  post_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint bookmark_pkey primary key (profile_id, post_id),
  constraint bookmark_profile_id_fkey foreign key (profile_id) references profile (id) on delete cascade,
  constraint bookmark_post_id_fkey foreign key (post_id) references post (id) on delete cascade
) TABLESPACE pg_default;
