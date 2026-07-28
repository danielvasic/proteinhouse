-- Admin panel → Korisnici: listanje i dodjela admin role BEZ service_role
-- ključa u frontendu. Security definer funkcije koje iznutra provjeravaju
-- da je pozivalac admin (is_admin() iz postojeće šeme).
-- Run: Supabase Dashboard → SQL Editor → Run

-- ── Lista korisnika ──────────────────────────────────────────────────────────
create or replace function admin_list_users()
returns table (
  id                 uuid,
  email              text,
  full_name          text,
  role               text,
  created_at         timestamptz,
  last_sign_in_at    timestamptz,
  email_confirmed_at timestamptz
) language plpgsql security definer set search_path = public, auth as $$
begin
  if not is_admin() then
    raise exception 'Samo administratori mogu vidjeti korisnike.';
  end if;
  return query
    select u.id,
           u.email::text,
           u.raw_user_meta_data->>'full_name',
           u.raw_user_meta_data->>'role',
           u.created_at,
           u.last_sign_in_at,
           u.email_confirmed_at
      from auth.users u
     order by u.created_at desc;
end; $$;

revoke execute on function admin_list_users() from public, anon;
grant  execute on function admin_list_users() to authenticated;

-- ── Postavi / ukloni admin rolu ──────────────────────────────────────────────
create or replace function admin_set_role(p_user_id uuid, p_admin boolean)
returns void language plpgsql security definer set search_path = public, auth as $$
begin
  if not is_admin() then
    raise exception 'Samo administratori mogu mijenjati role.';
  end if;
  if p_user_id = auth.uid() and not p_admin then
    raise exception 'Ne možete sami sebi oduzeti admin pristup.';
  end if;
  update auth.users
     set raw_user_meta_data = case
       when p_admin then coalesce(raw_user_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
       else              coalesce(raw_user_meta_data, '{}'::jsonb) - 'role'
     end
   where id = p_user_id;
end; $$;

revoke execute on function admin_set_role(uuid, boolean) from public, anon;
grant  execute on function admin_set_role(uuid, boolean) to authenticated;
