create table public.profile (
  id uuid not null,
  name text null,
  handle text null,
  avatar_url text null,
  constraint profile_pkey primary key (id),
  constraint profile_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;
