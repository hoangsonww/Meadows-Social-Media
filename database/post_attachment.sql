create table public.post_attachment (
  id uuid not null default gen_random_uuid(),
  post_id uuid not null,
  path text not null,
  position smallint not null check (position between 1 and 8),
  created_at timestamp with time zone not null default now(),
  constraint post_attachment_pkey primary key (id),
  constraint post_attachment_post_id_fkey foreign key (post_id) references post (id) on delete cascade,
  constraint post_attachment_post_id_position_key unique (post_id, position)
) TABLESPACE pg_default;

create index if not exists post_attachment_post_idx on public.post_attachment using btree (post_id);
