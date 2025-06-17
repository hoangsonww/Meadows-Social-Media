-- Create a profile table, establish the relationship between
-- the profile table and the auth.user table, and set up the
-- postgres function and trigger to create a new profile row
-- every time a new user signs up.
create table public.profile (
id uuid not null references auth.users on delete cascade,
name text,
handle text,
avatar_url text,
primary key (id)
);

-- Create a function that inserts a new row into the profile
-- based on a new user's data.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
insert into public.profile (id, name, handle)
values (new.id, new.raw_user_meta_data ->> 'name', new.raw_user_meta_data ->> 'handle');
return new;
end;
$$;

-- Create a trigger that runs the above function whenever a new
-- user gets signed up.
create or replace trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
