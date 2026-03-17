-- Meadows: Daily Vibe Pulse + Comments/Replies feature pack
-- Safe to re-run (idempotent where possible).

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 1) Post extension: fast feed-level comment counts
-- -----------------------------------------------------------------------------
alter table public.post
add column if not exists comment_count integer not null default 0
check (comment_count >= 0);

-- -----------------------------------------------------------------------------
-- 2) Daily vibe status
-- -----------------------------------------------------------------------------
create table if not exists public.daily_vibe_status (
  profile_id uuid not null,
  vibe_date date not null default ((now() at time zone 'utc')::date),
  vibe text not null check (vibe in ('aura_up', 'real', 'mood', 'chaotic')),
  note text null check (char_length(note) <= 280),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint daily_vibe_status_pkey primary key (profile_id, vibe_date),
  constraint daily_vibe_status_profile_id_fkey
    foreign key (profile_id) references public.profile (id) on delete cascade
) tablespace pg_default;

create index if not exists daily_vibe_status_vibe_date_vibe_idx
  on public.daily_vibe_status using btree (vibe_date, vibe);

create index if not exists daily_vibe_status_profile_date_idx
  on public.daily_vibe_status using btree (profile_id, vibe_date desc);

-- -----------------------------------------------------------------------------
-- 3) Comments + one-level replies
-- -----------------------------------------------------------------------------
create table if not exists public.post_comment (
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
  constraint post_comment_post_id_fkey
    foreign key (post_id) references public.post (id) on delete cascade,
  constraint post_comment_author_id_fkey
    foreign key (author_id) references public.profile (id) on delete cascade,
  constraint post_comment_parent_comment_id_fkey
    foreign key (parent_comment_id) references public.post_comment (id) on delete cascade,
  constraint post_comment_content_or_image_check
    check (nullif(btrim(content), '') is not null or image_url is not null)
) tablespace pg_default;

create index if not exists post_comment_post_parent_created_idx
  on public.post_comment using btree (post_id, parent_comment_id, created_at desc);

create index if not exists post_comment_post_top_score_idx
  on public.post_comment using btree (
    post_id,
    parent_comment_id,
    engagement_score desc,
    created_at desc
  );

create index if not exists post_comment_author_created_idx
  on public.post_comment using btree (author_id, created_at desc);

-- -----------------------------------------------------------------------------
-- 4) Comment vibe reactions
-- -----------------------------------------------------------------------------
create table if not exists public.post_comment_vibe_reaction (
  comment_id uuid not null,
  profile_id uuid not null,
  vibe text not null check (vibe in ('aura_up', 'real', 'mood', 'chaotic')),
  reacted_at timestamp with time zone not null default now(),
  constraint post_comment_vibe_reaction_pkey primary key (comment_id, profile_id),
  constraint post_comment_vibe_reaction_comment_id_fkey
    foreign key (comment_id) references public.post_comment (id) on delete cascade,
  constraint post_comment_vibe_reaction_profile_id_fkey
    foreign key (profile_id) references public.profile (id) on delete cascade
) tablespace pg_default;

create index if not exists post_comment_vibe_reaction_comment_vibe_idx
  on public.post_comment_vibe_reaction using btree (comment_id, vibe);

create index if not exists post_comment_vibe_reaction_profile_idx
  on public.post_comment_vibe_reaction using btree (profile_id);

-- -----------------------------------------------------------------------------
-- 5) Comment reports
-- -----------------------------------------------------------------------------
create table if not exists public.post_comment_report (
  id uuid not null default gen_random_uuid(),
  comment_id uuid not null,
  reporter_id uuid not null,
  reason text not null check (char_length(reason) between 2 and 80),
  details text null check (char_length(details) <= 500),
  created_at timestamp with time zone not null default now(),
  constraint post_comment_report_pkey primary key (id),
  constraint post_comment_report_unique unique (comment_id, reporter_id),
  constraint post_comment_report_comment_id_fkey
    foreign key (comment_id) references public.post_comment (id) on delete cascade,
  constraint post_comment_report_reporter_id_fkey
    foreign key (reporter_id) references public.profile (id) on delete cascade
) tablespace pg_default;

create index if not exists post_comment_report_comment_idx
  on public.post_comment_report using btree (comment_id, created_at desc);

-- -----------------------------------------------------------------------------
-- 6) Mentions
-- -----------------------------------------------------------------------------
create table if not exists public.post_comment_mention (
  comment_id uuid not null,
  mentioned_profile_id uuid not null,
  created_at timestamp with time zone not null default now(),
  constraint post_comment_mention_pkey primary key (comment_id, mentioned_profile_id),
  constraint post_comment_mention_comment_id_fkey
    foreign key (comment_id) references public.post_comment (id) on delete cascade,
  constraint post_comment_mention_mentioned_profile_id_fkey
    foreign key (mentioned_profile_id) references public.profile (id) on delete cascade
) tablespace pg_default;

create index if not exists post_comment_mention_profile_idx
  on public.post_comment_mention using btree (mentioned_profile_id, created_at desc);

-- -----------------------------------------------------------------------------
-- 7) Notifications
-- -----------------------------------------------------------------------------
create table if not exists public.notification (
  id uuid not null default gen_random_uuid(),
  recipient_id uuid not null,
  actor_id uuid null,
  type text not null
    check (type in ('post_comment', 'comment_reply', 'comment_mention', 'comment_vibe')),
  post_id uuid null,
  comment_id uuid null,
  payload jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamp with time zone not null default now(),
  constraint notification_pkey primary key (id),
  constraint notification_recipient_id_fkey
    foreign key (recipient_id) references public.profile (id) on delete cascade,
  constraint notification_actor_id_fkey
    foreign key (actor_id) references public.profile (id) on delete set null,
  constraint notification_post_id_fkey
    foreign key (post_id) references public.post (id) on delete cascade,
  constraint notification_comment_id_fkey
    foreign key (comment_id) references public.post_comment (id) on delete cascade
) tablespace pg_default;

create index if not exists notification_recipient_unread_idx
  on public.notification using btree (recipient_id, is_read, created_at desc);

create index if not exists notification_recipient_created_idx
  on public.notification using btree (recipient_id, created_at desc);

-- -----------------------------------------------------------------------------
-- 8) Trigger helpers
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_daily_vibe_status_updated_at on public.daily_vibe_status;
create trigger trg_touch_daily_vibe_status_updated_at
before update on public.daily_vibe_status
for each row
execute function public.touch_updated_at();

drop trigger if exists trg_touch_post_comment_updated_at on public.post_comment;
create trigger trg_touch_post_comment_updated_at
before update on public.post_comment
for each row
execute function public.touch_updated_at();

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

-- -----------------------------------------------------------------------------
-- 9) Counter resync (safe backfill)
-- -----------------------------------------------------------------------------
with post_counts as (
  select post_id, count(*)::integer as cnt
  from public.post_comment
  group by post_id
)
update public.post p
set comment_count = coalesce(pc.cnt, 0)
from post_counts pc
where p.id = pc.post_id;

update public.post p
set comment_count = 0
where not exists (
  select 1
  from public.post_comment c
  where c.post_id = p.id
);

with reply_counts as (
  select parent_comment_id as comment_id, count(*)::integer as cnt
  from public.post_comment
  where parent_comment_id is not null
  group by parent_comment_id
)
update public.post_comment c
set reply_count = coalesce(rc.cnt, 0)
from reply_counts rc
where c.id = rc.comment_id;

update public.post_comment
set reply_count = 0
where id not in (
  select distinct parent_comment_id
  from public.post_comment
  where parent_comment_id is not null
);

with vibe_counts as (
  select comment_id, count(*)::integer as cnt
  from public.post_comment_vibe_reaction
  group by comment_id
)
update public.post_comment c
set vibe_count = coalesce(vc.cnt, 0)
from vibe_counts vc
where c.id = vc.comment_id;

update public.post_comment
set vibe_count = 0
where id not in (
  select distinct comment_id
  from public.post_comment_vibe_reaction
);

