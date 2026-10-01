create extension if not exists pgcrypto;

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  price_ngn numeric(12,2),
  short_description text,
  description text,
  specs jsonb not null default '{}'::jsonb,
  availability text not null default 'in_stock'
    check (availability in ('in_stock','out_of_stock','pre_order')),
  featured boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on products (category_id);
create index on products (published, created_at desc);
create index on products (featured) where featured;
create index on products using gin (to_tsvector('simple', name || ' ' || coalesce(short_description,'')));

create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  storage_path text not null,
  alt_text text not null default '',
  sort_order int not null default 0
);
create index on product_images (product_id, sort_order);

create table gallery_images (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  alt_text text not null default '',
  caption text,
  featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  product_or_service text not null,
  preferred_date date,
  preferred_time text,
  message text,
  status text not null default 'new'
    check (status in ('new','contacted','confirmed','completed','cancelled')),
  created_at timestamptz not null default now()
);
create index on bookings (status, created_at desc);

create table admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create table site_settings (
  id int primary key default 1 check (id = 1),
  business_name text not null default 'King Mobiles',
  whatsapp_number text not null default '07069969046',
  phone text, email text, address text,
  business_hours jsonb not null default '{}'::jsonb,
  socials jsonb not null default '{}'::jsonb,
  seo_title text, seo_description text,
  logo_path text, favicon_path text,
  homepage jsonb not null default '{}'::jsonb
);
insert into site_settings (id) values (1) on conflict do nothing;

create or replace function is_admin() returns boolean
language sql security definer stable as
$$ select exists (select 1 from admin_users where user_id = auth.uid()) $$;

alter table categories enable row level security;
alter table products enable row level security;
alter table product_images enable row level security;
alter table gallery_images enable row level security;
alter table bookings enable row level security;
alter table admin_users enable row level security;
alter table site_settings enable row level security;

create policy "public read" on categories for select using (true);
create policy "public read published" on products for select using (published or is_admin());
create policy "public read" on product_images for select using (true);
create policy "public read" on gallery_images for select using (true);
create policy "public read" on site_settings for select using (true);

create policy "admin write" on categories for all using (is_admin()) with check (is_admin());
create policy "admin write" on products for all using (is_admin()) with check (is_admin());
create policy "admin write" on product_images for all using (is_admin()) with check (is_admin());
create policy "admin write" on gallery_images for all using (is_admin()) with check (is_admin());
create policy "admin write" on site_settings for all using (is_admin()) with check (is_admin());
create policy "admin manage bookings" on bookings for all using (is_admin()) with check (is_admin());
create policy "admin self" on admin_users for select using (user_id = auth.uid());
