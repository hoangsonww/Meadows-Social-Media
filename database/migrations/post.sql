create table public.post (
  id uuid not null default gen_random_uuid (),
  content text not null,
  posted_at timestamp with time zone null,
  author_id uuid null default gen_random_uuid (),
  attachment_url text null,
  constraint post_pkey primary key (id),
  constraint post_author_id_fkey foreign KEY (author_id) references profile (id)
) TABLESPACE pg_default;
