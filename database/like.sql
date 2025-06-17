create table public.like (
  post_id uuid not null default gen_random_uuid (),
  profile_id uuid not null default gen_random_uuid (),
  constraint like_pkey primary key (post_id, profile_id),
  constraint like_post_id_fkey foreign KEY (post_id) references post (id),
  constraint like_profile_id_fkey foreign KEY (profile_id) references profile (id)
) TABLESPACE pg_default;
