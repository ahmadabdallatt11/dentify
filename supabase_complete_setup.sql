-- =============================================================
-- DENTIFY | Production-oriented Supabase schema and RLS
-- Run in Supabase SQL Editor after taking a backup.
-- This script does NOT create a fake Auth account or bypass email verification.
-- =============================================================
create extension if not exists pgcrypto;

-- Core profile table. Extra columns are added safely for existing projects.
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '', email text, phone text,
 gender text check (gender in ('male','female','prefer_not_to_say')),
 university text, major text,
 academic_year text check (academic_year in ('first','second','third','fourth','graduate','school','other')),
 governorate text, date_of_birth date, avatar_path text,
 role text not null default 'student' check (role in ('student','admin')),
 is_active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.profiles add column if not exists full_name text not null default '';
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists university text;
alter table public.profiles add column if not exists major text;
alter table public.profiles add column if not exists academic_year text;
alter table public.profiles add column if not exists governorate text;
alter table public.profiles add column if not exists date_of_birth date;
alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles add column if not exists role text not null default 'student';
alter table public.profiles add column if not exists is_active boolean not null default true;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

create table if not exists public.courses (
 id uuid primary key default gen_random_uuid(), title_ar text not null, title_en text not null,
 slug text not null unique, description_ar text not null default '', description_en text not null default '',
 image_path text, instructor_name text, price_jod numeric(10,2) not null default 0 check(price_jod>=0),
 is_published boolean not null default false, sort_order integer not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.courses add column if not exists title_ar text not null default '';
alter table public.courses add column if not exists title_en text not null default '';
alter table public.courses add column if not exists slug text;
alter table public.courses add column if not exists description_ar text not null default '';
alter table public.courses add column if not exists description_en text not null default '';
alter table public.courses add column if not exists image_path text;
alter table public.courses add column if not exists instructor_name text;
alter table public.courses add column if not exists price_jod numeric(10,2) not null default 0;
alter table public.courses add column if not exists is_published boolean not null default false;
alter table public.courses add column if not exists sort_order integer not null default 0;
alter table public.courses add column if not exists created_at timestamptz not null default now();
alter table public.courses add column if not exists updated_at timestamptz not null default now();
create unique index if not exists courses_slug_unique_idx on public.courses(slug) where slug is not null;

create table if not exists public.course_lessons (
 id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id) on delete cascade,
 title_ar text not null, title_en text not null, description_ar text not null default '', description_en text not null default '',
 video_path text, duration_seconds integer not null default 0 check(duration_seconds>=0), sort_order integer not null default 0,
 is_preview boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.course_lessons add column if not exists description_ar text not null default '';
alter table public.course_lessons add column if not exists description_en text not null default '';
alter table public.course_lessons add column if not exists video_path text;
alter table public.course_lessons add column if not exists duration_seconds integer not null default 0;
alter table public.course_lessons add column if not exists sort_order integer not null default 0;
alter table public.course_lessons add column if not exists is_preview boolean not null default false;
alter table public.course_lessons add column if not exists updated_at timestamptz not null default now();

create table if not exists public.cart_items (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 course_id uuid not null references public.courses(id) on delete cascade, created_at timestamptz not null default now(),
 unique(user_id,course_id)
);
create table if not exists public.cliq_orders (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete restrict,
 status text not null default 'pending' check(status in ('pending','approved','rejected','cancelled')),
 amount_jod numeric(10,2) not null check(amount_jod>=0), cliq_alias text, bank_name text,
 transfer_reference text, proof_path text, admin_note text, reviewed_by uuid references public.profiles(id) on delete set null,
 reviewed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.cliq_orders add column if not exists status text not null default 'pending';
alter table public.cliq_orders add column if not exists amount_jod numeric(10,2) not null default 0;
alter table public.cliq_orders add column if not exists cliq_alias text;
alter table public.cliq_orders add column if not exists bank_name text;
alter table public.cliq_orders add column if not exists transfer_reference text;
alter table public.cliq_orders add column if not exists proof_path text;
alter table public.cliq_orders add column if not exists admin_note text;
alter table public.cliq_orders add column if not exists reviewed_by uuid references public.profiles(id) on delete set null;
alter table public.cliq_orders add column if not exists reviewed_at timestamptz;
alter table public.cliq_orders add column if not exists updated_at timestamptz not null default now();
create table if not exists public.cliq_order_items (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.cliq_orders(id) on delete cascade,
 course_id uuid not null references public.courses(id) on delete restrict, price_jod numeric(10,2) not null check(price_jod>=0),
 unique(order_id,course_id)
);
create table if not exists public.enrollments (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 course_id uuid not null references public.courses(id) on delete cascade, order_id uuid references public.cliq_orders(id) on delete set null,
 granted_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), unique(user_id,course_id)
);
create table if not exists public.course_lesson_progress (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 course_id uuid not null references public.courses(id) on delete cascade,
 lesson_id uuid not null references public.course_lessons(id) on delete cascade,
 is_completed boolean not null default true, updated_at timestamptz not null default now(), unique(user_id,lesson_id)
);
create table if not exists public.site_settings (
 key text primary key, value jsonb not null default '{}'::jsonb,
 updated_by uuid references public.profiles(id) on delete set null, updated_at timestamptz not null default now()
);

create index if not exists idx_courses_published_order on public.courses(is_published,sort_order);
create index if not exists idx_lessons_course_order on public.course_lessons(course_id,sort_order);
create index if not exists idx_cart_user on public.cart_items(user_id);
create index if not exists idx_orders_user_created on public.cliq_orders(user_id,created_at desc);
create index if not exists idx_orders_status on public.cliq_orders(status);
create index if not exists idx_enrollments_user on public.enrollments(user_id);
create index if not exists idx_profiles_university on public.profiles(university);

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='admin' and p.is_active=true);
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at=now(); return new; end; $$;

-- Auth trigger: public metadata cannot set roles or account status. Invalid optional dates must never break signup.
create or replace function public.try_parse_date(p_value text)
returns date language plpgsql immutable set search_path = '' as $
begin
 if coalesce(trim(p_value),'')='' then return null; end if;
 return p_value::date;
exception when others then return null;
end; $;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
 insert into public.profiles(id,full_name,email,phone,gender,university,major,academic_year,governorate,date_of_birth,role,is_active)
 values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),new.email,new.raw_user_meta_data->>'phone',
 case when new.raw_user_meta_data->>'gender' in ('male','female','prefer_not_to_say') then new.raw_user_meta_data->>'gender' else null end,
 new.raw_user_meta_data->>'university',new.raw_user_meta_data->>'major',
 case when new.raw_user_meta_data->>'academic_year' in ('first','second','third','fourth','graduate','school','other') then new.raw_user_meta_data->>'academic_year' else null end,
 new.raw_user_meta_data->>'governorate',
 public.try_parse_date(new.raw_user_meta_data->>'date_of_birth'),
 'student',true)
 on conflict(id) do update set email=excluded.email;
 return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_created_dentify on auth.users;
create trigger on_auth_user_created_dentify after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.sync_auth_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin update public.profiles set email=new.email,updated_at=now() where id=new.id; return new; end; $$;
drop trigger if exists on_auth_user_updated on auth.users;
drop trigger if exists on_auth_email_updated_dentify on auth.users;
create trigger on_auth_email_updated_dentify after update of email on auth.users for each row execute function public.sync_auth_email();

create or replace function public.is_active_user()
returns boolean language sql stable security definer set search_path = '' as $
 select exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.is_active=true);
$;
revoke all on function public.is_active_user() from public;
grant execute on function public.is_active_user() to authenticated;

-- Prevent self-promotion and self-reactivation from client updates.
create or replace function public.protect_profile_privileges()
returns trigger language plpgsql set search_path = '' as $$
begin
 if auth.uid() is not null and old.role is distinct from new.role and not public.is_admin() then raise exception 'Only an admin may change roles'; end if;
 if auth.uid() is not null and old.is_active is distinct from new.is_active and not public.is_admin() then raise exception 'Only an admin may change account status'; end if;
 return new;
end; $$;
drop trigger if exists protect_profile_privileges_dentify on public.profiles;
create trigger protect_profile_privileges_dentify before update on public.profiles for each row execute function public.protect_profile_privileges();

-- Atomic order creation: prices are read from courses on the server, not trusted from the browser.
create or replace function public.create_cliq_order_from_cart(p_transfer_reference text,p_proof_path text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_user uuid := auth.uid(); v_order uuid; v_total numeric(10,2);
begin
 if v_user is null then raise exception 'Authentication required'; end if;
 if not exists(select 1 from public.profiles p where p.id=v_user and p.is_active=true) then raise exception 'Account inactive'; end if;
 if coalesce(trim(p_transfer_reference),'')='' then raise exception 'Transfer reference required'; end if;
 if coalesce(trim(p_proof_path),'')='' or split_part(p_proof_path,'/',1)<>v_user::text then raise exception 'Invalid payment proof path'; end if;
 if not exists(select 1 from public.cart_items ci where ci.user_id=v_user) then raise exception 'Cart is empty'; end if;
 select coalesce(sum(c.price_jod),0) into v_total from public.cart_items ci join public.courses c on c.id=ci.course_id where ci.user_id=v_user and c.is_published=true;
 if v_total<=0 then raise exception 'Cart total is invalid or contains no published courses'; end if;
 insert into public.cliq_orders(user_id,status,amount_jod,transfer_reference,proof_path)
 values(v_user,'pending',v_total,trim(p_transfer_reference),p_proof_path) returning id into v_order;
 insert into public.cliq_order_items(order_id,course_id,price_jod)
 select v_order,c.id,c.price_jod from public.cart_items ci join public.courses c on c.id=ci.course_id where ci.user_id=v_user and c.is_published=true;
 return v_order;
end; $$;
revoke all on function public.create_cliq_order_from_cart(text,text) from public;
grant execute on function public.create_cliq_order_from_cart(text,text) to authenticated;

-- Atomic admin review: approval grants all courses in the order and clears only those cart entries.
create or replace function public.review_cliq_order(p_order_id uuid,p_status text,p_admin_note text default null)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_order public.cliq_orders%rowtype; v_admin uuid := auth.uid();
begin
 if v_admin is null or not public.is_admin() then raise exception 'Admin access required'; end if;
 if p_status not in ('approved','rejected') then raise exception 'Invalid review status'; end if;
 select * into v_order from public.cliq_orders where id=p_order_id for update;
 if not found then raise exception 'Order not found'; end if;
 if v_order.status<>'pending' then raise exception 'Order has already been reviewed'; end if;
 update public.cliq_orders set status=p_status,admin_note=nullif(trim(coalesce(p_admin_note,'')),''),reviewed_by=v_admin,reviewed_at=now(),updated_at=now() where id=p_order_id;
 if p_status='approved' then
   insert into public.enrollments(user_id,course_id,order_id,granted_by)
   select v_order.user_id,oi.course_id,v_order.id,v_admin from public.cliq_order_items oi where oi.order_id=v_order.id
   on conflict(user_id,course_id) do nothing;
   delete from public.cart_items ci using public.cliq_order_items oi where oi.order_id=v_order.id and ci.user_id=v_order.user_id and ci.course_id=oi.course_id;
 end if;
 return true;
end; $$;
revoke all on function public.review_cliq_order(uuid,text,text) from public;
grant execute on function public.review_cliq_order(uuid,text,text) to authenticated;

-- RLS enablement
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.course_lessons enable row level security;
alter table public.cart_items enable row level security;
alter table public.cliq_orders enable row level security;
alter table public.cliq_order_items enable row level security;
alter table public.enrollments enable row level security;
alter table public.course_lesson_progress enable row level security;
alter table public.site_settings enable row level security;

-- Remove known old policies to make reruns predictable.
drop policy if exists profile_select_self_or_admin on public.profiles;
drop policy if exists profile_update_self_or_admin on public.profiles;
drop policy if exists profiles_select_self_admin on public.profiles;
drop policy if exists profiles_update_self_admin on public.profiles;
drop policy if exists courses_public_read on public.courses;
drop policy if exists published_courses_read on public.courses;
drop policy if exists courses_admin_all on public.courses;
drop policy if exists admin_manage_courses on public.courses;
drop policy if exists lessons_access on public.course_lessons;
drop policy if exists lesson_access on public.course_lessons;
drop policy if exists lessons_admin_all on public.course_lessons;
drop policy if exists admin_manage_lessons on public.course_lessons;
drop policy if exists cart_owner_all on public.cart_items;
drop policy if exists cart_owner_access on public.cart_items;
drop policy if exists order_read_owner_or_admin on public.cliq_orders;
drop policy if exists order_create_owner on public.cliq_orders;
drop policy if exists order_admin_update on public.cliq_orders;
drop policy if exists order_admin_delete on public.cliq_orders;
drop policy if exists order_items_read_owner_admin on public.cliq_order_items;
drop policy if exists order_items_insert_pending_owner on public.cliq_order_items;
drop policy if exists order_items_admin_manage on public.cliq_order_items;
drop policy if exists enrollment_read_owner_admin on public.enrollments;
drop policy if exists enrollment_admin_manage on public.enrollments;
drop policy if exists progress_owner_all on public.course_lesson_progress;
drop policy if exists settings_public_read on public.site_settings;
drop policy if exists settings_admin_all on public.site_settings;

create policy profiles_select_self_admin on public.profiles for select to authenticated using(id=(select auth.uid()) or (select public.is_admin()));
create policy profiles_update_self_admin on public.profiles for update to authenticated using(id=(select auth.uid()) or (select public.is_admin())) with check((id=(select auth.uid()) and role='student') or (select public.is_admin()));
create policy profiles_admin_delete on public.profiles for delete to authenticated using((select public.is_admin()));
create policy courses_public_read on public.courses for select to anon,authenticated using(is_published=true or (select public.is_admin()));
create policy courses_admin_all on public.courses for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy lessons_access on public.course_lessons for select to anon,authenticated using(((is_preview=true) and exists(select 1 from public.courses c where c.id=course_lessons.course_id and c.is_published=true)) or (select public.is_admin()) or exists(select 1 from public.enrollments e join public.profiles p on p.id=e.user_id where e.course_id=course_lessons.course_id and e.user_id=(select auth.uid()) and p.is_active=true));
create policy lessons_admin_all on public.course_lessons for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy cart_owner_all on public.cart_items for all to authenticated using((user_id=(select auth.uid()) and (select public.is_active_user())) or (select public.is_admin())) with check((user_id=(select auth.uid()) and (select public.is_active_user())) or (select public.is_admin()));
create policy order_read_owner_or_admin on public.cliq_orders for select to authenticated using((user_id=(select auth.uid()) and (select public.is_active_user())) or (select public.is_admin()));
create policy order_create_owner on public.cliq_orders for insert to authenticated with check(user_id=(select auth.uid()) and (select public.is_active_user()) and status='pending' and reviewed_by is null and reviewed_at is null);
create policy order_admin_update on public.cliq_orders for update to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy order_admin_delete on public.cliq_orders for delete to authenticated using((select public.is_admin()));
create policy order_items_read_owner_admin on public.cliq_order_items for select to authenticated using((select public.is_admin()) or exists(select 1 from public.cliq_orders o where o.id=cliq_order_items.order_id and o.user_id=(select auth.uid()) and (select public.is_active_user())));
create policy order_items_admin_manage on public.cliq_order_items for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy enrollment_read_owner_admin on public.enrollments for select to authenticated using((user_id=(select auth.uid()) and (select public.is_active_user())) or (select public.is_admin()));
create policy enrollment_admin_manage on public.enrollments for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
create policy progress_owner_all on public.course_lesson_progress for all to authenticated using((user_id=(select auth.uid()) and (select public.is_active_user())) or (select public.is_admin())) with check((user_id=(select auth.uid()) and (select public.is_active_user())) or (select public.is_admin()));
create policy settings_public_read on public.site_settings for select to anon,authenticated using(key in ('brand_name','logo_url','primary_color','secondary_color','default_language','support_email','cliq_alias','cliq_bank_name','cliq_qr_url') or (select public.is_admin()));
create policy settings_admin_all on public.site_settings for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));

-- Updated-at triggers for mutable records.
drop trigger if exists profiles_updated_at_dentify on public.profiles;
create trigger profiles_updated_at_dentify before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists courses_updated_at_dentify on public.courses;
create trigger courses_updated_at_dentify before update on public.courses for each row execute function public.set_updated_at();
drop trigger if exists lessons_updated_at_dentify on public.course_lessons;
create trigger lessons_updated_at_dentify before update on public.course_lessons for each row execute function public.set_updated_at();
drop trigger if exists orders_updated_at_dentify on public.cliq_orders;
create trigger orders_updated_at_dentify before update on public.cliq_orders for each row execute function public.set_updated_at();
drop trigger if exists settings_updated_at_dentify on public.site_settings;
create trigger settings_updated_at_dentify before update on public.site_settings for each row execute function public.set_updated_at();
drop trigger if exists progress_updated_at_dentify on public.course_lesson_progress;
create trigger progress_updated_at_dentify before update on public.course_lesson_progress for each row execute function public.set_updated_at();

-- Storage buckets: public images, private receipts/videos.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('course-images','course-images',true,5242880,array['image/jpeg','image/png','image/webp']),
 ('avatars','avatars',true,5242880,array['image/jpeg','image/png','image/webp']),
 ('payment-proofs','payment-proofs',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf']),
 ('course-videos','course-videos',false,524288000,array['video/mp4','video/webm','video/quicktime'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists dentify_public_course_images on storage.objects;
drop policy if exists dentify_public_avatars on storage.objects;
drop policy if exists dentify_admin_course_images on storage.objects;
drop policy if exists dentify_own_avatar_upload on storage.objects;
drop policy if exists dentify_own_avatar_update on storage.objects;
drop policy if exists dentify_payment_proof_insert on storage.objects;
drop policy if exists dentify_payment_proof_read on storage.objects;
drop policy if exists dentify_admin_payment_proof_delete on storage.objects;
drop policy if exists dentify_admin_video_manage on storage.objects;
drop policy if exists dentify_enrolled_video_read on storage.objects;
create policy dentify_public_course_images on storage.objects for select to anon,authenticated using(bucket_id='course-images');
create policy dentify_public_avatars on storage.objects for select to anon,authenticated using(bucket_id='avatars');
create policy dentify_admin_course_images on storage.objects for all to authenticated using(bucket_id='course-images' and (select public.is_admin())) with check(bucket_id='course-images' and (select public.is_admin()));
create policy dentify_own_avatar_upload on storage.objects for insert to authenticated with check(bucket_id='avatars' and (select public.is_active_user()) and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy dentify_own_avatar_update on storage.objects for update to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=(select auth.uid())::text) with check(bucket_id='avatars' and (select public.is_active_user()) and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy dentify_payment_proof_insert on storage.objects for insert to authenticated with check(bucket_id='payment-proofs' and (select public.is_active_user()) and (storage.foldername(name))[1]=(select auth.uid())::text);
create policy dentify_payment_proof_read on storage.objects for select to authenticated using(bucket_id='payment-proofs' and (((storage.foldername(name))[1]=(select auth.uid())::text and (select public.is_active_user())) or (select public.is_admin())));
create policy dentify_admin_payment_proof_delete on storage.objects for delete to authenticated using(bucket_id='payment-proofs' and (select public.is_admin()));
create policy dentify_admin_video_manage on storage.objects for all to authenticated using(bucket_id='course-videos' and (select public.is_admin())) with check(bucket_id='course-videos' and (select public.is_admin()));
create policy dentify_enrolled_video_read on storage.objects for select to authenticated using(bucket_id='course-videos' and ((select public.is_admin()) or exists(select 1 from public.enrollments e join public.profiles p on p.id=e.user_id where e.course_id::text=(storage.foldername(name))[1] and e.user_id=(select auth.uid()) and p.is_active=true)));

insert into public.site_settings(key,value) values
 ('brand_name','"Dentify"'::jsonb),('logo_url','""'::jsonb),('primary_color','"#0F766E"'::jsonb),('secondary_color','"#0F172A"'::jsonb),
 ('cliq_alias','""'::jsonb),('cliq_bank_name','""'::jsonb),('cliq_qr_url','""'::jsonb),('support_email','""'::jsonb),('default_language','"ar"'::jsonb)
on conflict(key) do nothing;

-- Admin bootstrap: create account via Supabase Auth first, then run:
-- update public.profiles set role='admin', is_active=true where lower(email)=lower('YOUR_REAL_EMAIL');
-- Never expose a service_role key in browser code. No fake credentials are seeded.
