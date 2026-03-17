alter table public.post
add column if not exists comment_count integer not null default 0 check (comment_count >= 0);

create table public.post_comment (
  id uuid not null default gen_random_uuid(),
  post_id uuid not null,
  author_id uuid not null,
  parent_comment_id uuid null,
  content text null check (char_length(content) <= 500),
  image_url text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  reply_count integer not null default 0 check (reply_count >= 0),
  vibe_count integer not null default 0 check (vibe_count >= 0),
  engagement_score integer generated always as (vibe_count + (reply_count * 2)) stored,
  constraint post_comment_pkey primary key (id),
  constraint post_comment_post_id_fkey foreign key (post_id) references post (id) on delete cascade,
  constraint post_comment_author_id_fkey foreign key (author_id) references profile (id) on delete cascade,
  constraint post_comment_parent_comment_id_fkey foreign key (parent_comment_id) references post_comment (id) on delete cascade,
  constraint post_comment_content_or_image_check check (
    nullif(btrim(content), '') is not null or image_url is not null
  )
) TABLESPACE pg_default;

create index if not exists post_comment_post_parent_created_idx
  on public.post_comment using btree (post_id, parent_comment_id, created_at desc);

create index if not exists post_comment_post_top_score_idx
  on public.post_comment using btree (post_id, parent_comment_id, engagement_score desc, created_at desc);

create index if not exists post_comment_author_created_idx
  on public.post_comment using btree (author_id, created_at desc);

create table public.post_comment_vibe_reaction (
  comment_id uuid not null,
  profile_id uuid not null,
  vibe text not null check (vibe in ('aura_up', 'real', 'mood', 'chaotic')),
  reacted_at timestamp with time zone not null default now(),
  constraint post_comment_vibe_reaction_pkey primary key (comment_id, profile_id),
  constraint post_comment_vibe_reaction_comment_id_fkey foreign key (comment_id) references post_comment (id) on delete cascade,
  constraint post_comment_vibe_reaction_profile_id_fkey foreign key (profile_id) references profile (id) on delete cascade
) TABLESPACE pg_default;

create index if not exists post_comment_vibe_reaction_comment_vibe_idx
  on public.post_comment_vibe_reaction using btree (comment_id, vibe);

create index if not exists post_comment_vibe_reaction_profile_idx
  on public.post_comment_vibe_reaction using btree (profile_id);

create table public.post_comment_report (
  id uuid not null default gen_random_uuid(),
  comment_id uuid not null,
  reporter_id uuid not null,
  reason text not null check (char_length(reason) between 2 and 80),
  details text null check (char_length(details) <= 500),
  created_at timestamp with time zone not null default now(),
  constraint post_comment_report_pkey primary key (id),
  constraint post_comment_report_unique unique (comment_id, reporter_id),
  constraint post_comment_report_comment_id_fkey foreign key (comment_id) references post_comment (id) on delete cascade,
  constraint post_comment_report_reporter_id_fkey foreign key (reporter_id) references profile (id) on delete cascade
) TABLESPACE pg_default;

create index if not exists post_comment_report_comment_idx
  on public.post_comment_report using btree (comment_id, created_at desc);

create table public.post_comment_mention (
  comment_id uuid not null,
  mentioned_profile_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint post_comment_mention_pkey primary key (comment_id, mentioned_profile_id),
  constraint post_comment_mention_comment_id_fkey foreign key (comment_id) references post_comment (id) on delete cascade,
  constraint post_comment_mention_mentioned_profile_id_fkey foreign key (mentioned_profile_id) references profile (id) on delete cascade
) TABLESPACE pg_default;

create index if not exists post_comment_mention_profile_idx
  on public.post_comment_mention using btree (mentioned_profile_id, created_at desc);

create table public.notification (
  id uuid not null default gen_random_uuid(),
  recipient_id uuid not null,
  actor_id uuid null,
  type text not null check (
    type in ('post_comment', 'comment_reply', 'comment_mention', 'comment_vibe')
  ),
  post_id uuid null,
  comment_id uuid null,
  payload jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamp with time zone not null default now(),
  constraint notification_pkey primary key (id),
  constraint notification_recipient_id_fkey foreign key (recipient_id) references profile (id) on delete cascade,
  constraint notification_actor_id_fkey foreign key (actor_id) references profile (id) on delete set null,
  constraint notification_post_id_fkey foreign key (post_id) references post (id) on delete cascade,
  constraint notification_comment_id_fkey foreign key (comment_id) references post_comment (id) on delete cascade
) TABLESPACE pg_default;

create index if not exists notification_recipient_unread_idx
  on public.notification using btree (recipient_id, is_read, created_at desc);

create index if not exists notification_recipient_created_idx
  on public.notification using btree (recipient_id, created_at desc);

create or replace function public.enforce_post_comment_reply_depth()
returns trigger
language plpgsql
as $$
declare
  parent_post_id uuid;
  parent_parent_comment_id uuid;
begin
  if new.parent_comment_id is null then
    return new;
  end if;

  select post_id, parent_comment_id
  into parent_post_id, parent_parent_comment_id
  from public.post_comment
  where id = new.parent_comment_id;

  if parent_post_id is null then
    raise exception 'Parent comment does not exist.';
  end if;

  if parent_post_id <> new.post_id then
    raise exception 'Reply must target a comment on the same post.';
  end if;

  if parent_parent_comment_id is not null then
    raise exception 'Only one reply level is allowed.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_post_comment_reply_depth on public.post_comment;
create trigger trg_enforce_post_comment_reply_depth
before insert or update of parent_comment_id, post_id
on public.post_comment
for each row
execute function public.enforce_post_comment_reply_depth();

create or replace function public.enforce_post_comment_rate_limit()
returns trigger
language plpgsql
as $$
declare
  recent_count integer;
begin
  select count(*)
  into recent_count
  from public.post_comment
  where author_id = new.author_id
    and created_at >= (now() - interval '30 seconds');

  if recent_count >= 6 then
    raise exception 'Comment rate limit exceeded. Please slow down.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_post_comment_rate_limit on public.post_comment;
create trigger trg_enforce_post_comment_rate_limit
before insert
on public.post_comment
for each row
execute function public.enforce_post_comment_rate_limit();

create or replace function public.handle_post_comment_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.post
    set comment_count = comment_count + 1
    where id = new.post_id;
    return new;
  end if;

  update public.post
  set comment_count = greatest(comment_count - 1, 0)
  where id = old.post_id;
  return old;
end;
$$;

drop trigger if exists trg_handle_post_comment_count on public.post_comment;
create trigger trg_handle_post_comment_count
after insert or delete
on public.post_comment
for each row
execute function public.handle_post_comment_count();

create or replace function public.handle_post_comment_reply_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' and new.parent_comment_id is not null then
    update public.post_comment
    set reply_count = reply_count + 1
    where id = new.parent_comment_id;
    return new;
  end if;

  if tg_op = 'DELETE' and old.parent_comment_id is not null then
    update public.post_comment
    set reply_count = greatest(reply_count - 1, 0)
    where id = old.parent_comment_id;
    return old;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_handle_post_comment_reply_count on public.post_comment;
create trigger trg_handle_post_comment_reply_count
after insert or delete
on public.post_comment
for each row
execute function public.handle_post_comment_reply_count();

create or replace function public.handle_post_comment_vibe_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.post_comment
    set vibe_count = vibe_count + 1
    where id = new.comment_id;
    return new;
  end if;

  update public.post_comment
  set vibe_count = greatest(vibe_count - 1, 0)
  where id = old.comment_id;
  return old;
end;
$$;

drop trigger if exists trg_handle_post_comment_vibe_count on public.post_comment_vibe_reaction;
create trigger trg_handle_post_comment_vibe_count
after insert or delete
on public.post_comment_vibe_reaction
for each row
execute function public.handle_post_comment_vibe_count();

