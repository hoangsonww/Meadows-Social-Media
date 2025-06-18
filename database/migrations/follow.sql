create table public.follow (
  follower_id uuid not null default gen_random_uuid (),
  following_id uuid not null default gen_random_uuid (),
  constraint follow_pkey primary key (follower_id, following_id),
  constraint follow_follower_id_fkey foreign KEY (follower_id) references profile (id),
  constraint follow_following_id_fkey foreign KEY (following_id) references profile (id)
) TABLESPACE pg_default;
